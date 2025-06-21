import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Zap, Battery, Building, ArrowRight, Check } from "lucide-react";

export default function ServicesOverview() {
  const services = [
    {
      icon: Home,
      title: "Residential Solar",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300",
      alt: "Residential solar installation on modern home",
      features: [
        "Rooftop solar panel systems",
        "Net metering optimization",
        "25-year warranty protection",
        "Professional installation team"
      ],
      color: "bg-solar-teal"
    },
    {
      icon: Zap,
      title: "Portable & Off-Grid Systems",
      image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300",
      alt: "Portable solar panels and off-grid energy system",
      features: [
        "Portable solar generators",
        "RV & boat solar systems",
        "Remote cabin solutions",
        "Emergency backup power"
      ],
      color: "bg-solar-green"
    },
    {
      icon: Battery,
      title: "Battery & EV Integration",
      image: "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300",
      alt: "Modern battery storage system and EV charging station",
      features: [
        "Tesla Powerwall & alternatives",
        "EV charging station integration",
        "Grid-tie with backup power",
        "Smart home energy management"
      ],
      color: "bg-solar-orange"
    },
    {
      icon: Building,
      title: "Commercial Solar",
      image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300",
      alt: "Large commercial solar panel installation on business building",
      features: [
        "Large-scale installations",
        "ROI analysis & projections",
        "Tax incentive maximization",
        "Power purchase agreements"
      ],
      color: "bg-solar-blue"
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl text-gray-900 mb-6">
            Our Solar Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive solar consulting services tailored to your energy needs and lifestyle
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="bg-gray-50 hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className={`${service.color} text-white p-3 rounded-lg`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <h3 className="font-poppins font-bold text-2xl flex-1">
                          {service.title}
                        </h3>
                      </div>
                    </div>
                    
                    <img
                      src={service.image}
                      alt={service.alt}
                      className="w-full h-48 object-cover"
                    />
                    
                    <div className="p-6">
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <Check className="w-4 h-4 text-solar-green mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button variant="ghost" className="text-solar-teal hover:text-teal-700 p-0">
                        Learn More <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
