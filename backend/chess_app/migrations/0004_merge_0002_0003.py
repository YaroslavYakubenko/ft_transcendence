"""Merge migration for chess_app conflicts."""
from django.db import import_module
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("chess_app", "0002_game_difficulty"),
        ("chess_app", "0003_alter_game_black_player_alter_game_white_player"),
    ]

    operations = []
