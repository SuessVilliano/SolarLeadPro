import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function ExitIntentModal({ isOpen, onClose, onContinue }: ExitIntentModalProps) {
  const [billRange, setBillRange] = useState("");

  const handleContinue = () => {
    onClose();
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Solar Qualification Check</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-6">
          <div className="bg-solar-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="font-poppins font-bold text-2xl mb-4">Wait! Don't Miss Out</h3>
            <p className="text-gray-600 mb-6">
              See if you qualify for $0 down solar installation. 
              Just answer one quick question to get started.
            </p>
          </div>

          <div className="text-left space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              What's your average monthly electric bill?
            </label>
            <Select onValueChange={setBillRange} value={billRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-100">Under $100</SelectItem>
                <SelectItem value="100-150">$100 - $150</SelectItem>
                <SelectItem value="150-200">$150 - $200</SelectItem>
                <SelectItem value="200-plus">$200+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleContinue}
              className="bg-solar-teal hover:bg-teal-700 text-white flex-1"
              disabled={!billRange}
            >
              Check My Qualification
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
