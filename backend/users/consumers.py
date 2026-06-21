import chess
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer, AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async
from chess_app.models import Game, Move
from chess_app.views import update_player_stats
from django.utils import timezone
from users.models import ChatMessage

# self is the consumer instance
# Django Channels creates an object (self) for each WebSocket connection
# channel_layer: message bus that moves messages between different WebSocket connections
# group_add adds this specific connection to a named group
# group_discard removes this connection from a named group


class OnlineStatusConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = None

        query_string = self.scope.get('query_string', b'').decode()
        token_key = None

        for part in query_string.split('&'):
            if part.startswith('token='):
                token_key = part.split('=')[1]
                break

        if not token_key:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
            self.user = token.user
        except Token.DoesNotExist:
            await self.close()
            return

        self.inbox = 'inbox_' + str(self.user.id)
        await self.channel_layer.group_add(self.inbox, self.channel_name)
        await self.channel_layer.group_add('presence', self.channel_name)
        await database_sync_to_async(self.setOnline)(True)
        await self.accept()

        print("PRESENCE ONLINE:", self.user.id, self.user.email, flush=True)

    
        await self.channel_layer.group_send('presence', {
            'type': 'presence_msg',
            'user_id': self.user.id,
            'is_online': True,
        })

    async def presence_msg(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))

    async def disconnect(self, close_code):
        if self.user is not None:
            await self.channel_layer.group_discard(self.inbox, self.channel_name)
            await self.channel_layer.group_discard('presence', self.channel_name)
            await database_sync_to_async(self.setOnline)(False)

            print("PRESENCE OFFLINE:", self.user.id, self.user.email)
            await self.channel_layer.group_send('presence', {
                'type': 'presence_msg',
                'user_id': self.user.id,
                'is_online': False,
        })

    def setOnline(self, status):
        if self.user is not None:
            self.user.is_online = status
            self.user.save(update_fields=['is_online'])

    #save ChatMessage to database
    @database_sync_to_async
    def save_chat_message(self, to_user_id, message):
        return ChatMessage.objects.create(
            sender = self.user,
            recipient_id=to_user_id,
            message=message,
        )

    # called when frontend sends a message through this WebSocket
    # runs on User A's consumer — handles the send request
    async def receive(self, text_data):

        content = json.loads(text_data)
        
        to_user_id = content.get('to_user_id')
        message = content.get('message', '')

        if not to_user_id or not message:
            return

        saved_message = await self.save_chat_message(to_user_id, message)

        chat_data = {
            'type': 'chat_message',
            'id': saved_message.id,
            'message': saved_message.message,
            'from_user_id': self.user.id,
            'to_user_id': int(to_user_id),
            'username': self.user.username or self.user.email,
            'created_at': saved_message.created_at.isoformat(),
        }

        # deliver to recipient's inbox
        await self.channel_layer.group_send('inbox_' + str(to_user_id), chat_data)

        # echo back to sender so they see their own message
        await self.channel_layer.group_send('inbox_' + str(self.user.id), chat_data)

    async def chat_message(self, event):
        # runs on User B's consumer — delivers message to browser
        await self.send(text_data=json.dumps({
        'type': 'chat',
        'id': event['id'],
        'message': event['message'],
        'from_user_id': event['from_user_id'],
        'to_user_id': event['to_user_id'],
        'username': event['username'],
        'created_at': event['created_at'],
        }))

    async def friend_removed_msg(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_removed',
            'removed_by_id': event['removed_by_id'],
        }))

    async def friend_added_msg(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_added',
            'added_by_id': event['added_by_id'],
        }))


# Handles WebSocket connections for live Chess games
# Both players connect here; moves are broadcast between them in real time
# channel_name comes from the base class AsyncWebsocketConsumer, automatically assigned random string by Daphne
class GameConsumer(AsyncJsonWebsocketConsumer):

    # read token, find user, read game_id
    # create WebSocket group name
    # load game from database, if game does not exist, reject connection
    # add socket to the game group
    # accept WebSocket connection
    # send current board state to this player
    # tell the group that this player is connected
    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode()
        token_key = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token_key = part.split('=')[1]
                break

        if not token_key:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
            self.user = token.user
        except Token.DoesNotExist:
            await self.close()
            return

        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = 'game_' + str(self.game_id)

        # row from the Game table in the database; returns a python object
        game = await self.get_game()										
        if game is None:
            await self.close()
            return

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()

        # game taken from database through get_game function
        # send to GamePage.tsx / frontend
        is_white = self.user == game.white_player
        opponent = game.black_player if is_white else game.white_player
        await self.send_json({
            'msg_type': 'sync',
            'fen': game.current_fen,
            'status': game.status,
            'result': game.result,
            'white_player': game.white_player.username or game.white_player.email,
            'black_player': game.black_player.username or game.black_player.email,
            'your_color': 'white' if is_white else 'black',
            'opponent_id': opponent.id,
            'opponent_name': opponent.username or opponent.email,
            'timer': game.timer,
        })

        #broadcast to game_group_name 
        # GamePage.tsx listens for data.msg_type === 'player_connected'
        await self.channel_layer.group_send(self.game_group_name, {
            'type': 'game_message',
            'msg_type': 'player_connected',
            'username': self.user.username or self.user.email,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)				# client just left game_group_name
            await self.channel_layer.group_send(self.game_group_name, 									# notifies everybody remaining in game_group_name about the disconnect
            {
                'type': 'game_message',
                'msg_type': 'player_disconnected',
                'username': self.user.username or self.user.email,
            })

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'move':
            await self._handle_move(content)
        elif msg_type == 'resign':
            await self._handle_resign()
        elif msg_type == 'draw_offer':
            await self._handle_draw_offer()
        elif msg_type == 'draw_response':
            await self._handle_draw_response(content.get('accepted', False))

    # called on each connection in the group when group_send fires
    async def game_message(self, event):
        event.pop('type')
        await self.send_json(event)

    @database_sync_to_async
    def get_game(self):
        pending_email = 'pending@transcendence.de'

        try:
            game = Game.objects.select_related('white_player', 'black_player').get(id=self.game_id)

            print(f"game {self.game_id}: white={game.white_player.email} black={game.black_player.email} user={self.user.email}")

            # If this user is already white or black, allow connection.
            if self.user in (game.white_player, game.black_player):
                return game

            # If black is still pending, assign this user as black.
            if game.black_player.email == pending_email:
                game.black_player = self.user
                game.save(update_fields=['black_player'])
                return game

            # If white is still pending, assign this user as white.
            if game.white_player.email == pending_email:
                game.white_player = self.user
                game.save(update_fields=['white_player'])
                return game

            print("USER NOT IN GAME")
            return None

        except Game.DoesNotExist:
            print("GAME DOES NOT EXIST")
            return None

    async def _handle_move(self, data):
        frm = data.get('from')
        to = data.get('to')
        promotion = data.get('promotion', '')   # e.g. 'q', 'r', 'b', 'n'

        if not frm or not to:
            await self.send_json({'type': 'error', 'message': 'missing from/to'})
            return

        game = await self.get_game()
        if game is None or game.status == 'completed':
            await self.send_json({'type': 'error', 'message': 'game not found or already over'})
            return

        # enforce turn order — white_player moves on white's turn, black_player on black's
        board = chess.Board(game.current_fen)
        is_white_turn = board.turn == chess.WHITE
        if is_white_turn and self.user != game.white_player:
            await self.send_json({'type': 'error', 'message': 'not your turn'})
            return
        if not is_white_turn and self.user != game.black_player:
            await self.send_json({'type': 'error', 'message': 'not your turn'})
            return

        uci = frm + to + (promotion.lower() if promotion else '')
        try:
            move = chess.Move.from_uci(uci)
        except ValueError:
            await self.send_json({'type': 'error', 'message': 'invalid move format'})
            return

        if move not in board.legal_moves:
            await self.send_json({'type': 'error', 'message': 'illegal move'})
            return

        fen_before = game.current_fen
        board.push(move)
        new_fen = board.fen()

        # determine game result
        result = 'ongoing'
        winner = ''
        king_in_check = ''
        if board.is_checkmate():
            result = 'checkmate'
            winner = 'Black' if board.turn == chess.WHITE else 'White'
        elif board.is_stalemate():
            result = 'stalemate'
        elif board.is_insufficient_material() or board.is_seventyfive_moves() or board.is_fivefold_repetition():
            result = 'draw'
        elif board.is_check():
            king_in_check = chess.square_name(board.king(board.turn))

        await self._save_move(game, frm, to, promotion, fen_before, new_fen, result)

        await self.channel_layer.group_send(self.game_group_name, {
            'type': 'game_message',
            'msg_type': 'move',
            'from': frm,
            'to': to,
            'promotion': promotion,
            'fen': new_fen,
            'result': result,
            'winner': winner,
            'king_in_check': king_in_check,
        })

    @database_sync_to_async
    def _save_move(self, game, frm, to, promotion, fen_before, fen_after, result):
        move_count = game.moves.count() + 1
        Move.objects.create(
            game=game,
            from_square=frm,
            to_square=to,
            promotion_piece=promotion or None,
            fen_before=fen_before,
            fen_after=fen_after,
            move_number=move_count,
        )
        game.current_fen = fen_after
        if result != 'ongoing':
            game.save(update_fields=['current_fen'])
            update_player_stats(game, result)
        elif game.status == 'pending':
            game.status = 'ongoing'
            game.started_at = timezone.now()
            game.save(update_fields=['current_fen', 'status', 'started_at'])
        else:
            game.save(update_fields=['current_fen'])

    async def _handle_resign(self):
        game = await self.get_game()
        if game is None or game.status == 'completed':
            return

        # the player who resigns loses
        if self.user == game.white_player:
            db_result = 'black_win'
            winner = 'Black'
        else:
            db_result = 'white_win'
            winner = 'White'

        await database_sync_to_async(self._finish_game)(game, db_result)

        await self.channel_layer.group_send(self.game_group_name, {
            'type': 'game_message',
            'msg_type': 'resign',
            'resigned_player': self.user.username or self.user.email,
            'result': 'resign',
            'winner': winner,
            'fen': game.current_fen,
        })

    def _finish_game(self, game, result):
        game.result = result
        game.status = 'completed'
        game.ended_at = timezone.now()
        game.save(update_fields=['result', 'status', 'ended_at'])
        # update player stats / ELO
        game.white_player.refresh_from_db()
        game.black_player.refresh_from_db()
        if result == 'white_win':
            game.white_player.wins += 1
            game.black_player.losses += 1
        else:
            game.white_player.losses += 1
            game.black_player.wins += 1
        game.white_player.save()
        game.black_player.save()

    async def _handle_draw_offer(self):
        game = await self.get_game()
        if game is None or game.status == 'completed':
            return
        await self.channel_layer.group_send(self.game_group_name, {
            'type': 'game_message',
            'msg_type': 'draw_offer',
            'from_player': self.user.username or self.user.email,
        })

    async def _handle_draw_response(self, accepted):
        if accepted:
            game = await self.get_game()
            if game is None or game.status == 'completed':
                return
            await database_sync_to_async(self._finish_draw)(game)
            await self.channel_layer.group_send(self.game_group_name, {
                'type': 'game_message',
                'msg_type': 'draw_accepted',
            })
        else:
            await self.channel_layer.group_send(self.game_group_name, {
                'type': 'game_message',
                'msg_type': 'draw_declined',
            })

    def _finish_draw(self, game):
        game.result = 'draw'
        game.status = 'completed'
        game.ended_at = timezone.now()
        game.save(update_fields=['result', 'status', 'ended_at'])
        game.white_player.refresh_from_db()
        game.black_player.refresh_from_db()
        game.white_player.draws += 1
        game.black_player.draws += 1
        game.white_player.save()
        game.black_player.save()
