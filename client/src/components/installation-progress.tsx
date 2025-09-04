import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Hammer, 
  Zap,
  Home,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface InstallationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  icon: React.ReactNode;
  estimatedDays?: number;
  completedDate?: string;
}

interface InstallationProgressProps {
  projectId?: number;
  currentStatus: string;
  progress: number;
  estimatedCompletion?: string;
}

const installationSteps: InstallationStep[] = [
  {
    id: 'approved',
    title: 'Project Approved',
    description: 'Your solar project has been approved and planning has begun',
    status: 'pending',
    icon: <CheckCircle className="w-5 h-5" />,
    estimatedDays: 1,
  },
  {
    id: 'design',
    title: 'System Design',
    description: 'Creating custom solar system design for your property',
    status: 'pending',
    icon: <FileCheck className="w-5 h-5" />,
    estimatedDays: 7,
  },
  {
    id: 'permits',
    title: 'Permits & Approvals',
    description: 'Obtaining necessary permits and utility approvals',
    status: 'pending',
    icon: <Calendar className="w-5 h-5" />,
    estimatedDays: 30,
  },
  {
    id: 'installation',
    title: 'Installation',
    description: 'Professional installation of your solar system',
    status: 'pending',
    icon: <Hammer className="w-5 h-5" />,
    estimatedDays: 3,
  },
  {
    id: 'inspection',
    title: 'Final Inspection',
    description: 'City and utility final inspection and approval',
    status: 'pending',
    icon: <Home className="w-5 h-5" />,
    estimatedDays: 14,
  },
  {
    id: 'activation',
    title: 'System Activation',
    description: 'Your solar system is live and generating energy!',
    status: 'pending',
    icon: <Zap className="w-5 h-5" />,
    estimatedDays: 1,
  },
];

export default function InstallationProgress({ 
  projectId, 
  currentStatus, 
  progress, 
  estimatedCompletion 
}: InstallationProgressProps) {
  // Determine current step based on status
  const getCurrentStepIndex = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'approved': return 0;
      case 'design': return 1;
      case 'permits': return 2;
      case 'installation': return 3;
      case 'inspection': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);
  
  // Update step statuses based on current progress
  const updatedSteps = installationSteps.map((step, index) => {
    if (index < currentStepIndex) {
      return { ...step, status: 'completed' as const };
    } else if (index === currentStepIndex) {
      return { ...step, status: 'in_progress' as const };
    } else {
      return { ...step, status: 'pending' as const };
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'delayed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Installation Progress
            <Badge variant="outline">
              {Math.round(progress)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full h-3 mb-4" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Started</span>
            {estimatedCompletion && (
              <span>Est. completion: {new Date(estimatedCompletion).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {updatedSteps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'in_progress' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className={`${
                      step.status === 'in_progress' ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'in_progress' ? 'text-blue-900' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(step.status)}>
                        {getStatusIcon(step.status)}
                        <span className="ml-1 capitalize">{step.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                  
                  {step.estimatedDays && step.status !== 'completed' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated: {step.estimatedDays} day{step.estimatedDays > 1 ? 's' : ''}
                    </p>
                  )}
                  
                  {step.completedDate && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed: {new Date(step.completedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}