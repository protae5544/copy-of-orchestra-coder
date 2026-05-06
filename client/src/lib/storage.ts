/**
 * Storage Utilities for Orchestra Coder
 */

export interface ProjectResult {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  results: {
    database: string;
    backend: string;
    frontend: string;
    devops: string;
  };
  metadata: {
    requirements: string;
    techStack: string;
  };
}

const STORAGE_KEY = 'orchestra-coder-projects';
const MAX_PROJECTS = 50;

export function saveProjectResult(project: Omit<ProjectResult, 'id' | 'timestamp'>): ProjectResult {
  const result: ProjectResult = {
    ...project,
    id: generateId(),
    timestamp: Date.now()
  };

  const projects = getAllProjects();
  projects.unshift(result);

  if (projects.length > MAX_PROJECTS) {
    projects.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return result;
}

export function getAllProjects(): ProjectResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve projects:', error);
    return [];
  }
}

export function getProjectById(id: string): ProjectResult | null {
  const projects = getAllProjects();
  return projects.find(p => p.id === id) || null;
}

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

export function exportProjectAsFiles(id: string): { [key: string]: string } | null {
  const project = getProjectById(id);
  if (!project) return null;

  return {
    'schema.sql': project.results.database,
    'backend.ts': project.results.backend,
    'frontend.tsx': project.results.frontend,
    'devops.yml': project.results.devops,
    'project.json': JSON.stringify({
      title: project.title,
      description: project.description,
      requirements: project.metadata.requirements,
      techStack: project.metadata.techStack,
      createdAt: new Date(project.timestamp).toISOString()
    }, null, 2)
  };
}

function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
