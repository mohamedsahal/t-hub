import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronDown, 
  ChevronUp, 
  Grip, 
  Plus, 
  Trash2, 
  Pencil, 
  Save, 
  FileText, 
  Video, 
  Clock, 
  Calendar
} from "lucide-react";

// Schema for validating section form inputs
const sectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.number().optional(),
  unlockDate: z.string().optional()
});

type SectionFormValues = z.infer<typeof sectionSchema>;

// Interface for our course section object
interface CourseSection {
  id: number;
  courseId: number;
  semesterId?: number;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  unlockDate?: string;
}

interface SortableItemProps {
  id: number;
  section: CourseSection;
  onEdit: (section: CourseSection) => void;
  onDelete: (id: number) => void;
}

// Sortable Item Component for each section
function SortableItem({ id, section, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-3"
    >
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <span 
              className="cursor-move p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 mr-2"
              {...attributes}
              {...listeners}
            >
              <Grip className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.description && (
                <CardDescription className="text-sm">{section.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(section)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive" 
              onClick={() => onDelete(section.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-3 text-sm">
            {section.duration && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{section.duration} hours</span>
              </div>
            )}
            {section.unlockDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Unlocks on {new Date(section.unlockDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CourseBuilderProps {
  courseId: number;
}

export default function CourseBuilder({ courseId }: CourseBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);

  // Setting up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch course sections
  const { data: courseSections, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', courseId, 'sections'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${courseId}/sections`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course sections:", error);
        return [];
      }
    }
  });

  // Fetch course info
  const { data: course } = useQuery({
    queryKey: ['/api/admin/courses', courseId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${courseId}`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course:", error);
        return null;
      }
    }
  });

  // Set up forms for adding and editing sections
  const addSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined
    }
  });

  const editSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined
    }
  });

  // Add new section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      const newSection = {
        ...data,
        courseId,
        order: sections.length + 1
      };
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections`, {
        method: 'POST',
        body: JSON.stringify(newSection),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      setIsAddDialogOpen(false);
      addSectionForm.reset();
      toast({
        title: "Section Added",
        description: "The section has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding section:", error);
      toast({
        title: "Error",
        description: "Failed to add section. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CourseSection> }) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Section Updated",
        description: "The section has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating section:", error);
      toast({
        title: "Error",
        description: "Failed to update section. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      toast({
        title: "Section Deleted",
        description: "The section has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update section order mutation
  const updateSectionOrderMutation = useMutation({
    mutationFn: async (sections: CourseSection[]) => {
      const updates = sections.map((section, index) => ({
        id: section.id,
        order: index + 1
      }));
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ sections: updates }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      toast({
        title: "Order Updated",
        description: "Section order has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating section order:", error);
      toast({
        title: "Error",
        description: "Failed to update section order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update local sections when API data changes
  useEffect(() => {
    if (courseSections) {
      const sortedSections = [...courseSections].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    }
  }, [courseSections]);

  // Handle adding a new section
  const onAddSubmit = (data: SectionFormValues) => {
    addSectionMutation.mutate(data);
  };

  // Handle updating a section
  const onEditSubmit = (data: SectionFormValues) => {
    if (selectedSection) {
      updateSectionMutation.mutate({
        id: selectedSection.id,
        data: data
      });
    }
  };

  // Handle opening edit dialog
  const handleEditSection = (section: CourseSection) => {
    setSelectedSection(section);
    editSectionForm.reset({
      title: section.title,
      description: section.description || "",
      duration: section.duration,
      unlockDate: section.unlockDate ? new Date(section.unlockDate).toISOString().split('T')[0] : undefined
    });
    setIsEditDialogOpen(true);
  };

  // Handle deleting a section
  const handleDeleteSection = (sectionId: number) => {
    if (confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
      deleteSectionMutation.mutate(sectionId);
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSections((sections) => {
        const oldIndex = sections.findIndex(section => section.id === active.id);
        const newIndex = sections.findIndex(section => section.id === over.id);
        
        const newSections = arrayMove(sections, oldIndex, newIndex);
        
        // Update the order in the database
        updateSectionOrderMutation.mutate(newSections);
        
        return newSections;
      });
    }
  };

  // Build the UI
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Builder</h2>
          <p className="text-muted-foreground">
            {course ? `Building: ${course.title}` : 'Loading course...'}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading course sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-medium">No sections yet</h3>
            <p className="text-muted-foreground mb-4">
              This course doesn't have any sections yet. Add your first section to get started.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Section
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map(section => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableItem
                  key={section.id}
                  id={section.id}
                  section={section}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Add a new section to your course. Sections help organize your content into logical groups.
            </DialogDescription>
          </DialogHeader>
          <Form {...addSectionForm}>
            <form onSubmit={addSectionForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addSectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter section title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter section description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addSectionForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter duration" 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addSectionForm.control}
                  name="unlockDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unlock Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        For drip content only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addSectionMutation.isPending}>
                  {addSectionMutation.isPending ? "Adding..." : "Add Section"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the section details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editSectionForm}>
            <form onSubmit={editSectionForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editSectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter section title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editSectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter section description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editSectionForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter duration" 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editSectionForm.control}
                  name="unlockDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unlock Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        For drip content only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSectionMutation.isPending}>
                  {updateSectionMutation.isPending ? "Updating..." : "Update Section"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}