import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, DollarSign, Home, Zap } from "lucide-react";

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
  energyGoals?: string;
  leadSource?: string;
  status?: string;
  createdAt: string;
  calculations?: any[];
  consultations?: any[];
}

export default function Admin() {
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading leads...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">LIV8Solar Lead Dashboard</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {leads?.length || 0} Total Leads
          </Badge>
        </div>

        <div className="grid gap-6">
          {leads?.map((lead) => (
            <Card key={lead.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {lead.firstName} {lead.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Lead #{lead.id}</span>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                        {lead.status || 'new'}
                      </Badge>
                      <span>Source: {lead.leadSource || 'website'}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>Submitted: {new Date(lead.createdAt).toLocaleDateString()}</div>
                    <div>{new Date(lead.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Contact Info</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                          {lead.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </div>
                      {lead.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-sm">{lead.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Property Details</h4>
                    <div className="space-y-2">
                      {lead.monthlyBill && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Monthly Bill: ${lead.monthlyBill}</span>
                        </div>
                      )}
                      {lead.homeSize && (
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Home Size: {lead.homeSize} sq ft</span>
                        </div>
                      )}
                      {lead.roofType && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Roof Type: {lead.roofType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Energy Goals */}
                  {lead.energyGoals && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Energy Goals</h4>
                      <p className="text-sm text-gray-700">{lead.energyGoals}</p>
                    </div>
                  )}
                </div>

                {/* Solar Calculations */}
                {lead.calculations && lead.calculations.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Solar Calculations</h4>
                    {lead.calculations.map((calc) => (
                      <div key={calc.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Monthly Savings:</span>
                          <div className="font-semibold text-green-600">${calc.monthlySavings}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Year 1 Savings:</span>
                          <div className="font-semibold text-green-600">${calc.yearOneSavings}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">20-Year Savings:</span>
                          <div className="font-semibold text-green-600">${calc.twentyYearSavings}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">System Size:</span>
                          <div className="font-semibold">{calc.systemSize}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Consultations */}
                {lead.consultations && lead.consultations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Consultations</h4>
                    {lead.consultations.map((consultation) => (
                      <div key={consultation.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Status: {consultation.status || 'scheduled'}</span>
                          {consultation.scheduledDate && (
                            <span>• Scheduled: {new Date(consultation.scheduledDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {consultation.notes && (
                          <p className="mt-2 text-gray-700">{consultation.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button size="sm" className="bg-solar-teal hover:bg-teal-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Lead
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline">
                    Mark as Contacted
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!leads || leads.length === 0) && (
          <Card className="text-center p-12">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">No leads yet</h3>
              <p className="text-gray-600">New leads will appear here as they submit forms on your website.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}