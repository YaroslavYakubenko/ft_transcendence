from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_remove_match_users_match_white_p_d48257_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_bot',
            field=models.BooleanField(default=False),
        ),
    ]