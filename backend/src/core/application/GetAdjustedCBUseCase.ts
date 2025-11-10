import { ComplianceBalance } from '../domain/ComplianceBalance';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IBankRepository } from '../ports/IBankRepository';

/**
 * Use case: Get adjusted Compliance Balance after bank applications
 * Adjusted CB = Original CB - Applied Banked Amount
 */
export class GetAdjustedCBUseCase {
  constructor(
    private readonly complianceRepository: IComplianceRepository,
    private readonly bankRepository: IBankRepository
  ) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    // Get original CB
    const originalCB = await this.complianceRepository.getCB(shipId, year);
    if (!originalCB) {
      throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
    }

    // Get total applied banked amount
    const totalApplied = await this.bankRepository.getTotalApplied(shipId, year);

    // Calculate adjusted CB
    const adjustedCB = originalCB.adjust(-totalApplied);

    return adjustedCB;
  }
}

