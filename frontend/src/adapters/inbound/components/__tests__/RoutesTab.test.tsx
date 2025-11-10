import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RoutesTab } from '../RoutesTab';
import { RouteService } from '../../../../core/application/services/RouteService';
import { apiClient } from '../../../../adapters/outbound/apiClient';

// Mock the API client and services
jest.mock('../../../../adapters/outbound/apiClient');
jest.mock('../../../../core/application/services/RouteService');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('RoutesTab', () => {
  const mockRoutes = [
    {
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
    {
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    mockApiClient.getRoutes.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockRoutes), 100);
        })
    );

    render(<RoutesTab />);

    expect(screen.getByText('Loading routes...')).toBeInTheDocument();
  });

  it('should render routes table after loading', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
      expect(screen.getByText('R002')).toBeInTheDocument();
    });

    expect(screen.getByText('Container')).toBeInTheDocument();
    expect(screen.getByText('BulkCarrier')).toBeInTheDocument();
  });

  it('should display baseline badge for baseline route', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('Baseline')).toBeInTheDocument();
    });
  });

  it('should filter routes by vessel type', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });

    const vesselTypeSelect = screen.getByLabelText('Vessel Type');
    fireEvent.change(vesselTypeSelect, { target: { value: 'Container' } });

    await waitFor(() => {
      expect(mockApiClient.getRoutes).toHaveBeenCalledWith(
        expect.objectContaining({ vesselType: 'Container' })
      );
    });
  });

  it('should filter routes by fuel type', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });

    const fuelTypeSelect = screen.getByLabelText('Fuel Type');
    fireEvent.change(fuelTypeSelect, { target: { value: 'LNG' } });

    await waitFor(() => {
      expect(mockApiClient.getRoutes).toHaveBeenCalledWith(
        expect.objectContaining({ fuelType: 'LNG' })
      );
    });
  });

  it('should filter routes by year', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });

    const yearInput = screen.getByLabelText('Year');
    fireEvent.change(yearInput, { target: { value: '2024' } });

    await waitFor(() => {
      expect(mockApiClient.getRoutes).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2024 })
      );
    });
  });

  it('should clear filters when clear button is clicked', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });

    const vesselTypeSelect = screen.getByLabelText('Vessel Type');
    fireEvent.change(vesselTypeSelect, { target: { value: 'Container' } });

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockApiClient.getRoutes).toHaveBeenCalledWith({});
    });
  });

  it('should set baseline when button is clicked', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);
    mockApiClient.setBaseline.mockResolvedValue(undefined);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('R002')).toBeInTheDocument();
    });

    const setBaselineButtons = screen.getAllByText('Set Baseline');
    const nonBaselineButton = setBaselineButtons.find(
      (btn) => !btn.closest('tr')?.querySelector('[class*="bg-primary-50"]')
    );

    if (nonBaselineButton) {
      fireEvent.click(nonBaselineButton);

      await waitFor(() => {
        expect(mockApiClient.setBaseline).toHaveBeenCalled();
      });
    }
  });

  it('should disable set baseline button for baseline route', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      const baselineRow = screen.getByText('R001').closest('tr');
      const setBaselineButton = baselineRow?.querySelector('button');
      expect(setBaselineButton).toBeDisabled();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockApiClient.getRoutes.mockRejectedValue(new Error('Failed to fetch routes'));

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading routes/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch routes')).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    mockApiClient.getRoutes.mockRejectedValue(new Error('Failed to fetch routes'));

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
    });
  });

  it('should display results count', async () => {
    mockApiClient.getRoutes.mockResolvedValue(mockRoutes);

    render(<RoutesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 2 routes/i)).toBeInTheDocument();
    });
  });
});

