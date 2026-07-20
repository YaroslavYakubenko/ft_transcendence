from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chess_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='difficulty',
            field=models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', max_length=20),
        ),
    ]