# Generated by Django 4.2.5 on 2024-05-06 13:01

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('aircraft', '0001_initial'),
        ('users', '0002_remove_baseuser_full_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessioninstance',
            name='aircrafts',
            field=models.ManyToManyField(related_name='aircraft_list', to='aircraft.aircraft'),
        ),
        migrations.AddField(
            model_name='sessioninstance',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='simulationsession',
            name='aircrafts',
            field=models.ManyToManyField(related_name='admin_aircraft_list', to='aircraft.adminaircraft'),
        ),
        migrations.AddField(
            model_name='simulationsession',
            name='status',
            field=models.CharField(choices=[('created', 'Created'), ('started', 'Started'), ('closed', 'Closed')], default='created', max_length=10),
        ),
        migrations.AddField(
            model_name='simulationsession',
            name='users',
            field=models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL),
        ),
    ]