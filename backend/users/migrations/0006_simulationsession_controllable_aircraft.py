# Generated by Django 4.2.5 on 2024-05-08 04:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('aircraft', '0001_initial'),
        ('users', '0005_baseuser_channel_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='simulationsession',
            name='controllable_aircraft',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='controllable_aircraft', to='aircraft.adminaircraft'),
        ),
    ]