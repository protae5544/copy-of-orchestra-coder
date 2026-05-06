/**
 * Frontend Specialist Module
 * Handles UI/UX, component generation, and responsive design
 */

export const FRONTEND_GUIDELINES = {
  frameworks: ['React', 'Vue', 'Angular', 'Svelte'],
  languages: ['JavaScript', 'TypeScript'],
  styling: ['Tailwind CSS', 'CSS-in-JS', 'SCSS'],
  stateManagement: ['useState', 'useContext', 'Redux', 'Pinia', 'Vuex'],
  testing: ['Jest', 'React Testing Library', 'Vitest'],
  performance: ['Code splitting', 'Lazy loading', 'Memoization', 'Image optimization']
};

export const FRONTEND_BEST_PRACTICES = [
  'Component composition and reusability',
  'Proper TypeScript typing',
  'Responsive design (mobile-first)',
  'Accessibility (WCAG 2.1)',
  'Performance optimization',
  'Error boundaries and error handling',
  'Loading and empty states',
  'Keyboard navigation',
  'Semantic HTML',
  'Progressive enhancement'
];

export const FRONTEND_TEMPLATE = `
// Frontend Component Template
import React, { useState, useEffect } from 'react';

interface ComponentProps {
  // Define props
}

export const Component: React.FC<ComponentProps> = (props) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div className="component">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
`;

export function generateFrontendChecklist(): string[] {
  return [
    '✓ Component structure is modular and reusable',
    '✓ TypeScript types are properly defined',
    '✓ Responsive design implemented',
    '✓ Accessibility features included',
    '✓ Error handling implemented',
    '✓ Loading states handled',
    '✓ Performance optimized',
    '✓ Code is well-commented',
    '✓ Follows project conventions',
    '✓ Ready for production'
  ];
}

export function validateFrontendCode(code: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for React imports
  if (!code.includes('import React') && !code.includes('import { ')) {
    issues.push('Missing imports');
    score -= 15;
  }

  // Check for component structure
  if (!code.includes('export') && !code.includes('function')) {
    issues.push('Missing component export');
    score -= 15;
  }

  // Check for JSX
  if (!code.includes('return') || !code.includes('<')) {
    issues.push('Missing JSX return');
    score -= 15;
  }

  // Check for TypeScript
  if (!code.includes('interface') && !code.includes('type') && !code.includes(': ')) {
    issues.push('Missing TypeScript types');
    score -= 10;
  }

  // Check for accessibility
  if (!code.includes('aria-') && !code.includes('alt=') && !code.includes('role=')) {
    issues.push('Missing accessibility attributes');
    score -= 10;
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues
  };
}
