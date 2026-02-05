import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Send, Upload, Sun, ExternalLink, MapPin, Zap, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { trackFormSubmission } from "@/lib/referralTracking";

const calculatorSchema = z.object({
  monthlyBill: z.string().min(1, "Monthly bill is required"),
  homeSize: z.string().min(1, "Home size is required"),
  roofType: z.string().min(1, "Roof type is required"),
  address: z.string().optional(),
});

const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Address is required"),
  energyGoals: z.string().optional(),
});

type CalculatorData = z.infer<typeof calculatorSchema>;
type LeadFormData = z.infer<typeof leadFormSchema>;

interface SolarInsights {
  address: string;
  latitude: number;
  longitude: number;
  imageryQuality: string;
  maxPanelCount: number;
  maxArrayAreaSqFt: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  carbonOffsetFactorKgPerMwh: number;
  roofSegments: number;
  recommendedSystemSizeKw: number;
  yearlyEnergyProductionKwh: number;
  financialAnalysis: {
    monthlyBillAmount: number;
    federalIncentive: number;
    stateIncentive: number;
    solarPercentage: number;
    netMeteringAllowed: boolean;
    cashPurchase?: {
      upfrontCost: number;
      paybackYears: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
    financing?: {
      annualLoanPayment: number;
      loanInterestRate: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
    leasing?: {
      annualLeasingCost: number;
      savingsYear1: number;
      savingsYear20: number;
      savingsLifetime: number;
    };
  } | null;
  sunroofUrl: string;
}

export default function SolarCalculator() {
  const [showResults, setShowResults] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [solarInsights, setSolarInsights] = useState<SolarInsights | null>(null);
  const { toast } = useToast();

  // Check if Google Solar API is available
  const { data: solarStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/solar-insights/status'],
  });

  const calculatorForm = useForm<CalculatorData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      monthlyBill: "",
      homeSize: "",
      roofType: "",
      address: "",
    },
  });

  const leadForm = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      energyGoals: "",
    },
  });

  // Google Solar API mutation for real building data
  const solarInsightsMutation = useMutation({
    mutationFn: async (data: { address: string; monthlyBill: number }) => {
      const response = await apiRequest("POST", "/api/solar-insights/bill-match", data);
      return response.json();
    },
    onSuccess: (data: SolarInsights) => {
      setSolarInsights(data);
    },
    onError: () => {
      // Silently fail - we still have our basic calculation
      setSolarInsights(null);
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorData) => {
      const response = await apiRequest("POST", "/api/solar-calculations", {
        monthlyBill: data.monthlyBill,
        homeSize: parseInt(data.homeSize),
        roofType: data.roofType,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setCalculationResults(data);
      setShowResults(true);
      toast({
        title: "Calculation Complete!",
        description: "Your solar savings estimate is ready.",
      });

      // If address provided and Google Solar is configured, fetch real data
      const address = variables.address || leadForm.getValues("address");
      if (address && solarStatus?.configured) {
        solarInsightsMutation.mutate({
          address,
          monthlyBill: parseFloat(variables.monthlyBill),
        });
      }
    },
    onError: () => {
      toast({
        title: "Calculation Failed",
        description: "Please try again or contact us for assistance.",
        variant: "destructive",
      });
    },
  });

  const leadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await apiRequest("POST", "/api/leads", {
        ...data,
        leadSource: "calculator",
        monthlyBill: calculatorForm.getValues("monthlyBill"),
        homeSize: parseInt(calculatorForm.getValues("homeSize") || "0"),
        roofType: calculatorForm.getValues("roofType"),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Design Request Submitted!",
        description: "We'll contact you within 24 hours with your custom solar design.",
      });
      leadForm.reset();
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly at 813-441-9686.",
        variant: "destructive",
      });
    },
  });

  const onCalculate = (data: CalculatorData) => {
    calculateMutation.mutate(data);
  };

  const onSubmitLead = (data: LeadFormData) => {
    // Track form submission for affiliate referrals
    trackFormSubmission('calculator_lead', data);
    leadMutation.mutate(data);

    // Also try to get solar insights when lead submits with address
    if (data.address && solarStatus?.configured && !solarInsights) {
      const monthlyBill = parseFloat(calculatorForm.getValues("monthlyBill") || "0");
      if (monthlyBill > 0) {
        solarInsightsMutation.mutate({ address: data.address, monthlyBill });
      }
    }
  };

  return (
    <section id="calculator" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl text-gray-900 mb-6">
            Solar Savings Calculator
          </h2>
          <p className="text-xl text-gray-600">
            See how much you could save with solar + get your free custom design
          </p>
          {solarStatus?.configured && (
            <p className="text-sm text-solar-teal mt-2 flex items-center justify-center gap-1">
              <Sun className="w-4 h-4" />
              Powered by Google Solar API for accurate roof-level data
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Calculator Section */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-poppins">
                Calculate Your Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...calculatorForm}>
                <form onSubmit={calculatorForm.handleSubmit(onCalculate)} className="space-y-6">
                  <FormField
                    control={calculatorForm.control}
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Electric Bill</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <Input
                              {...field}
                              type="number"
                              placeholder="150"
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={calculatorForm.control}
                    name="homeSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Size (sq ft)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="2000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={calculatorForm.control}
                    name="roofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select roof type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asphalt">Asphalt Shingle</SelectItem>
                            <SelectItem value="metal">Metal</SelectItem>
                            <SelectItem value="tile">Tile</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {solarStatus?.configured && (
                    <FormField
                      control={calculatorForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Address (for satellite analysis)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <Input
                                {...field}
                                placeholder="123 Main St, Tampa, FL 33601"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Enter your address for Google satellite roof analysis
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-solar-teal hover:bg-teal-700 text-white"
                    disabled={calculateMutation.isPending || solarInsightsMutation.isPending}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    {calculateMutation.isPending || solarInsightsMutation.isPending
                      ? "Analyzing..."
                      : "Calculate My Savings"}
                  </Button>
                </form>
              </Form>

              {/* Results Display */}
              {showResults && calculationResults && (
                <Card className="mt-8 bg-gradient-to-r from-solar-blue to-solar-teal border-2 border-solar-turquoise">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-xl bg-black/30 px-4 py-2 rounded-lg">Your Solar Savings Estimate</h3>
                      <p className="text-white font-medium bg-black/20 px-3 py-1 rounded">Based on your inputs, here's what you could save:</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div className="bg-black/40 backdrop-blur rounded-lg p-4 border border-solar-turquoise/50">
                        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                          ${solarInsights?.financialAnalysis?.cashPurchase?.savingsYear1
                            ? Math.round(solarInsights.financialAnalysis.cashPurchase.savingsYear1 / 12).toLocaleString()
                            : calculationResults.monthlySavings}
                        </div>
                        <div className="text-sm font-medium text-solar-turquoise bg-black/20 px-2 py-1 rounded">Monthly Savings</div>
                      </div>
                      <div className="bg-black/40 backdrop-blur rounded-lg p-4 border border-solar-turquoise/50">
                        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                          ${solarInsights?.financialAnalysis?.cashPurchase?.savingsYear1
                            ? solarInsights.financialAnalysis.cashPurchase.savingsYear1.toLocaleString()
                            : calculationResults.yearOneSavings}
                        </div>
                        <div className="text-sm font-medium text-solar-turquoise bg-black/20 px-2 py-1 rounded">First Year Savings</div>
                      </div>
                      <div className="bg-black/40 backdrop-blur rounded-lg p-4 border border-solar-turquoise/50">
                        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                          ${solarInsights?.financialAnalysis?.cashPurchase?.savingsYear20
                            ? solarInsights.financialAnalysis.cashPurchase.savingsYear20.toLocaleString()
                            : calculationResults.twentyYearSavings}
                        </div>
                        <div className="text-sm font-medium text-solar-turquoise bg-black/20 px-2 py-1 rounded">20-Year Savings</div>
                      </div>
                      <div className="bg-black/40 backdrop-blur rounded-lg p-4 border border-solar-turquoise/50">
                        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                          {solarInsights
                            ? `${solarInsights.recommendedSystemSizeKw}kW`
                            : calculationResults.systemSize}
                        </div>
                        <div className="text-sm font-medium text-solar-turquoise bg-black/20 px-2 py-1 rounded">Recommended Size</div>
                      </div>
                    </div>

                    {/* Google Solar Insights - Enhanced Data */}
                    {solarInsights && (
                      <div className="mt-6 space-y-4">
                        <div className="bg-black/30 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Sun className="w-5 h-5 text-yellow-400" />
                            Google Satellite Roof Analysis
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-white/10 rounded p-2">
                              <div className="text-solar-turquoise font-medium">{solarInsights.maxPanelCount}</div>
                              <div className="text-white/80">Max Panels</div>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                              <div className="text-solar-turquoise font-medium">{solarInsights.maxArrayAreaSqFt.toLocaleString()} sq ft</div>
                              <div className="text-white/80">Usable Roof</div>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                              <div className="text-solar-turquoise font-medium">{solarInsights.maxSunshineHoursPerYear.toLocaleString()} hrs</div>
                              <div className="text-white/80">Sunshine/Year</div>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                              <div className="text-solar-turquoise font-medium">{solarInsights.yearlyEnergyProductionKwh.toLocaleString()} kWh</div>
                              <div className="text-white/80">Annual Production</div>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                              <div className="text-solar-turquoise font-medium">{solarInsights.roofSegments}</div>
                              <div className="text-white/80">Roof Segments</div>
                            </div>
                            {solarInsights.financialAnalysis && (
                              <div className="bg-white/10 rounded p-2">
                                <div className="text-solar-turquoise font-medium">
                                  {Math.round(solarInsights.financialAnalysis.solarPercentage)}%
                                </div>
                                <div className="text-white/80">Energy Offset</div>
                              </div>
                            )}
                          </div>

                          {/* Financial Details */}
                          {solarInsights.financialAnalysis && (
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              {solarInsights.financialAnalysis.federalIncentive > 0 && (
                                <div className="bg-green-500/20 rounded p-2">
                                  <div className="text-green-300 font-medium">
                                    ${solarInsights.financialAnalysis.federalIncentive.toLocaleString()}
                                  </div>
                                  <div className="text-white/80">Federal Tax Credit</div>
                                </div>
                              )}
                              {solarInsights.financialAnalysis.cashPurchase && (
                                <div className="bg-green-500/20 rounded p-2">
                                  <div className="text-green-300 font-medium">
                                    {solarInsights.financialAnalysis.cashPurchase.paybackYears} years
                                  </div>
                                  <div className="text-white/80">Payback Period</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Google Sunroof Link */}
                        <a
                          href={solarInsights.sunroofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-3 text-white font-medium"
                        >
                          <Leaf className="w-5 h-5" />
                          View Your Roof on Google Project Sunroof
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {solarInsightsMutation.isPending && (
                      <div className="mt-4 text-center text-white/80 text-sm animate-pulse">
                        Analyzing your roof with Google satellite data...
                      </div>
                    )}

                    <div className="mt-6 text-center">
                      <p className="text-white font-medium">Ready to start saving? Get your free consultation below!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-poppins">
                Get Your Free Custom Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...leadForm}>
                <form onSubmit={leadForm.handleSubmit(onSubmitLead)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={leadForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={leadForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Smith" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={leadForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Solar Street, Tampa, FL 33601" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="energyGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Energy Goals (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about your energy goals..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-solar-teal transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-600">
                      Drag & drop your utility bill here or{" "}
                      <span className="text-solar-teal font-semibold cursor-pointer">
                        browse files
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      PDF, JPG, PNG - Max 5MB
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-solar-orange hover:bg-yellow-500 text-white"
                    disabled={leadMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {leadMutation.isPending ? "Submitting..." : "Get My Free Design Now"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting, you agree to receive marketing communications.
                    Your information is secure and never shared.
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Google Sunroof Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto shadow-lg bg-gradient-to-r from-solar-blue/5 to-solar-teal/5 border-solar-teal/20">
            <CardContent className="p-8">
              <Sun className="w-12 h-12 text-solar-teal mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-poppins">
                Explore Your Roof's Solar Potential
              </h3>
              <p className="text-gray-600 mb-6">
                Use Google's Project Sunroof to see a satellite view of your roof
                and get an independent estimate of your home's solar energy potential.
              </p>
              <a
                href="https://sunroof.withgoogle.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-solar-teal text-solar-teal hover:bg-solar-teal hover:text-white"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Visit Google Project Sunroof
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <p className="text-xs text-gray-500 mt-3">
                Powered by Google Maps satellite imagery
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
