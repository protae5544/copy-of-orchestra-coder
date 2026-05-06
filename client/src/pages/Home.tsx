import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, Database, Server, Users, GitBranch, Copy, CheckCircle, Clock, AlertTriangle, Download, Trash2, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateCoordinatorPrompt,
  generateDatabasePrompt,
  generateBackendPrompt,
  generateFrontendPrompt,
  generateDevOpsPrompt,
  extractCode,
  extractJSON,
  validateOutput,
  calculateComplexity,
  extractDependencies,
  type ProjectContext,
  type SpecialistRole,
  type SpecialistOutput,
  type OrchestrationState
} from '@/lib/orchestrator';
import { saveProjectResult, getAllProjects, deleteProject, exportProjectAsFiles, formatDate, type ProjectResult } from '@/lib/storage';
import { downloadFile, downloadFilesAsZip, copyToClipboard } from '@/lib/export';

const SPECIALISTS: Record<SpecialistRole, { name: string; icon: any; color: string; description: string }> = {
  database: {
    name: 'Database Specialist',
    icon: Database,
    color: 'bg-orange-100 text-orange-700',
    description: 'Schema design, optimization, migrations'
  },
  backend: {
    name: 'Backend Specialist',
    icon: Server,
    color: 'bg-green-100 text-green-700',
    description: 'APIs, business logic, authentication'
  },
  frontend: {
    name: 'Frontend Specialist',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    description: 'UI/UX, React, responsive design'
  },
  devops: {
    name: 'DevOps Specialist',
    icon: GitBranch,
    color: 'bg-purple-100 text-purple-700',
    description: 'Infrastructure, CI/CD, deployment'
  }
};

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface SpecialistState {
  status: TaskStatus;
  output: SpecialistOutput | null;
  error: string | null;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [techStack, setTechStack] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<ProjectResult[]>(getAllProjects());
  
  const [specialists, setSpecialists] = useState<Record<SpecialistRole, SpecialistState>>({
    database: { status: 'pending', output: null, error: null },
    backend: { status: 'pending', output: null, error: null },
    frontend: { status: 'pending', output: null, error: null },
    devops: { status: 'pending', output: null, error: null }
  });

  const callDeepSeekAPI = useCallback(async (systemPrompt: string, userPrompt: string): Promise<string> => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }, [apiKey]);

  const updateSpecialistState = (role: SpecialistRole, updates: Partial<SpecialistState>) => {
    setSpecialists(prev => ({
      ...prev,
      [role]: { ...prev[role], ...updates }
    }));
  };

  const handleGenerateProject = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your DeepSeek API key');
      return;
    }

    if (!projectTitle.trim() || !projectDescription.trim()) {
      toast.error('Please enter project title and description');
      return;
    }

    setLoading(true);
    
    // Reset all specialists
    Object.keys(SPECIALISTS).forEach(role => {
      updateSpecialistState(role as SpecialistRole, { status: 'pending', output: null, error: null });
    });

    try {
      const projectContext: ProjectContext = {
        title: projectTitle,
        description: projectDescription,
        requirements,
        techStack
      };

      // Step 1: Coordinator Analysis
      toast.info('🎼 Maestro analyzing project...');
      updateSpecialistState('database', { status: 'processing' });
      
      const coordinatorPrompt = generateCoordinatorPrompt(projectContext);
      const coordinatorResponse = await callDeepSeekAPI(
        'You are an expert project coordinator. Analyze requirements and create a detailed breakdown.',
        coordinatorPrompt
      );

      // Step 2: Database Specialist (generates schema)
      toast.info('🗄️ Database specialist designing schema...');
      const databasePrompt = generateDatabasePrompt(projectContext, coordinatorResponse);
      const databaseResponse = await callDeepSeekAPI(
        'You are a Senior Database Architect. Generate production-ready SQL code.',
        databasePrompt
      );

      const databaseCode = extractCode(databaseResponse);
      const databaseValidation = validateOutput('database', databaseCode);
      
      if (!databaseValidation.valid) {
        throw new Error(`Database validation failed: ${databaseValidation.issues.join(', ')}`);
      }

      const databaseOutput: SpecialistOutput = {
        role: 'database',
        code: databaseCode,
        metadata: {
          linesOfCode: databaseCode.split('\n').length,
          complexity: calculateComplexity(databaseCode),
          dependencies: extractDependencies(databaseCode),
          timestamp: Date.now()
        }
      };

      updateSpecialistState('database', { status: 'completed', output: databaseOutput });

      // Step 3: Backend Specialist (uses database schema)
      toast.info('🔌 Backend specialist building API...');
      updateSpecialistState('backend', { status: 'processing' });
      
      const backendPrompt = generateBackendPrompt(projectContext, coordinatorResponse, databaseCode);
      const backendResponse = await callDeepSeekAPI(
        'You are a Senior Backend Engineer. Generate production-ready Node.js/Express code.',
        backendPrompt
      );

      const backendCode = extractCode(backendResponse);
      const backendValidation = validateOutput('backend', backendCode);
      
      if (!backendValidation.valid) {
        throw new Error(`Backend validation failed: ${backendValidation.issues.join(', ')}`);
      }

      const backendOutput: SpecialistOutput = {
        role: 'backend',
        code: backendCode,
        metadata: {
          linesOfCode: backendCode.split('\n').length,
          complexity: calculateComplexity(backendCode),
          dependencies: extractDependencies(backendCode),
          timestamp: Date.now()
        }
      };

      updateSpecialistState('backend', { status: 'completed', output: backendOutput });

      // Step 4: Frontend Specialist (uses backend API)
      toast.info('🎨 Frontend specialist building UI...');
      updateSpecialistState('frontend', { status: 'processing' });
      
      const frontendPrompt = generateFrontendPrompt(projectContext, coordinatorResponse, backendCode);
      const frontendResponse = await callDeepSeekAPI(
        'You are a Senior Frontend Engineer. Generate production-ready React/TypeScript code.',
        frontendPrompt
      );

      const frontendCode = extractCode(frontendResponse);
      const frontendValidation = validateOutput('frontend', frontendCode);
      
      if (!frontendValidation.valid) {
        throw new Error(`Frontend validation failed: ${frontendValidation.issues.join(', ')}`);
      }

      const frontendOutput: SpecialistOutput = {
        role: 'frontend',
        code: frontendCode,
        metadata: {
          linesOfCode: frontendCode.split('\n').length,
          complexity: calculateComplexity(frontendCode),
          dependencies: extractDependencies(frontendCode),
          timestamp: Date.now()
        }
      };

      updateSpecialistState('frontend', { status: 'completed', output: frontendOutput });

      // Step 5: DevOps Specialist (orchestrates everything)
      toast.info('⚙️ DevOps specialist creating deployment configs...');
      updateSpecialistState('devops', { status: 'processing' });
      
      const devopsPrompt = generateDevOpsPrompt(projectContext, coordinatorResponse, backendCode, frontendCode);
      const devopsResponse = await callDeepSeekAPI(
        'You are a Senior DevOps Engineer. Generate production-ready deployment configurations.',
        devopsPrompt
      );

      const devopsCode = extractCode(devopsResponse);
      const devopsValidation = validateOutput('devops', devopsCode);
      
      if (!devopsValidation.valid) {
        throw new Error(`DevOps validation failed: ${devopsValidation.issues.join(', ')}`);
      }

      const devopsOutput: SpecialistOutput = {
        role: 'devops',
        code: devopsCode,
        metadata: {
          linesOfCode: devopsCode.split('\n').length,
          complexity: calculateComplexity(devopsCode),
          dependencies: extractDependencies(devopsCode),
          timestamp: Date.now()
        }
      };

      updateSpecialistState('devops', { status: 'completed', output: devopsOutput });

      // Save to storage
      const savedProject = saveProjectResult({
        title: projectTitle,
        description: projectDescription,
        results: {
          database: databaseCode,
          backend: backendCode,
          frontend: frontendCode,
          devops: devopsCode
        },
        metadata: {
          requirements,
          techStack
        }
      });

      setProjects(getAllProjects());
      toast.success('✨ Project generation completed!');
      setActiveTab('results');
    } catch (error) {
      console.error('Orchestration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate project';
      toast.error(errorMessage);

      // Mark all in-progress specialists as failed
      Object.keys(SPECIALISTS).forEach(role => {
        const state = specialists[role as SpecialistRole];
        if (state.status === 'processing') {
          updateSpecialistState(role as SpecialistRole, { status: 'failed', error: errorMessage });
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOutput = async (role: SpecialistRole) => {
    const output = specialists[role].output;
    if (output?.code) {
      const success = await copyToClipboard(output.code);
      if (success) {
        toast.success(`${SPECIALISTS[role].name} code copied!`);
      }
    }
  };

  const handleExportProject = async () => {
    if (!projects.length) return;
    
    const files = exportProjectAsFiles(projects[0].id);
    if (files) {
      await downloadFilesAsZip(files, projectTitle || 'orchestra-project');
      toast.success('Project exported as ZIP!');
    }
  };

  const handleDeleteProject = (id: string) => {
    if (deleteProject(id)) {
      setProjects(getAllProjects());
      toast.success('Project deleted!');
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold tracking-tight font-mono">Orchestra Coder</h1>
          <p className="text-sm text-muted-foreground mt-2">Professional code generation with true specialist orchestration</p>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="project">Project Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-mono">Orchestration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(SPECIALISTS) as [SpecialistRole, typeof SPECIALISTS['database']][]).map(([role, specialist]) => {
                  const Icon = specialist.icon;
                  const state = specialists[role];
                  return (
                    <div key={role} className={`p-4 rounded-lg border border-border ${specialist.color}`}>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="w-6 h-6" />
                        {getStatusIcon(state.status)}
                      </div>
                      <h3 className="font-semibold text-sm">{specialist.name}</h3>
                      <p className="text-xs opacity-75 mt-1">{specialist.description}</p>
                      {state.output && (
                        <p className="text-xs mt-2 font-mono">{state.output.metadata.linesOfCode} lines</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-mono">Quick Stats</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Lines</p>
                  <p className="text-2xl font-bold">
                    {projects.reduce((sum, p) => {
                      return sum + 
                        p.results.database.split('\n').length +
                        p.results.backend.split('\n').length +
                        p.results.frontend.split('\n').length +
                        p.results.devops.split('\n').length;
                    }, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold">{loading ? '⟳' : '✓'}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Project Setup Tab */}
          <TabsContent value="project" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-mono">API Configuration</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="api-key" className="text-sm font-medium">
                    DeepSeek API Key
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-2 font-mono text-sm"
                  />
                  {apiKey.trim() && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      API key configured
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-mono">Project Requirements</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-title" className="text-sm font-medium">
                    Project Title
                  </Label>
                  <Input
                    id="project-title"
                    placeholder="e.g., E-commerce Platform"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="project-description" className="text-sm font-medium">
                    Project Description
                  </Label>
                  <Textarea
                    id="project-description"
                    placeholder="Describe your project in detail..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="mt-2 font-mono text-sm min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="requirements" className="text-sm font-medium">
                    Specific Requirements (optional)
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="List specific features, constraints, or requirements..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="mt-2 font-mono text-sm min-h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="tech-stack" className="text-sm font-medium">
                    Preferred Tech Stack (optional)
                  </Label>
                  <Input
                    id="tech-stack"
                    placeholder="e.g., React, Node.js, PostgreSQL, Docker"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateProject}
                  disabled={loading || !apiKey.trim() || !projectTitle.trim() || !projectDescription.trim()}
                  className="w-full bg-accent hover:bg-blue-700 text-white font-medium"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Orchestrating Specialists...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Project
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {specialists.database.output && (
              <Card className="p-4 bg-muted">
                <div className="flex gap-3">
                  <Button onClick={handleExportProject} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export as ZIP
                  </Button>
                </div>
              </Card>
            )}

            {(Object.entries(SPECIALISTS) as [SpecialistRole, typeof SPECIALISTS['database']][]).map(([role, specialist]) => {
              const state = specialists[role];
              const Icon = specialist.icon;
              return (
                <Card key={role} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold font-mono">{specialist.name}</h3>
                        <p className="text-xs text-muted-foreground">{specialist.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(state.status)}
                      <span className="text-xs font-medium capitalize">{state.status}</span>
                    </div>
                  </div>

                  {state.output && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-mono">{state.output.metadata.linesOfCode} lines</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{state.output.metadata.complexity} complexity</span>
                        </div>
                        <Button
                          onClick={() => handleCopyOutput(role)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-sm border border-border overflow-x-auto text-sm font-mono text-foreground max-h-96 overflow-y-auto">
                        <code>{state.output.code}</code>
                      </pre>
                    </>
                  )}

                  {state.status === 'pending' && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Waiting for orchestration...</p>
                    </div>
                  )}

                  {state.status === 'processing' && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin">
                        <Clock className="w-6 h-6 text-accent" />
                      </div>
                      <p className="text-muted-foreground mt-2">Processing...</p>
                    </div>
                  )}

                  {state.status === 'failed' && (
                    <div className="text-center py-8 text-red-600">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                      <p>{state.error || 'Failed to generate output'}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {projects.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet. Create your first project to see it here!</p>
              </Card>
            ) : (
              projects.map(project => (
                <Card key={project.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(project.timestamp)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDeleteProject(project.id)}
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
