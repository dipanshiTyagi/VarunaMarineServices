# Prisma Database Setup

## Prerequisites

- PostgreSQL installed and running
- Database created (e.g., `fueleu_maritime`)

## Setup Steps

1. **Create `.env` file in backend directory:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
   PORT=3001
   NODE_ENV=development
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Run Migrations:**
   ```bash
   npm run prisma:migrate
   ```
   This will create the initial migration and apply it to the database.

4. **Seed the Database:**
   ```bash
   npm run prisma:seed
   ```
   This will populate the database with sample routes and compliance data.

5. **Open Prisma Studio (Optional):**
   ```bash
   npm run prisma:studio
   ```
   This opens a GUI to view and edit your database.

## Database Schema

### Tables

- **routes**: Vessel route data with GHG intensity metrics
- **ship_compliance**: Compliance balance records per ship/year
- **bank_entries**: Banked surplus compliance balances
- **pools**: Pool registry
- **pool_members**: Pool member allocations with before/after CB values

### Indexes

- `routeId` on routes table
- `year` on routes, ship_compliance, bank_entries, pools
- `shipId` on ship_compliance, bank_entries, pool_members
- Composite indexes on (shipId, year) for efficient queries

## Sample Data

The seed file includes:
- 5 sample routes (R001-R005)
- R001 is set as the baseline route
- Sample ship compliance records for testing

