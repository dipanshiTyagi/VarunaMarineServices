import { Request, Response } from 'express';
import { BankSurplusUseCase, ApplyBankedUseCase } from '../../../core/application';
import { IBankRepository } from '../../../core/ports/IBankRepository';

interface BankRequest {
  shipId: string;
  year: number;
  amount: number;
}

/**
 * Banking Controller
 * Handles HTTP requests for banking operations (Fuel EU Article 20)
 */
export class BankingController {
  constructor(
    private readonly bankRepository: IBankRepository,
    private readonly bankSurplusUseCase: BankSurplusUseCase,
    private readonly applyBankedUseCase: ApplyBankedUseCase
  ) {}

  /**
   * GET /banking/records?shipId&year
   * Get all bank records for a ship
   */
  async getBankRecords(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.query.shipId as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      if (!shipId || !year) {
        res.status(400).json({
          success: false,
          error: 'shipId and year query parameters are required',
        });
        return;
      }

      const records = await this.bankRepository.getBankRecords(shipId, year);
      const totalBanked = await this.bankRepository.getTotalBanked(shipId, year);
      const totalApplied = await this.bankRepository.getTotalApplied(shipId, year);

      res.status(200).json({
        success: true,
        data: {
          records: records.map((record) => ({
            id: record.id,
            shipId: record.shipId,
            year: record.year,
            amountGco2eq: record.amountGco2eq,
            createdAt: record.createdAt,
          })),
          summary: {
            totalBanked,
            totalApplied,
            available: totalBanked - totalApplied,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bank records',
      });
    }
  }

  /**
   * POST /banking/bank
   * Bank surplus compliance balance
   * Body: { shipId, year, amount }
   */
  async bankSurplus(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year, amount }: BankRequest = req.body;

      if (!shipId || !year || !amount) {
        res.status(400).json({
          success: false,
          error: 'shipId, year, and amount are required',
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'amount must be a positive number',
        });
        return;
      }

      const bankEntry = await this.bankSurplusUseCase.execute(shipId, year, amount);

      res.status(201).json({
        success: true,
        message: 'Surplus banked successfully',
        data: {
          id: bankEntry.id,
          shipId: bankEntry.shipId,
          year: bankEntry.year,
          amountGco2eq: bankEntry.amountGco2eq,
          createdAt: bankEntry.createdAt,
        },
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && (error.message.includes('not positive') || error.message.includes('Cannot bank'))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bank surplus',
      });
    }
  }

  /**
   * POST /banking/apply
   * Apply banked surplus to cover a deficit
   * Body: { shipId, year, amount }
   */
  async applyBanked(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year, amount }: BankRequest = req.body;

      if (!shipId || !year || !amount) {
        res.status(400).json({
          success: false,
          error: 'shipId, year, and amount are required',
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'amount must be a positive number',
        });
        return;
      }

      const result = await this.applyBankedUseCase.execute(shipId, year, amount);

      res.status(200).json({
        success: true,
        message: 'Banked amount applied successfully',
        data: {
          cbBefore: result.cbBefore,
          applied: result.applied,
          cbAfter: result.cbAfter,
        },
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && (error.message.includes('Cannot apply') || error.message.includes('not found'))
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply banked amount',
      });
    }
  }
}

