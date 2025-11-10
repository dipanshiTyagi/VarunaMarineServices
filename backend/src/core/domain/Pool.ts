import { PoolMember } from './PoolMember';

export { PoolMember } from './PoolMember';

/**
 * Pool domain entity
 * Represents a pool of ships combining their compliance balances
 * Used for Fuel EU Article 21 - Pooling
 */
export class Pool {
  constructor(
    public readonly id: number,
    public readonly year: number,
    public readonly members: PoolMember[],
    public readonly createdAt?: Date
  ) {}

  /**
   * Validate pool according to Fuel EU rules:
   * 1. Sum of all adjusted CBs must be >= 0
   * 2. Deficit ship cannot exit worse than before
   * 3. Surplus ship cannot exit negative
   *
   * @returns Validation result with error messages if invalid
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Rule 1: Sum of all CBs must be >= 0
    const totalCB = this.members.reduce((sum, member) => sum + member.cbBefore, 0);
    if (totalCB < 0) {
      errors.push(`Pool sum is negative (${totalCB.toFixed(2)}). Sum must be >= 0.`);
    }

    // Rule 2: Deficit ship cannot exit worse
    for (const member of this.members) {
      if (member.wasDeficit() && member.hasWorsened()) {
        errors.push(
          `Ship ${member.shipId} (deficit) cannot exit worse. Before: ${member.cbBefore.toFixed(2)}, After: ${member.cbAfter.toFixed(2)}`
        );
      }
    }

    // Rule 3: Surplus ship cannot exit negative
    for (const member of this.members) {
      if (member.wasSurplus() && member.cbAfter < 0) {
        errors.push(
          `Ship ${member.shipId} (surplus) cannot exit negative. After: ${member.cbAfter.toFixed(2)}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Allocate compliance balances using greedy algorithm:
   * 1. Sort members by CB descending (surplus first)
   * 2. Transfer surplus from positive members to negative members
   * 3. Update cbAfter for each member
   *
   * @param members - Array of members with cbBefore values
   * @returns Array of PoolMember with cbAfter calculated
   */
  static allocate(members: Array<{ shipId: string; cbBefore: number }>): PoolMember[] {
    // Create working copy with cbAfter initialized to cbBefore
    const workingMembers = members.map(
      (m) => new PoolMember(m.shipId, m.cbBefore, m.cbBefore)
    );

    // Sort by CB descending (surplus first, then deficits)
    const sorted = [...workingMembers].sort((a, b) => b.cbBefore - a.cbBefore);

    // Greedy allocation: transfer surplus to deficits
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      // If current member has surplus, try to allocate to deficits
      if (current.cbBefore > 0) {
        for (let j = i + 1; j < sorted.length; j++) {
          const deficit = sorted[j];

          // If deficit is already covered, skip
          if (deficit.cbAfter >= 0) {
            continue;
          }

          // Calculate how much we can transfer
          const available = current.cbAfter;
          const needed = Math.abs(deficit.cbAfter);

          if (available > 0 && needed > 0) {
            const transfer = Math.min(available, needed);

            // Update both members
            const currentIndex = workingMembers.findIndex((m) => m.shipId === current.shipId);
            const deficitIndex = workingMembers.findIndex((m) => m.shipId === deficit.shipId);

            if (currentIndex !== -1 && deficitIndex !== -1) {
              workingMembers[currentIndex] = new PoolMember(
                current.shipId,
                current.cbBefore,
                current.cbAfter - transfer
              );
              workingMembers[deficitIndex] = new PoolMember(
                deficit.shipId,
                deficit.cbBefore,
                deficit.cbAfter + transfer
              );

              // Update sorted array for next iteration
              current.cbAfter -= transfer;
              deficit.cbAfter += transfer;
              
            }
          }
        }
      }
    }

    return workingMembers;
  }

  /**
   * Get total pool sum (sum of all cbBefore)
   */
  getTotalSum(): number {
    return this.members.reduce((sum, member) => sum + member.cbBefore, 0);
  }

  /**
   * Get total pool sum after allocation (sum of all cbAfter)
   */
  getTotalSumAfter(): number {
    return this.members.reduce((sum, member) => sum + member.cbAfter, 0);
  }

  /**
   * Check if pool is compliant (total sum >= 0)
   */
  isCompliant(): boolean {
    return this.getTotalSum() >= 0;
  }

  /**
   * Get number of deficit ships
   */
  getDeficitCount(): number {
    return this.members.filter((m) => m.wasDeficit()).length;
  }

  /**
   * Get number of surplus ships
   */
  getSurplusCount(): number {
    return this.members.filter((m) => m.wasSurplus()).length;
  }
}

// export type { PoolMember };

