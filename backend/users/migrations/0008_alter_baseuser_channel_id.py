# Generated by Django 4.2.5 on 2024-05-08 05:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_simulationsession_created_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='baseuser',
            name='channel_id',
            field=models.CharField(blank=True, default='', max_length=250, null=True),
        ),
    ]
