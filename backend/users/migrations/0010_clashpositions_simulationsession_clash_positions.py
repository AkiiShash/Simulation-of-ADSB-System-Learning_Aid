# Generated by Django 4.2.5 on 2024-05-16 06:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_simulationsession_end_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClashPositions',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clash_time', models.DateTimeField()),
                ('clash_pos_lat', models.DecimalField(decimal_places=16, max_digits=20)),
                ('clash_pos_lng', models.DecimalField(decimal_places=16, max_digits=20)),
                ('clash_altitude', models.DecimalField(decimal_places=2, max_digits=10)),
            ],
        ),
        migrations.AddField(
            model_name='simulationsession',
            name='clash_positions',
            field=models.ManyToManyField(blank=True, to='users.clashpositions'),
        ),
    ]
