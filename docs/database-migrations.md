# Database Migration Guide

This document outlines the process for managing database migrations in the WriterFlow platform.

## Prerequisites

- Node.js installed
- Access to Turso database (URL and token)
- Environment variables properly configured in `.env.local`

## Migration Commands

The platform uses Drizzle ORM for database migrations. The following commands are available:

### Generate Migrations

To generate migrations based on schema changes:

```bash
node scripts/migrate.js generate
```

This command analyzes the current schema in `src/lib/db/schema.js` and compares it with the current database state to generate migration files in the `drizzle` directory.

### Apply Migrations

To apply pending migrations to the database:

```bash
node scripts/migrate.js apply
```

This command applies all pending migrations to bring the database schema up to date.

### Check Migration Status

To check the status of migrations:

```bash
node scripts/migrate.js status
```

This command shows which migrations have been applied and which are pending.

## Migration Workflow

1. Make changes to the schema in `src/lib/db/schema.js`
2. Generate migrations: `node scripts/migrate.js generate`
3. Review the generated SQL in the `drizzle` directory
4. Apply migrations: `node scripts/migrate.js apply`
5. Commit both schema changes and migration files to version control

## Best Practices

- Always generate and apply migrations in development before deploying to production
- Include migration files in version control
- Test migrations on a copy of production data before applying to production
- Back up the database before applying migrations in production
- Document breaking changes in migration files

## Troubleshooting

### Migration Failed to Apply

If a migration fails to apply:

1. Check the error message for specific issues
2. Fix the schema or migration file as needed
3. If the migration was partially applied, you may need to manually fix the database state
4. Regenerate the migration with `node scripts/migrate.js generate`

### Schema Drift

If the actual database schema differs from what Drizzle expects:

1. Use `node scripts/migrate.js status` to identify differences
2. Either update the schema to match the database or create a new migration to update the database

## Adding New Tables

When adding new tables to the schema:

1. Add the table definition to `src/lib/db/schema.js`
2. Generate a migration: `node scripts/migrate.js generate`
3. Apply the migration: `node scripts/migrate.js apply`

## Modifying Existing Tables

When modifying existing tables:

1. Update the table definition in `src/lib/db/schema.js`
2. Generate a migration: `node scripts/migrate.js generate`
3. Review the migration carefully to ensure it won't cause data loss
4. Apply the migration: `node scripts/migrate.js apply`

## Handling Production Deployments

For production deployments:

1. Include migration application as part of the deployment process
2. Consider using a migration lock to prevent concurrent migrations
3. Have a rollback plan in case of migration failures