from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chess_app', '0005_remove_game_difficulty'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='difficulty',
            field=models.CharField(
                max_length=10,
                choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
                default='medium',
            ),
        ),
    ]