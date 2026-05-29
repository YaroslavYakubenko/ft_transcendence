import chess
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async
from chess_app.models import Game, Move
from chess_app.views import update_player_stats
from django.utils import timezone

# self is the consumer instance 
# Django Channels creates an object (self) for each WebSocket connection

# this consumer tracks online / offline status
# when a user opens this WS connection, they're "online"; when it closes, they're "offline"
class OnlineStatusConsumer(AsyncWebsocketConsumer):

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

        # database_sync_to_async = adapter between async world and sync Django ORM
        # Django's ORM (database queries) is blocking / synchronous
        # but we're in an async function - calling sync code directly would freeze everything
        # this wrapper runs the sync function in a thread pool, like offloading blocking I/O to a worker thread
        await database_sync_to_async(self._set_online)(True)    # mark online before accepting
        await self.accept()


    # regardless of why they disconnected (browser closed, network dropped, etc.), mark them offline
    # guard against case where connect() failed before self.user was set
    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            await database_sync_to_async(self._set_online)(False)

    # regular synchronous method - no async here because database_sync_to_async handles that
    # update_fields = only write these specific columns to DB, more efficient than saving the whole object
    def _set_online(self, status):
        self.user.is_online = status
        self.user.save(update_fields=['is_online'])


class ChatConsumer(AsyncWebsocketConsumer):

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

        self.room_group_name = f'chat_{self.scope["url_route"]["kwargs"]["room_name"]}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # close_code: 1000 = normal, 1006 = abnormal / network drop),
        # leave the group as we stop receiving messages
        # always do this on disconnect or you'll have ghost subscribers
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
        )
    
    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': content.get('message', ''),
                'username': self.user.username or self.user.email,
            }
        )

    async def chat_message(self, event):
        await self.send_json({
            'message': event['message'],
            'username': event['username'],
        })



# Handles WebSocket connections for live Chess games
# Both players connect here; moves are broadcast between them in real time

class GameConsumer(AsyncWebsocketConsumer):

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
        self.game_group_name = f'game_{self.game_id}'

        # verify this user is actually a player in this game
        game = await self._get_game()
        if game is None:
            await self.close()
            return

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()

        # send the current board state so the joining player is in sync
        await self.send_json({
            'type': 'sync',
            'fen': game.current_fen,
            'status': game.status,
            'result': game.result,
            'white_player': game.white_player.username or game.white_player.email,
            'black_player': game.black_player.username or game.black_player.email,
        })

        # notify the other player that their opponent connected
        await self.channel_layer.group_send(self.game_group_name, {
            'type': 'game_message',
            'msg_type': 'player_connected',
            'username': self.user.username or self.user.email,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
            await self.channel_layer.group_send(self.game_group_name, {
                'type': 'game_message',
                'msg_type': 'player_disconnected',
                'username': self.user.username or self.user.email if hasattr(self, 'user') else 'unknown',
            })

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'move':
            await self._handle_move(content)
        elif msg_type == 'resign':
            await self._handle_resign()

    async def game_message(self, event):
        # called on each connection in the group when group_send fires
        event.pop('type')
        await self.send_json(event)

    # ------------------------------------------------------------------ helpers

    @database_sync_to_async
    def _get_game(self):
        try:
            game = Game.objects.select_related('white_player', 'black_player').get(id=self.game_id)
            # only allow the two players in
            if self.user not in (game.white_player, game.black_player):
                return None
            return game
        except Game.DoesNotExist:
            return None

    async def _handle_move(self, data):
        frm = data.get('from')
        to  = data.get('to')
        promotion = data.get('promotion', '')   # e.g. 'q', 'r', 'b', 'n'

        if not frm or not to:
            await self.send_json({'type': 'error', 'message': 'missing from/to'})
            return

        game = await self._get_game()
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
        game = await self._get_game()
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