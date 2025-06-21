import { Card, CardContent } from "@/components/ui/card";
import { Star, Expand } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Mike Rodriguez",
      location: "Phoenix, AZ",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
      testimonial: "Since going solar with LIV8Solar, I've saved $150/month with zero down. The Project Hestia funding made it possible for our family to go green without breaking the bank."
    },
    {
      name: "Sarah Chen",
      location: "Austin, TX",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c5ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
      testimonial: "The team at LIV8Solar made the whole process seamless. From qualification to installation, they handled everything. Our energy bill is now practically $0!"
    },
    {
      name: "David Thompson",
      location: "Denver, CO",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
      testimonial: "LIV8Solar's expertise in off-grid systems helped us achieve energy independence for our cabin. Professional, knowledgeable, and always available for questions."
    }
  ];

  const installations = [
    {
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      alt: "Professional solar installation in progress"
    },
    {
      image: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      alt: "Completed residential solar installation"
    },
    {
      image: "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      alt: "Modern battery storage system installation"
    },
    {
      image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      alt: "Happy family with their new solar system"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl lg:text-5xl text-gray-900 mb-6">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600">
            Real stories from Florida homeowners who chose LIV8Solar for their energy journey
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gray-50 hover:shadow-xl transition-shadow h-full">
              <CardContent className="p-8">
                <div className="flex text-yellow-400 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.testimonial}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={`${testimonial.name} testimonial`}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Installation Gallery */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-8">
            <h3 className="font-poppins font-bold text-2xl text-center mb-8">
              Installation Gallery
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {installations.map((installation, index) => (
                <div key={index} className="relative group cursor-pointer">
                  <img
                    src={installation.image}
                    alt={installation.alt}
                    className="rounded-lg w-full h-48 object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="w-8 h-8 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
