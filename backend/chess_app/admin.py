from django.contrib import admin
from .models import Game, Move


class MoveInline(admin.TabularInline):
	model = Move
	extra = 0
	readonly_fields = ['from_square', 'to_square', 'promotion_piece', 'fen_before', 'fen_after', 'move_number', 'created_at']
	can_delete = False


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
	list_display = ['id', 'white_player', 'black_player', 'status', 'result', 'created_at']
	list_filter = ['status', 'result', 'created_at']
	search_fields = ['white_player__email', 'black_player__email', 'white_player__username', 'black_player__username']
	readonly_fields = ['current_fen', 'created_at', 'updated_at']
	inlines = [MoveInline]
	
	fieldsets = (
		('Players', {
			'fields': ('white_player', 'black_player')
		}),
		('Game State', {
			'fields': ('status', 'result', 'current_fen')
		}),
		('Timestamps', {
			'fields': ('created_at', 'updated_at', 'started_at', 'ended_at'),
			'classes': ('collapse',)
		}),
	)


@admin.register(Move)
class MoveAdmin(admin.ModelAdmin):
	list_display = ['id', 'game', 'move_number', 'from_square', 'to_square', 'created_at']
	list_filter = ['game', 'created_at']
	search_fields = ['game__id']
	readonly_fields = ['fen_before', 'fen_after', 'created_at']
	ordering = ['game', 'move_number']
