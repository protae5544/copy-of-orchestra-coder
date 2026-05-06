import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, Users, GitBranch, Database, Server, Copy, CheckCircle, Clock, AlertTriangle, Download, Trash2, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateCoordinatorPrompt,
  generateSpecialistPrompts,
  validateSpecialistOutput,
  calculateLinesOfCode,
  determineComplexity,
  extractDependencies,
  type ProjectContext,
  type SpecialistRole
} from '@/lib/orchestrator';
import { generateMockResults } from '@/lib/mockData';
import { saveProjectResult, getAllProjects, deleteProject, exportProjectAsFiles, formatDate, type ProjectResult } from '@/lib/storage';
import { downloadFile, downloadFilesAsZip, copyToClipboard, generateMarkdownDoc } from '@/lib/export';

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface SpecialistOutput {
  role: SpecialistRole;
  status: TaskStatus;
  output: string;
  metadata: {
    lines_of_code: number;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
  };
}

const SPECIALISTS = {
  frontend: {
    name: 'Frontend Specialist',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    description: 'UI/UX, React, Vue, Angular, responsive design'
  },
  backend: {
    name: 'Backend Specialist',
    icon: Server,
    color: 'bg-green-100 text-green-700',
    description: 'APIs, business logic, authentication, security'
  },
  devops: {
    name: 'DevOps Specialist',
    icon: GitBranch,
    color: 'bg-purple-100 text-purple-700',
    description: 'Infrastructure, CI/CD, deployment, monitoring'
  },
  database: {
    name: 'Database Specialist',
    icon: Database,
    color: 'bg-orange-100 text-orange-700',
    description: 'Schema design, optimization, migrations'
  }
};

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [techStack, setTechStack] = useState('');
  const [loading, setLoading] = useState(false);
  const [useDemo, setUseDemo] = useState(false);
  const [outputs, setOutputs] = useState<Record<SpecialistRole, SpecialistOutput>>({
    frontend: { role: 'frontend', status: 'pending', output: '', metadata: { lines_of_code: 0, complexity: 'low', dependencies: [] } },
    backend: { role: 'backend', status: 'pending', output: '', metadata: { lines_of_code: 0, complexity: 'low', dependencies: [] } },
    devops: { role: 'devops', status: 'pending', output: '', metadata: { lines_of_code: 0, complexity: 'low', dependencies: [] } },
    database: { role: 'database', status: 'pending', output: '', metadata: { lines_of_code: 0, complexity: 'low', dependencies: [] } }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<ProjectResult[]>(getAllProjects());

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    setApiKeyValid(value.trim().length > 0);
  };

  const callDeepSeekAPI = useCallback(async (systemPrompt: string, userPrompt: string) => {
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
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }, [apiKey]);

  const handleGenerateProject = async () => {
    if (!useDemo && !apiKey.trim()) {
      toast.error('Please enter your DeepSeek API key or use Demo Mode');
      return;
    }

    if (!projectTitle.trim() || !projectDescription.trim()) {
      toast.error('Please enter project title and description');
      return;
    }

    setLoading(true);
    
    const newOutputs = { ...outputs };
    (Object.keys(SPECIALISTS) as SpecialistRole[]).forEach(role => {
      newOutputs[role].status = 'processing';
      newOutputs[role].output = '';
    });
    setOutputs(newOutputs);

    try {
      let results: Record<SpecialistRole, SpecialistOutput>;

      if (useDemo) {
        // Use mock data for demo
        toast.info('Using Demo Mode with sample code...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
        const mockResults = generateMockResults();
        results = mockResults as Record<SpecialistRole, SpecialistOutput>;
      } else {
        // Use real API
        const projectContext: ProjectContext = {
          title: projectTitle,
          description: projectDescription,
          requirements,
          techStack
        };

        const coordinatorPrompt = generateCoordinatorPrompt(projectContext);
        toast.info('Coordinator analyzing project...');
        
        const taskBreakdown = await callDeepSeekAPI(
          'You are an expert project coordinator. Analyze requirements and create detailed task breakdowns for specialized teams.',
          coordinatorPrompt
        );

        const specialists = ['frontend', 'backend', 'devops', 'database'] as const;
        const specialistPromptsMap = generateSpecialistPrompts(projectContext, taskBreakdown);

        toast.info('Specialists processing tasks...');

        const specialistResponses = await Promise.all(
          specialists.map(role =>
            callDeepSeekAPI(
              specialistPromptsMap[role].systemPrompt,
              specialistPromptsMap[role].userPrompt
            ).catch(error => {
              console.error(`${role} specialist error:`, error);
              return null;
            })
          )
        );

        results = {} as Record<SpecialistRole, SpecialistOutput>;
        for (let i = 0; i < specialists.length; i++) {
          const output = specialistResponses[i];
          const role = specialists[i] as SpecialistRole;

          if (!output) {
            results[role] = {
              role,
              status: 'failed',
              output: '',
              metadata: { lines_of_code: 0, complexity: 'low', dependencies: [] }
            };
            continue;
          }

          const validation = validateSpecialistOutput(role, output);
          results[role] = {
            role,
            status: validation.valid ? 'completed' : 'completed',
            output,
            metadata: {
              lines_of_code: calculateLinesOfCode(output),
              complexity: determineComplexity(output),
              dependencies: extractDependencies(output)
            }
          };
        }
      }

      setOutputs(results);

      // Save to storage
      const savedProject = saveProjectResult({
        title: projectTitle,
        description: projectDescription,
        results: {
          frontend: results.frontend.output,
          backend: results.backend.output,
          devops: results.devops.output,
          database: results.database.output
        },
        metadata: {
          requirements,
          techStack
        }
      });

      setProjects(getAllProjects());
      toast.success('Project generation completed!');
      setActiveTab('results');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate project. Please try again.');
      
      (Object.keys(SPECIALISTS) as SpecialistRole[]).forEach(role => {
        newOutputs[role].status = 'failed';
      });
      setOutputs(newOutputs);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOutput = async (role: SpecialistRole) => {
    if (outputs[role].output) {
      const success = await copyToClipboard(outputs[role].output);
      if (success) {
        toast.success(`${SPECIALISTS[role].name} output copied!`);
      }
    }
  };

  const handleExportProject = async () => {
    const files = exportProjectAsFiles(projects[0]?.id);
    if (files) {
      await downloadFilesAsZip(files, projectTitle || 'orchestra-project');
      toast.success('Project exported as ZIP!');
    }
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownDoc(projectTitle, projectDescription, {
      frontend: outputs.frontend.output,
      backend: outputs.backend.output,
      devops: outputs.devops.output,
      database: outputs.database.output
    });
    downloadFile(markdown, `${projectTitle || 'project'}.md`, 'text/markdown');
    toast.success('Documentation downloaded!');
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
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold tracking-tight font-mono">Orchestra Coder</h1>
          <p className="text-sm text-muted-foreground mt-2">Professional code generation with specialist role orchestration</p>
        </div>
      </header>

      {/* Main Content */}
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
              <h2 className="text-lg font-semibold mb-4 font-mono">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(SPECIALISTS) as [SpecialistRole, typeof SPECIALISTS['frontend']][]).map(([role, specialist]) => {
                  const Icon = specialist.icon;
                  const output = outputs[role];
                  return (
                    <div key={role} className={`p-4 rounded-lg border border-border ${specialist.color}`}>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="w-6 h-6" />
                        {getStatusIcon(output.status)}
                      </div>
                      <h3 className="font-semibold text-sm">{specialist.name}</h3>
                      <p className="text-xs opacity-75 mt-1">{specialist.description}</p>
                      {output.status === 'completed' && (
                        <p className="text-xs mt-2 font-mono">{output.metadata.lines_of_code} lines</p>
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
                        p.results.frontend.split('\n').length +
                        p.results.backend.split('\n').length +
                        p.results.devops.split('\n').length +
                        p.results.database.split('\n').length;
                    }, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Demo Mode</p>
                  <p className="text-2xl font-bold">{useDemo ? '✓' : '✗'}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Project Setup Tab */}
          <TabsContent value="project" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-mono">API Configuration</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="demo-mode"
                    checked={useDemo}
                    onChange={(e) => setUseDemo(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
                    Use Demo Mode (with sample code)
                  </Label>
                </div>

                {!useDemo && (
                  <div>
                    <Label htmlFor="api-key" className="text-sm font-medium">
                      DeepSeek API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      className="mt-2 input-minimal font-mono text-sm"
                    />
                    {apiKeyValid && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        API key configured
                      </p>
                    )}
                  </div>
                )}
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
                    className="mt-2 input-minimal"
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
                    className="mt-2 input-minimal font-mono text-sm min-h-24"
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
                    className="mt-2 input-minimal font-mono text-sm min-h-20"
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
                    className="mt-2 input-minimal font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateProject}
                  disabled={loading || (!useDemo && !apiKeyValid) || !projectTitle.trim() || !projectDescription.trim()}
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
            {outputs.frontend.output && (
              <Card className="p-4 bg-muted">
                <div className="flex gap-3">
                  <Button onClick={handleExportProject} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export as ZIP
                  </Button>
                  <Button onClick={handleDownloadMarkdown} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Markdown
                  </Button>
                </div>
              </Card>
            )}

            {(Object.entries(SPECIALISTS) as [SpecialistRole, typeof SPECIALISTS['frontend']][]).map(([role, specialist]) => {
              const output = outputs[role];
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
                      {getStatusIcon(output.status)}
                      <span className="text-xs font-medium capitalize">{output.status}</span>
                    </div>
                  </div>

                  {output.output && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-mono">{output.metadata.lines_of_code} lines</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{output.metadata.complexity} complexity</span>
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
                        <code>{output.output}</code>
                      </pre>
                    </>
                  )}

                  {output.status === 'pending' && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Waiting for project generation...</p>
                    </div>
                  )}

                  {output.status === 'processing' && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin">
                        <Clock className="w-6 h-6 text-accent" />
                      </div>
                      <p className="text-muted-foreground mt-2">Processing...</p>
                    </div>
                  )}

                  {output.status === 'failed' && (
                    <div className="text-center py-8 text-red-600">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                      <p>Failed to generate output</p>
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
