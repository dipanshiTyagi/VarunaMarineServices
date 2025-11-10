<<<<<<< HEAD
# VarunaMarineServices
=======
# Fuel EU Maritime Compliance Platform

A full-stack application for managing Fuel EU Maritime compliance, including route management, compliance balance calculations, banking, and pooling features.

## Overview

This platform implements the Fuel EU Maritime Regulation (EU) 2023/1805 compliance module, providing:

- **Route Management**: Track vessel routes with GHG intensity data
- **Compliance Comparison**: Compare routes against baseline and target values
- **Banking**: Manage compliance balance surplus (Article 20)
- **Pooling**: Combine multiple ships' compliance balances (Article 21)

## Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters / Clean Architecture) principles:

```
┌─────────────────────────────────────────┐
│           Application Core              │
│  ┌──────────┐  ┌──────────┐           │
│  │ Domain   │  │ Use Cases│           │
│  └──────────┘  └──────────┘           │
│         ↕                              │
│  ┌──────────┐  (Ports/Interfaces)     │
│  │  Ports   │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
         ↕                    ↕
┌──────────────┐      ┌──────────────┐
│   Adapters   │      │  Adapters    │
│   (Inbound)  │      │  (Outbound)  │
│              │      │              │
│  HTTP/REST   │      │  PostgreSQL  │
│  React UI    │      │  API Clients │
└──────────────┘      └──────────────┘
```

### Backend Structure
```
backend/src/
├── core/
│   ├── domain/          # Business entities (Route, ComplianceBalance, etc.)
│   ├── application/     # Use cases (GetRoutes, ComputeCB, etc.)
│   └── ports/           # Interfaces (IRouteRepository, etc.)
├── adapters/
│   ├── inbound/http/    # Express controllers
│   └── outbound/postgres/ # Database repositories
├── infrastructure/
│   ├── db/              # Prisma setup
│   └── server/          # Express app
└── shared/              # Utilities
```

### Frontend Structure
```
frontend/src/
├── core/
│   ├── domain/          # TypeScript interfaces
│   ├── application/     # Business logic services
│   └── ports/           # Service interfaces
├── adapters/
│   ├── inbound/         # React components
│   └── outbound/        # API clients
└── ui/                  # Shared UI components
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Testing**: React Testing Library

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9 or higher (comes with Node.js)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd VMS_assgn
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
# Copy the example and update with your database credentials
cp .env.example .env
# Edit .env and set:
# DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
# PORT=3001

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional, defaults to http://localhost:3001)
# REACT_APP_API_URL=http://localhost:3001
```

### 4. Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Access the Application

Open your browser and navigate to: `http://localhost:3000`

## API Endpoints

### Routes

#### Get All Routes
```http
GET /routes
GET /routes?vesselType=Container&fuelType=LNG&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "routeId": "R001",
      "vesselType": "Container",
      "fuelType": "HFO",
      "year": 2024,
      "ghgIntensity": 91.0,
      "fuelConsumption": 5000,
      "distance": 12000,
      "totalEmissions": 4500,
      "isBaseline": true
    }
  ],
  "count": 1
}
```

#### Set Baseline Route
```http
POST /routes/:routeId/baseline
```

**Response:**
```json
{
  "success": true,
  "message": "Route R001 set as baseline"
}
```

#### Get Comparison
```http
GET /routes/comparison
```

**Response:**
```json
{
  "success": true,
  "data": {
    "baseline": {
      "routeId": "R001",
      "ghgIntensity": 91.0,
      ...
    },
    "comparisons": [
      {
        "route": { ... },
        "percentDiff": -3.3,
        "compliant": true
      }
    ]
  }
}
```

### Compliance

#### Get Compliance Balance
```http
GET /compliance/cb?shipId=S001&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipId": "S001",
    "year": 2024,
    "cbGco2eq": 10000.5,
    "isSurplus": true,
    "isDeficit": false
  }
}
```

#### Get Adjusted Compliance Balance
```http
GET /compliance/adjusted-cb?shipId=S001&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipId": "S001",
    "year": 2024,
    "cbGco2eq": 8000.5,
    "isSurplus": true,
    "isDeficit": false
  }
}
```

### Banking

#### Get Bank Records
```http
GET /banking/records?shipId=S001&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "shipId": "S001",
        "year": 2024,
        "amountGco2eq": 5000.0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalBanked": 5000.0,
      "totalApplied": 2000.0,
      "available": 3000.0
    }
  }
}
```

#### Bank Surplus
```http
POST /banking/bank
Content-Type: application/json

{
  "shipId": "S001",
  "year": 2024,
  "amount": 5000.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Surplus banked successfully",
  "data": {
    "id": 1,
    "shipId": "S001",
    "year": 2024,
    "amountGco2eq": 5000.0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Apply Banked Amount
```http
POST /banking/apply
Content-Type: application/json

{
  "shipId": "S001",
  "year": 2024,
  "amount": 2000.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banked amount applied successfully",
  "data": {
    "cbBefore": 10000.5,
    "applied": 2000.0,
    "cbAfter": 12000.5
  }
}
```

### Pooling

#### Create Pool
```http
POST /pools
Content-Type: application/json

{
  "year": 2024,
  "members": ["S001", "S002", "S003"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pool created successfully",
  "data": {
    "id": 1,
    "year": 2024,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "members": [
      {
        "shipId": "S001",
        "cbBefore": 10000.0,
        "cbAfter": 5000.0,
        "change": -5000.0,
        "isCompliantAfter": true
      },
      {
        "shipId": "S002",
        "cbBefore": -5000.0,
        "cbAfter": 0.0,
        "change": 5000.0,
        "isCompliantAfter": true
      }
    ],
    "summary": {
      "totalSum": 5000.0,
      "totalSumAfter": 5000.0,
      "deficitCount": 1,
      "surplusCount": 1,
      "isCompliant": true
    }
  }
}
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

## Key Formulas

### Compliance Balance (CB)
```
CB = (Target - Actual GHG Intensity) × Energy in Scope
Energy in Scope = Fuel Consumption (t) × 41,000 MJ/t
Target (2025) = 89.3368 gCO₂e/MJ
```

**Example:**
- GHG Intensity: 88.0 gCO₂e/MJ
- Fuel Consumption: 5000 tonnes
- Energy in Scope: 5000 × 41,000 = 205,000,000 MJ
- CB = (89.3368 - 88.0) × 205,000,000 = 274,044,000 gCO₂e = 274,044 tCO₂e (Surplus)

### Percentage Difference
```
percentDiff = ((comparison / baseline) - 1) × 100
```

**Example:**
- Baseline: 91.0 gCO₂e/MJ
- Comparison: 88.0 gCO₂e/MJ
- percentDiff = ((88.0 / 91.0) - 1) × 100 = -3.3%

## Sample Data

The database is seeded with 5 sample routes:

| Route ID | Vessel Type | Fuel Type | Year | GHG Intensity | Fuel Consumption | Distance | Total Emissions | Baseline |
|----------|-------------|-----------|------|---------------|------------------|----------|-----------------|----------|
| R001     | Container   | HFO       | 2024 | 91.0          | 5000t            | 12000km  | 4500t           | Yes      |
| R002     | BulkCarrier | LNG       | 2024 | 88.0          | 4800t            | 11500km  | 4200t           | No       |
| R003     | Tanker     | MGO       | 2024 | 93.5          | 5100t            | 12500km  | 4700t           | No       |
| R004     | RoRo       | HFO       | 2025 | 89.2          | 4900t            | 11800km  | 4300t           | No       |
| R005     | Container   | LNG       | 2025 | 90.5          | 4950t            | 11900km  | 4400t           | No       |

## Sample API Requests

### Using cURL

#### Get Routes
```bash
curl http://localhost:3001/routes
```

#### Set Baseline
```bash
curl -X POST http://localhost:3001/routes/R001/baseline
```

#### Get Compliance Balance
```bash
curl "http://localhost:3001/compliance/cb?shipId=S001&year=2024"
```

#### Bank Surplus
```bash
curl -X POST http://localhost:3001/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"S001","year":2024,"amount":5000.0}'
```

#### Create Pool
```bash
curl -X POST http://localhost:3001/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"members":["S001","S002","S003"]}'
```

## Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
VMS_assgn/
├── backend/
│   ├── src/
│   │   ├── core/              # Domain & Application layers
│   │   ├── adapters/          # Infrastructure adapters
│   │   └── infrastructure/    # Database & Server setup
│   ├── prisma/                # Database schema & migrations
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── core/              # Domain & Application layers
│   │   ├── adapters/          # React components & API clients
│   │   └── ui/                # Shared UI components
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── AGENT_WORKFLOW.md          # AI agent usage documentation
├── README.md                  # This file
└── REFLECTION.md              # Reflection on AI agent usage
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check database exists: `CREATE DATABASE fueleu_maritime;`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Set `PORT=3000` in `frontend/.env` or use `PORT=3000 npm run dev`

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
- Use `npm run prisma:studio` to inspect database

### CORS Issues
- Ensure backend CORS is configured (already set up)
- Verify frontend API URL matches backend port

## Contributing

1. Follow the hexagonal architecture pattern
2. Write tests for new features
3. Use TypeScript strict mode
4. Follow ESLint and Prettier configurations
5. Document AI agent usage in `AGENT_WORKFLOW.md`

## License

ISC

## References

- [Fuel EU Maritime Regulation (EU) 2023/1805](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1805)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
>>>>>>> 119c9fe (Basic functionalities)
