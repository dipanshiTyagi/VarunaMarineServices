// import { ComplianceBalance } from '../domain/ComplianceBalance';
// // import { Route } from '../domain/Route';
// import { IRouteRepository } from '../ports/IRouteRepository';
// import { IComplianceRepository } from '../ports/IComplianceRepository';

// /**
//  * Use case: Compute Compliance Balance for a ship
//  * CB = (TARGET - actual GHG intensity) × Energy in Scope
//  * Saves the result to ship_compliance table
//  */
// export class ComputeCBUseCase {
//   constructor(
//     private readonly routeRepository: IRouteRepository,
//     private readonly complianceRepository: IComplianceRepository
//   ) {}

//   async execute(shipId: string, year: number): Promise<ComplianceBalance> {
//     // For this use case, we assume shipId maps to routeId
//     // In a real system, you might have a separate ship-to-route mapping
//     // Get route data for the ship
//     const routes = await this.routeRepository.findAll({ shipId, year } as any);
    
//     if (routes.length === 0) {
//       throw new Error(`No routes found for ship ${shipId} in year ${year}`);
//     }

//     // Calculate total CB across all routes for this ship
//     let totalCB = 0;
//     for (const route of routes) {
//       const routeCB = route.calculateCB();
//       totalCB += routeCB;
//     }

//     // Create ComplianceBalance
//     const cb = new ComplianceBalance(shipId, year, totalCB);

//     // Save to repository
//     return await this.complianceRepository.saveCB(cb);
//   }

//   /**
//    * Alternative: Compute CB from a single route
//    */
//   async executeFromRoute(routeId: string, shipId: string, year: number): Promise<ComplianceBalance> {
//     const route = await this.routeRepository.findById(routeId);
//     if (!route) {
//       throw new Error(`Route with ID ${routeId} not found`);
//     }

//     // Calculate CB using the route's method
//     const cbValue = route.calculateCB();

//     // Create ComplianceBalance
//     const cb = new ComplianceBalance(shipId, year, cbValue);

//     // Save to repository
//     return await this.complianceRepository.saveCB(cb);
//   }
// }

import { ComplianceBalance } from '../domain/ComplianceBalance';
import { IRouteRepository } from '../ports/IRouteRepository';
import { IComplianceRepository } from '../ports/IComplianceRepository';

export class ComputeCBUseCase {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly complianceRepository: IComplianceRepository
  ) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    // In this implementation, we assume shipId maps to routeId
    // In a real system, you'd have a ship-to-route mapping table
    
    // Try to find route by routeId (assuming shipId format matches routeId)
    const route = await this.routeRepository.findById(shipId);
    
    if (!route) {
      // If not found by ID, get all routes for the year and calculate
      const routes = await this.routeRepository.findAll({ year });
      
      if (routes.length === 0) {
        throw new Error(`No routes found for ship ${shipId} in year ${year}`);
      }
      
      // Use the first route or aggregate if multiple
      let totalCB = 0;
      for (const r of routes) {
        totalCB += r.calculateCB();
      }
      
      const cb = new ComplianceBalance(shipId, year, totalCB / routes.length);
      return await this.complianceRepository.saveCB(cb);
    }

    // Calculate CB from the found route
    const cbValue = route.calculateCB();
    const cb = new ComplianceBalance(shipId, year, cbValue);
    return await this.complianceRepository.saveCB(cb);
  }

  async executeFromRoute(routeId: string, shipId: string, year: number): Promise<ComplianceBalance> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    const cbValue = route.calculateCB();
    const cb = new ComplianceBalance(shipId, year, cbValue);
    return await this.complianceRepository.saveCB(cb);
  }
}
