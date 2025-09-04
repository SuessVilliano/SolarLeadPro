import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Settings,
  Phone,
  Mail,
  MapPin,
  Shield,
  BarChart3,
  FileSpreadsheet
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
  calculations?: any[];
  consultations?: any[];
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalLeads: number;
  totalRevenue: number;
  activeProjects: number;
  conversionRate: number;
  leadsThisMonth: number;
  revenueThisMonth: number;
}

export default function AdminDashboard() {
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    refetchInterval: 10000, // Refresh every 10 seconds for admin
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/admin/stats'],
  });

  const exportToSheetsMutation = useMutation({
    mutationFn: async (leadData: Lead) => {
      const response = await apiRequest('POST', '/api/admin/export-to-sheets', leadData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Export Successful',
        description: 'Lead data has been sent to Google Sheets.',
      });
    },
    onError: () => {
      toast({
        title: 'Export Failed',
        description: 'Could not send data to Google Sheets. Check webhook configuration.',
        variant: 'destructive',
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User Updated',
        description: 'User role has been updated successfully.',
      });
    },
  });

  // Calculate stats from leads if API stats not available
  const calculatedStats = React.useMemo(() => {
    if (!leads) return null;
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const leadsThisMonth = leads.filter(lead => 
      new Date(lead.createdAt) >= thisMonth
    ).length;
    
    const totalRevenue = leads.reduce((sum, lead) => {
      const calculations = lead.calculations || [];
      return sum + calculations.reduce((calcSum, calc) => 
        calcSum + parseFloat(calc.twentyYearSavings || '0'), 0
      );
    }, 0);

    return {
      totalLeads: leads.length,
      leadsThisMonth,
      totalRevenue,
      activeProjects: leads.filter(lead => lead.consultations?.length).length,
      conversionRate: leads.length ? 
        (leads.filter(lead => lead.consultations?.length).length / leads.length) * 100 : 0,
      revenueThisMonth: totalRevenue * 0.3, // Estimate
    };
  }, [leads]);

  const displayStats = stats || calculatedStats;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'rep': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLeadData = (lead: Lead) => {
    const csvData = [
      ['Name', 'Email', 'Phone', 'Address', 'Monthly Bill', 'Home Size', 'Roof Type', 'Source', 'Status', 'Date'],
      [
        `${lead.firstName} ${lead.lastName}`,
        lead.email,
        lead.phone,
        lead.address || '',
        lead.monthlyBill || '',
        lead.homeSize?.toString() || '',
        lead.roofType || '',
        lead.leadSource || '',
        lead.status || '',
        new Date(lead.createdAt).toLocaleDateString()
      ]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${lead.id}-${lead.firstName}-${lead.lastName}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor leads, manage users, and track business performance</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            Administrator
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {displayStats?.leadsThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(displayStats?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total potential value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats?.activeProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(displayStats?.conversionRate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Lead to consultation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(user => user.isActive).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total users: {users?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(displayStats?.revenueThisMonth || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {displayStats?.leadsThisMonth || 0} new leads
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Leads</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (leads && leads.length > 0) {
                        const csvData = [
                          ['ID', 'Name', 'Email', 'Phone', 'Address', 'Monthly Bill', 'Home Size', 'Source', 'Status', 'Date'],
                          ...leads.map(lead => [
                            lead.id.toString(),
                            `${lead.firstName} ${lead.lastName}`,
                            lead.email,
                            lead.phone,
                            lead.address || '',
                            lead.monthlyBill || '',
                            lead.homeSize?.toString() || '',
                            lead.leadSource || '',
                            lead.status || '',
                            new Date(lead.createdAt).toLocaleDateString()
                          ])
                        ];
                        
                        const csvContent = csvData.map(row => row.join(',')).join('\\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `all-leads-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
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
                                Lead #{lead.id}: {lead.firstName} {lead.lastName}
                              </h3>
                              <Badge className={getStatusColor(lead.status || 'new')}>
                                {lead.status || 'new'}
                              </Badge>
                              <Badge variant="outline">
                                {lead.leadSource || 'website'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
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
                            
                            <div className="flex items-center space-x-6 text-sm">
                              {lead.monthlyBill && (
                                <span><strong>Bill:</strong> ${lead.monthlyBill}</span>
                              )}
                              {lead.homeSize && (
                                <span><strong>Home:</strong> {lead.homeSize} sq ft</span>
                              )}
                              {lead.roofType && (
                                <span><strong>Roof:</strong> {lead.roofType}</span>
                              )}
                              <span><strong>Submitted:</strong> {new Date(lead.createdAt).toLocaleDateString()}</span>
                            </div>

                            {lead.calculations && lead.calculations.length > 0 && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                <strong>Solar Calculation:</strong> Est. ${lead.calculations[0].monthlySavings}/month savings
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportLeadData(lead)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportToSheetsMutation.mutate(lead)}
                            >
                              <FileSpreadsheet className="w-4 h-4 mr-1" />
                              To Sheets
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
                    <p className="text-gray-600">Leads from your website will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div>Loading users...</div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getStatusColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Created: {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(newRole) => 
                            updateUserRoleMutation.mutate({ userId: user.id, role: newRole })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="rep">Rep</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                    <p className="text-gray-600">Users will appear here as they register.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    Detailed analytics and reporting features will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Google Sheets Integration</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Configure webhook URL to automatically send lead data to Google Sheets.
                    </p>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="https://hooks.zapier.com/hooks/catch/..." 
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      />
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Email Notifications</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Current status: {process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Push Lap Tracking</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Affiliate tracking status: {process.env.PUSHLAP_API_KEY ? '✅ Active' : '❌ Setup required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}