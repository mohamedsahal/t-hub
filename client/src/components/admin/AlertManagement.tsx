import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Check, X, Tag, Bell, Award, AlertCircle, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: number;
  title: string;
  content: string;
  type: 'discount' | 'registration' | 'celebration' | 'announcement' | 'info';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  buttonText: string | null;
  buttonLink: string | null; // Note: the schema uses buttonLink, not buttonUrl
  priority: number;
  bgColor?: string;
  textColor?: string;
  iconName?: string;
  dismissable?: boolean;
  createdAt: string;
  updatedAt: string;
}

const alertFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  type: z.enum(['discount', 'registration', 'celebration', 'announcement', 'info']),
  isActive: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(1),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  buttonText: z.string().nullable().optional(),
  buttonLink: z.string().nullable().optional(), // Changed from buttonUrl to buttonLink to match schema
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  iconName: z.string().optional(),
  dismissable: z.boolean().default(true).optional(),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

const AlertManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);

  // Fetch all alerts
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Set up form with react-hook-form and zod validation
  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'info',
      isActive: true,
      priority: 1,
      startDate: null,
      endDate: null,
      buttonText: null,
      buttonLink: null,
      bgColor: '#3cb878',
      textColor: '#ffffff',
      iconName: 'megaphone',
      dismissable: true,
    },
  });

  // Create alert mutation
  const { mutate: createAlert, isPending: isCreating } = useMutation({
    mutationFn: (data: AlertFormValues) => {
      console.log('Sending data to API:', data);
      return apiRequest('/api/alerts', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (data) => {
      console.log('Alert created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      setIsOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Alert has been created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create alert. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating alert:', error);
    },
  });

  // Update alert mutation
  const { mutate: updateAlert, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AlertFormValues }) => {
      return apiRequest(`/api/alerts/${id}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      setIsOpen(false);
      setEditingAlert(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Alert has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update alert. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating alert:', error);
    },
  });

  // Delete alert mutation
  const { mutate: deleteAlert, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/alerts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      setAlertToDelete(null);
      toast({
        title: 'Success',
        description: 'Alert has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete alert. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting alert:', error);
    },
  });

  const handleSubmit = (values: AlertFormValues) => {
    console.log('Form values being submitted:', values);
    if (editingAlert) {
      updateAlert({ id: editingAlert.id, data: values });
    } else {
      createAlert(values);
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    
    // Set form values based on the alert being edited
    form.reset({
      title: alert.title,
      content: alert.content,
      type: alert.type,
      isActive: alert.isActive,
      priority: alert.priority,
      startDate: alert.startDate ? new Date(alert.startDate).toISOString().split('T')[0] : null,
      endDate: alert.endDate ? new Date(alert.endDate).toISOString().split('T')[0] : null,
      buttonText: alert.buttonText,
      buttonLink: alert.buttonLink,
      bgColor: alert.bgColor || '#3cb878',
      textColor: alert.textColor || '#ffffff',
      iconName: alert.iconName || 'megaphone',
      dismissable: alert.dismissable !== undefined ? alert.dismissable : true,
    });
    
    setIsOpen(true);
  };

  const handleDelete = (alert: Alert) => {
    setAlertToDelete(alert);
  };

  const confirmDelete = () => {
    if (alertToDelete) {
      deleteAlert(alertToDelete.id);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset the form and editing state when dialog is closed
      setTimeout(() => {
        setEditingAlert(null);
        form.reset();
      }, 300);
    }
    setIsOpen(open);
  };

  // Helper function to get alert type badge
  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case 'discount':
        return <Badge className="bg-emerald-500"><Tag className="w-3 h-3 mr-1" /> Discount</Badge>;
      case 'registration':
        return <Badge className="bg-blue-500"><Bell className="w-3 h-3 mr-1" /> Registration</Badge>;
      case 'celebration':
        return <Badge className="bg-amber-500"><Award className="w-3 h-3 mr-1" /> Celebration</Badge>;
      case 'announcement':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Announcement</Badge>;
      case 'info':
      default:
        return <Badge className="bg-gray-500"><Info className="w-3 h-3 mr-1" /> Info</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alert Management</h2>
        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingAlert ? 'Edit Alert' : 'Create New Alert'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alert type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="info">Information</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of alert to display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter alert title" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter alert content" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10} 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Higher priority alerts show first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Show this alert to users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value || null)} 
                          />
                        </FormControl>
                        <FormDescription>
                          When to start showing the alert
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value || null)} 
                          />
                        </FormControl>
                        <FormDescription>
                          When to stop showing the alert
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="buttonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g. Learn More" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value || null)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="buttonLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Link (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value || null)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    type="submit"
                    disabled={isCreating || isUpdating}
                  >
                    {isCreating || isUpdating ? (
                      <span>Saving...</span>
                    ) : (
                      <span>{editingAlert ? 'Update' : 'Create'}</span>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No alerts found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.isActive ? 'border-green-300' : 'border-gray-300 opacity-70'}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  {getAlertTypeBadge(alert.type)}
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(alert)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center">
                  Priority: {alert.priority}
                  {alert.isActive && <span className="ml-2 text-green-500 flex items-center"><Check className="h-3 w-3 mr-1" /> Active</span>}
                  {!alert.isActive && <span className="ml-2 text-gray-500 flex items-center"><X className="h-3 w-3 mr-1" /> Inactive</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-md font-medium mb-1">{alert.title}</h4>
                <p className="whitespace-pre-line text-sm">{alert.content}</p>
                {alert.buttonText && alert.buttonLink && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-gray-100">
                      Button: {alert.buttonText}
                    </Badge>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-gray-500 flex justify-between pt-0">
                <div>
                  {alert.startDate ? `From: ${formatDate(alert.startDate)}` : 'No start date'}
                </div>
                <div>
                  {alert.endDate ? `Until: ${formatDate(alert.endDate)}` : 'No end date'}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={!!alertToDelete} onOpenChange={(open) => !open && setAlertToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlertManagement;