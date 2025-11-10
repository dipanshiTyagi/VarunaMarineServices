import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PoolingTab } from '../PoolingTab';
import { PoolingService } from '../../../../core/application/services/PoolingService';
import { ComplianceService } from '../../../../core/application/services/ComplianceService';
import { apiClient } from '../../../../adapters/outbound/apiClient';

// Mock the API client and services
jest.mock('../../../../adapters/outbound/apiClient');
jest.mock('../../../../core/application/services/PoolingService');
jest.mock('../../../../core/application/services/ComplianceService');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('PoolingTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with year and ship ID inputs', () => {
    render(<PoolingTab />);

    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Add Ship ID')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should add ship ID when add button is clicked', () => {
    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    expect(screen.getByText('S001')).toBeInTheDocument();
  });

  it('should remove ship ID when remove button is clicked', () => {
    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    expect(screen.getByText('S001')).toBeInTheDocument();

    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    expect(screen.queryByText('S001')).not.toBeInTheDocument();
  });

  it('should fetch adjusted CB for all ships', async () => {
    mockApiClient.getAdjustedCB = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        shipId: 'S001',
        year: 2024,
        cbGco2eq: 10000.0,
      })
      .mockResolvedValueOnce({
        id: 2,
        shipId: 'S002',
        year: 2024,
        cbGco2eq: -5000.0,
      });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    fireEvent.change(shipIdInput, { target: { value: 'S002' } });
    fireEvent.click(addButton);

    const fetchButton = screen.getByText('Fetch Adjusted CB for All Ships');
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(mockApiClient.getAdjustedCB).toHaveBeenCalledTimes(2);
    });
  });

  it('should display pool members table after fetching CB', async () => {
    mockApiClient.getAdjustedCB = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        shipId: 'S001',
        year: 2024,
        cbGco2eq: 10000.0,
      })
      .mockResolvedValueOnce({
        id: 2,
        shipId: 'S002',
        year: 2024,
        cbGco2eq: -5000.0,
      });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    fireEvent.change(shipIdInput, { target: { value: 'S002' } });
    fireEvent.click(addButton);

    const fetchButton = screen.getByText('Fetch Adjusted CB for All Ships');
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText('Pool Members')).toBeInTheDocument();
      expect(screen.getByText('S001')).toBeInTheDocument();
      expect(screen.getByText('S002')).toBeInTheDocument();
    });
  });

  it('should display pool sum indicator', async () => {
    mockApiClient.getAdjustedCB = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        shipId: 'S001',
        year: 2024,
        cbGco2eq: 10000.0,
      })
      .mockResolvedValueOnce({
        id: 2,
        shipId: 'S002',
        year: 2024,
        cbGco2eq: -5000.0,
      });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    fireEvent.change(shipIdInput, { target: { value: 'S002' } });
    fireEvent.click(addButton);

    const fetchButton = screen.getByText('Fetch Adjusted CB for All Ships');
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText('Pool Sum')).toBeInTheDocument();
      expect(screen.getByText('5000.00 gCO₂e')).toBeInTheDocument();
    });
  });

  it('should show green indicator when pool sum is positive', async () => {
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      cbGco2eq: 10000.0,
    });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Fetch Adjusted CB for All Ships'));

    await waitFor(() => {
      const poolSumIndicator = screen.getByText('Pool Sum').closest('div');
      expect(poolSumIndicator).toHaveClass('bg-green-50');
    });
  });

  it('should show red indicator when pool sum is negative', async () => {
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      cbGco2eq: -10000.0,
    });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Fetch Adjusted CB for All Ships'));

    await waitFor(() => {
      const poolSumIndicator = screen.getByText('Pool Sum').closest('div');
      expect(poolSumIndicator).toHaveClass('bg-red-50');
    });
  });

  it('should disable create pool button when pool sum is negative', async () => {
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      cbGco2eq: -10000.0,
    });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Fetch Adjusted CB for All Ships'));

    await waitFor(() => {
      const createButton = screen.getByText('Create Pool');
      expect(createButton).toBeDisabled();
    });
  });

  it('should create pool when button is clicked', async () => {
    mockApiClient.getAdjustedCB = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        shipId: 'S001',
        year: 2024,
        cbGco2eq: 10000.0,
      })
      .mockResolvedValueOnce({
        id: 2,
        shipId: 'S002',
        year: 2024,
        cbGco2eq: -5000.0,
      });

    const mockPool = {
      id: 1,
      year: 2024,
      members: [
        { shipId: 'S001', cbBefore: 10000.0, cbAfter: 5000.0 },
        { shipId: 'S002', cbBefore: -5000.0, cbAfter: 0.0 },
      ],
      createdAt: new Date(),
    };

    mockApiClient.createPool = jest.fn().mockResolvedValue(mockPool);

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    const addButton = screen.getByText('Add');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(addButton);

    fireEvent.change(shipIdInput, { target: { value: 'S002' } });
    fireEvent.click(addButton);

    const fetchButton = screen.getByText('Fetch Adjusted CB for All Ships');
    fireEvent.click(fetchButton);

    await waitFor(() => {
      const createButton = screen.getByText('Create Pool');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(mockApiClient.createPool).toHaveBeenCalledWith({
        year: 2024,
        members: ['S001', 'S002'],
      });
    });
  });

  it('should display error message on validation failure', async () => {
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      cbGco2eq: -10000.0,
    });

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Fetch Adjusted CB for All Ships'));

    await waitFor(() => {
      const createButton = screen.getByText('Create Pool');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('should display success message after pool creation', async () => {
    mockApiClient.getAdjustedCB = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        shipId: 'S001',
        year: 2024,
        cbGco2eq: 10000.0,
      })
      .mockResolvedValueOnce({
        id: 2,
        shipId: 'S002',
        year: 2024,
        cbGco2eq: -5000.0,
      });

    const mockPool = {
      id: 1,
      year: 2024,
      members: [
        { shipId: 'S001', cbBefore: 10000.0, cbAfter: 5000.0 },
        { shipId: 'S002', cbBefore: -5000.0, cbAfter: 0.0 },
      ],
      createdAt: new Date(),
    };

    mockApiClient.createPool = jest.fn().mockResolvedValue(mockPool);

    render(<PoolingTab />);

    const shipIdInput = screen.getByLabelText('Add Ship ID');
    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.change(shipIdInput, { target: { value: 'S002' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Fetch Adjusted CB for All Ships'));

    await waitFor(() => {
      const createButton = screen.getByText('Create Pool');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });
  });
});

