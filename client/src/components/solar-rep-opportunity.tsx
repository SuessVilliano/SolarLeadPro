import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  DollarSign, 
  MapPin, 
  Briefcase,
  Star,
  TrendingUp
} from "lucide-react";

export default function SolarRepOpportunity() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Unlimited Earning Potential",
      description: "Commission-based earnings with no ceiling - the more you help families go solar, the more you earn."
    },
    {
      icon: MapPin,
      title: "Available in All 50 States",
      description: "Nationwide opportunity means you can work from anywhere and help families across America."
    },
    {
      icon: Briefcase,
      title: "No Experience Required",
      description: "Complete training program provided - we'll teach you everything you need to succeed."
    },
    {
      icon: Users,
      title: "No License Needed",
      description: "Get started immediately without lengthy licensing requirements or certifications."
    },
    {
      icon: TrendingUp,
      title: "Growing Industry",
      description: "Solar is booming - join a rapidly expanding market with massive potential."
    },
    {
      icon: Star,
      title: "Make a Difference",
      description: "Help families save money while contributing to a cleaner, more sustainable future."
    }
  ];

  const handleJoinTeam = () => {
    window.open('https://sqr.co/JoinLIV8Solar', '_blank');
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl mb-6 text-black">
            Join Our Solar Team
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Looking for a rewarding career in the fastest-growing energy sector? 
            Our team is always expanding across all 50 states.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Card key={index} className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="bg-solar-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl mb-4 text-black">
                    {benefit.title}
                  </h3>
                  <p className="text-black">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="font-poppins font-bold text-2xl mb-4 text-black">
              Ready to Start Your Solar Career?
            </h3>
            <p className="text-black mb-6">
              No experience? No problem. No license? We've got you covered. 
              Just bring your passion for helping families and we'll provide the rest.
            </p>
            <Button
              onClick={handleJoinTeam}
              size="lg"
              className="bg-solar-orange hover:bg-yellow-500 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Our Team Today
            </Button>
          </div>
          
          <p className="text-sm text-gray-600">
            Equal opportunity employer - all backgrounds welcome
          </p>
        </div>
      </div>
    </section>
  );
}