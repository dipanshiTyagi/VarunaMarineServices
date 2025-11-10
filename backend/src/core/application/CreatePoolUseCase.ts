import { Pool } from '../domain/Pool';
import { ComplianceBalance } from '../domain/ComplianceBalance';
// import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IPoolRepository } from '../ports/IPoolRepository';

export interface IAdjustedCBService {
  getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance>;
}

/**
 * Use case: Create a pool with multiple ships
 * Validates pool rules and performs greedy allocation
 */
export class CreatePoolUseCase {
  constructor(
    private readonly adjustedCBService: IAdjustedCBService,
    private readonly poolRepository: IPoolRepository
  ) {}

  async execute(year: number, memberShipIds: string[]): Promise<Pool> {
    if (memberShipIds.length === 0) {
      throw new Error('Pool must have at least one member');
    }

    // Get adjusted CB for each member
    const membersData: Array<{ shipId: string; cbBefore: number }> = [];
    
    for (const shipId of memberShipIds) {
      try {
        const adjustedCB = await this.adjustedCBService.getAdjustedCB(shipId, year);
        membersData.push({
          shipId,
          cbBefore: adjustedCB.cbGco2eq,
        });
      } catch (error) {
        throw new Error(`Failed to get adjusted CB for ship ${shipId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate sum of adjusted CBs >= 0
    const totalSum = membersData.reduce((sum, m) => sum + m.cbBefore, 0);
    if (totalSum < 0) {
      throw new Error(
        `Pool sum is negative (${totalSum.toFixed(2)}). Sum of all adjusted CBs must be >= 0.`
      );
    }

    // Perform greedy allocation
    const allocatedMembers = Pool.allocate(membersData);

    // Create pool with allocated members
    const poolId = await this.poolRepository.getNextId();
    const pool = new Pool(poolId, year, allocatedMembers);

    // Validate pool rules
    const validation = pool.validate();
    if (!validation.isValid) {
      throw new Error(`Pool validation failed: ${validation.errors.join('; ')}`);
    }

    // Save pool
    return await this.poolRepository.save(pool);
  }
}

