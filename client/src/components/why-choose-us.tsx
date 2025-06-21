import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Handshake, 
  Award, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  MapPin,
  CalendarCheck
} from "lucide-react";

export default function WhyChooseUs() {
  const differentiators = [
    {
      icon: Handshake,
      title: "No Manufacturing - Pure Consulting",
      description: "We don't manufacture panels. We connect you with vetted, certified installation partners to ensure unbiased recommendations and competitive pricing."
    },
    {
      icon: Award,
      title: "DOE Project Hestia Certified",
      description: "Guided by the Department of Energy's Project Hestia framework, we help you access government funding and maximize available incentives."
    },
    {
      icon: Shield,
      title: "End-to-End Protection",
      description: "From initial consultation to post-installation monitoring, we're with you every step. Our partnerships ensure quality workmanship and long-term reliability."
    },
    {
      icon: TrendingUp,
      title: "Smart Home Integration",
      description: "Beyond solar panels, we help you integrate battery storage, EV charging, and smart home systems for complete energy independence."
    },
    {
      icon: DollarSign,
      title: "$0 Down Options Available",
      description: "Through Project Hestia and our financing partners, many homeowners qualify for $0 down installation with immediate savings."
    },
    {
      icon: MapPin,
      title: "Nationwide Network Excellence",
      description: "Connected to top installers, leading panel manufacturers, and premium battery companies across all 50 states. National expertise, local execution."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl mb-6 text-black">
            Why Choose LIV8Solar?
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            We're not just another solar company. We're your trusted energy consultants, 
            backed by DOE's Project Hestia framework and committed to your success.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {differentiators.map((diff, index) => {
            const IconComponent = diff.icon;
            return (
              <Card key={index} className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="bg-solar-turquoise text-solar-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl mb-4 text-black">
                    {diff.title}
                  </h3>
                  <p className="text-black">
                    {diff.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-solar-orange hover:bg-yellow-500 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all shadow-lg"
          >
            <CalendarCheck className="w-5 h-5 mr-2" />
            Schedule Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
}
