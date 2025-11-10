import { BankSurplusUseCase } from '../BankSurplusUseCase';
import { ComplianceBalance } from '../../domain/ComplianceBalance';
import { BankEntry } from '../../domain/BankEntry';
import { IComplianceRepository } from '../../ports/IComplianceRepository';
import { IBankRepository } from '../../ports/IBankRepository';

describe('BankSurplusUseCase', () => {
  let bankSurplusUseCase: BankSurplusUseCase;
  let mockComplianceRepository: jest.Mocked<IComplianceRepository>;
  let mockBankRepository: jest.Mocked<IBankRepository>;

  beforeEach(() => {
    mockComplianceRepository = {
      getCB: jest.fn(),
      saveCB: jest.fn(),
      getAdjustedCB: jest.fn(),
    };

    mockBankRepository = {
      getBanked: jest.fn(),
      getTotalBanked: jest.fn(),
      getTotalApplied: jest.fn(),
      saveBankEntry: jest.fn(),
      getBankRecords: jest.fn(),
      recordApplication: jest.fn(),
    };

    bankSurplusUseCase = new BankSurplusUseCase(mockComplianceRepository, mockBankRepository);
  });

  describe('execute', () => {
    it('should bank surplus when CB is positive and amount is valid', async () => {
      // Arrange
      const shipId = 'S001';
      const year = 2024;
      const cbValue = 10000.5; // Positive CB (surplus)
      const amount = 5000.0;

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0); // No previous banking

      const bankEntry = new BankEntry(shipId, year, amount);
      mockBankRepository.saveBankEntry.mockResolvedValue(bankEntry);

      // Act
      const result = await bankSurplusUseCase.execute(shipId, year, amount);

      // Assert
      expect(result).toBeInstanceOf(BankEntry);
      expect(result.shipId).toBe(shipId);
      expect(result.year).toBe(year);
      expect(result.amountGco2eq).toBe(amount);
      expect(mockBankRepository.saveBankEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          shipId,
          year,
          amountGco2eq: amount,
        })
      );
    });

    it('should bank partial amount when some already banked', async () => {
      // Arrange
      const shipId = 'S002';
      const year = 2024;
      const cbValue = 10000.0;
      const alreadyBanked = 3000.0;
      const amount = 5000.0; // Less than available

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(alreadyBanked);

      const bankEntry = new BankEntry(shipId, year, amount);
      mockBankRepository.saveBankEntry.mockResolvedValue(bankEntry);

      // Act
      const result = await bankSurplusUseCase.execute(shipId, year, amount);

      // Assert
      expect(result.amountGco2eq).toBe(amount);
      expect(mockBankRepository.getTotalBanked).toHaveBeenCalledWith(shipId, year);
    });

    it('should throw error when CB is zero', async () => {
      // Arrange
      const shipId = 'S003';
      const year = 2024;
      const cbValue = 0;
      const amount = 1000.0;

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        'Cannot bank: Compliance Balance is not positive'
      );
    });

    it('should throw error when CB is negative', async () => {
      // Arrange
      const shipId = 'S004';
      const year = 2024;
      const cbValue = -5000.0; // Negative CB (deficit)
      const amount = 1000.0;

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        'Cannot bank: Compliance Balance is not positive'
      );
    });

    it('should throw error when amount is negative', async () => {
      // Arrange
      const shipId = 'S005';
      const year = 2024;
      const cbValue = 10000.0;
      const amount = -1000.0; // Negative amount

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        'Banked amount must be positive'
      );
    });

    it('should throw error when amount is zero', async () => {
      // Arrange
      const shipId = 'S006';
      const year = 2024;
      const cbValue = 10000.0;
      const amount = 0;

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        'Banked amount must be positive'
      );
    });

    it('should throw error when amount exceeds available CB', async () => {
      // Arrange
      const shipId = 'S007';
      const year = 2024;
      const cbValue = 10000.0;
      const alreadyBanked = 2000.0;
      const availableToBank = cbValue - alreadyBanked; // 8000
      const amount = 9000.0; // More than available

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(alreadyBanked);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        `Cannot bank ${amount.toFixed(2)}: Only ${availableToBank.toFixed(2)} available`
      );
    });

    it('should throw error when amount equals exactly available CB', async () => {
      // Arrange
      const shipId = 'S008';
      const year = 2024;
      const cbValue = 10000.0;
      const alreadyBanked = 0;
      const amount = 10000.0; // Exactly equal to CB

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(alreadyBanked);

      const bankEntry = new BankEntry(shipId, year, amount);
      mockBankRepository.saveBankEntry.mockResolvedValue(bankEntry);

      // Act
      const result = await bankSurplusUseCase.execute(shipId, year, amount);

      // Assert
      expect(result.amountGco2eq).toBe(amount);
    });

    it('should throw error when CB not found', async () => {
      // Arrange
      const shipId = 'S009';
      const year = 2024;
      const amount = 1000.0;

      mockComplianceRepository.getCB.mockResolvedValue(null);

      // Act & Assert
      await expect(bankSurplusUseCase.execute(shipId, year, amount)).rejects.toThrow(
        `No compliance balance found for ship ${shipId} in year ${year}`
      );
    });

    it('should handle edge case with very small amount', async () => {
      // Arrange
      const shipId = 'S010';
      const year = 2024;
      const cbValue = 10000.0;
      const amount = 0.01; // Very small amount

      const cb = new ComplianceBalance(shipId, year, cbValue);
      mockComplianceRepository.getCB.mockResolvedValue(cb);
      mockBankRepository.getTotalBanked.mockResolvedValue(0);

      const bankEntry = new BankEntry(shipId, year, amount);
      mockBankRepository.saveBankEntry.mockResolvedValue(bankEntry);

      // Act
      const result = await bankSurplusUseCase.execute(shipId, year, amount);

      // Assert
      expect(result.amountGco2eq).toBe(amount);
    });
  });
});

