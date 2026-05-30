# database_sync_to_async = adapter between async world and sync Django ORM
# Django's ORM (database queries) is blocking / synchronous
# but we're in an async function - calling sync code directly would freeze everything
# this wrapper runs the sync function in a thread pool, like offloading blocking I/O to a worker thread

import chess
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async
from chess_app.models import Game, Move
from chess_app.views import update_player_stats
from django.utils import timezone

# self is the consumer instance 
# Django Channels creates an object (self) for each WebSocket connection
# channel_layer: message bus that moves messages between different Websocket connections (InMemory in settings.py)
# group_add adds this specific connection to a named group, group_discard discards this connection

# this consumer tracks online / offline status
# when a user opens this WS connection, they're "online"; when it closes, they're "offline"

# channel_name = specific name of this Websocket connection
# inbox = group name containing one or more sockets

# ToDo: Add msgs to database in order to assure persistency 
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

        await database_sync_to_async(self.setOnline)(True)    # mark online with function setOnline before accepting
        await self.accept()

    async def disconnect(self, close_code):
        if self.user is not None
			await self.channel_layer.group_discard(self.inbox, self.channel_name)
            await database_sync_to_async(self.setOnline)(False)

    def setOnline(self, status):
		if self.user is not None:
        	self.user.is_online = status
        	self.user.save()

	# called when the frontend sends a message through this WebSocket
	# to_user_id is the friend's user ID that the frontend sends as part of the message
	# content is a Python dictionary already parsed from JSON. Channels does that automatically with receive_json, 
	# receive_json handles a send request from USER A to group_send to inbox_user.id
	
	# frontend -> backend: "User A sent hello"
	# group_send puts message on the channel_layer
	# runs on User A's consumer
	async def receive_json(self, content)
		to_user_id = content.get('to_user_id')
		message = content.get('message', '')

		if not to_user_id or not message
			return

		chat_data = {
			'type': 'chat_message',
			'message': message, 
			'from_user_id': self.user.id,
			'username': self.username or self.user.email,
		}

		# deliver to recipient's inbox  
		recipient_inbox = 'inbox_' + str(to_user_id)
		await self.channel_layer.group_send(recipient_inbox, chat_data)

		# echo back to sender so they see their own message
		sender_inbox = 'inbox_' + str(self.user.id)
		await self.channel_layer.group_send(sender_inbox, chat_data)

	# runs on User B's consumer 
	# backend -> frontend, deliver hello to User B's browser
	async def chat_message(self, event)
		await self.send_json({
			'type': 'chat_message',
			'message': event['message'],
			'from_user_id': event['from_user_id'],
			'username': event['username'],
		})

# class ChatConsumer(AsyncWebsocketConsumer):

#     async def connect(self):
#         query_string = self.scope.get('query_string', b'').decode()
#         token_key = None
#         for part in query_string.split('&'):
#             if part.startswith('token='):
#                 token_key = part.split('=')[1]
#                 break

#         if not token_key:
#             await self.close()
#             return

#         try:
#             token = await database_sync_to_async(Token.objects.select_related('user').get)(key=token_key)
#             self.user = token.user

#         except Token.DoesNotExist:
#             await self.close()
#             return

		
#         self.room_group_name = f'chat_{self.scope["url_route"]["kwargs"]["room_name"]}'

#         await self.channel_layer.group_add
# 		(
#             self.room_group_name,
#             self.channel_name
#         )

#         await self.accept()

#     async def disconnect(self, close_code):
#         # close_code: 1000 = normal, 1006 = abnormal / network drop),
#         # leave the group as we stop receiving messages
#         # always do this on disconnect or you'll have ghost subscribers
#         if hasattr(self, 'room_group_name'):
#             await self.channel_layer.group_discard(
#                 self.room_group_name,
#                 self.channel_name
#         )
    
#     async def receive_json(self, content):
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': content.get('message', ''),
#                 'username': self.user.username or self.user.email,
#             }
#         )

#     async def chat_message(self, event):
#         await self.send_json({
#             'message': event['message'],
#             'username': event['username'],
#         })



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