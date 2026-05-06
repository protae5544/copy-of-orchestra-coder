/**
 * Orchestra Coder - Core Orchestration Engine
 * 
 * Implements TRUE orchestration with sequential specialist execution and context sharing.
 * Each specialist builds on previous outputs, creating integrated, production-ready code.
 */

export type SpecialistRole = 'database' | 'backend' | 'frontend' | 'devops';

export interface ProjectContext {
  title: string;
  description: string;
  requirements: string;
  techStack: string;
}

export interface SpecialistOutput {
  role: SpecialistRole;
  code: string;
  metadata: {
    linesOfCode: number;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
    timestamp: number;
  };
}

export interface OrchestrationState {
  database: SpecialistOutput | null;
  backend: SpecialistOutput | null;
  frontend: SpecialistOutput | null;
  devops: SpecialistOutput | null;
}

/**
 * Generate coordinator analysis prompt
 * The Maestro analyzes the project and creates a comprehensive breakdown
 */
export function generateCoordinatorPrompt(context: ProjectContext): string {
  return `You are the Maestro Coordinator for a professional code generation orchestra.

Your job is to analyze the project requirements and create a DETAILED breakdown that will guide each specialist.

PROJECT DETAILS:
Title: ${context.title}
Description: ${context.description}
Requirements: ${context.requirements || 'Not specified'}
Tech Stack: ${context.techStack || 'Your recommendation'}

Create a comprehensive analysis in JSON format:
{
  "architecture_overview": "High-level system architecture and design patterns",
  "database_design": {
    "tables": "List of required database tables and their purposes",
    "relationships": "Key relationships and constraints",
    "indexes": "Performance optimization strategy"
  },
  "backend_api": {
    "endpoints": "Complete list of required API endpoints with methods and purposes",
    "authentication": "Authentication strategy and middleware",
    "business_logic": "Key business logic components"
  },
  "frontend_components": {
    "pages": "List of required pages/views",
    "components": "Reusable component structure",
    "state_management": "State management approach"
  },
  "devops_requirements": {
    "deployment": "Deployment strategy and environments",
    "ci_cd": "CI/CD pipeline requirements",
    "monitoring": "Monitoring and logging requirements"
  },
  "integration_points": "Critical integration points between components",
  "tech_stack_recommendation": "Recommended technologies if not specified"
}

Be VERY specific and detailed. Each specialist will use this to generate code that integrates perfectly.`;
}

/**
 * Generate database specialist prompt
 * Database is first - it defines the schema that backend depends on
 */
export function generateDatabasePrompt(
  context: ProjectContext,
  coordinatorAnalysis: string
): string {
  return `You are a Senior Database Architect specialist.

Your role is to design the database schema that will support the entire application.

PROJECT CONTEXT:
${coordinatorAnalysis}

REQUIREMENTS:
1. Design a normalized, production-ready database schema
2. Include ALL tables needed by the application
3. Define proper relationships, constraints, and indexes
4. Create migration scripts (up/down)
5. Include seed data for testing
6. Optimize for performance
7. Add comments explaining design decisions

OUTPUT FORMAT:
Provide COMPLETE, production-ready SQL code including:
- CREATE TABLE statements with all columns, types, constraints
- FOREIGN KEY relationships
- Indexes for performance
- CHECK constraints where needed
- DEFAULT values
- Comments explaining each table's purpose

The backend specialist will depend on this schema, so be THOROUGH and COMPLETE.
Include at least 5-10 tables for a realistic application.`;
}

/**
 * Generate backend specialist prompt
 * Backend is second - it uses database schema and defines API contracts
 */
export function generateBackendPrompt(
  context: ProjectContext,
  coordinatorAnalysis: string,
  databaseSchema: string
): string {
  return `You are a Senior Backend Engineer specialist.

Your role is to design and implement the backend API that will serve the frontend.

PROJECT CONTEXT:
${coordinatorAnalysis}

DATABASE SCHEMA (that you must work with):
${databaseSchema}

REQUIREMENTS:
1. Design RESTful API endpoints based on the coordinator's specification
2. Implement proper request validation and error handling
3. Create database integration code using the provided schema
4. Implement authentication/authorization
5. Add middleware for logging, error handling, CORS
6. Include comprehensive error responses
7. Add API documentation comments

OUTPUT FORMAT:
Provide production-ready Node.js/Express code including:
- Complete Express app setup
- All required endpoints with proper HTTP methods
- Request validation using express-validator or similar
- Database queries that match the schema
- Error handling middleware
- Authentication middleware
- CORS and security headers
- Comprehensive comments

The frontend specialist will depend on your API contracts, so define them CLEARLY.
Include at least 10-15 endpoints for a realistic application.`;
}

/**
 * Generate frontend specialist prompt
 * Frontend is third - it uses backend API and implements the UI
 */
export function generateFrontendPrompt(
  context: ProjectContext,
  coordinatorAnalysis: string,
  backendCode: string
): string {
  return `You are a Senior Frontend Engineer specialist.

Your role is to build the user interface that consumes the backend API.

PROJECT CONTEXT:
${coordinatorAnalysis}

BACKEND API (that you must consume):
${backendCode}

REQUIREMENTS:
1. Create React components for all pages specified in the coordinator's analysis
2. Implement proper state management (useState, useContext, or similar)
3. Create API client code that matches the backend endpoints
4. Implement error handling and loading states
5. Add form validation
6. Ensure responsive design (mobile-first)
7. Implement proper TypeScript types

OUTPUT FORMAT:
Provide production-ready React/TypeScript code including:
- React components for all pages
- Custom hooks for API calls and state management
- TypeScript interfaces for all data types
- Error boundaries and error handling
- Loading and empty states
- Form components with validation
- Responsive Tailwind CSS styling
- Comprehensive comments

Extract the API endpoints from the backend code and implement proper client code to consume them.
Include at least 5-8 pages/major components for a realistic application.`;
}

/**
 * Generate DevOps specialist prompt
 * DevOps is last - it deploys everything together
 */
export function generateDevOpsPrompt(
  context: ProjectContext,
  coordinatorAnalysis: string,
  backendCode: string,
  frontendCode: string
): string {
  return `You are a Senior DevOps Engineer specialist.

Your role is to create deployment configurations and infrastructure code.

PROJECT CONTEXT:
${coordinatorAnalysis}

BACKEND CODE (that you must containerize):
${backendCode}

FRONTEND CODE (that you must build and serve):
${frontendCode}

REQUIREMENTS:
1. Create Dockerfile with multi-stage builds for both frontend and backend
2. Create docker-compose.yml for local development
3. Create CI/CD pipeline configuration (GitHub Actions)
4. Set up environment management
5. Create health checks and monitoring setup
6. Add security scanning and best practices
7. Create deployment automation scripts

OUTPUT FORMAT:
Provide production-ready DevOps configurations including:
- Dockerfile for backend (Node.js)
- Dockerfile for frontend (React build)
- docker-compose.yml for development
- .github/workflows/ci-cd.yml for GitHub Actions
- .env.example with all required variables
- Health check scripts
- Deployment documentation
- Security best practices

Make sure the configurations work with the actual code provided above.
Include proper logging, monitoring, and error handling.`;
}

/**
 * Calculate complexity based on code analysis
 */
export function calculateComplexity(code: string): 'low' | 'medium' | 'high' {
  const lines = code.split('\n').filter(l => l.trim().length > 0).length;
  const hasAsync = /async|await|promise/i.test(code);
  const hasClasses = /class\s+\w+|interface\s+\w+|type\s+\w+/i.test(code);
  const hasComplexLogic = /for|while|if.*else|switch|map|filter|reduce|recursion/i.test(code);

  if (lines > 400 && (hasAsync || hasClasses) && hasComplexLogic) {
    return 'high';
  } else if (lines > 200 || (hasAsync && hasComplexLogic)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Extract dependencies from code
 */
export function extractDependencies(code: string): string[] {
  const deps = new Set<string>();

  // ES6 imports
  const importMatches = code.match(/import\s+(?:{[^}]*}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g);
  if (importMatches) {
    importMatches.forEach(match => {
      const pkg = match.match(/['"]([^'"]+)['"]/)?.[1];
      if (pkg && !pkg.startsWith('.') && !pkg.startsWith('@/')) {
        deps.add(pkg);
      }
    });
  }

  // CommonJS requires
  const requireMatches = code.match(/require\(['"]([^'"]+)['"]\)/g);
  if (requireMatches) {
    requireMatches.forEach(match => {
      const pkg = match.match(/['"]([^'"]+)['"]/)?.[1];
      if (pkg && !pkg.startsWith('.')) {
        deps.add(pkg);
      }
    });
  }

  return Array.from(deps);
}

/**
 * Validate specialist output quality
 */
export function validateOutput(role: SpecialistRole, code: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Minimum length check
  if (code.length < 500) {
    issues.push('Output too short (< 500 characters)');
    score -= 30;
  }

  // Must have actual code
  if (!code.includes('{') && !code.includes('CREATE TABLE') && !code.includes('SELECT')) {
    issues.push('No code structure detected');
    score -= 25;
  }

  // Role-specific validation
  switch (role) {
    case 'database':
      if (!code.toUpperCase().includes('CREATE TABLE')) {
        issues.push('Missing CREATE TABLE statements');
        score -= 20;
      }
      if (!code.toUpperCase().includes('PRIMARY KEY')) {
        issues.push('Missing PRIMARY KEY definitions');
        score -= 15;
      }
      break;

    case 'backend':
      if (!code.includes('app.') && !code.includes('router.')) {
        issues.push('Missing Express app or router setup');
        score -= 20;
      }
      if (!code.match(/app\.(get|post|put|delete|patch)/i)) {
        issues.push('Missing API endpoints');
        score -= 20;
      }
      break;

    case 'frontend':
      if (!code.includes('export') || !code.includes('function') && !code.includes('=>')) {
        issues.push('Missing React component exports');
        score -= 20;
      }
      if (!code.includes('useState') && !code.includes('useEffect') && !code.includes('fetch')) {
        issues.push('Missing React hooks or API calls');
        score -= 15;
      }
      break;

    case 'devops':
      if (!code.includes('FROM') && !code.includes('version:')) {
        issues.push('Missing Docker or docker-compose configuration');
        score -= 20;
      }
      break;
  }

  return {
    valid: score >= 50,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON(text: string): Record<string, any> | null {
  try {
    // Try direct JSON parsing first
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through
      }
    }

    // Try finding JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Fall through
      }
    }

    return null;
  }
}

/**
 * Extract code from LLM response (handles markdown code blocks)
 */
export function extractCode(text: string): string {
  // Try to extract from markdown code blocks
  const codeMatch = text.match(/```(?:[\w]+)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  // If no code block, return the text as-is (might be plain code)
  return text.trim();
}
