import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  FileText, 
  MessageCircle, 
  DollarSign, 
  Calendar,
  Download,
  Zap,
  Sun
} from 'lucide-react';
import InstallationProgress from '@/components/installation-progress';

interface Project {
  id: number;
  projectName: string;
  systemSize?: string;
  estimatedValue?: number;
  installationStatus: string;
  installationProgress: number;
  expectedCompletionDate?: string;
  contracts?: Contract[];
  messages?: Message[];
}

interface Contract {
  id: number;
  contractType: string;
  status: string;
  totalAmount?: number;
  signedDate?: string;
  documentUrl?: string;
}

interface Message {
  id: number;
  subject?: string;
  message: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
}

export default function ClientDashboard() {
  // Mock user ID - in real app this would come from auth context
  const clientId = 1;

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects/client/${clientId}`],
    enabled: !!clientId,
  });

  const activeProject = projects?.[0]; // Show first project for now

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading your solar dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Solar Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your solar installation progress and manage your account</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Sun className="w-4 h-4 mr-2" />
            Solar Customer
          </Badge>
        </div>

        {activeProject ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Project Status</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {activeProject.installationStatus}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeProject.installationProgress}% Complete
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Size</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {activeProject.systemSize || 'TBD'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solar system capacity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investment</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {activeProject.estimatedValue 
                        ? `$${activeProject.estimatedValue.toLocaleString()}`
                        : 'TBD'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Project value
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {activeProject.expectedCompletionDate 
                        ? new Date(activeProject.expectedCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'TBD'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expected date
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{activeProject.projectName}</h3>
                      <p className="text-gray-600 mt-1">
                        Your solar installation is currently in the <span className="font-medium capitalize">
                        {activeProject.installationStatus}</span> phase.
                      </p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Rep
                      </Button>
                      <Button variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Visit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <InstallationProgress
                projectId={activeProject.id}
                currentStatus={activeProject.installationStatus}
                progress={activeProject.installationProgress}
                estimatedCompletion={activeProject.expectedCompletionDate}
              />
            </TabsContent>

            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle>Contracts & Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProject.contracts && activeProject.contracts.length > 0 ? (
                    <div className="space-y-4">
                      {activeProject.contracts.map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium capitalize">{contract.contractType} Agreement</h4>
                            <p className="text-sm text-gray-600">
                              Status: <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'}>
                                {contract.status}
                              </Badge>
                            </p>
                            {contract.totalAmount && (
                              <p className="text-sm text-gray-600 mt-1">
                                Amount: ${contract.totalAmount.toLocaleString()}
                              </p>
                            )}
                            {contract.signedDate && (
                              <p className="text-sm text-gray-600">
                                Signed: {new Date(contract.signedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {contract.documentUrl && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
                      <p className="text-gray-600">
                        Contracts will appear here once your project moves to the agreement phase.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Messages & Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProject.messages && activeProject.messages.length > 0 ? (
                    <div className="space-y-4">
                      {activeProject.messages.map((message) => (
                        <div key={message.id} className={`p-4 border rounded-lg ${
                          !message.isRead ? 'bg-blue-50 border-blue-200' : ''
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{message.subject || 'Project Update'}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{message.message}</p>
                          {!message.isRead && (
                            <Badge variant="default" className="mt-2">New</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-600">
                        Communication with your solar rep will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sun className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to LIV8Solar</h3>
                <p className="text-gray-600 mb-6">
                  Your solar project dashboard will appear here once your installation begins.
                </p>
                <Button>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}