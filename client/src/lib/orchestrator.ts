/**
 * Orchestra Coder - Orchestrator Utilities
 * Handles Coordinator logic, task decomposition, and specialist management
 */

export type SpecialistRole = 'frontend' | 'backend' | 'devops' | 'database';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskBreakdown {
  frontend_tasks: string;
  backend_tasks: string;
  devops_tasks: string;
  database_tasks: string;
  dependencies: string[];
}

export interface SpecialistPrompt {
  role: SpecialistRole;
  systemPrompt: string;
  userPrompt: string;
}

export interface ProjectContext {
  title: string;
  description: string;
  requirements: string;
  techStack: string;
}

/**
 * Generate Coordinator analysis prompt
 * Analyzes project requirements and creates task breakdown
 */
export function generateCoordinatorPrompt(context: ProjectContext): string {
  return `You are the Coordinator (Maestro) for a professional code generation team. 

Project Requirements:
Title: ${context.title}
Description: ${context.description}
Requirements: ${context.requirements || 'Not specified'}
Tech Stack: ${context.techStack || 'Your choice'}

Analyze this project and create a comprehensive breakdown for each specialist:
1. Frontend Specialist - UI/UX components, responsive design, state management
2. Backend Specialist - API endpoints, business logic, authentication, database integration
3. DevOps Specialist - Deployment configuration, CI/CD pipelines, infrastructure
4. Database Specialist - Schema design, migrations, optimization, indexing

Provide a detailed JSON response with this structure:
{
  "frontend_tasks": "specific frontend requirements, component structure, and implementation details",
  "backend_tasks": "specific backend requirements, API design, and business logic",
  "devops_tasks": "specific devops requirements, deployment, and infrastructure",
  "database_tasks": "specific database requirements, schema, and migrations",
  "dependencies": ["list of dependencies between tasks"],
  "architecture_notes": "overall architecture considerations"
}

Be specific and detailed so each specialist can generate production-ready code.`;
}

/**
 * Generate specialist prompts based on coordinator breakdown
 */
export function generateSpecialistPrompts(
  context: ProjectContext,
  taskBreakdown: string
): Record<SpecialistRole, SpecialistPrompt> {
  return {
    frontend: {
      role: 'frontend',
      systemPrompt: 'You are a Professional Frontend Specialist with expertise in React, TypeScript, responsive design, and modern UI patterns. Generate production-ready code.',
      userPrompt: `Based on this project breakdown, generate professional React/TypeScript code for the user interface:

Project: ${context.title}
Description: ${context.description}

Task Breakdown:
${taskBreakdown}

Requirements:
- Use React 19 with TypeScript
- Implement proper component structure and composition
- Use Tailwind CSS for styling
- Implement state management (useState, useContext)
- Ensure responsive design (mobile-first)
- Add proper error handling and loading states
- Include accessibility features (ARIA labels, keyboard navigation)
- Use React hooks best practices

Generate clean, production-ready frontend code with:
1. Well-structured React components
2. Proper TypeScript typing
3. State management patterns
4. Responsive layout
5. Error boundaries
6. Loading and empty states`
    },
    backend: {
      role: 'backend',
      systemPrompt: 'You are a Professional Backend Specialist with expertise in API design, business logic, security, and database integration. Generate production-ready code.',
      userPrompt: `Based on this project breakdown, generate professional backend code:

Project: ${context.title}
Description: ${context.description}

Task Breakdown:
${taskBreakdown}

Requirements:
- Use Node.js with Express or similar framework
- Implement RESTful API endpoints
- Add proper error handling and validation
- Include authentication/authorization logic
- Implement database integration
- Add logging and monitoring
- Follow security best practices
- Include API documentation

Generate clean, production-ready backend code with:
1. Well-designed API endpoints
2. Request validation and error handling
3. Authentication and authorization
4. Database queries and migrations
5. Middleware implementation
6. Environment configuration
7. Security measures (input validation, CORS, etc.)`
    },
    devops: {
      role: 'devops',
      systemPrompt: 'You are a Professional DevOps Specialist with expertise in Docker, Kubernetes, CI/CD, and infrastructure. Generate production-ready configurations.',
      userPrompt: `Based on this project breakdown, generate professional DevOps configurations:

Project: ${context.title}
Description: ${context.description}

Task Breakdown:
${taskBreakdown}

Requirements:
- Create Docker configuration for containerization
- Implement CI/CD pipeline configuration (GitHub Actions, GitLab CI, or similar)
- Configure environment management
- Add monitoring and logging setup
- Implement health checks
- Create deployment scripts
- Add security scanning

Generate production-ready DevOps configurations with:
1. Dockerfile with multi-stage builds
2. Docker Compose for local development
3. CI/CD pipeline configuration
4. Environment variable management
5. Health checks and monitoring
6. Deployment automation
7. Security scanning and compliance`
    },
    database: {
      role: 'database',
      systemPrompt: 'You are a Professional Database Specialist with expertise in schema design, optimization, and migrations. Generate production-ready database code.',
      userPrompt: `Based on this project breakdown, generate professional database code:

Project: ${context.title}
Description: ${context.description}

Task Breakdown:
${taskBreakdown}

Requirements:
- Design normalized database schema
- Create migration scripts
- Add indexes for optimization
- Implement foreign keys and constraints
- Add seed data scripts
- Include backup strategies
- Optimize queries

Generate production-ready database code with:
1. SQL schema with proper normalization
2. Table relationships and constraints
3. Indexes for performance
4. Migration scripts (up/down)
5. Seed data for testing
6. Query optimization examples
7. Backup and recovery procedures`
    }
  };
}

/**
 * Parse coordinator response
 */
export function parseCoordinatorResponse(response: string): TaskBreakdown {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to parse coordinator response:', error);
  }

  // Fallback: create default breakdown
  return {
    frontend_tasks: response,
    backend_tasks: response,
    devops_tasks: response,
    database_tasks: response,
    dependencies: []
  };
}

/**
 * Validate specialist output quality
 */
export function validateSpecialistOutput(
  role: SpecialistRole,
  output: string
): { valid: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  // Check minimum length
  if (output.length < 100) {
    issues.push('Output too short');
    score -= 20;
  }

  // Check for code blocks
  if (!output.includes('```') && !output.includes('{') && !output.includes('SELECT')) {
    issues.push('No code detected');
    score -= 15;
  }

  // Role-specific validation
  switch (role) {
    case 'frontend':
      if (!output.toLowerCase().includes('react') && !output.toLowerCase().includes('component')) {
        issues.push('Missing React/component references');
        score -= 10;
      }
      break;
    case 'backend':
      if (!output.toLowerCase().includes('api') && !output.toLowerCase().includes('endpoint')) {
        issues.push('Missing API/endpoint references');
        score -= 10;
      }
      break;
    case 'devops':
      if (!output.toLowerCase().includes('docker') && !output.toLowerCase().includes('deploy')) {
        issues.push('Missing deployment references');
        score -= 10;
      }
      break;
    case 'database':
      if (!output.toLowerCase().includes('create') && !output.toLowerCase().includes('table')) {
        issues.push('Missing database schema references');
        score -= 10;
      }
      break;
  }

  return {
    valid: score >= 60,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Calculate lines of code
 */
export function calculateLinesOfCode(output: string): number {
  return output.split('\n').filter(line => line.trim().length > 0).length;
}

/**
 * Determine complexity level
 */
export function determineComplexity(output: string): 'low' | 'medium' | 'high' {
  const lines = calculateLinesOfCode(output);
  const hasAdvancedPatterns = /async|await|promise|class|interface|type|generic|decorator/.test(output);
  const hasComplexLogic = /for|while|if.*else|switch|map|filter|reduce/.test(output);

  if (lines > 500 && hasAdvancedPatterns && hasComplexLogic) {
    return 'high';
  } else if (lines > 200 || (hasAdvancedPatterns && hasComplexLogic)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Extract dependencies from output
 */
export function extractDependencies(output: string): string[] {
  const dependencies = new Set<string>();

  // Extract npm packages
  const npmMatch = output.match(/import.*from\s['"]([^'"]+)['"]/g);
  if (npmMatch) {
    npmMatch.forEach(match => {
      const pkg = match.match(/['"]([^'"]+)['"]/)?.[1];
      if (pkg && !pkg.startsWith('.')) {
        dependencies.add(pkg);
      }
    });
  }

  // Extract other references
  const requireMatch = output.match(/require\(['"]([^'"]+)['"]\)/g);
  if (requireMatch) {
    requireMatch.forEach(match => {
      const pkg = match.match(/['"]([^'"]+)['"]/)?.[1];
      if (pkg && !pkg.startsWith('.')) {
        dependencies.add(pkg);
      }
    });
  }

  return Array.from(dependencies);
}
