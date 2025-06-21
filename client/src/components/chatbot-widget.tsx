import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mail, 
  Calculator,
  CheckCircle
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you learn about solar for your home. What would you like to know?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");

  const quickActions = [
    {
      icon: Calculator,
      text: "Get Solar Quote",
      action: () => handleQuickAction("I'd like to get a solar quote for my home")
    },
    {
      icon: Phone,
      text: "Call Now",
      action: () => window.location.href = "tel:813-441-9686"
    },
    {
      icon: Mail,
      text: "Email Us",
      action: () => window.location.href = "mailto:info@liv8solar.com"
    },
    {
      icon: CheckCircle,
      text: "Qualify for $0 Down",
      action: () => handleQuickAction("How do I qualify for $0 down solar installation?")
    }
  ];

  const botResponses = {
    "quote": "I'd love to help you get a solar quote! To provide the most accurate estimate, I'll need some basic information about your home. What's your average monthly electric bill?",
    "qualify": "Great question! Through DOE's Project Hestia program, many homeowners qualify for $0 down installation. The main requirements are: owning your home, having a monthly electric bill over $100, and decent credit. Would you like me to connect you with our qualification team?",
    "cost": "Solar costs vary based on your home's energy needs and roof size. The average Florida home saves $1,200+ monthly with our Project Hestia program. Most customers see immediate savings from day one! Want a personalized quote?",
    "savings": "Our Florida customers typically save 70-90% on their electric bills immediately after installation. With Project Hestia's government funding, many pay $0 down and start saving from day one. What's your current monthly bill?",
    "how": "Solar is simple: panels capture sunlight, convert it to electricity for your home, and excess power goes back to the grid for credits. We handle everything from design to installation. Ready to get started?",
    "default": "That's a great question! For detailed information about solar for your specific situation, I'd recommend speaking with one of our solar consultants. They can provide personalized answers based on your home and energy needs. Would you like me to connect you with them?"
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('quote') || message.includes('price') || message.includes('estimate')) {
      return botResponses.quote;
    } else if (message.includes('qualify') || message.includes('$0') || message.includes('down')) {
      return botResponses.qualify;
    } else if (message.includes('cost') || message.includes('expensive') || message.includes('afford')) {
      return botResponses.cost;
    } else if (message.includes('save') || message.includes('saving') || message.includes('bill')) {
      return botResponses.savings;
    } else if (message.includes('how') || message.includes('work') || message.includes('process')) {
      return botResponses.how;
    } else {
      return botResponses.default;
    }
  };

  const sendMessage = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-solar-orange hover:bg-yellow-500 text-white rounded-full w-16 h-16 shadow-lg transform hover:scale-110 transition-all"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96">
          <Card className="shadow-2xl border-2 border-solar-teal">
            <CardHeader className="bg-gradient-to-r from-solar-teal to-solar-blue text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-solar-orange rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Solar Assistant</CardTitle>
                    <p className="text-sm text-gray-100">Online now</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Messages Area */}
              <ScrollArea className="h-80 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.isBot
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-solar-blue text-white'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickActions.map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={action.action}
                        className="text-xs flex items-center space-x-1"
                      >
                        <IconComponent className="w-3 h-3" />
                        <span>{action.text}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    className="bg-solar-orange hover:bg-yellow-500"
                    disabled={!inputText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}