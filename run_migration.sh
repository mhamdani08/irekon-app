#!/bin/bash
set -e

echo "=== Running Database Migration & Seeding for iRekon App ==="
docker compose exec backend python -m app.database.init_db
echo "=== Database Migration & Seeding Completed Successfully! ==="
