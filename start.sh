#!/bin/sh
set -e

# Initialize database if not exists
if [ ! -f /app/data/prod.db ]; then
  echo "Initializing database..."
  cd /app
  npx prisma db push --skip-generate
  echo "Database initialized!"
fi

# Start the application
exec node server.js
