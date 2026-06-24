import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def mark_existing_users_verified(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.all().update(email_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_chatmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_users_verified, migrations.RunPython.noop),
        migrations.CreateModel(
            name='EmailVerificationToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='email_token',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
