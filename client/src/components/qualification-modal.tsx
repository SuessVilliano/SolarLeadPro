import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const qualificationSchema = z.object({
  monthlyBill: z.string().min(1, "Please select your monthly bill range"),
  homeOwnership: z.string().min(1, "Please select your home ownership status"),
  creditScore: z.string().min(1, "Please select your credit score range"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Address is required"),
});

type QualificationData = z.infer<typeof qualificationSchema>;

interface QualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QualificationModal({ isOpen, onClose }: QualificationModalProps) {
  const [step, setStep] = useState(1);
  const [qualified, setQualified] = useState<boolean | null>(null);
  const { toast } = useToast();

  const form = useForm<QualificationData>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      monthlyBill: "",
      homeOwnership: "",
      creditScore: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const qualificationMutation = useMutation({
    mutationFn: async (data: QualificationData) => {
      const response = await apiRequest("POST", "/api/leads", {
        ...data,
        leadSource: "qualification",
      });
      return response.json();
    },
    onSuccess: () => {
      // Simple qualification logic
      const monthlyBill = parseInt(form.getValues("monthlyBill") || "0");
      const homeOwnership = form.getValues("homeOwnership");
      const creditScore = parseInt(form.getValues("creditScore") || "0");

      const isQualified = monthlyBill >= 100 && homeOwnership === "own" && creditScore >= 650;
      setQualified(isQualified);
      setStep(4);

      toast({
        title: isQualified ? "Congratulations!" : "Thank You",
        description: isQualified 
          ? "You qualify for $0 down solar installation!"
          : "We'll review your information and contact you with options.",
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly at 813-441-9686.",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Submit form
      form.handleSubmit((data) => qualificationMutation.mutate(data))();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    setStep(1);
    setQualified(null);
    form.reset();
    onClose();
  };

  const progress = (step / 4) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins text-center">
            Solar Qualification Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {step} of 4</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Form {...form}>
            <form className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Let's Start with the Basics</h3>
                    <p className="text-gray-600">Tell us about your current energy usage</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your average monthly electric bill?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your range..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="50">Under $50</SelectItem>
                            <SelectItem value="100">$50 - $100</SelectItem>
                            <SelectItem value="150">$100 - $150</SelectItem>
                            <SelectItem value="200">$150 - $200</SelectItem>
                            <SelectItem value="250">$200 - $250</SelectItem>
                            <SelectItem value="300">$250+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Property Information</h3>
                    <p className="text-gray-600">Help us understand your property details</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="homeOwnership"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do you own or rent your home?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ownership status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="own">I own my home</SelectItem>
                            <SelectItem value="rent">I rent my home</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your approximate credit score?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select credit score range..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="600">Below 600</SelectItem>
                            <SelectItem value="650">600 - 650</SelectItem>
                            <SelectItem value="700">650 - 700</SelectItem>
                            <SelectItem value="750">700 - 750</SelectItem>
                            <SelectItem value="800">750+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
                    <p className="text-gray-600">We'll use this to send your qualification results</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 text-center">
                  {qualified ? (
                    <>
                      <div className="bg-green-50 rounded-lg p-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-800 mb-2">
                          Congratulations! You Qualify!
                        </h3>
                        <p className="text-green-700 mb-4">
                          Based on your information, you qualify for $0 down solar installation 
                          through Project Hestia funding.
                        </p>
                        <div className="bg-white rounded-lg p-4 text-left">
                          <h4 className="font-semibold mb-2">Next Steps:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>✓ Free custom solar design</li>
                            <li>✓ Detailed savings analysis</li>
                            <li>✓ Government incentive application</li>
                            <li>✓ Professional installation coordination</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        We'll contact you within 24 hours to schedule your free consultation.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-white">💡</span>
                        </div>
                        <h3 className="text-2xl font-bold text-blue-800 mb-2">
                          Thank You for Your Interest!
                        </h3>
                        <p className="text-blue-700 mb-4">
                          While you may not qualify for our standard $0 down program, 
                          we have other solar options that might work for you.
                        </p>
                        <div className="bg-white rounded-lg p-4 text-left">
                          <h4 className="font-semibold mb-2">We'll explore:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>✓ Alternative financing options</li>
                            <li>✓ Lease and rental programs</li>
                            <li>✓ Portable solar solutions</li>
                            <li>✓ Energy efficiency improvements</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Our team will review your information and contact you with personalized options.
                      </p>
                    </>
                  )}
                </div>
              )}
            </form>
          </Form>

          <div className="flex justify-between">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            {step < 4 ? (
              <Button 
                onClick={nextStep}
                className={`${step === 1 ? 'w-full' : 'ml-auto'} bg-solar-teal hover:bg-teal-700`}
                disabled={qualificationMutation.isPending}
              >
                {step === 3 ? (
                  qualificationMutation.isPending ? "Checking..." : "Check Qualification"
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleClose} className="w-full bg-solar-orange hover:bg-yellow-500">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
