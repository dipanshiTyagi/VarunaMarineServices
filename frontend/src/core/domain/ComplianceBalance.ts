/**
 * ComplianceBalance domain interface
 * Matches backend ComplianceBalance entity
 */
export interface ComplianceBalance {
  id?: number;
  shipId: string;
  year: number;
  cbGco2eq: number; // Can be positive (surplus) or negative (deficit)
  createdAt?: Date;
}

