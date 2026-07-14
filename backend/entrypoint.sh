#!/bin/bash

# This script is the entry point for the Django application. 
# It waits for the PostgreSQL database to be ready (if DB_HOST is set), applies database migrations, collects static files, and starts the Django development server.

# Exit immediately if a command exits with a non-zero status
set -e
trap 'echo "❌ Error on line $LINENO: $BASH_COMMAND"' ERR

# Wait for PostgreSQL if DB_HOST is set
if [ -n "$DB_HOST" ]; then
  echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

  while ! nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 1
  done

  echo "PostgreSQL is ready at $DB_HOST:$DB_PORT"
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the Django server
echo "Starting Django server..."
#python manage.py runserver 0.0.0.0:8000
daphne --access-log /dev/null -b 0.0.0.0 -p 8000 backend.asgi:application
