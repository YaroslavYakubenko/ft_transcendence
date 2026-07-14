from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chess_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='timer',
            field=models.CharField(
                choices=[('none', 'No Timer'), ('3', '3 min'), ('5', '5+3'), ('10', '10+5')],
                default='none',
                max_length=10,
            ),
        ),
    ]
