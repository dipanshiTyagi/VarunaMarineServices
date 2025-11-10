# AI Agent Workflow Log

This document tracks the usage of AI agents (Cursor AI, GitHub Copilot, Claude Code, etc.) throughout the development of the Fuel EU Maritime compliance platform.

## Agents Used

- **Cursor AI** (Primary)
  - Used for: Code generation, architecture decisions, refactoring, debugging
  - Features: Chat, Composer, Inline completions

---

## Prompts & Outputs

### Example 1: Project Structure Creation

**Date:** Initial Setup
**Agent:** Cursor AI
**Prompt:**
```
Create a Fuel EU Maritime compliance platform with hexagonal architecture.

Create two main folders:
- /backend - Node.js + TypeScript + PostgreSQL backend
- /frontend - React + TypeScript + TailwindCSS frontend

Backend structure:
src/
  core/
    domain/          # Business entities
    application/     # Use cases
    ports/           # Interfaces
  adapters/
    inbound/http/    # Express controllers
    outbound/postgres/ # Database repositories
  infrastructure/
    db/              # Prisma setup
    server/          # Express app
  shared/            # Utilities

Frontend structure:
src/
  core/
    domain/          # TypeScript interfaces
    application/     # Business logic
    ports/           # Service interfaces
  adapters/
    inbound/         # React components
    outbound/        # API clients
  ui/                # Shared components
```

**Generated Code:**
- Complete directory structure for both backend and frontend
- All required folders created with proper nesting
- Template files for AGENT_WORKFLOW.md, README.md, REFLECTION.md

**Refinements:**
- Added .gitignore files for both projects
- Created index.ts barrel exports for easier imports

---

### Example 2: Prisma Schema Generation

**Date:** Database Setup
**Agent:** Cursor AI
**Prompt:**
```
Create Prisma schema for Fuel EU Maritime compliance:

Tables needed:
1. routes
   - id (Int, @id, @default(autoincrement()))
   - routeId (String, unique)
   - vesselType (String)
   - fuelType (String)
   - year (Int)
   - ghgIntensity (Float) - gCO₂e/MJ
   - fuelConsumption (Float) - tonnes
   - distance (Float) - km
   - totalEmissions (Float) - tonnes
   - isBaseline (Boolean, @default(false))
   - createdAt (DateTime)
   - updatedAt (DateTime)

2. ship_compliance
   - id (Int, @id, @default(autoincrement()))
   - shipId (String)
   - year (Int)
   - cbGco2eq (Float) - Compliance Balance
   - createdAt (DateTime)

3. bank_entries
   - id (Int, @id, @default(autoincrement()))
   - shipId (String)
   - year (Int)
   - amountGco2eq (Float) - banked amount
   - createdAt (DateTime)

4. pools
   - id (Int, @id, @default(autoincrement()))
   - year (Int)
   - createdAt (DateTime)

5. pool_members
   - id (Int, @id, @default(autoincrement()))
   - poolId (Int, relation to pools)
   - shipId (String)
   - cbBefore (Float)
   - cbAfter (Float)
   - createdAt (DateTime)

Use PostgreSQL. Add indexes on shipId, year, routeId.
```

**Generated Code:**
```prisma
model Route {
  id               Int      @id @default(autoincrement())
  routeId          String   @unique @map("route_id")
  vesselType       String   @map("vessel_type")
  fuelType         String   @map("fuel_type")
  year             Int
  ghgIntensity     Float    @map("ghg_intensity")
  fuelConsumption  Float    @map("fuel_consumption")
  distance         Float
  totalEmissions   Float    @map("total_emissions")
  isBaseline       Boolean  @default(false) @map("is_baseline")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([routeId])
  @@index([year])
  @@map("routes")
}
// ... other models
```

**Refinements:**
- Added cascade delete for pool_members
- Added composite indexes for better query performance
- Created seed file with sample data

---

### Example 3: Domain Entities with Business Logic

**Date:** Core Domain Implementation
**Agent:** Cursor AI
**Prompt:**
```
Create domain entities in backend/src/core/domain/:

1. Route.ts - Entity with:
   - routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions, isBaseline
   - Methods: calculateCB() - returns Compliance Balance

2. ComplianceBalance.ts - Value object with:
   - shipId, year, cbGco2eq (can be positive or negative)
   - Constants: TARGET_2025 = 89.3368, ENERGY_PER_TONNE = 41000
   - Static method: calculate(ghgIntensity, fuelConsumption) - returns CB

3. Pool.ts - Entity with:
   - id, year, members (array of PoolMember)
   - Methods: validate(), allocate() - greedy allocation algorithm
```

**Generated Code:**
```typescript
export class Route {
  calculateCB(): number {
    const TARGET_2025 = 89.3368;
    const ENERGY_PER_TONNE = 41000;
    const energyInScope = this.fuelConsumption * ENERGY_PER_TONNE;
    const cb = (TARGET_2025 - this.ghgIntensity) * energyInScope;
    return cb;
  }
}

export class Pool {
  static allocate(members: Array<{ shipId: string; cbBefore: number }>): PoolMember[] {
    // Greedy allocation algorithm
    const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);
    // Transfer surplus to deficits...
  }
}
```

**Refinements:**
- Enhanced Pool.allocate() with proper greedy algorithm implementation
- Added validation methods to ComplianceBalance (isSurplus, isDeficit)
- Added helper methods for percentage difference calculation

---

### Example 4: Use Cases with Dependency Injection

**Date:** Application Layer
**Agent:** Cursor AI
**Prompt:**
```
Create use cases in backend/src/core/application/:

1. ComputeCBUseCase.ts
   - Input: shipId, year
   - Output: ComplianceBalance
   - Calculate CB = (TARGET - actual) * energyInScope
   - Save to ship_compliance table

2. BankSurplusUseCase.ts
   - Input: shipId, year, amount
   - Output: BankEntry
   - Validate: CB > 0, amount <= CB

3. CreatePoolUseCase.ts
   - Input: year, members (shipId[])
   - Output: Pool with cbBefore/cbAfter for each member
   - Validate: sum(adjustedCB) >= 0
   - Use greedy allocation
```

**Generated Code:**
```typescript
export class ComputeCBUseCase {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly complianceRepository: IComplianceRepository
  ) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    const routes = await this.routeRepository.findAll({ shipId, year } as any);
    let totalCB = 0;
    for (const route of routes) {
      totalCB += route.calculateCB();
    }
    const cb = new ComplianceBalance(shipId, year, totalCB);
    return await this.complianceRepository.saveCB(cb);
  }
}
```

**Refinements:**
- Fixed type issues with route filters
- Added proper error handling for edge cases
- Enhanced validation messages

---

### Example 5: React Components with State Management

**Date:** Frontend Implementation
**Agent:** Cursor AI
**Prompt:**
```
Create frontend/src/adapters/inbound/components/RoutesTab.tsx:

- Fetch routes from API on mount
- Display table with columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions
- Add filters: vesselType dropdown, fuelType dropdown, year input
- "Set Baseline" button for each row
- Use TailwindCSS for styling
- Show loading and error states
```

**Generated Code:**
```typescript
export const RoutesTab: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<RouteFilters>({});

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await routeService.getRoutes(filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };
  // ... rest of component
};
```

**Refinements:**
- Added proper TypeScript types
- Enhanced error handling with retry functionality
- Improved loading states with spinners
- Added baseline badge styling

---

### Example 6: Test Generation

**Date:** Testing Phase
**Agent:** Cursor AI
**Prompt:**
```
Create tests in backend/src/core/application/__tests__/:

1. ComputeCBUseCase.test.ts
   - Test CB calculation with positive and negative results
   - Test edge cases

2. BankSurplusUseCase.test.ts
   - Test banking with valid CB
   - Test validation (CB <= 0, amount > CB)

Use Jest. Mock repositories.
```

**Generated Code:**
```typescript
describe('ComputeCBUseCase', () => {
  let mockRouteRepository: jest.Mocked<IRouteRepository>;
  let mockComplianceRepository: jest.Mocked<IComplianceRepository>;

  beforeEach(() => {
    mockRouteRepository = {
      findAll: jest.fn(),
      // ... other methods
    };
    // ... setup
  });

  it('should calculate positive CB (surplus) correctly', async () => {
    const route = new Route(/* ... */);
    mockRouteRepository.findAll.mockResolvedValue([route]);
    // ... test implementation
  });
});
```

**Refinements:**
- Added comprehensive edge case tests
- Enhanced mock setup for better isolation
- Added tests for error scenarios

---

## Validation / Corrections

### Verification Process

1. **Code Review**: Manually reviewed all generated code for:
   - Type safety and TypeScript strict mode compliance
   - Business logic correctness (CB calculations, pooling rules)
   - Architecture adherence (hexagonal pattern)

2. **Testing**: Created comprehensive test suites to verify:
   - Use case logic correctness
   - Component rendering and interactions
   - API endpoint functionality

3. **Manual Review Steps**:
   - Checked Prisma schema against requirements
   - Verified domain entity calculations match Fuel EU formulas
   - Validated API endpoints return correct data structures
   - Tested frontend components manually in browser

### Bugs Found and Fixed

1. **Pool Allocation Algorithm**
   - Issue: Initial greedy allocation didn't properly handle multiple deficits
   - Fix: Refined algorithm to sort by CB descending and transfer surplus to deficits iteratively
   - Agent contribution: Agent provided initial structure, manual refinement needed for complex logic

2. **Type Safety in Use Cases**
   - Issue: Route filters type mismatch in ComputeCBUseCase
   - Fix: Created proper RouteFilters interface and updated type definitions
   - Agent contribution: Agent generated code but needed type refinement

3. **API Client Error Handling**
   - Issue: Error messages not properly extracted from API responses
   - Fix: Enhanced response interceptor to extract error messages from response data
   - Agent contribution: Agent provided structure, manual enhancement for better UX

4. **Prisma Repository Mapping**
   - Issue: Domain entities not properly mapped from Prisma models
   - Fix: Added explicit toDomain() and toPrisma() mapping methods
   - Agent contribution: Agent generated repository structure, manual mapping logic added

### Manual Corrections

- **Bank Application Tracking**: The PrismaBankRepository had placeholder methods for tracking applied amounts. This requires a separate table or schema extension, which was documented but not fully implemented.

- **Route-to-Ship Mapping**: In ComputeCBUseCase, assumed shipId maps to routeId. In production, this would need a proper ship-to-route mapping table.

- **Chart Target Line**: Initial Recharts implementation used Bar component for target line. Corrected to use ReferenceLine component.

---

## Observations

### Where Agent Saved Time

✅ **Project Structure Setup**: Generated complete directory structure instantly vs. manual creation

✅ **Boilerplate Code**: Generated TypeScript interfaces, class structures, and basic CRUD operations quickly

✅ **Prisma Schema**: Generated complete schema with proper relations and indexes

✅ **Component Scaffolding**: Created React component structure with hooks and state management

✅ **Test Templates**: Generated test file structure with Jest mocks and basic test cases

✅ **API Documentation**: Generated comprehensive README with API endpoint documentation

✅ **Type Definitions**: Generated TypeScript types and interfaces across the codebase

### Where It Failed or Hallucinated

❌ **Complex Business Logic**: Pool allocation algorithm needed manual refinement for correct greedy implementation

❌ **Type Inference**: Sometimes generated code with `any` types instead of proper TypeScript types

❌ **Error Handling**: Generated basic error handling but needed enhancement for better user experience

❌ **Chart Implementation**: Initial chart code used wrong Recharts component (Bar instead of ReferenceLine)

❌ **Database Relationships**: Initial Prisma schema needed manual adjustment for proper cascade deletes

❌ **API Response Format**: Sometimes assumed response formats that didn't match actual implementation

### How Tools Were Combined Effectively

1. **Iterative Refinement**:
   - Used Cursor Chat for high-level architecture questions
   - Used Cursor Composer for multi-file changes (e.g., all use cases at once)
   - Used inline completions for repetitive code patterns

2. **Workflow Pattern**:
   - Step 1: Use Chat to understand requirements and get architecture guidance
   - Step 2: Use Composer to generate multiple related files (e.g., all domain entities)
   - Step 3: Use inline completions to fill in method implementations
   - Step 4: Manual review and refinement
   - Step 5: Use Chat again for specific fixes or improvements

3. **Code Generation Strategy**:
   - Generated structure first (classes, interfaces, method signatures)
   - Then filled in implementations iteratively
   - Used agent for boilerplate, manual for business logic

4. **Testing Approach**:
   - Generated test file structure with agent
   - Used agent to create mock setups
   - Manual refinement for test cases and assertions

---

## Best Practices Followed

### 1. Architecture Decisions
- ✅ Used Cursor Chat for hexagonal architecture guidance
- ✅ Validated structure with agent before implementation
- ✅ Asked agent to explain dependency injection patterns

### 2. Code Generation
- ✅ Used Cursor Composer for multi-file changes (all use cases, all controllers)
- ✅ Used inline completions for boilerplate code (getters, setters, basic CRUD)
- ✅ Used Chat for complex business logic (pooling algorithm, CB calculations)

### 3. Refactoring
- ✅ Used agent to refactor code while maintaining tests
- ✅ Validated refactoring with agent suggestions
- ✅ Used agent to identify code duplication

### 4. Testing
- ✅ Generated test templates with agent
- ✅ Used agent to identify edge cases
- ✅ Manual refinement for test assertions and coverage

### 5. Documentation
- ✅ Used agent to generate initial documentation structure
- ✅ Refined documentation with agent assistance
- ✅ Used agent to generate API endpoint examples

### 6. Error Handling
- ✅ Used agent to generate error handling patterns
- ✅ Manual enhancement for user-friendly error messages
- ✅ Used agent to identify potential error scenarios

### 7. Type Safety
- ✅ Used agent to generate TypeScript interfaces
- ✅ Manual refinement to ensure strict mode compliance
- ✅ Used agent to identify type issues

---

## Key Learnings

### What Worked Well with AI Agents

1. **Rapid Prototyping**: Agent excelled at generating project structure and boilerplate code, allowing focus on business logic

2. **Architecture Guidance**: Agent provided excellent guidance on hexagonal architecture patterns and best practices

3. **Code Consistency**: Agent helped maintain consistent code style and patterns across the codebase

4. **Documentation**: Agent was very effective at generating comprehensive documentation and API examples

5. **Test Generation**: Agent created good test file structures and mock setups, saving significant time

### What Didn't Work as Expected

1. **Complex Algorithms**: Agent struggled with complex business logic like the greedy pooling algorithm, requiring manual refinement

2. **Type Inference**: Agent sometimes used `any` types or loose typing, requiring manual type refinement

3. **Error Handling**: Generated error handling was basic and needed enhancement for production quality

4. **Library-Specific Code**: Agent sometimes used incorrect library APIs (e.g., Recharts components), requiring manual correction

### How to Improve Agent Usage Next Time

1. **Be More Specific**: Provide more context about business rules and requirements upfront

2. **Iterative Approach**: Generate code in smaller chunks and validate each step

3. **Test Early**: Generate tests alongside code, not after, to catch issues earlier

4. **Review Promptly**: Review agent output immediately and refine before moving to next feature

5. **Use Examples**: Provide example code snippets in prompts for better context

6. **Validate Assumptions**: Always verify agent assumptions about library APIs and patterns

---

## Statistics

- **Total Prompts Used:** ~25-30 major prompts
- **Code Generated:** ~15,000+ lines of code
- **Time Saved:** Estimated 60-70% faster than manual coding
- **Corrections Needed:** ~15-20 manual corrections/refinements
- **Test Coverage:** ~80% for use cases, ~70% for components

---

## Conclusion

Using Cursor AI significantly accelerated the development process, especially for:
- Project structure and boilerplate code
- Type definitions and interfaces
- Component scaffolding
- Test file generation
- Documentation

However, complex business logic, type safety refinement, and library-specific implementations required careful manual review and correction. The key to effective AI agent usage is finding the right balance between automation and manual oversight, especially for domain-specific logic and production-quality code.

**Estimated Efficiency Gain:** 60-70% faster than manual coding
**Code Quality:** Similar to manual coding after refinement
**Learning Curve:** ~2-3 hours to become effective with agent features
