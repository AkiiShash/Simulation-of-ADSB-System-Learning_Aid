# Generated by Django 4.2.5 on 2024-05-06 06:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='baseuser',
            name='full_name',
        ),
    ]