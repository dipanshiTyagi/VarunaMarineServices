import { BankEntry } from '../domain/BankEntry';
// import { ComplianceBalance } from '../domain/ComplianceBalance';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IBankRepository } from '../ports/IBankRepository';

/**
 * Use case: Bank surplus Compliance Balance
 * Validates that CB > 0 and amount <= CB before banking
 */
export class BankSurplusUseCase {
  constructor(
    private readonly complianceRepository: IComplianceRepository,
    private readonly bankRepository: IBankRepository
  ) {}

  async execute(shipId: string, year: number, amount: number): Promise<BankEntry> {
    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Banked amount must be positive');
    }

    // Get current CB
    const cb = await this.complianceRepository.getCB(shipId, year);
    if (!cb) {
      throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
    }

    // Validate CB is positive (surplus)
    if (cb.cbGco2eq <= 0) {
      throw new Error(`Cannot bank: Compliance Balance is not positive (${cb.cbGco2eq.toFixed(2)})`);
    }

    // Get already banked amount
    const alreadyBanked = await this.bankRepository.getTotalBanked(shipId, year);
    const availableToBank = cb.cbGco2eq - alreadyBanked;

    // Validate amount doesn't exceed available CB
    if (amount > availableToBank) {
      throw new Error(
        `Cannot bank ${amount.toFixed(2)}: Only ${availableToBank.toFixed(2)} available (CB: ${cb.cbGco2eq.toFixed(2)}, Already banked: ${alreadyBanked.toFixed(2)})`
      );
    }

    // Create bank entry
    const bankEntry = new BankEntry(shipId, year, amount);

    // Save to repository
    return await this.bankRepository.saveBankEntry(bankEntry);
  }
}

