# Generated by Django 4.2.5 on 2024-05-08 04:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aircraft', '0003_remove_aircraft_call_sign_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='aircraft',
            name='max_altitude',
            field=models.DecimalField(decimal_places=4, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='aircraft',
            name='max_velocity',
            field=models.IntegerField(null=True),
        ),
    ]