import { ComplianceBalance } from '../../../core/domain/ComplianceBalance';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';
import { IBankRepository } from '../../../core/ports/IBankRepository';
import { prisma } from '../../../infrastructure/db/prismaClient';

/**
 * Prisma implementation of IComplianceRepository
 * Maps Prisma models to domain ComplianceBalance entities
 */
export class PrismaComplianceRepository implements IComplianceRepository {
  constructor(private readonly bankRepository?: IBankRepository) {}

  /**
   * Map Prisma compliance model to domain ComplianceBalance entity
   */
  private toDomain(prismaCompliance: any): ComplianceBalance {
    return new ComplianceBalance(
      prismaCompliance.shipId,
      prismaCompliance.year,
      prismaCompliance.cbGco2eq,
      prismaCompliance.id,
      prismaCompliance.createdAt
    );
  }

  async getCB(shipId: string, year: number): Promise<ComplianceBalance | null> {
    try {
      const compliance = await prisma.shipCompliance.findFirst({
        where: {
          shipId,
          year,
        },
        orderBy: {
          createdAt: 'desc', // Get the most recent CB record
        },
      });

      return compliance ? this.toDomain(compliance) : null;
    } catch (error) {
      throw new Error(
        `Failed to get compliance balance for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async saveCB(cb: ComplianceBalance): Promise<ComplianceBalance> {
    try {
      // Check if CB record exists
      const existing = await prisma.shipCompliance.findFirst({
        where: {
          shipId: cb.shipId,
          year: cb.year,
        },
      });

      if (existing) {
        // Update existing record
        const updated = await prisma.shipCompliance.update({
          where: { id: existing.id },
          data: {
            cbGco2eq: cb.cbGco2eq,
          },
        });
        return this.toDomain(updated);
      } else {
        // Create new record
        const created = await prisma.shipCompliance.create({
          data: {
            shipId: cb.shipId,
            year: cb.year,
            cbGco2eq: cb.cbGco2eq,
          },
        });
        return this.toDomain(created);
      }
    } catch (error) {
      throw new Error(`Failed to save compliance balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
    try {
      // Get original CB
      const originalCB = await this.getCB(shipId, year);
      if (!originalCB) {
        throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
      }

      // Get total applied banked amount (if bank repository is available)
      const totalApplied = this.bankRepository
        ? await this.bankRepository.getTotalApplied(shipId, year)
        : 0;

      // Calculate adjusted CB
      return originalCB.adjust(-totalApplied);
    } catch (error) {
      throw new Error(
        `Failed to get adjusted compliance balance for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

