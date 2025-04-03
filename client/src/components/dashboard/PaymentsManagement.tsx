import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  DollarSign,
  Users,
  BookOpen,
  Calendar,
  Search,
  PlusCircle,
  Pencil,
  Eye,
  ArrowUpDown,
  Check,
  Clock,
  X,
  CreditCard,
  CalendarRange,
  Filter,
  Download,
  Wallet,
  Receipt,
  Info,
  CircleDot
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define payment form schema
const paymentFormSchema = z.object({
  userId: z.coerce.number({
    required_error: "User is required",
    invalid_type_error: "User ID must be a number"
  }),
  courseId: z.coerce.number({
    required_error: "Course is required",
    invalid_type_error: "Course ID must be a number"
  }),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  type: z.enum(["one_time", "installment"]),
  status: z.enum(["pending", "completed", "failed"]),
  transactionId: z.string().optional(),
  numberOfInstallments: z.coerce.number().min(1, "At least one installment is required").optional(),
  dueDate: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Define installment form schema
const installmentFormSchema = z.object({
  paymentId: z.coerce.number(),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  dueDate: z.string().min(1, "Due date is required"),
  isPaid: z.boolean().default(false),
  installmentNumber: z.coerce.number().min(1, "Installment number must be at least 1"),
  status: z.enum(["pending", "completed", "failed"]),
  transactionId: z.string().optional(),
  paymentDate: z.string().optional(),
});

type InstallmentFormValues = z.infer<typeof installmentFormSchema>;

export default function PaymentsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddInstallmentDialogOpen, setIsAddInstallmentDialogOpen] = useState(false);
  const [isEditInstallmentDialogOpen, setIsEditInstallmentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "paymentDate",
    direction: "desc",
  });

  // Fetch all payments
  const {
    data: payments,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
  } = useQuery({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/payments');
        return response;
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        throw error;
      }
    },
  });

  // Fetch all users for the dropdown
  const {
    data: users,
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/users');
        return response;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
      }
    },
  });

  // Fetch all courses for the dropdown
  const {
    data: courses,
    isLoading: isCoursesLoading,
  } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/courses');
        return response;
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
      }
    },
  });

  // Fetch installments for a specific payment
  const {
    data: installments,
    isLoading: isInstallmentsLoading,
    refetch: refetchInstallments,
  } = useQuery({
    queryKey: [`/api/admin/payments/${selectedPayment?.id}/installments`],
    queryFn: async () => {
      if (!selectedPayment?.id) return [];

      try {
        const response = await apiRequest(`/api/admin/payments/${selectedPayment.id}/installments`);
        return response;
      } catch (error) {
        console.error("Failed to fetch installments:", error);
        return [];
      }
    },
    enabled: !!selectedPayment?.id,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (newPayment: PaymentFormValues) => {
      const response = await apiRequest('/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify(newPayment),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Payment Created",
        description: "The payment has been created successfully.",
        variant: "default",
      });
      addForm.reset();
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PaymentFormValues }) => {
      const response = await apiRequest(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Payment Updated",
        description: "The payment has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "Failed to update payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create installment mutation
  const createInstallmentMutation = useMutation({
    mutationFn: async (newInstallment: InstallmentFormValues) => {
      const response = await apiRequest('/api/admin/installments', {
        method: 'POST',
        body: JSON.stringify(newInstallment),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/payments/${selectedPayment?.id}/installments`] });
      setIsAddInstallmentDialogOpen(false);
      toast({
        title: "Installment Created",
        description: "The installment has been created successfully.",
        variant: "default",
      });
      addInstallmentForm.reset();
      refetchInstallments();
    },
    onError: (error) => {
      console.error("Error creating installment:", error);
      toast({
        title: "Error",
        description: "Failed to create installment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update installment mutation
  const updateInstallmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InstallmentFormValues> }) => {
      const response = await apiRequest(`/api/admin/installments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/payments/${selectedPayment?.id}/installments`] });
      setIsEditInstallmentDialogOpen(false);
      toast({
        title: "Installment Updated",
        description: "The installment has been updated successfully.",
        variant: "default",
      });
      refetchInstallments();
    },
    onError: (error) => {
      console.error("Error updating installment:", error);
      toast({
        title: "Error",
        description: "Failed to update installment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form for adding new payment
  const addForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      userId: undefined,
      courseId: undefined,
      amount: 0,
      type: "one_time",
      status: "pending",
      transactionId: "",
      numberOfInstallments: 1,
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  // Form for editing payment
  const editForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      userId: undefined,
      courseId: undefined,
      amount: 0,
      type: "one_time",
      status: "pending",
      transactionId: "",
      numberOfInstallments: 1,
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  // Form for adding new installment
  const addInstallmentForm = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentFormSchema),
    defaultValues: {
      paymentId: undefined,
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      isPaid: false,
      installmentNumber: 1,
      status: "pending",
      transactionId: "",
      paymentDate: "",
    },
  });

  // Form for editing installment
  const editInstallmentForm = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentFormSchema),
    defaultValues: {
      paymentId: undefined,
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      isPaid: false,
      installmentNumber: 1,
      status: "pending",
      transactionId: "",
      paymentDate: "",
    },
  });

  const onAddSubmit = (data: PaymentFormValues) => {
    createPaymentMutation.mutate(data);
  };

  const onEditSubmit = (data: PaymentFormValues) => {
    if (selectedPayment) {
      updatePaymentMutation.mutate({ id: selectedPayment.id, data });
    }
  };

  const onAddInstallmentSubmit = (data: InstallmentFormValues) => {
    createInstallmentMutation.mutate(data);
  };

  const onEditInstallmentSubmit = (data: InstallmentFormValues) => {
    if (selectedInstallment) {
      updateInstallmentMutation.mutate({ id: selectedInstallment.id, data });
    }
  };

  const handleViewClick = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (payment: any) => {
    setSelectedPayment(payment);
    editForm.reset({
      userId: payment.userId,
      courseId: payment.courseId,
      amount: payment.amount,
      type: payment.type,
      status: payment.status,
      transactionId: payment.transactionId || "",
      numberOfInstallments: payment.numberOfInstallments || 1,
      dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleAddInstallmentClick = () => {
    addInstallmentForm.reset({
      paymentId: selectedPayment.id,
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      isPaid: false,
      installmentNumber: (installments?.length || 0) + 1,
      status: "pending",
      transactionId: "",
      paymentDate: "",
    });
    setIsAddInstallmentDialogOpen(true);
  };

  const handleEditInstallmentClick = (installment: any) => {
    setSelectedInstallment(installment);
    editInstallmentForm.reset({
      paymentId: installment.paymentId,
      amount: installment.amount,
      dueDate: installment.dueDate ? new Date(installment.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isPaid: installment.isPaid,
      installmentNumber: installment.installmentNumber,
      status: installment.status,
      transactionId: installment.transactionId || "",
      paymentDate: installment.paymentDate ? new Date(installment.paymentDate).toISOString().split('T')[0] : "",
    });
    setIsEditInstallmentDialogOpen(true);
  };

  const handleMarkInstallmentAsPaid = (installment: any) => {
    const currentDate = new Date().toISOString();
    const data: Partial<InstallmentFormValues> = {
      isPaid: true,
      status: "completed",
      paymentDate: currentDate,
    };
    updateInstallmentMutation.mutate({ id: installment.id, data });
  };

  // Watch type field to dynamically display installment fields
  const watchType = addForm.watch("type");
  const editWatchType = editForm.watch("type");
  
  // Filter and sort payments based on search query, active tab, and sort options
  const filteredAndSortedPayments = payments
    ? [...payments]
        .filter((payment: any) => {
          const user = users?.find((u: any) => u.id === payment.userId);
          const course = courses?.find((c: any) => c.id === payment.courseId);
          
          const userName = user?.name?.toLowerCase() || "";
          const userEmail = user?.email?.toLowerCase() || "";
          const courseTitle = course?.title?.toLowerCase() || "";
          const transactionId = payment.transactionId?.toLowerCase() || "";
          
          const matchesSearch = 
            userName.includes(searchQuery.toLowerCase()) || 
            userEmail.includes(searchQuery.toLowerCase()) || 
            courseTitle.includes(searchQuery.toLowerCase()) ||
            transactionId.includes(searchQuery.toLowerCase()) ||
            payment.amount.toString().includes(searchQuery);
          
          if (activeTab === "all") return matchesSearch;
          return matchesSearch && payment.status === activeTab;
        })
        .sort((a: any, b: any) => {
          // Handle different field types
          if (sortBy.field === "paymentDate") {
            const dateA = new Date(a.paymentDate || 0).getTime();
            const dateB = new Date(b.paymentDate || 0).getTime();
            return sortBy.direction === "asc" ? dateA - dateB : dateB - dateA;
          } else if (sortBy.field === "amount") {
            return sortBy.direction === "asc" 
              ? a.amount - b.amount 
              : b.amount - a.amount;
          } else if (sortBy.field === "id") {
            return sortBy.direction === "asc" ? a.id - b.id : b.id - a.id;
          }
          return 0;
        })
    : [];

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: string; icon: React.ReactNode } } = {
      pending: { 
        label: "Pending", 
        variant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500", 
        icon: <Clock className="mr-1 h-3 w-3" /> 
      },
      completed: { 
        label: "Completed", 
        variant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500", 
        icon: <Check className="mr-1 h-3 w-3" /> 
      },
      failed: { 
        label: "Failed", 
        variant: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500", 
        icon: <X className="mr-1 h-3 w-3" /> 
      },
    };

    const statusInfo = statusMap[status] || { 
      label: status, 
      variant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
      icon: <Info className="mr-1 h-3 w-3" /> 
    };

    return (
      <Badge variant="outline" className={`${statusInfo.variant} border-0 flex items-center`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; variant: string; icon: React.ReactNode } } = {
      one_time: { 
        label: "One-Time", 
        variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", 
        icon: <CreditCard className="mr-1 h-3 w-3" /> 
      },
      installment: { 
        label: "Installment", 
        variant: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500", 
        icon: <CalendarRange className="mr-1 h-3 w-3" /> 
      },
    };

    const typeInfo = typeMap[type] || { 
      label: type, 
      variant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
      icon: <Info className="mr-1 h-3 w-3" /> 
    };

    return (
      <Badge variant="outline" className={`${typeInfo.variant} border-0 flex items-center`}>
        {typeInfo.icon}
        {typeInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const toggleSort = (field: string) => {
    if (sortBy.field === field) {
      // Toggle direction if the same field is clicked
      setSortBy({
        field,
        direction: sortBy.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Default to desc for new field
      setSortBy({ field, direction: "desc" });
    }
  };

  if (isPaymentsError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load payments</h3>
          <p className="text-sm text-muted-foreground">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Total Revenue</CardTitle>
              <CardDescription>All time payments</CardDescription>
            </div>
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPaymentsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments
                    ?.filter((payment: any) => payment.status === "completed")
                    .reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Pending Payments</CardTitle>
              <CardDescription>Awaiting confirmation</CardDescription>
            </div>
            <Clock className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPaymentsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">
                {payments?.filter((payment: any) => payment.status === "pending").length || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">This Month</CardTitle>
              <CardDescription>Revenue for current month</CardDescription>
            </div>
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPaymentsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments
                    ?.filter((payment: any) => {
                      const paymentDate = new Date(payment.paymentDate);
                      const now = new Date();
                      return (
                        payment.status === "completed" &&
                        paymentDate.getMonth() === now.getMonth() &&
                        paymentDate.getFullYear() === now.getFullYear()
                      );
                    })
                    .reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto hidden md:flex">
                <Filter className="mr-2 h-4 w-4" />
                Filter & Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleSort("id")}>
                ID
                {sortBy.field === "id" && (
                  <span className="ml-auto">
                    {sortBy.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("amount")}>
                Amount
                {sortBy.field === "amount" && (
                  <span className="ml-auto">
                    {sortBy.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("paymentDate")}>
                Date
                {sortBy.field === "paymentDate" && (
                  <span className="ml-auto">
                    {sortBy.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isPaymentsLoading || isUsersLoading || isCoursesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] cursor-pointer" onClick={() => toggleSort("id")}>
                      <div className="flex items-center">
                        ID
                        {sortBy.field === "id" && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy.direction === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("amount")}>
                      <div className="flex items-center">
                        Amount
                        {sortBy.field === "amount" && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy.direction === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("paymentDate")}>
                      <div className="flex items-center">
                        Date
                        {sortBy.field === "paymentDate" && (
                          <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy.direction === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPayments.length > 0 ? (
                    filteredAndSortedPayments.map((payment: any) => {
                      const user = users?.find((u: any) => u.id === payment.userId);
                      const course = courses?.find((c: any) => c.id === payment.courseId);
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{user?.name || "Unknown"}</span>
                              {user?.email && (
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{course?.title || "Unknown Course"}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            {getPaymentTypeBadge(payment.type)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            {payment.paymentDate 
                              ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') 
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewClick(payment)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(payment)}
                                title="Edit payment"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        {searchQuery ? "No matching payments found" : "No payments found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for a student's course enrollment.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isUsersLoading ? (
                            <div className="p-2">Loading students...</div>
                          ) : (
                            users
                              ?.filter((user: any) => user.role === "student")
                              .map((user: any) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isCoursesLoading ? (
                            <div className="p-2">Loading courses...</div>
                          ) : (
                            courses
                              ?.filter((course: any) => course.status === "published")
                              .map((course: any) => (
                                <SelectItem
                                  key={course.id}
                                  value={course.id.toString()}
                                >
                                  {course.title} - {formatCurrency(course.price)}
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_time">One-Time Payment</SelectItem>
                          <SelectItem value="installment">Installment Plan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="External transaction reference" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional reference from payment processor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === "installment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                  <FormField
                    control={addForm.control}
                    name="numberOfInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Installments</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Installment Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? "Creating..." : "Create Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment details and status.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isUsersLoading ? (
                            <div className="p-2">Loading students...</div>
                          ) : (
                            users
                              ?.filter((user: any) => user.role === "student")
                              .map((user: any) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isCoursesLoading ? (
                            <div className="p-2">Loading courses...</div>
                          ) : (
                            courses?.map((course: any) => (
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
                                {course.title} - {formatCurrency(course.price)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_time">One-Time Payment</SelectItem>
                          <SelectItem value="installment">Installment Plan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="External transaction reference" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional reference from payment processor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {editWatchType === "installment" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                  <FormField
                    control={editForm.control}
                    name="numberOfInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Installments</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Installment Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePaymentMutation.isPending}
                >
                  {updatePaymentMutation.isPending ? "Updating..." : "Update Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Payment Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this payment and its installments.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ID:</span>
                      <span>{selectedPayment.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="font-bold">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status:</span>
                      <span>{getPaymentStatusBadge(selectedPayment.status)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Type:</span>
                      <span>{getPaymentTypeBadge(selectedPayment.type)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Date:</span>
                      <span>{selectedPayment.paymentDate ? format(new Date(selectedPayment.paymentDate), 'MMM dd, yyyy') : "N/A"}</span>
                    </div>
                    {selectedPayment.transactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Transaction ID:</span>
                        <span className="font-mono text-sm">{selectedPayment.transactionId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course & Student</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Student:</h4>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="font-medium">
                          {users?.find((u: any) => u.id === selectedPayment.userId)?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {users?.find((u: any) => u.id === selectedPayment.userId)?.email || "No email"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Course:</h4>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="font-medium">
                          {courses?.find((c: any) => c.id === selectedPayment.courseId)?.title || "Unknown Course"}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span>{formatCurrency(courses?.find((c: any) => c.id === selectedPayment.courseId)?.price || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedPayment.type === "installment" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Installments</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddInstallmentClick}
                      disabled={isInstallmentsLoading}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Installment
                    </Button>
                  </div>
                  
                  {isInstallmentsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : installments?.length === 0 ? (
                    <div className="bg-muted p-6 text-center rounded-md">
                      <p className="text-muted-foreground">No installments have been set up yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {installments?.map((installment: any) => (
                        <Card key={installment.id} className={`${installment.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                  <CircleDot className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Installment #{installment.installmentNumber}</span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {format(new Date(installment.dueDate), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-bold">{formatCurrency(installment.amount)}</span>
                                <span className="mt-1">
                                  {getPaymentStatusBadge(installment.status)}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditInstallmentClick(installment)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {installment.status !== "completed" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleMarkInstallmentAsPaid(installment)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {installment.paymentDate && (
                              <div className="mt-2 text-xs text-right text-muted-foreground">
                                Paid on: {format(new Date(installment.paymentDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Installment Dialog */}
      <Dialog open={isAddInstallmentDialogOpen} onOpenChange={setIsAddInstallmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Installment</DialogTitle>
            <DialogDescription>
              Add a new installment for this payment plan.
            </DialogDescription>
          </DialogHeader>
          <Form {...addInstallmentForm}>
            <form onSubmit={addInstallmentForm.handleSubmit(onAddInstallmentSubmit)} className="space-y-4">
              <FormField
                control={addInstallmentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addInstallmentForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addInstallmentForm.control}
                name="installmentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installment Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addInstallmentForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddInstallmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInstallmentMutation.isPending}
                >
                  {createInstallmentMutation.isPending ? "Creating..." : "Create Installment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Installment Dialog */}
      <Dialog open={isEditInstallmentDialogOpen} onOpenChange={setIsEditInstallmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Installment</DialogTitle>
            <DialogDescription>
              Update installment details and status.
            </DialogDescription>
          </DialogHeader>
          <Form {...editInstallmentForm}>
            <form onSubmit={editInstallmentForm.handleSubmit(onEditInstallmentSubmit)} className="space-y-4">
              <FormField
                control={editInstallmentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editInstallmentForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editInstallmentForm.control}
                name="installmentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installment Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editInstallmentForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editInstallmentForm.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Marked as Paid</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {editInstallmentForm.watch("status") === "completed" && (
                <FormField
                  control={editInstallmentForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When this installment was paid
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={editInstallmentForm.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                      <Input placeholder="External transaction reference" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional reference from payment processor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditInstallmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateInstallmentMutation.isPending}
                >
                  {updateInstallmentMutation.isPending ? "Updating..." : "Update Installment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}