import { ComputeCBUseCase } from '../ComputeCBUseCase';
import { Route } from '../../domain/Route';
import { ComplianceBalance } from '../../domain/ComplianceBalance';
import { IRouteRepository } from '../../ports/IRouteRepository';
import { IComplianceRepository } from '../../ports/IComplianceRepository';

describe('ComputeCBUseCase', () => {
  let computeCBUseCase: ComputeCBUseCase;
  let mockRouteRepository: jest.Mocked<IRouteRepository>;
  let mockComplianceRepository: jest.Mocked<IComplianceRepository>;

  beforeEach(() => {
    mockRouteRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByBaseline: jest.fn(),
      setBaseline: jest.fn(),
      clearAllBaselines: jest.fn(),
      save: jest.fn(),
    };

    mockComplianceRepository = {
      getCB: jest.fn(),
      saveCB: jest.fn(),
      getAdjustedCB: jest.fn(),
    };

    computeCBUseCase = new ComputeCBUseCase(mockRouteRepository, mockComplianceRepository);
  });

  describe('execute', () => {
    it('should calculate positive CB (surplus) correctly', async () => {
      // Arrange
      const shipId = 'S001';
      const year = 2024;
      const route = new Route(
        'R001',
        'Container',
        'LNG',
        year,
        88.0, // GHG intensity below target (89.3368)
        5000, // fuel consumption in tonnes
        12000, // distance
        4500, // total emissions
        false
      );

      mockRouteRepository.findAll.mockResolvedValue([route]);

      const expectedCB = ComplianceBalance.calculate(route.ghgIntensity, route.fuelConsumption);
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result).toBeInstanceOf(ComplianceBalance);
      expect(result.shipId).toBe(shipId);
      expect(result.year).toBe(year);
      expect(result.cbGco2eq).toBeGreaterThan(0); // Positive CB (surplus)
      expect(mockComplianceRepository.saveCB).toHaveBeenCalledWith(
        expect.objectContaining({
          shipId,
          year,
          cbGco2eq: expectedCB,
        })
      );
    });

    it('should calculate negative CB (deficit) correctly', async () => {
      // Arrange
      const shipId = 'S002';
      const year = 2024;
      const route = new Route(
        'R002',
        'Tanker',
        'HFO',
        year,
        93.5, // GHG intensity above target (89.3368)
        5100, // fuel consumption in tonnes
        12500, // distance
        4700, // total emissions
        false
      );

      mockRouteRepository.findAll.mockResolvedValue([route]);

      const expectedCB = ComplianceBalance.calculate(route.ghgIntensity, route.fuelConsumption);
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result.cbGco2eq).toBeLessThan(0); // Negative CB (deficit)
      expect(mockComplianceRepository.saveCB).toHaveBeenCalled();
    });

    it('should calculate zero CB when GHG intensity equals target', async () => {
      // Arrange
      const shipId = 'S003';
      const year = 2024;
      const targetIntensity = 89.3368;
      const route = new Route(
        'R003',
        'Container',
        'MGO',
        year,
        targetIntensity, // Exactly at target
        5000,
        12000,
        4500,
        false
      );

      mockRouteRepository.findAll.mockResolvedValue([route]);

      const expectedCB = ComplianceBalance.calculate(route.ghgIntensity, route.fuelConsumption);
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result.cbGco2eq).toBeCloseTo(0, 2);
    });

    it('should sum CB from multiple routes', async () => {
      // Arrange
      const shipId = 'S004';
      const year = 2024;
      const routes = [
        new Route('R001', 'Container', 'LNG', year, 88.0, 2500, 6000, 2250, false),
        new Route('R002', 'Container', 'LNG', year, 90.0, 2500, 6000, 2250, false),
      ];

      mockRouteRepository.findAll.mockResolvedValue(routes);

      const totalCB =
        ComplianceBalance.calculate(routes[0].ghgIntensity, routes[0].fuelConsumption) +
        ComplianceBalance.calculate(routes[1].ghgIntensity, routes[1].fuelConsumption);

      const savedCB = new ComplianceBalance(shipId, year, totalCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result.cbGco2eq).toBeCloseTo(totalCB, 2);
    });

    it('should throw error when no routes found', async () => {
      // Arrange
      const shipId = 'S005';
      const year = 2024;

      mockRouteRepository.findAll.mockResolvedValue([]);

      // Act & Assert
      await expect(computeCBUseCase.execute(shipId, year)).rejects.toThrow(
        `No routes found for ship ${shipId} in year ${year}`
      );
    });

    it('should handle edge case with very small fuel consumption', async () => {
      // Arrange
      const shipId = 'S006';
      const year = 2024;
      const route = new Route(
        'R006',
        'Container',
        'LNG',
        year,
        88.0,
        0.1, // Very small fuel consumption
        100,
        0.09,
        false
      );

      mockRouteRepository.findAll.mockResolvedValue([route]);

      const expectedCB = ComplianceBalance.calculate(route.ghgIntensity, route.fuelConsumption);
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result.cbGco2eq).toBeCloseTo(expectedCB, 2);
      expect(Math.abs(result.cbGco2eq)).toBeLessThan(1000); // Small value
    });

    it('should handle edge case with very large fuel consumption', async () => {
      // Arrange
      const shipId = 'S007';
      const year = 2024;
      const route = new Route(
        'R007',
        'Tanker',
        'HFO',
        year,
        88.0,
        50000, // Very large fuel consumption
        100000,
        45000,
        false
      );

      mockRouteRepository.findAll.mockResolvedValue([route]);

      const expectedCB = ComplianceBalance.calculate(route.ghgIntensity, route.fuelConsumption);
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.execute(shipId, year);

      // Assert
      expect(result.cbGco2eq).toBeCloseTo(expectedCB, 2);
      expect(Math.abs(result.cbGco2eq)).toBeGreaterThan(100000); // Large value
    });
  });

  describe('executeFromRoute', () => {
    it('should compute CB from a single route', async () => {
      // Arrange
      const shipId = 'S008';
      const year = 2024;
      const routeId = 'R001';
      const route = new Route(
        routeId,
        'Container',
        'LNG',
        year,
        88.0,
        5000,
        12000,
        4500,
        false
      );

      mockRouteRepository.findById.mockResolvedValue(route);

      const expectedCB = route.calculateCB();
      const savedCB = new ComplianceBalance(shipId, year, expectedCB);
      mockComplianceRepository.saveCB.mockResolvedValue(savedCB);

      // Act
      const result = await computeCBUseCase.executeFromRoute(routeId, shipId, year);

      // Assert
      expect(result.cbGco2eq).toBe(expectedCB);
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(mockComplianceRepository.saveCB).toHaveBeenCalled();
    });

    it('should throw error when route not found', async () => {
      // Arrange
      const routeId = 'R999';
      const shipId = 'S009';
      const year = 2024;

      mockRouteRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        computeCBUseCase.executeFromRoute(routeId, shipId, year)
      ).rejects.toThrow(`Route with ID ${routeId} not found`);
    });
  });
});

