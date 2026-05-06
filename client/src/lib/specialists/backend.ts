/**
 * Backend Specialist Module
 * Handles API design, business logic, and server implementation
 */

export const BACKEND_GUIDELINES = {
  frameworks: ['Express', 'Fastify', 'Django', 'FastAPI', 'Spring Boot', 'ASP.NET'],
  languages: ['Node.js', 'Python', 'Java', 'Go', 'C#'],
  databases: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
  authentication: ['JWT', 'OAuth2', 'Session-based'],
  testing: ['Jest', 'Mocha', 'Pytest', 'JUnit']
};

export const BACKEND_BEST_PRACTICES = [
  'RESTful API design',
  'Input validation and sanitization',
  'Error handling and logging',
  'Authentication and authorization',
  'Rate limiting',
  'CORS configuration',
  'Database optimization',
  'Caching strategies',
  'Security best practices',
  'API documentation'
];

export const BACKEND_TEMPLATE = `
// Backend API Template
import express, { Request, Response } from 'express';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/resource', (req: Request, res: Response) => {
  try {
    // Business logic
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/resource', (req: Request, res: Response) => {
  try {
    // Validate input
    // Process request
    // Return response
    res.status(201).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
});

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
`;

export function generateBackendChecklist(): string[] {
  return [
    '✓ API endpoints are well-designed',
    '✓ Input validation implemented',
    '✓ Error handling comprehensive',
    '✓ Authentication/authorization included',
    '✓ Database queries optimized',
    '✓ Logging implemented',
    '✓ Security measures in place',
    '✓ API documented',
    '✓ Rate limiting configured',
    '✓ Ready for production'
  ];
}

export function validateBackendCode(code: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for framework imports
  if (!code.includes('import') && !code.includes('require')) {
    issues.push('Missing imports');
    score -= 15;
  }

  // Check for route definitions
  if (!code.includes('app.') && !code.includes('router.')) {
    issues.push('Missing route definitions');
    score -= 15;
  }

  // Check for error handling
  if (!code.includes('try') && !code.includes('catch')) {
    issues.push('Missing error handling');
    score -= 15;
  }

  // Check for validation
  if (!code.includes('validate') && !code.includes('check')) {
    issues.push('Missing input validation');
    score -= 10;
  }

  // Check for response handling
  if (!code.includes('res.') && !code.includes('response')) {
    issues.push('Missing response handling');
    score -= 15;
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues
  };
}
