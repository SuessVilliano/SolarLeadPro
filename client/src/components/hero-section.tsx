import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Sun, Star, Users, DollarSign } from "lucide-react";

interface HeroSectionProps {
  onOpenQualification: () => void;
  onScrollToCalculator: () => void;
}

export default function HeroSection({ onOpenQualification, onScrollToCalculator }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-solar-blue to-solar-teal text-white py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-poppins font-bold text-4xl lg:text-6xl leading-tight mb-6">
              Smart Energy Consulting
              <span className="text-solar-turquoise block">
                Solar, Storage & Off-Grid Solutions
              </span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100">
              Get qualified for $0 down solar installation through DOE's Project Hestia.{" "}
              <strong>Government funding available</strong> for eligible homeowners.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                onClick={onOpenQualification}
                size="lg"
                className="bg-solar-orange hover:bg-yellow-500 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all shadow-lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Check if You Qualify
              </Button>
              <Button
                onClick={onScrollToCalculator}
                variant="outline"
                size="lg"
                className="bg-white text-solar-blue hover:bg-gray-100 px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all shadow-lg border-white"
              >
                <Sun className="w-5 h-5 mr-2" />
                Get Free Design
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-blue-100">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="font-semibold">4.9/5 Rating</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-semibold">500+ Happy Customers</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                <span className="font-semibold">$0 Down Available</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
              alt="Modern home with solar panels installation"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />

            {/* Video Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 shadow-xl transition-all transform hover:scale-110 text-solar-blue"
                onClick={() => {
                  // TODO: Implement YouTube video modal for Project Hestia
                  console.log("Play Project Hestia video");
                }}
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-solar-teal">$1,200</div>
                <div className="text-sm text-gray-600">Avg Monthly Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
