// import { ComplianceBalance } from '../domain/ComplianceBalance';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IBankRepository } from '../ports/IBankRepository';

export interface ApplyBankedResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

/**
 * Use case: Apply banked surplus to cover a deficit
 * Validates that amount <= available banked before applying
 */
export class ApplyBankedUseCase {
  constructor(
    private readonly complianceRepository: IComplianceRepository,
    private readonly bankRepository: IBankRepository
  ) {}

  async execute(shipId: string, year: number, amount: number): Promise<ApplyBankedResult> {
    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Applied amount must be positive');
    }

    // Get current CB
    const cbBefore = await this.complianceRepository.getCB(shipId, year);
    if (!cbBefore) {
      throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
    }

    // Get available banked amount
    const totalBanked = await this.bankRepository.getTotalBanked(shipId, year);
    const totalApplied = await this.bankRepository.getTotalApplied(shipId, year);
    const availableBanked = totalBanked - totalApplied;

    // Validate amount doesn't exceed available banked
    if (amount > availableBanked) {
      throw new Error(
        `Cannot apply ${amount.toFixed(2)}: Only ${availableBanked.toFixed(2)} available (Banked: ${totalBanked.toFixed(2)}, Already applied: ${totalApplied.toFixed(2)})`
      );
    }

    // Calculate new CB after application
    const cbAfter = cbBefore.adjust(amount);

    // Save updated CB
    await this.complianceRepository.saveCB(cbAfter);

    // Record the application
    await this.bankRepository.recordApplication(shipId, year, amount);

    return {
      cbBefore: cbBefore.cbGco2eq,
      applied: amount,
      cbAfter: cbAfter.cbGco2eq,
    };
  }
}

