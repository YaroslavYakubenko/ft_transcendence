"""
Django management command to seed sample data for development.
Usage: python manage.py seed_data

This command creates:
- 5 sample users
- Friendship relationships between users
- Sample match history
- Sample tournaments

All sample data uses predictable test data for consistent development.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, Friendship, Match, Tournament
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Seed the database with sample data for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Match.objects.all().delete()
            Tournament.objects.all().delete()
            Friendship.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS('Starting to seed data...'))

        # Create sample users
        users_data = [
            {'email': 'alice@example.com', 'username': 'alice_player', 'wins': 15, 'losses': 5, 'draws': 2, 'elo': 1450},
            {'email': 'bob@example.com', 'username': 'bob_player', 'wins': 10, 'losses': 8, 'draws': 3, 'elo': 1300},
            {'email': 'charlie@example.com', 'username': 'charlie_player', 'wins': 8, 'losses': 12, 'draws': 1, 'elo': 1150},
            {'email': 'diana@example.com', 'username': 'diana_player', 'wins': 20, 'losses': 3, 'draws': 5, 'elo': 1550},
            {'email': 'eve@example.com', 'username': 'eve_player', 'wins': 5, 'losses': 15, 'draws': 0, 'elo': 950},
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'wins': user_data['wins'],
                    'losses': user_data['losses'],
                    'draws': user_data['draws'],
                    'elo': user_data['elo'],
                }
            )
            users.append(user)
            if created:
                user.set_password('test123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.email}'))
            else:
                self.stdout.write(f'User already exists: {user.email}')

        # Create friendships
        self.stdout.write('Creating friendships...')
        friendships_to_create = [
            (users[0], users[1], Friendship.ACCEPTED),
            (users[0], users[2], Friendship.PENDING),
            (users[1], users[0], Friendship.ACCEPTED),
            (users[1], users[3], Friendship.ACCEPTED),
            (users[2], users[3], Friendship.PENDING),
            (users[3], users[4], Friendship.ACCEPTED),
        ]

        for from_user, to_user, status in friendships_to_create:
            friendship, created = Friendship.objects.get_or_create(
                from_user=from_user,
                to_user=to_user,
                defaults={'status': status}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created friendship: {from_user.username} -> {to_user.username} ({status})'))

        # Create sample matches
        self.stdout.write('Creating match history...')
        now = timezone.now()
        matches_data = [
            {
                'white_player': users[0],
                'black_player': users[1],
                'result': Match.WHITE,
                'status': Match.COMPLETED,
                'created_at': now - timedelta(days=10),
                'pgn_notation': '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 Na5 9.Bc2 c5',
            },
            {
                'white_player': users[1],
                'black_player': users[2],
                'result': Match.BLACK,
                'status': Match.COMPLETED,
                'created_at': now - timedelta(days=7),
                'pgn_notation': '1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.Cxd5 cxd5 5.Bf4 Nc6 6.Nf3 a6',
            },
            {
                'white_player': users[3],
                'black_player': users[0],
                'result': Match.DRAW,
                'status': Match.COMPLETED,
                'created_at': now - timedelta(days=5),
                'pgn_notation': '1.c4 e5 2.Nc3 Nf6 3.Nf3 Nc6 4.g3 d5 5.cxd5 Nxd5',
            },
            {
                'white_player': users[2],
                'black_player': users[4],
                'result': Match.WHITE,
                'status': Match.COMPLETED,
                'created_at': now - timedelta(days=3),
                'pgn_notation': '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6',
            },
        ]

        for match_data in matches_data:
            match, created = Match.objects.get_or_create(
                white_player=match_data['white_player'],
                black_player=match_data['black_player'],
                created_at=match_data['created_at'],
                defaults={
                    'result': match_data['result'],
                    'status': match_data['status'],
                    'pgn_notation': match_data['pgn_notation'],
                    'started_at': match_data['created_at'],
                    'completed_at': match_data['created_at'] + timedelta(minutes=30),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'Created match: {match_data["white_player"].username} vs {match_data["black_player"].username}'
                ))

        # Create a sample tournament
        self.stdout.write('Creating sample tournaments...')
        tournament, created = Tournament.objects.get_or_create(
            name='Spring 2026 Championship',
            defaults={
                'description': 'Annual spring chess championship for all skill levels',
                'status': Tournament.ONGOING,
                'created_at': now - timedelta(days=30),
                'start_date': now - timedelta(days=20),
                'max_participants': 16,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created tournament: {tournament.name}'))
            tournament.participants.set(users[:4])
        else:
            self.stdout.write(f'Tournament already exists: {tournament.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with sample data'))
