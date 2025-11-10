// /**
//  * PoolMember value object
//  * Represents a ship's compliance balance before and after pool allocation
//  */
// export class PoolMember {
//   constructor(
//     public readonly shipId: string,
//     public readonly cbBefore: number, // Compliance Balance before pooling
//     public cbAfter: number // Compliance Balance after pooling
//   ) {}

//   /**
//    * Get the change in CB (after - before)
//    */
//   getChange(): number {
//     return this.cbAfter - this.cbBefore;
//   }

//   /**
//    * Check if this member improved (went from deficit to less deficit or surplus)
//    */
//   hasImproved(): boolean {
//     return this.cbAfter > this.cbBefore;
//   }

//   /**
//    * Check if this member worsened (went from surplus to less surplus or deficit)
//    */
//   hasWorsened(): boolean {
//     return this.cbAfter < this.cbBefore;
//   }

//   /**
//    * Check if this member was a deficit before pooling
//    */
//   wasDeficit(): boolean {
//     return this.cbBefore < 0;
//   }

//   /**
//    * Check if this member was a surplus before pooling
//    */
//   wasSurplus(): boolean {
//     return this.cbBefore > 0;
//   }

//   /**
//    * Check if this member is compliant after pooling (CB >= 0)
//    */
//   isCompliantAfter(): boolean {
//     return this.cbAfter >= 0;
//   }
// }


export class PoolMember {
  constructor(
    public readonly shipId: string,
    public readonly cbBefore: number,
    public cbAfter: number // Remove readonly
  ) {}

  getChange(): number {
    return this.cbAfter - this.cbBefore;
  }

  hasImproved(): boolean {
    return this.cbAfter > this.cbBefore;
  }

  hasWorsened(): boolean {
    return this.cbAfter < this.cbBefore;
  }

  wasDeficit(): boolean {
    return this.cbBefore < 0;
  }

  wasSurplus(): boolean {
    return this.cbBefore > 0;
  }

  isCompliantAfter(): boolean {
    return this.cbAfter >= 0;
  }
}
