import { useState, useEffect } from "react";
import { User as SchemaUser, courseTypeEnum } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Extended User type with preferredCourse
interface User extends Omit<SchemaUser, 'preferredCourse'> {
  preferredCourse: "multimedia" | "accounting" | "marketing" | "development" | "diploma" | null;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define form schemas
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "teacher", "student"]),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  preferredCourse: z.enum(["multimedia", "accounting", "marketing", "development", "diploma"]),
});

const userUpdateSchema = userFormSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  });

type UserFormValues = z.infer<typeof userFormSchema>;
type UserUpdateValues = z.infer<typeof userUpdateSchema>;

export default function UsersManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries - improve error handling and add refetch
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: 1,
    staleTime: 0, // Always refetch when tab is selected
    refetchOnWindowFocus: true,
  });

  // Create user form
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      phone: "",
      password: "",
      preferredCourse: "multimedia",
    },
  });

  // Edit user form
  const editForm = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      phone: "",
      password: "",
    },
  });

  // Set up the edit form when a user is selected
  useEffect(() => {
    if (selectedUser) {
      editForm.reset({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        phone: selectedUser.phone || "",
        preferredCourse: selectedUser.preferredCourse || "multimedia",
      });
    }
  }, [selectedUser, editForm]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (newUser: UserFormValues) => {
      return apiRequest("POST", "/api/admin/users", newUser);
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreating(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: number; user: UserUpdateValues }) => {
      return apiRequest("PUT", `/api/admin/users/${data.id}`, data.user);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditing(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onCreateSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: UserUpdateValues) => {
    if (selectedUser) {
      // Only include password if it's been provided
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      updateUserMutation.mutate({
        id: selectedUser.id,
        user: updateData,
      });
    }
  };

  const handleDelete = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  // Helper function to get badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "teacher":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "student":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage all users in the system: students, teachers, and administrators
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreating(true)}>Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new user account.
                </DialogDescription>
              </DialogHeader>

              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          User permissions are based on roles
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="preferredCourse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Course</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="multimedia">Multimedia</SelectItem>
                            <SelectItem value="accounting">Accounting</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will determine the user's ID prefix
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {(() => {
                        // Get course prefix based on preferredCourse if available
                        let coursePrefix = "";
                        if (user.preferredCourse) {
                          switch(user.preferredCourse) {
                            case "multimedia": coursePrefix = "MM"; break;
                            case "accounting": coursePrefix = "ACC"; break;
                            case "marketing": coursePrefix = "MKT"; break;
                            case "development": coursePrefix = "DEV"; break;
                            case "diploma": coursePrefix = "DIP"; break;
                            default: coursePrefix = "TH"; break;
                          }
                        } else {
                          // Fallback to role-based prefix
                          coursePrefix = user.role === 'student' ? 'STDN' : 
                                         user.role === 'teacher' ? 'TCHR' : 'ADMN';
                        }
                        
                        // Format ID with leading zeros
                        const formattedId = user.id < 10 ? `00${user.id}` : 
                                           user.id < 100 ? `0${user.id}` : user.id;
                                           
                        return `${coursePrefix}-${formattedId}`;
                      })()}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditing(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {selectedUser && selectedUser.id === user.id && isEditing && (
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                  Update user details for {selectedUser.name}
                                </DialogDescription>
                              </DialogHeader>

                              <Form {...editForm}>
                                <form
                                  onSubmit={editForm.handleSubmit(onEditSubmit)}
                                  className="space-y-4"
                                >
                                  <FormField
                                    control={editForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter full name"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={editForm.control}
                                    name="email"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={editForm.control}
                                    name="role"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="student">
                                              Student
                                            </SelectItem>
                                            <SelectItem value="teacher">
                                              Teacher
                                            </SelectItem>
                                            <SelectItem value="admin">
                                              Admin
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription>
                                          User permissions are based on roles
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={editForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Enter phone number (optional)"
                                            {...field}
                                            value={field.value || ""}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={editForm.control}
                                    name="password"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="password"
                                            placeholder="Enter new password (leave empty to keep current)"
                                            {...field}
                                            value={field.value || ""}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Leave blank to keep the current password
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={editForm.control}
                                    name="preferredCourse"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Preferred Course</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select course type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="multimedia">Multimedia</SelectItem>
                                            <SelectItem value="accounting">Accounting</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="development">Development</SelectItem>
                                            <SelectItem value="diploma">Diploma</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription>
                                          This will determine the user's ID prefix
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setIsEditing(false);
                                        setSelectedUser(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={updateUserMutation.isPending}
                                    >
                                      {updateUserMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Update User
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          )}
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you sure you want to delete this user?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently
                                delete the user account and remove their data from
                                our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteUserMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No users found. Create a new user to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}