import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CompareTab } from '../CompareTab';
import { RouteService } from '../../../../core/application/services/RouteService';
import { apiClient } from '../../../../adapters/outbound/apiClient';

// Mock the API client and services
jest.mock('../../../../adapters/outbound/apiClient');
jest.mock('../../../../core/application/services/RouteService');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CompareTab', () => {
  const mockComparisonData = {
    baseline: {
      id: 1,
      routeId: 'R001',
      vesselType: 'Container',
      fuelType: 'HFO',
      year: 2024,
      ghgIntensity: 91.0,
      fuelConsumption: 5000,
      distance: 12000,
      totalEmissions: 4500,
      isBaseline: true,
    },
    comparisons: [
      {
        route: {
          id: 2,
          routeId: 'R002',
          vesselType: 'BulkCarrier',
          fuelType: 'LNG',
          year: 2024,
          ghgIntensity: 88.0,
          fuelConsumption: 4800,
          distance: 11500,
          totalEmissions: 4200,
          isBaseline: false,
        },
        percentDiff: -3.3,
        compliant: true,
      },
      {
        route: {
          id: 3,
          routeId: 'R003',
          vesselType: 'Tanker',
          fuelType: 'MGO',
          year: 2024,
          ghgIntensity: 93.5,
          fuelConsumption: 5100,
          distance: 12500,
          totalEmissions: 4700,
          isBaseline: false,
        },
        percentDiff: 2.75,
        compliant: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    mockApiClient.getComparison.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockComparisonData), 100);
        })
    );

    render(<CompareTab />);

    expect(screen.getByText('Loading comparison data...')).toBeInTheDocument();
  });

  it('should render baseline info card', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText('Baseline Route')).toBeInTheDocument();
      expect(screen.getByText('R001')).toBeInTheDocument();
      expect(screen.getByText('91.00 gCO₂e/MJ')).toBeInTheDocument();
    });
  });

  it('should render comparison table', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText('R002')).toBeInTheDocument();
      expect(screen.getByText('R003')).toBeInTheDocument();
    });
  });

  it('should display percent difference correctly', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      // R002 has negative percentDiff (-3.3%)
      const r002Row = screen.getByText('R002').closest('tr');
      expect(r002Row).toHaveTextContent('-3.30%');
    });
  });

  it('should display compliant status with checkmark', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      const r002Row = screen.getByText('R002').closest('tr');
      expect(r002Row).toHaveTextContent('✅');
      expect(r002Row).toHaveTextContent('Compliant');
    });
  });

  it('should display non-compliant status with cross', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      const r003Row = screen.getByText('R003').closest('tr');
      expect(r003Row).toHaveTextContent('❌');
      expect(r003Row).toHaveTextContent('Non-compliant');
    });
  });

  it('should render summary statistics', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText('Total Comparisons')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Compliant Routes')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Non-Compliant Routes')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockApiClient.getComparison.mockRejectedValue(new Error('Failed to fetch comparison'));

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading comparison data/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch comparison')).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    mockApiClient.getComparison.mockRejectedValue(new Error('Failed to fetch comparison'));

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });
  });

  it('should render chart with correct data', async () => {
    mockApiClient.getComparison.mockResolvedValue(mockComparisonData);

    render(<CompareTab />);

    await waitFor(() => {
      expect(screen.getByText('GHG Intensity Comparison')).toBeInTheDocument();
    });
  });
});

