import { Request, Response } from 'express';
import { CreatePoolUseCase } from '../../../core/application';

interface CreatePoolRequest {
  year: number;
  members: string[];
}

/**
 * Pooling Controller
 * Handles HTTP requests for pooling operations (Fuel EU Article 21)
 */
export class PoolingController {
  constructor(private readonly createPoolUseCase: CreatePoolUseCase) {}

  /**
   * POST /pools
   * Create a pool with multiple ships
   * Body: { year, members: string[] }
   */
  async createPool(req: Request, res: Response): Promise<void> {
    try {
      const { year, members }: CreatePoolRequest = req.body;

      if (!year || !members) {
        res.status(400).json({
          success: false,
          error: 'year and members are required',
        });
        return;
      }

      if (!Array.isArray(members) || members.length === 0) {
        res.status(400).json({
          success: false,
          error: 'members must be a non-empty array of ship IDs',
        });
        return;
      }

      if (typeof year !== 'number' || year <= 0) {
        res.status(400).json({
          success: false,
          error: 'year must be a positive number',
        });
        return;
      }

      const pool = await this.createPoolUseCase.execute(year, members);

      res.status(201).json({
        success: true,
        message: 'Pool created successfully',
        data: {
          id: pool.id,
          year: pool.year,
          createdAt: pool.createdAt,
          members: pool.members.map((member) => ({
            shipId: member.shipId,
            cbBefore: member.cbBefore,
            cbAfter: member.cbAfter,
            change: member.getChange(),
            isCompliantAfter: member.isCompliantAfter(),
          })),
          summary: {
            totalSum: pool.getTotalSum(),
            totalSumAfter: pool.getTotalSumAfter(),
            deficitCount: pool.getDeficitCount(),
            surplusCount: pool.getSurplusCount(),
            isCompliant: pool.isCompliant(),
          },
        },
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && (error.message.includes('validation') || error.message.includes('negative'))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create pool',
      });
    }
  }
}

