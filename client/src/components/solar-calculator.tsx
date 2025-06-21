import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Send, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const calculatorSchema = z.object({
  monthlyBill: z.string().min(1, "Monthly bill is required"),
  homeSize: z.string().min(1, "Home size is required"),
  roofType: z.string().min(1, "Roof type is required"),
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

export default function SolarCalculator() {
  const [showResults, setShowResults] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const { toast } = useToast();

  const calculatorForm = useForm<CalculatorData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      monthlyBill: "",
      homeSize: "",
      roofType: "",
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

  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorData) => {
      const response = await apiRequest("POST", "/api/solar-calculations", {
        monthlyBill: data.monthlyBill,
        homeSize: parseInt(data.homeSize),
        roofType: data.roofType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCalculationResults(data);
      setShowResults(true);
      toast({
        title: "Calculation Complete!",
        description: "Your solar savings estimate is ready.",
      });
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
    leadMutation.mutate(data);
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

                  <Button
                    type="submit"
                    className="w-full bg-solar-teal hover:bg-teal-700 text-white"
                    disabled={calculateMutation.isPending}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    {calculateMutation.isPending ? "Calculating..." : "Calculate My Savings"}
                  </Button>
                </form>
              </Form>

              {/* Results Display */}
              {showResults && calculationResults && (
                <Card className="mt-8 bg-gradient-to-r from-solar-green to-teal-500 text-white">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold">
                          ${calculationResults.monthlySavings}
                        </div>
                        <div className="text-sm text-green-100">Monthly Savings</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          ${calculationResults.yearOneSavings}
                        </div>
                        <div className="text-sm text-green-100">First Year Savings</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          ${calculationResults.twentyYearSavings}
                        </div>
                        <div className="text-sm text-green-100">20-Year Savings</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {calculationResults.systemSize}
                        </div>
                        <div className="text-sm text-green-100">Recommended Size</div>
                      </div>
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
      </div>
    </section>
  );
}
