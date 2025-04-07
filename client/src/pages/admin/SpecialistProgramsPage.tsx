import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye,
  Package
} from "lucide-react";

interface SpecialistProgram {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  isActive: boolean;
  isVisible: boolean;
  hasDiscounted: boolean;
  discountedPrice: number | null;
  discountExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SpecialistProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const [programToDelete, setProgramToDelete] = useState<SpecialistProgram | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch specialist programs data
  const { data: allPrograms, isLoading } = useQuery({
    queryKey: ['/api/specialist-programs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/specialist-programs');
        return response;
      } catch (error) {
        console.error("Failed to fetch specialist programs:", error);
        return [];
      }
    }
  });

  // Delete program mutation
  const deleteProgram = useMutation({
    mutationFn: async (programId: number) => {
      return await apiRequest(`/api/specialist-programs/${programId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Program deleted successfully",
        description: "The specialist program has been removed",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/specialist-programs'] });
      setProgramToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete program",
        description: "There was an error deleting the program. Please try again.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    }
  });

  // Filter programs by search query
  const programs = allPrograms
    ? allPrograms.filter((program: SpecialistProgram) => 
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Function to get status badge display
  const getStatusBadge = (isActive: boolean, isVisible: boolean) => {
    if (isActive && isVisible) {
      return <Badge className="bg-green-500">Active & Visible</Badge>;
    } else if (isActive && !isVisible) {
      return <Badge variant="outline" className="bg-blue-100">Active (Hidden)</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  // Navigate to edit specialist program
  const editProgram = (programId: number) => {
    setLocation(`/admin/specialist-programs/edit/${programId}`);
  };

  // Navigate to create new specialist program
  const createNewProgram = () => {
    setLocation('/admin/specialist-programs/create');
  };

  // Confirm delete handler
  const handleDeleteConfirm = () => {
    if (programToDelete) {
      deleteProgram.mutate(programToDelete.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Specialist Programs</h1>
            <p className="text-muted-foreground">
              Manage specialized training programs with multiple courses
            </p>
          </div>
          <Button onClick={createNewProgram}>
            <Plus className="mr-2 h-4 w-4" />
            Create Specialist Program
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Specialist Programs</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading specialist programs...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No specialist programs found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-4">
                  You haven't created any specialist programs yet, or none match your search criteria.
                </p>
                <Button onClick={createNewProgram}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Specialist Program
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program: SpecialistProgram) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.code}</TableCell>
                      <TableCell>
                        {program.hasDiscounted && program.discountedPrice 
                          ? <div>
                              <span className="line-through text-muted-foreground mr-2">${program.price}</span>
                              <span className="font-medium">${program.discountedPrice}</span>
                            </div>
                          : <span>${program.price}</span>
                        }
                      </TableCell>
                      <TableCell>{program.duration} months</TableCell>
                      <TableCell>{getStatusBadge(program.isActive, program.isVisible)}</TableCell>
                      <TableCell>{new Date(program.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editProgram(program.id)}
                            title="Edit program"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/specialist-programs/${program.id}`, '_blank')}
                            title="View program"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setProgramToDelete(program)}
                            title="Delete program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!programToDelete} onOpenChange={(open) => !open && setProgramToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specialist Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the program "{programToDelete?.name}"? 
              This action cannot be undone and will also remove all associated courses and enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}