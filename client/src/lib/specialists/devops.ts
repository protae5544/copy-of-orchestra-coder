/**
 * DevOps Specialist Module
 * Handles infrastructure, deployment, and CI/CD
 */

export const DEVOPS_GUIDELINES = {
  containerization: ['Docker', 'Podman'],
  orchestration: ['Kubernetes', 'Docker Compose'],
  cicd: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI'],
  cloud: ['AWS', 'GCP', 'Azure', 'DigitalOcean'],
  monitoring: ['Prometheus', 'Grafana', 'ELK Stack'],
  infrastructure: ['Terraform', 'Ansible', 'CloudFormation']
};

export const DEVOPS_BEST_PRACTICES = [
  'Infrastructure as Code',
  'Containerization with Docker',
  'CI/CD pipeline automation',
  'Environment management',
  'Health checks and monitoring',
  'Log aggregation',
  'Security scanning',
  'Backup and disaster recovery',
  'Performance monitoring',
  'Cost optimization'
];

export const DOCKERFILE_TEMPLATE = `
# Multi-stage Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/index.js"]
`;

export const GITHUB_ACTIONS_TEMPLATE = `
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: npm run deploy
`;

export function generateDevOpsChecklist(): string[] {
  return [
    '✓ Dockerfile is optimized',
    '✓ Docker Compose configured',
    '✓ CI/CD pipeline defined',
    '✓ Environment variables managed',
    '✓ Health checks implemented',
    '✓ Monitoring configured',
    '✓ Logging setup',
    '✓ Security scanning enabled',
    '✓ Deployment automated',
    '✓ Ready for production'
  ];
}

export function validateDevOpsConfig(code: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for Docker
  if (!code.includes('FROM') && !code.includes('docker')) {
    issues.push('Missing Docker configuration');
    score -= 15;
  }

  // Check for CI/CD
  if (!code.includes('jobs') && !code.includes('stages') && !code.includes('pipeline')) {
    issues.push('Missing CI/CD configuration');
    score -= 15;
  }

  // Check for environment
  if (!code.includes('ENV') && !code.includes('environment') && !code.includes('env')) {
    issues.push('Missing environment configuration');
    score -= 10;
  }

  // Check for health checks
  if (!code.includes('HEALTHCHECK') && !code.includes('health')) {
    issues.push('Missing health checks');
    score -= 10;
  }

  // Check for monitoring
  if (!code.includes('monitor') && !code.includes('prometheus') && !code.includes('logging')) {
    issues.push('Missing monitoring/logging');
    score -= 10;
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues
  };
}
