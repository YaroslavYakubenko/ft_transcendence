from rest_framework import serializers
from .models import Game, Move


class MoveSerializer(serializers.ModelSerializer):
	class Meta:
		model = Move
		fields = ['id', 'from_square', 'to_square', 'promotion_piece', 'fen_before', 'fen_after', 'move_number', 'created_at']


class GameSerializer(serializers.ModelSerializer):
	moves = MoveSerializer(many=True, read_only=True)
	white_player_username = serializers.CharField(source='white_player.username', read_only=True)
	black_player_username = serializers.CharField(source='black_player.username', read_only=True)
	
	class Meta:
		model = Game
		fields = ['id', 'white_player', 'white_player_username', 'black_player', 'black_player_username', 
				  'status', 'result', 'current_fen', 'moves', 'created_at', 'updated_at', 'started_at', 'ended_at']
		read_only_fields = ['current_fen', 'status', 'result', 'created_at', 'updated_at', 'started_at', 'ended_at']
