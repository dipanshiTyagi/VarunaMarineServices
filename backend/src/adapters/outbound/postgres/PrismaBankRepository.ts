// import { BankEntry } from '../../../core/domain/BankEntry';
// import { IBankRepository } from '../../../core/ports/IBankRepository';
// import { prisma } from '../../../infrastructure/db/prismaClient';

// /**
//  * Prisma implementation of IBankRepository
//  * Maps Prisma models to domain BankEntry entities
//  */
// export class PrismaBankRepository implements IBankRepository {
//   /**
//    * Map Prisma bank entry model to domain BankEntry entity
//    */
//   private toDomain(prismaEntry: any): BankEntry {
//     return new BankEntry(
//       prismaEntry.shipId,
//       prismaEntry.year,
//       prismaEntry.amountGco2eq,
//       prismaEntry.id,
//       prismaEntry.createdAt
//     );
//   }

//   async getBanked(shipId: string, year: number): Promise<number> {
//     return this.getTotalBanked(shipId, year);
//   }

//   async getTotalBanked(shipId: string, year: number): Promise<number> {
//     try {
//       const result = await prisma.bankEntry.aggregate({
//         where: {
//           shipId,
//           year,
//         },
//         _sum: {
//           amountGco2eq: true,
//         },
//       });

//       return result._sum.amountGco2eq ?? 0;
//     } catch (error) {
//       throw new Error(
//         `Failed to get total banked amount for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
//       );
//     }
//   }

//   async getTotalApplied(shipId: string, year: number): Promise<number> {
//     try {
//       // In a real system, you might have a separate table for applications
//       // For now, we'll use a simple approach: track applied amounts in a separate field
//       // or calculate from bank entries that have been applied
//       // This is a simplified implementation - you may need to adjust based on your schema

//       // For now, return 0 as we need to track applications separately
//       // You could add an 'applied' field to bank_entries or create a separate table
//       // This is a placeholder that should be implemented based on your requirements
//       return 0;
//     } catch (error) {
//       throw new Error(
//         `Failed to get total applied amount for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
//       );
//     }
//   }

//   async saveBankEntry(entry: BankEntry): Promise<BankEntry> {
//     try {
//       const created = await prisma.bankEntry.create({
//         data: {
//           shipId: entry.shipId,
//           year: entry.year,
//           amountGco2eq: entry.amountGco2eq,
//         },
//       });

//       return this.toDomain(created);
//     } catch (error) {
//       throw new Error(`Failed to save bank entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   async getBankRecords(shipId: string, year: number): Promise<BankEntry[]> {
//     try {
//       const entries = await prisma.bankEntry.findMany({
//         where: {
//           shipId,
//           year,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });

//       return entries.map((entry) => this.toDomain(entry));
//     } catch (error) {
//       throw new Error(
//         `Failed to get bank records for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
//       );
//     }
//   }

//   async recordApplication(shipId: string, year: number, amount: number): Promise<void> {
//     try {
//       // In a real system, you would track applications in a separate table
//       // For now, this is a placeholder
//       // You might want to create a bank_applications table or add an 'applied' field
//       // This implementation should be extended based on your schema design
      
//       // Placeholder: Could create a separate table for tracking applications
//       // await prisma.bankApplication.create({ data: { shipId, year, amount } });
      
//       // For now, we'll just log or you can implement a proper tracking mechanism
//       console.log(`Recording application: shipId=${shipId}, year=${year}, amount=${amount}`);
//     } catch (error) {
//       throw new Error(
//         `Failed to record application for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
//       );
//     }
//   }
// }


import { BankEntry } from '../../../core/domain/BankEntry';
import { IBankRepository } from '../../../core/ports/IBankRepository';
import { prisma } from '../../../infrastructure/db/prismaClient';

/**
 * Prisma implementation of IBankRepository
 * Maps Prisma models to domain BankEntry entities
 */
export class PrismaBankRepository implements IBankRepository {
  /**
   * Map Prisma bank entry model to domain BankEntry entity
   */
  private toDomain(prismaEntry: any): BankEntry {
    return new BankEntry(
      prismaEntry.shipId,
      prismaEntry.year,
      prismaEntry.amountGco2eq,
      prismaEntry.id,
      prismaEntry.createdAt
    );
  }

  async getBanked(shipId: string, year: number): Promise<number> {
    return this.getTotalBanked(shipId, year);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    try {
      const result = await prisma.bankEntry.aggregate({
        where: {
          shipId,
          year,
        },
        _sum: {
          amountGco2eq: true,
        },
      });

      return result._sum.amountGco2eq ?? 0;
    } catch (error) {
      throw new Error(
        `Failed to get total banked amount for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getTotalApplied(shipId: string, year: number): Promise<number> {
    try {
      // Since we don't have a separate table for tracking applications,
      // we return 0 for now. In a production system, you would:
      // 1. Create a bank_applications table
      // 2. Track each application with: shipId, year, amount, createdAt
      // 3. Sum all applications here
      
      // Placeholder implementation
      return 0;
    } catch (error) {
      throw new Error(
        `Failed to get total applied amount for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async saveBankEntry(entry: BankEntry): Promise<BankEntry> {
    try {
      const created = await prisma.bankEntry.create({
        data: {
          shipId: entry.shipId,
          year: entry.year,
          amountGco2eq: entry.amountGco2eq,
        },
      });

      return this.toDomain(created);
    } catch (error) {
      throw new Error(`Failed to save bank entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBankRecords(shipId: string, year: number): Promise<BankEntry[]> {
    try {
      const entries = await prisma.bankEntry.findMany({
        where: {
          shipId,
          year,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return entries.map((entry) => this.toDomain(entry));
    } catch (error) {
      throw new Error(
        `Failed to get bank records for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async recordApplication(shipId: string, year: number, amount: number): Promise<void> {
    try {
      // In a real system, you would create a separate table for tracking applications:
      // await prisma.bankApplication.create({
      //   data: { shipId, year, amount, createdAt: new Date() }
      // });
      
      // For now, we'll just log it
      console.log(`Recording application: shipId=${shipId}, year=${year}, amount=${amount}`);
      
      // Alternatively, you could store this information in the ship_compliance table
      // by updating the CB value, but that would require additional logic
    } catch (error) {
      throw new Error(
        `Failed to record application for ship ${shipId} in year ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}