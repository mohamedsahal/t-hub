import React, { useState, useEffect } from 'react';
import { X, Info, AlertCircle, Bell, Award, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Alert {
  id: number;
  type: 'discount' | 'registration' | 'celebration' | 'announcement' | 'info';
  title: string;
  content: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  buttonText: string | null;
  buttonLink: string | null; // Changed from buttonUrl to match schema
  priority: number;
  bgColor?: string;
  textColor?: string;
  iconName?: string;
  dismissable?: boolean;
  createdAt: string;
  updatedAt: string;
}

const AlertBanner: React.FC = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Save dismissed alerts to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  // Fetch active alerts
  const { data: alerts = [], isLoading, error } = useQuery<Alert[]>({
    queryKey: ['/api/alerts/active'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get alerts that haven't been dismissed
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  
  if (isLoading || error || visibleAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  // Get the highest priority alert to display
  const currentAlert = visibleAlerts[0];
  
  // Get the alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Tag className="h-5 w-5" />;
      case 'registration':
        return <Bell className="h-5 w-5" />;
      case 'celebration':
        return <Award className="h-5 w-5" />;
      case 'announcement':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Get alert colors based on type
  const getAlertColors = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800';
      case 'registration':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'celebration':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'announcement':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'info':
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`w-full px-4 py-3 mb-4 flex items-center justify-between rounded-md border ${getAlertColors(currentAlert.type)}`}>
      <div className="flex items-center space-x-3">
        {getAlertIcon(currentAlert.type)}
        <p className="text-sm font-medium">
          {currentAlert.content}
          {currentAlert.buttonText && currentAlert.buttonLink && (
            <a 
              href={currentAlert.buttonLink}
              className="ml-2 underline font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              {currentAlert.buttonText}
            </a>
          )}
        </p>
      </div>
      <button
        onClick={() => handleDismiss(currentAlert.id)}
        className="flex-shrink-0 ml-3 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AlertBanner;