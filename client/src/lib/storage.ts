/**
 * Storage Utilities for Orchestra Coder
 * Handles LocalStorage operations for project history and results
 */

export interface ProjectResult {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  results: {
    frontend: string;
    backend: string;
    devops: string;
    database: string;
  };
  metadata: {
    requirements: string;
    techStack: string;
  };
}

const STORAGE_KEY = 'orchestra-coder-projects';
const MAX_PROJECTS = 50;

/**
 * Save project result to LocalStorage
 */
export function saveProjectResult(project: Omit<ProjectResult, 'id' | 'timestamp'>): ProjectResult {
  const result: ProjectResult = {
    ...project,
    id: generateId(),
    timestamp: Date.now()
  };

  const projects = getAllProjects();
  projects.unshift(result);

  // Keep only the latest MAX_PROJECTS
  if (projects.length > MAX_PROJECTS) {
    projects.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return result;
}

/**
 * Get all saved projects
 */
export function getAllProjects(): ProjectResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve projects:', error);
    return [];
  }
}

/**
 * Get project by ID
 */
export function getProjectById(id: string): ProjectResult | null {
  const projects = getAllProjects();
  return projects.find(p => p.id === id) || null;
}

/**
 * Delete project by ID
 */
export function deleteProject(id: string): boolean {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete project:', error);
    return false;
  }
}

/**
 * Clear all projects
 */
export function clearAllProjects(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear projects:', error);
    return false;
  }
}

/**
 * Export project as JSON
 */
export function exportProjectAsJSON(id: string): string | null {
  const project = getProjectById(id);
  if (!project) return null;

  return JSON.stringify(project, null, 2);
}

/**
 * Export project as ZIP (returns file content)
 */
export function exportProjectAsFiles(id: string): { [key: string]: string } | null {
  const project = getProjectById(id);
  if (!project) return null;

  return {
    'frontend.tsx': project.results.frontend,
    'backend.ts': project.results.backend,
    'devops.yml': project.results.devops,
    'database.sql': project.results.database,
    'project.json': JSON.stringify({
      title: project.title,
      description: project.description,
      requirements: project.metadata.requirements,
      techStack: project.metadata.techStack,
      createdAt: new Date(project.timestamp).toISOString()
    }, null, 2)
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get project statistics
 */
export function getProjectStats() {
  const projects = getAllProjects();
  return {
    totalProjects: projects.length,
    totalLines: projects.reduce((sum, p) => {
      return sum + 
        p.results.frontend.split('\n').length +
        p.results.backend.split('\n').length +
        p.results.devops.split('\n').length +
        p.results.database.split('\n').length;
    }, 0),
    oldestProject: projects.length > 0 ? projects[projects.length - 1].timestamp : null,
    newestProject: projects.length > 0 ? projects[0].timestamp : null
  };
}
