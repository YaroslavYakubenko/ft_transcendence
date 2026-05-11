# Generated migration for chess_app models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('ongoing', 'Ongoing'), ('completed', 'Completed')], default='pending', max_length=20)),
                ('result', models.CharField(choices=[('white_win', 'White Win'), ('black_win', 'Black Win'), ('draw', 'Draw'), ('stalemate', 'Stalemate'), ('ongoing', 'Ongoing')], default='ongoing', max_length=20)),
                ('current_fen', models.TextField(default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('ended_at', models.DateTimeField(blank=True, null=True)),
                ('black_player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='games_as_black', to=settings.AUTH_USER_MODEL)),
                ('white_player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='games_as_white', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Move',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_square', models.CharField(max_length=2)),
                ('to_square', models.CharField(max_length=2)),
                ('promotion_piece', models.CharField(blank=True, max_length=1, null=True)),
                ('fen_before', models.TextField()),
                ('fen_after', models.TextField()),
                ('move_number', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moves', to='chess_app.game')),
            ],
            options={
                'ordering': ['move_number'],
            },
        ),
    ]
