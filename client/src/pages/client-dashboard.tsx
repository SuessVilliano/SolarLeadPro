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
  Sun,
  Battery,
  ExternalLink,
  Cpu,
  BarChart3,
  Leaf,
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
  openSolarProjectId?: string;
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

interface OpenSolarSummary {
  project: any;
  systems: Array<{
    uuid: string;
    id: number;
    name: string;
    kw_stc: number;
    output_annual_kwh: number;
    consumption_offset_percentage: number;
    module_quantity: number;
    battery_total_kwh: number;
    price_including_tax: number;
    price_excluding_tax: number;
    modules: Array<{ manufacturer_name: string; code: string; quantity: number }>;
    inverters: Array<{ manufacturer_name: string; code: string; quantity: number; max_power_rating: number }>;
    batteries: Array<{ manufacturer_name: string; code: string; quantity: number }>;
  }>;
  summary: {
    address: string;
    stage: number;
    systemCount: number;
    totalCapacityKw: number;
    totalPanels: number;
    totalBatteryKwh: number;
    estimatedAnnualOutput: number;
    estimatedPrice: number;
    panelManufacturers: string[];
    inverterManufacturers: string[];
    batteryManufacturers: string[];
  };
}

export default function ClientDashboard() {
  // Mock user ID - in real app this would come from auth context
  const clientId = 1;

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects/client/${clientId}`],
    enabled: !!clientId,
  });

  const activeProject = projects?.[0];

  // Fetch OpenSolar data if we have an openSolarProjectId
  const { data: openSolarData, isLoading: openSolarLoading } = useQuery<OpenSolarSummary>({
    queryKey: [`/api/opensolar/projects/${activeProject?.openSolarProjectId}/summary`],
    enabled: !!activeProject?.openSolarProjectId,
  });

  // Check OpenSolar integration status
  const { data: openSolarStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/opensolar/status'],
  });

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
            LIV8 Solar Customer
          </Badge>
        </div>

        {activeProject ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="solar-details">Solar Details</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="contracts">Documents</TabsTrigger>
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
                      {openSolarData?.summary?.totalCapacityKw
                        ? `${openSolarData.summary.totalCapacityKw}kW`
                        : activeProject.systemSize || 'TBD'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {openSolarData?.summary?.totalPanels
                        ? `${openSolarData.summary.totalPanels} panels`
                        : 'Solar system capacity'}
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
                      {openSolarData?.summary?.estimatedPrice
                        ? `$${openSolarData.summary.estimatedPrice.toLocaleString()}`
                        : activeProject.estimatedValue
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

              {/* Annual Production Card */}
              {openSolarData?.summary?.estimatedAnnualOutput > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-solar-teal" />
                      Estimated Annual Production
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-solar-teal">
                          {openSolarData.summary.estimatedAnnualOutput.toLocaleString()} kWh
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Annual Energy Production</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          ${Math.round(openSolarData.summary.estimatedAnnualOutput * 0.12).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Estimated Annual Savings</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {Math.round(openSolarData.summary.estimatedAnnualOutput * 0.000709).toLocaleString()} tons
                        </div>
                        <p className="text-sm text-gray-500 mt-1">CO2 Offset Per Year</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      {activeProject.openSolarProjectId && openSolarStatus?.configured && (
                        <p className="text-sm text-solar-teal mt-2 flex items-center gap-1">
                          <Leaf className="w-4 h-4" />
                          Connected to OpenSolar Project #{activeProject.openSolarProjectId}
                        </p>
                      )}
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

            {/* Solar Details Tab - OpenSolar Bridge */}
            <TabsContent value="solar-details">
              {openSolarData && openSolarData.systems.length > 0 ? (
                <div className="space-y-6">
                  {openSolarData.systems.map((system, index) => (
                    <Card key={system.uuid || index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Sun className="w-5 h-5 text-solar-teal" />
                            {system.name || `System Design ${index + 1}`}
                          </span>
                          <Badge variant="outline">
                            {system.kw_stc}kW
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Zap className="w-6 h-6 text-solar-teal mx-auto mb-2" />
                            <div className="text-xl font-bold">{system.kw_stc}kW</div>
                            <div className="text-sm text-gray-500">System Size</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <div className="text-xl font-bold">{system.module_quantity}</div>
                            <div className="text-sm text-gray-500">Solar Panels</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <BarChart3 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <div className="text-xl font-bold">{system.output_annual_kwh?.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">kWh/Year</div>
                          </div>
                          {system.battery_total_kwh > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <Battery className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                              <div className="text-xl font-bold">{system.battery_total_kwh}kWh</div>
                              <div className="text-sm text-gray-500">Battery Storage</div>
                            </div>
                          )}
                          {system.consumption_offset_percentage > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                              <Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" />
                              <div className="text-xl font-bold">{Math.round(system.consumption_offset_percentage)}%</div>
                              <div className="text-sm text-gray-500">Energy Offset</div>
                            </div>
                          )}
                        </div>

                        {/* Equipment Details */}
                        <div className="space-y-4">
                          {/* Panels */}
                          {system.modules && system.modules.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <Sun className="w-4 h-4 text-solar-teal" />
                                Solar Panels
                              </h4>
                              {system.modules.map((mod, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                                  <div>
                                    <span className="font-medium">{mod.manufacturer_name}</span>
                                    <span className="text-gray-500 ml-2">{mod.code}</span>
                                  </div>
                                  <Badge variant="secondary">x{mod.quantity}</Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inverters */}
                          {system.inverters && system.inverters.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <Cpu className="w-4 h-4 text-solar-teal" />
                                Inverters
                              </h4>
                              {system.inverters.map((inv, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                                  <div>
                                    <span className="font-medium">{inv.manufacturer_name}</span>
                                    <span className="text-gray-500 ml-2">{inv.code}</span>
                                    {inv.max_power_rating > 0 && (
                                      <span className="text-sm text-gray-400 ml-2">({inv.max_power_rating}W)</span>
                                    )}
                                  </div>
                                  <Badge variant="secondary">x{inv.quantity}</Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Batteries */}
                          {system.batteries && system.batteries.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <Battery className="w-4 h-4 text-blue-500" />
                                Battery Storage
                              </h4>
                              {system.batteries.map((bat, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                                  <div>
                                    <span className="font-medium">{bat.manufacturer_name}</span>
                                    <span className="text-gray-500 ml-2">{bat.code}</span>
                                  </div>
                                  <Badge variant="secondary">x{bat.quantity}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pricing */}
                        {system.price_including_tax > 0 && (
                          <div className="mt-4 bg-gradient-to-r from-solar-blue/10 to-solar-teal/10 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-lg">System Price</span>
                              <span className="text-2xl font-bold text-solar-teal">
                                ${system.price_including_tax.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Including tax and installation</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : openSolarLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-pulse">
                      <Sun className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Loading solar system details from OpenSolar...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Sun className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">Solar Details Coming Soon</h3>
                      <p className="text-gray-600 mb-4">
                        Detailed panel, inverter, and battery information will appear here
                        once your system design is finalized in OpenSolar.
                      </p>
                      {!activeProject.openSolarProjectId && (
                        <p className="text-sm text-gray-500">
                          Your project has not yet been linked to OpenSolar.
                          Your rep will set this up during the design phase.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Equipment Manufacturer Links */}
              {openSolarData?.summary && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Equipment Manufacturers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {openSolarData.summary.panelManufacturers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Panel Manufacturers</h4>
                          {openSolarData.summary.panelManufacturers.map((name) => (
                            <Badge key={name} variant="outline" className="mr-2 mb-2">
                              <Sun className="w-3 h-3 mr-1" />
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {openSolarData.summary.inverterManufacturers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Inverter Manufacturers</h4>
                          {openSolarData.summary.inverterManufacturers.map((name) => (
                            <Badge key={name} variant="outline" className="mr-2 mb-2">
                              <Cpu className="w-3 h-3 mr-1" />
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {openSolarData.summary.batteryManufacturers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Battery Manufacturers</h4>
                          {openSolarData.summary.batteryManufacturers.map((name) => (
                            <Badge key={name} variant="outline" className="mr-2 mb-2">
                              <Battery className="w-3 h-3 mr-1" />
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to LIV8 Solar</h3>
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
