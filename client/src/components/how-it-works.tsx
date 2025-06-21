import { Card } from "@/components/ui/card";
import { CheckCircle, Upload, Palette, CheckSquare, Zap } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: CheckCircle,
      title: "Fill Quick Form",
      description: "Basic info about your home and energy needs",
    },
    {
      icon: Upload,
      title: "Upload Utility Bill",
      description: "Secure UtilityAPI integration for accurate analysis",
    },
    {
      icon: Palette,
      title: "Free Design",
      description: "Custom solar system design for your property",
    },
    {
      icon: CheckSquare,
      title: "Get Approved",
      description: "Project Hestia qualification & financing approval",
    },
    {
      icon: Zap,
      title: "Installation",
      description: "Professional installation with $0 down option",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple 5-step process to get you qualified for solar with{" "}
            <strong>Project Hestia</strong> government funding
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-solar-teal text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-solar-blue to-solar-teal text-white p-8 max-w-4xl mx-auto">
          <h3 className="font-poppins font-bold text-2xl mb-6 text-center text-white">
            Project Hestia Benefits
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl text-yellow-300 mb-2">💰</div>
              <div className="font-semibold text-white">Government Funding</div>
              <div className="text-sm text-gray-100">
                Qualify for federal assistance
              </div>
            </div>
            <div>
              <div className="text-3xl text-yellow-300 mb-2">%</div>
              <div className="font-semibold text-white">Heavy Discounts</div>
              <div className="text-sm text-gray-100">
                Up to 30% tax credits available
              </div>
            </div>
            <div>
              <div className="text-3xl text-yellow-300 mb-2">⚡</div>
              <div className="font-semibold text-white">Immediate Savings</div>
              <div className="text-sm text-gray-100">
                Start saving from day one
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
