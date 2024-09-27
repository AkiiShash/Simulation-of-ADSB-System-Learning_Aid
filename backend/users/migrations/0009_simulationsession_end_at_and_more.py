# Generated by Django 4.2.5 on 2024-05-10 06:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aircraft', '0006_aircraft_aircraft_type'),
        ('users', '0008_alter_baseuser_channel_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='simulationsession',
            name='end_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='simulationsession',
            name='started_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='simulationsession',
            name='aircrafts',
            field=models.ManyToManyField(blank=True, related_name='admin_aircraft_list', to='aircraft.adminaircraft'),
        ),
    ]