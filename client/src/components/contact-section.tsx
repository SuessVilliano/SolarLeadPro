import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const consultationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  energyGoals: z.string().optional(),
});

type ConsultationData = z.infer<typeof consultationSchema>;

export default function ContactSection() {
  const { toast } = useToast();

  const form = useForm<ConsultationData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      energyGoals: "",
    },
  });

  const consultationMutation = useMutation({
    mutationFn: async (data: ConsultationData) => {
      // First create the lead
      const leadResponse = await apiRequest("POST", "/api/leads", {
        ...data,
        address: "", // Optional for consultation requests
        leadSource: "consultation",
      });
      const lead = await leadResponse.json();

      // Then schedule the consultation
      const consultationResponse = await apiRequest("POST", "/api/consultations", {
        leadId: lead.id,
        notes: data.energyGoals || "Consultation request from website",
      });
      return consultationResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Consultation Scheduled!",
        description: "We'll contact you within 24 hours to confirm your appointment.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Please try again or call us directly at 813-441-9686.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsultationData) => {
    consultationMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-solar-teal to-solar-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl mb-6">
            Ready to Go Solar?
          </h2>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto">
            Join thousands of homeowners nationwide saving thousands with Project Hestia. 
            Get your free consultation today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-solar-turquoise text-solar-blue rounded-full p-3 flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Call Us Now</div>
                  <a
                    href="tel:813-441-9686"
                    className="text-2xl font-bold text-white hover:text-solar-turquoise transition-colors"
                  >
                    813-441-9686
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-solar-turquoise text-solar-blue rounded-full p-3 flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Email Us</div>
                  <a
                    href="mailto:info@liv8solar.com"
                    className="text-xl text-white hover:text-solar-turquoise transition-colors"
                  >
                    info@liv8solar.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-solar-turquoise text-solar-blue rounded-full p-3 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Service Area</div>
                  <div className="text-xl text-white">All 50 States - Nationwide Coverage</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-solar-turquoise text-solar-blue rounded-full p-3 flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Business Hours</div>
                  <div className="text-xl text-white">Mon-Fri: 8AM-6PM | Sat: 9AM-4PM</div>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-8">
              <h3 className="font-poppins font-bold text-2xl mb-6 text-center text-black">
                Get Your Free Consultation
              </h3>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="First Name"
                              className="bg-white bg-opacity-90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-solar-turquoise focus:border-solar-turquoise"
                            />
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
                          <FormLabel className="text-black">Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Last Name"
                              className="bg-white bg-opacity-90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-solar-turquoise focus:border-solar-turquoise"
                            />
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
                        <FormLabel className="text-black">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Email Address"
                            className="bg-white bg-opacity-90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-solar-turquoise focus:border-solar-turquoise"
                          />
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
                        <FormLabel className="text-black">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Phone Number"
                            className="bg-white bg-opacity-90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-solar-turquoise focus:border-solar-turquoise"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="energyGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Tell us about your energy goals...</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about your energy goals..."
                            rows={4}
                            className="bg-white bg-opacity-90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-solar-turquoise focus:border-solar-turquoise resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-solar-orange hover:bg-yellow-500 text-white py-4 text-lg font-bold"
                    disabled={consultationMutation.isPending}
                  >
                    <CalendarCheck className="w-5 h-5 mr-2" />
                    {consultationMutation.isPending ? "Scheduling..." : "Schedule My Free Consultation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
