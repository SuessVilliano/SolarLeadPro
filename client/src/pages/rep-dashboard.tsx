import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  CheckSquare, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  User
} from 'lucide-react';

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  monthlyBill?: string;
  homeSize?: number;
  roofType?: string;
  leadSource?: string;
  status?: string;
  createdAt: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  leadId?: number;
  projectId?: number;
}

interface Project {
  id: number;
  projectName: string;
  clientId?: number;
  installationStatus: string;
  installationProgress: number;
  estimatedValue?: number;
  expectedCompletionDate?: string;
}

export default function RepDashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock rep ID - in real app this would come from auth context
  const repId = 1;

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/rep/${repId}`],
    enabled: !!repId,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects/rep/${repId}`],
    enabled: !!repId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const response = await apiRequest('POST', '/api/tasks', taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/rep/${repId}`] });
      setTaskDialogOpen(false);
      toast({
        title: 'Task Created',
        description: 'New task has been added to your CRM.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Create Task',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: number; updates: Partial<Project> }) => {
      const response = await apiRequest('PATCH', `/api/projects/${projectId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/rep/${repId}`] });
      toast({
        title: 'Project Updated',
        description: 'Project status has been updated.',
      });
    },
  });

  // Stats calculation
  const totalLeads = leads?.length || 0;
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
  const activeProjects = projects?.filter(project => 
    project.installationStatus !== 'completed'
  ).length || 0;
  const totalRevenue = projects?.reduce((sum, project) => 
    sum + (project.estimatedValue || 0), 0
  ) || 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Rep Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage leads, track projects, and grow your business</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <User className="w-4 h-4 mr-2" />
            Solar Rep
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                All leads assigned to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Projects in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total project value
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div>Loading leads...</div>
                ) : leads && leads.length > 0 ? (
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-lg">
                                {lead.firstName} {lead.lastName}
                              </h3>
                              <Badge className={getStatusColor(lead.status || 'new')}>
                                {lead.status || 'new'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {lead.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {lead.phone}
                              </div>
                              {lead.address && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {lead.address}
                                </div>
                              )}
                            </div>
                            
                            {lead.monthlyBill && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Monthly Bill:</span> ${lead.monthlyBill}
                                {lead.homeSize && <span className="ml-4"><span className="font-medium">Home:</span> {lead.homeSize} sq ft</span>}
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Submitted: {new Date(lead.createdAt).toLocaleDateString()} via {lead.leadSource}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                    <p className="text-gray-600">New leads will appear here as they come in.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Tasks</CardTitle>
                <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      createTaskMutation.mutate({
                        title: formData.get('title') as string,
                        description: formData.get('description') as string,
                        priority: formData.get('priority') as string,
                        repId: repId,
                      });
                    }}>
                      <div className="space-y-4">
                        <Input name="title" placeholder="Task title" required />
                        <Textarea name="description" placeholder="Task description" />
                        <Select name="priority" defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" className="w-full">
                          Create Task
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div>Loading tasks...</div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-grow">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getStatusColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-600">Create your first task to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div>Loading projects...</div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-lg">{project.projectName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(project.installationStatus)}>
                                {project.installationStatus}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {project.installationProgress}% Complete
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {project.estimatedValue && (
                              <div className="text-lg font-bold text-green-600">
                                ${project.estimatedValue.toLocaleString()}
                              </div>
                            )}
                            {project.expectedCompletionDate && (
                              <div className="text-sm text-gray-600">
                                Due: {new Date(project.expectedCompletionDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const newStatus = prompt('Update status:', project.installationStatus);
                              if (newStatus) {
                                updateProjectMutation.mutate({
                                  projectId: project.id,
                                  updates: { installationStatus: newStatus }
                                });
                              }
                            }}
                          >
                            Update Status
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
                    <p className="text-gray-600">Projects will appear here once leads convert.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                  <p className="text-gray-600">Client communication will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}