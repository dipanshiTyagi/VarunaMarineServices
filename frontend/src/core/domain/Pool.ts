/**
 * PoolMember domain interface
 */
export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

/**
 * Pool domain interface
 * Matches backend Pool entity
 */
export interface Pool {
  id: number;
  year: number;
  members: PoolMember[];
  createdAt?: Date;
}

