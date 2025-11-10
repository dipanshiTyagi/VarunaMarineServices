import { Pool } from '../domain/Pool';

/**
 * Port: Pool Repository Interface
 * Defines the contract for pool data access
 */
export interface IPoolRepository {
  /**
   * Save a pool (create or update)
   */
  save(pool: Pool): Promise<Pool>;

  /**
   * Find a pool by its ID
   */
  findById(poolId: number): Promise<Pool | null>;

  /**
   * Get the next available pool ID
   * This is a helper method for generating sequential IDs
   */
  getNextId(): Promise<number>;
}

