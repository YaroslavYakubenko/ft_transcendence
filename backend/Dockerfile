# defines HOW django will run in the container

# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Prevents Python from writing .pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1

# Ensure logs print directly to the terminal without buffering
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for psycopg2)
RUN apt-get update \
    && apt-get install -y gcc libpq-dev netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend project into the container
COPY . .

# Add entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 8000 for the Django
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
