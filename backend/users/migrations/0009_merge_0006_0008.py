"""Merge migration for users app conflicts."""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0006_user_is_bot"),
        ("users", "0008_user_ach"),
    ]

    operations = []
