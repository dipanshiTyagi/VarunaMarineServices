import { Pool, PoolMember } from '../../../core/domain/Pool';
import { IPoolRepository } from '../../../core/ports/IPoolRepository';
import { prisma } from '../../../infrastructure/db/prismaClient';

/**
 * Prisma implementation of IPoolRepository
 * Maps Prisma models to domain Pool entities
 */
export class PrismaPoolRepository implements IPoolRepository {
  /**
   * Map Prisma pool model to domain Pool entity
   */
  private async toDomain(prismaPool: any): Promise<Pool> {
    // Fetch pool members
    const members = await prisma.poolMember.findMany({
      where: { poolId: prismaPool.id },
    });

    const poolMembers = members.map(
      (member) => new PoolMember(member.shipId, member.cbBefore, member.cbAfter)
    );

    return new Pool(prismaPool.id, prismaPool.year, poolMembers, prismaPool.createdAt);
  }

  async save(pool: Pool): Promise<Pool> {
    try {
      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Save or update pool
        let poolRecord;
        if (pool.id) {
          // Update existing pool
          poolRecord = await tx.pool.update({
            where: { id: pool.id },
            data: {
              year: pool.year,
            },
          });

          // Delete existing members
          await tx.poolMember.deleteMany({
            where: { poolId: pool.id },
          });
        } else {
          // Create new pool
          poolRecord = await tx.pool.create({
            data: {
              year: pool.year,
            },
          });
        }

        // Save pool members
        const memberPromises = pool.members.map((member) =>
          tx.poolMember.create({
            data: {
              poolId: poolRecord.id,
              shipId: member.shipId,
              cbBefore: member.cbBefore,
              cbAfter: member.cbAfter,
            },
          })
        );

        await Promise.all(memberPromises);

        return poolRecord;
      });

      // Fetch the complete pool with members
      return await this.toDomain(result);
    } catch (error) {
      throw new Error(`Failed to save pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(poolId: number): Promise<Pool | null> {
    try {
      const pool = await prisma.pool.findUnique({
        where: { id: poolId },
      });

      return pool ? await this.toDomain(pool) : null;
    } catch (error) {
      throw new Error(`Failed to find pool by ID ${poolId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNextId(): Promise<number> {
    try {
      // Get the maximum ID and add 1
      const maxPool = await prisma.pool.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      return maxPool ? maxPool.id + 1 : 1;
    } catch (error) {
      throw new Error(`Failed to get next pool ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

