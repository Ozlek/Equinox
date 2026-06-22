from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count, Avg
from playthrough.models import ResponseLog, ResponseLogArchive
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = """
    Archive ResponseLog entries older than 90 days into ResponseLogArchive,
    then delete the raw logs to keep the table lean.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Archive logs older than this many days (default: 90)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be archived without making changes'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff = timezone.now() - timedelta(days=days)

        self.stdout.write(f"Archiving ResponseLog entries older than {days} days (before {cutoff.date()})...")

        # Find all old logs grouped by user, domain, and date
        old_logs = ResponseLog.objects.filter(timestamp__lt=cutoff)
        total_old = old_logs.count()
        
        if total_old == 0:
            self.stdout.write(self.style.SUCCESS("No old logs to archive."))
            return

        self.stdout.write(f"Found {total_old} entries to process.")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be made."))
            # Show sample of what would be archived
            sample = old_logs[:5]
            for log in sample:
                self.stdout.write(f"  Would archive: {log.user.username} - {log.domain} - {log.timestamp.date()}")
            return

        # Group logs by user, domain, and date
        grouped = (
            old_logs
            .values('user', 'domain', 'timestamp__date')
            .annotate(
                total_attempts=Count('id'),
                correct_attempts=Count('id', filter=Q(is_correct=True)),
                avg_difficulty=Avg('question_difficulty_value')
            )
        )

        archived_count = 0
        for group in grouped:
            user = User.objects.get(id=group['user'])
            date = group['timestamp__date']
            
            archive, created = ResponseLogArchive.objects.update_or_create(
                user=user,
                domain=group['domain'],
                date=date,
                defaults={
                    'total_attempts': group['total_attempts'],
                    'correct_attempts': group['correct_attempts'],
                    'avg_difficulty': group['avg_difficulty'],
                }
            )
            archived_count += group['total_attempts']

        # Delete the old raw logs
        deleted_count, _ = old_logs.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully archived {archived_count} entries into {grouped.count()} daily summaries."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted_count} raw ResponseLog entries."
            )
        )