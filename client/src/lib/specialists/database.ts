/**
 * Database Specialist Module
 * Handles schema design, migrations, and optimization
 */

export const DATABASE_GUIDELINES = {
  systems: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase'],
  languages: ['SQL', 'PL/pgSQL', 'JavaScript'],
  tools: ['Prisma', 'TypeORM', 'Sequelize', 'Knex.js'],
  migration: ['Flyway', 'Liquibase', 'Alembic'],
  optimization: ['Indexing', 'Query optimization', 'Caching']
};

export const DATABASE_BEST_PRACTICES = [
  'Normalized schema design',
  'Proper indexing strategy',
  'Foreign key constraints',
  'Data validation rules',
  'Migration versioning',
  'Query optimization',
  'Backup procedures',
  'Disaster recovery',
  'Performance monitoring',
  'Security and encryption'
];

export const SQL_SCHEMA_TEMPLATE = `
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);
`;

export const MIGRATION_TEMPLATE = `
-- Migration: 001_create_initial_schema.sql
-- Up
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down
DROP TABLE users;
`;

export function generateDatabaseChecklist(): string[] {
  return [
    '✓ Schema is properly normalized',
    '✓ Primary keys defined',
    '✓ Foreign keys configured',
    '✓ Indexes optimized',
    '✓ Constraints implemented',
    '✓ Migration scripts created',
    '✓ Seed data provided',
    '✓ Backup strategy defined',
    '✓ Query optimization done',
    '✓ Ready for production'
  ];
}

export function validateDatabaseSchema(code: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for CREATE TABLE
  if (!code.includes('CREATE TABLE')) {
    issues.push('Missing table definitions');
    score -= 20;
  }

  // Check for PRIMARY KEY
  if (!code.includes('PRIMARY KEY')) {
    issues.push('Missing primary keys');
    score -= 15;
  }

  // Check for FOREIGN KEY
  if (!code.includes('FOREIGN KEY') && code.includes('CREATE TABLE') && code.split('CREATE TABLE').length > 2) {
    issues.push('Missing foreign key relationships');
    score -= 10;
  }

  // Check for indexes
  if (!code.includes('INDEX') && !code.includes('CREATE INDEX')) {
    issues.push('Missing indexes');
    score -= 10;
  }

  // Check for constraints
  if (!code.includes('NOT NULL') && !code.includes('UNIQUE') && !code.includes('CHECK')) {
    issues.push('Missing constraints');
    score -= 10;
  }

  // Check for timestamps
  if (!code.includes('TIMESTAMP') && !code.includes('created_at') && !code.includes('updated_at')) {
    issues.push('Missing audit columns');
    score -= 5;
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues
  };
}

export function generateMigrationScript(tableName: string, columns: string[]): string {
  const columnDefs = columns.join(',\n  ');
  return `
-- Migration: create_${tableName}_table.sql
-- Up
CREATE TABLE ${tableName} (
  id SERIAL PRIMARY KEY,
  ${columnDefs},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down
DROP TABLE ${tableName};
`;
}
