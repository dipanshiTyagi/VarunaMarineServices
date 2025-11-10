import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BankingTab } from '../BankingTab';
import { BankingService } from '../../../../core/application/services/BankingService';
import { ComplianceService } from '../../../../core/application/services/ComplianceService';
import { apiClient } from '../../../../adapters/outbound/apiClient';

// Mock the API client and services
jest.mock('../../../../adapters/outbound/apiClient');
jest.mock('../../../../core/application/services/BankingService');
jest.mock('../../../../core/application/services/ComplianceService');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BankingTab', () => {
  const mockCB = {
    id: 1,
    shipId: 'S001',
    year: 2024,
    cbGco2eq: 10000.5,
    createdAt: new Date(),
  };

  const mockBankRecords = {
    records: [
      {
        id: 1,
        shipId: 'S001',
        year: 2024,
        amountGco2eq: 5000.0,
        createdAt: new Date(),
      },
    ],
    summary: {
      totalBanked: 5000.0,
      totalApplied: 2000.0,
      available: 3000.0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search form', () => {
    render(<BankingTab />);

    expect(screen.getByLabelText('Ship ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(screen.getByText('Fetch CB')).toBeInTheDocument();
  });

  it('should fetch CB and display KPIs on form submit', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({ ...mockCB, cbGco2eq: 8000.5 });
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue(mockBankRecords);

    render(<BankingTab />);

    const shipIdInput = screen.getByLabelText('Ship ID');
    const yearInput = screen.getByLabelText('Year');
    const submitButton = screen.getByText('Fetch CB');

    fireEvent.change(shipIdInput, { target: { value: 'S001' } });
    fireEvent.change(yearInput, { target: { value: '2024' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('CB Before')).toBeInTheDocument();
      expect(screen.getByText('10000.50')).toBeInTheDocument();
    });
  });

  it('should display KPIs correctly', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue({ ...mockCB, cbGco2eq: 8000.5 });
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue(mockBankRecords);

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      expect(screen.getByText('CB Before')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('CB After')).toBeInTheDocument();
    });
  });

  it('should disable bank button when CB is negative', async () => {
    const negativeCB = { ...mockCB, cbGco2eq: -5000.0 };
    mockApiClient.getCB = jest.fn().mockResolvedValue(negativeCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(negativeCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue({
      records: [],
      summary: { totalBanked: 0, totalApplied: 0, available: 0 },
    });

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      const bankButton = screen.getByText('Bank Surplus');
      expect(bankButton).toBeDisabled();
    });
  });

  it('should enable bank button when CB is positive', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue({
      records: [],
      summary: { totalBanked: 0, totalApplied: 0, available: 0 },
    });

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      const bankButton = screen.getByText('Bank Surplus');
      expect(bankButton).not.toBeDisabled();
    });
  });

  it('should bank surplus when button is clicked', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue({
      records: [],
      summary: { totalBanked: 0, totalApplied: 0, available: 0 },
    });
    mockApiClient.bankSurplus = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      amountGco2eq: 5000.0,
      createdAt: new Date(),
    });

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      const bankAmountInput = screen.getByLabelText('Amount (gCO₂e)');
      fireEvent.change(bankAmountInput, { target: { value: '5000' } });
    });

    const bankButton = screen.getByText('Bank Surplus');
    fireEvent.click(bankButton);

    await waitFor(() => {
      expect(mockApiClient.bankSurplus).toHaveBeenCalledWith({
        shipId: 'S001',
        year: 2024,
        amount: 5000,
      });
    });
  });

  it('should apply banked amount when button is clicked', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue(mockBankRecords);
    mockApiClient.applyBanked = jest.fn().mockResolvedValue({
      cbBefore: 10000.5,
      applied: 2000.0,
      cbAfter: 12000.5,
    });

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      const applyAmountInput = screen.getByLabelText('Amount (gCO₂e)', { exact: false });
      fireEvent.change(applyAmountInput, { target: { value: '2000' } });
    });

    const applyButton = screen.getByText('Apply Banked');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApiClient.applyBanked).toHaveBeenCalledWith({
        shipId: 'S001',
        year: 2024,
        amount: 2000,
      });
    });
  });

  it('should display bank records table', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue(mockBankRecords);

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      expect(screen.getByText('Bank Records')).toBeInTheDocument();
      expect(screen.getByText('S001')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockApiClient.getCB = jest.fn().mockRejectedValue(new Error('Failed to fetch CB'));

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch CB')).toBeInTheDocument();
    });
  });

  it('should display success message after banking', async () => {
    mockApiClient.getCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getAdjustedCB = jest.fn().mockResolvedValue(mockCB);
    mockApiClient.getBankRecords = jest.fn().mockResolvedValue({
      records: [],
      summary: { totalBanked: 0, totalApplied: 0, available: 0 },
    });
    mockApiClient.bankSurplus = jest.fn().mockResolvedValue({
      id: 1,
      shipId: 'S001',
      year: 2024,
      amountGco2eq: 5000.0,
      createdAt: new Date(),
    });

    render(<BankingTab />);

    fireEvent.change(screen.getByLabelText('Ship ID'), { target: { value: 'S001' } });
    fireEvent.click(screen.getByText('Fetch CB'));

    await waitFor(() => {
      const bankAmountInput = screen.getByLabelText('Amount (gCO₂e)');
      fireEvent.change(bankAmountInput, { target: { value: '5000' } });
    });

    fireEvent.click(screen.getByText('Bank Surplus'));

    await waitFor(() => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });
  });
});

