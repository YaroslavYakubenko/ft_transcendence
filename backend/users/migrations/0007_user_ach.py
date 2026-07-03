from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_chatmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='win_counter',
            field=models.IntegerField(default=0)
        ),
		migrations.AddField(
            model_name='user',
            name='highest_win_streak',
            field=models.IntegerField(default=0)
        ),
    ]
