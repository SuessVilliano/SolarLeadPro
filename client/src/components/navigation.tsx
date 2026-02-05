import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, LogIn } from "lucide-react";

interface NavigationProps {
  onOpenQualification: () => void;
}

export default function Navigation({ onOpenQualification }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const navItems = [
    { label: "How It Works", href: "how-it-works" },
    { label: "Services", href: "services" },
    { label: "Calculator", href: "calculator" },
    { label: "Reviews", href: "testimonials" },
    { label: "Contact", href: "contact" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-poppins font-bold text-solar-teal">
              LIV8Solar
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-700 hover:text-solar-teal transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:813-441-9686"
              className="text-solar-teal font-semibold flex items-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              813-441-9686
            </a>
            <a href="/login">
              <Button variant="outline" size="sm" className="text-solar-teal border-solar-teal hover:bg-solar-teal hover:text-white">
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            </a>
            <Button
              onClick={onOpenQualification}
              className="bg-solar-orange hover:bg-yellow-500 text-white"
            >
              Get Quote
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => scrollToSection(item.href)}
                      className="text-left text-gray-700 hover:text-solar-teal transition-colors font-medium text-lg"
                    >
                      {item.label}
                    </button>
                  ))}
                  <hr className="my-4" />
                  <a
                    href="tel:813-441-9686"
                    className="text-solar-teal font-semibold flex items-center text-lg"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    813-441-9686
                  </a>
                  <a href="/login" className="w-full">
                    <Button variant="outline" className="w-full text-solar-teal border-solar-teal hover:bg-solar-teal hover:text-white">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login / Sign Up
                    </Button>
                  </a>
                  <Button
                    onClick={onOpenQualification}
                    className="bg-solar-orange hover:bg-yellow-500 text-white w-full"
                  >
                    Get Quote
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
