import express, { Express } from 'express';
import cors from 'cors';
import { RoutesController, ComplianceController, BankingController, PoolingController, errorHandler } from '../../adapters/inbound/http';
import { PrismaRouteRepository, PrismaComplianceRepository, PrismaBankRepository, PrismaPoolRepository } from '../../adapters/outbound/postgres';
import {
  GetRoutesUseCase,
  SetBaselineUseCase,
  GetComparisonUseCase,
  ComputeCBUseCase,
  GetAdjustedCBUseCase,
  BankSurplusUseCase,
  ApplyBankedUseCase,
  CreatePoolUseCase,
} from '../../core/application';
// import { prisma } from '../db/prismaClient';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors()); // Enable CORS for all routes
  app.use(express.json()); // Parse JSON request bodies
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Initialize repositories
  const routeRepository = new PrismaRouteRepository();
  const bankRepository = new PrismaBankRepository();
  const complianceRepository = new PrismaComplianceRepository(bankRepository);
  const poolRepository = new PrismaPoolRepository();

  // Initialize use cases
  const getRoutesUseCase = new GetRoutesUseCase(routeRepository);
  const setBaselineUseCase = new SetBaselineUseCase(routeRepository);
  const getComparisonUseCase = new GetComparisonUseCase(routeRepository);
  const computeCBUseCase = new ComputeCBUseCase(routeRepository, complianceRepository);
  const getAdjustedCBUseCase = new GetAdjustedCBUseCase(complianceRepository, bankRepository);
  const bankSurplusUseCase = new BankSurplusUseCase(complianceRepository, bankRepository);
  const applyBankedUseCase = new ApplyBankedUseCase(complianceRepository, bankRepository);
  
  // Create pool use case needs an adjusted CB service
  // We'll use GetAdjustedCBUseCase as the service
  const createPoolUseCase = new CreatePoolUseCase(
    {
      getAdjustedCB: (shipId: string, year: number) => getAdjustedCBUseCase.execute(shipId, year),
    },
    poolRepository
  );

  // Initialize controllers
  const routesController = new RoutesController(
    getRoutesUseCase,
    setBaselineUseCase,
    getComparisonUseCase
  );

  const complianceController = new ComplianceController(
    computeCBUseCase,
    getAdjustedCBUseCase
  );

  const bankingController = new BankingController(
    bankRepository,
    bankSurplusUseCase,
    applyBankedUseCase
  );

  const poolingController = new PoolingController(createPoolUseCase);

  // Routes
  // Routes endpoints
  app.get('/routes', (req, res) => routesController.getAllRoutes(req, res));
  app.post('/routes/:routeId/baseline', (req, res) => routesController.setBaseline(req, res));
  app.get('/routes/comparison', (req, res) => routesController.getComparison(req, res));

  // Compliance endpoints
  app.get('/compliance/cb', (req, res) => complianceController.getCB(req, res));
  app.get('/compliance/adjusted-cb', (req, res) => complianceController.getAdjustedCB(req, res));

  // Banking endpoints
  app.get('/banking/records', (req, res) => bankingController.getBankRecords(req, res));
  app.post('/banking/bank', (req, res) => bankingController.bankSurplus(req, res));
  app.post('/banking/apply', (req, res) => bankingController.applyBanked(req, res));

  // Pooling endpoints
  app.post('/pools', (req, res) => poolingController.createPool(req, res));

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`,
    });
  });

  return app;
}

