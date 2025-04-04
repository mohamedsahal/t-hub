import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  DialogTitle 
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Calendar,
  ArrowLeft,
  Book,
  CheckCircle,
  HelpCircle,
  Award
} from "lucide-react";

// Schema for validating section form inputs
const sectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.coerce.number().optional(),
  unlockDate: z.string().optional(),
  videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  contentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
  type: z.enum(['lesson', 'quiz', 'exam']).default('lesson')
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
  videoUrl?: string;
  contentUrl?: string;
  isPublished?: boolean;
  type?: 'lesson' | 'quiz' | 'exam';
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

  // Get the icon based on section type
  const getSectionIcon = () => {
    switch(section.type) {
      case 'quiz':
        return <HelpCircle className="h-4 w-4 mr-1 text-orange-500" />;
      case 'exam':
        return <CheckCircle className="h-4 w-4 mr-1 text-red-500" />;
      default:
        return <Book className="h-4 w-4 mr-1 text-blue-500" />;
    }
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
            <div className="flex items-center">
              {getSectionIcon()}
              <div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && (
                  <CardDescription className="text-sm">{section.description}</CardDescription>
                )}
              </div>
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
            <div className="flex items-center text-muted-foreground">
              <span className={`px-2 py-1 rounded-full text-xs ${
                section.type === 'quiz' 
                  ? 'bg-orange-100 text-orange-800' 
                  : section.type === 'exam' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {section.type === 'quiz' 
                  ? 'Quiz' 
                  : section.type === 'exam' 
                    ? 'Exam' 
                    : 'Lesson'}
              </span>
            </div>
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
            {section.videoUrl && (
              <div className="flex items-center text-muted-foreground">
                <Video className="h-4 w-4 mr-1" />
                <span>Video Available</span>
              </div>
            )}
            {section.contentUrl && (
              <div className="flex items-center text-muted-foreground">
                <FileText className="h-4 w-4 mr-1" />
                <span>Materials Available</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <span className={`h-2 w-2 rounded-full mr-1 ${section.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{section.isPublished ? 'Published' : 'Draft'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CourseBuilderPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get the course ID from URL params
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? parseInt(courseId) : 0;
  
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  // Setting up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch course sections
  const { data: courseSections, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', id, 'sections'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${id}/sections`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course sections:", error);
        return [];
      }
    },
    enabled: id > 0
  });

  // Fetch course info
  const { data: course } = useQuery({
    queryKey: ['/api/admin/courses', id],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${id}`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course:", error);
        return null;
      }
    },
    enabled: id > 0
  });

  // Set up forms for adding and editing sections
  const addSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      isPublished: true,
      type: "lesson"
    }
  });

  const editSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      isPublished: true,
      type: "lesson"
    }
  });

  // Add new section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      const newSection = {
        ...data,
        courseId: id,
        order: sections.length + 1
      };
      
      const response = await apiRequest(`/api/admin/courses/${id}/sections`, {
        method: 'POST',
        body: JSON.stringify(newSection),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', id, 'sections'] });
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
    mutationFn: async ({ id: sectionId, data }: { id: number; data: Partial<CourseSection> }) => {
      const response = await apiRequest(`/api/admin/courses/${id}/sections/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', id, 'sections'] });
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
    mutationFn: async (sectionId: number) => {
      const response = await apiRequest(`/api/admin/courses/${id}/sections/${sectionId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', id, 'sections'] });
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
      
      const response = await apiRequest(`/api/admin/courses/${id}/sections/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ sections: updates }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', id, 'sections'] });
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
      unlockDate: section.unlockDate ? new Date(section.unlockDate).toISOString().split('T')[0] : undefined,
      videoUrl: section.videoUrl || "",
      contentUrl: section.contentUrl || "",
      isPublished: section.isPublished !== undefined ? section.isPublished : true,
      type: section.type || "lesson"
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

  // Handle back button click
  const handleBackClick = () => {
    if (course && course.type) {
      // Redirect based on course type
      switch(course.type) {
        case 'short':
          setLocation('/admin/courses/short');
          break;
        case 'specialist':
          setLocation('/admin/courses/specialist');
          break;
        case 'bootcamp':
          setLocation('/admin/courses/bootcamp');
          break;
        case 'diploma':
          setLocation('/admin/courses/diploma');
          break;
        default:
          setLocation('/admin/courses');
      }
    } else {
      setLocation('/admin/courses');
    }
  };

  // Build the UI
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBackClick} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Course Builder</h1>
              <p className="text-muted-foreground">
                {course ? `Building: ${course.title}` : 'Loading course...'}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="settings">Course Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading course modules...</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-medium">No modules yet</h3>
                <p className="text-muted-foreground mb-4">
                  This course doesn't have any content yet. Add your first module to get started.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Module
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
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>
                  Configure additional settings for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Course type: {course?.type}</p>
                {course?.type === 'bootcamp' && (
                  <div className="mt-4">
                    <h3 className="font-medium">Bootcamp-specific settings:</h3>
                    <ul className="list-disc list-inside mt-2">
                      <li>Content dripping settings</li>
                      <li>Online session management</li>
                      <li>Installment payment configuration</li>
                    </ul>
                  </div>
                )}
                {course?.type === 'diploma' && (
                  <div className="mt-4">
                    <h3 className="font-medium">Diploma-specific settings:</h3>
                    <ul className="list-disc list-inside mt-2">
                      <li>Semester configuration</li>
                      <li>Examination scheduling</li>
                      <li>Transcript generation</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Course Preview</CardTitle>
                <CardDescription>
                  Preview how your course will appear to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card text-card-foreground p-6">
                  <h2 className="text-2xl font-bold">{course?.title}</h2>
                  <p className="mt-2">{course?.description}</p>
                  
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Course Modules</h3>
                    {sections.length === 0 ? (
                      <p>No modules added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {sections.map((section, index) => (
                          <div key={section.id} className="p-3 border rounded-md">
                            <div className="flex items-center">
                              {section.type === 'quiz' ? (
                                <HelpCircle className="h-5 w-5 mr-2 text-orange-500" />
                              ) : section.type === 'exam' ? (
                                <CheckCircle className="h-5 w-5 mr-2 text-red-500" />
                              ) : (
                                <Book className="h-5 w-5 mr-2 text-blue-500" />
                              )}
                              <span className="font-medium">{index + 1}. {section.title}</span>
                            </div>
                            {section.description && (
                              <p className="text-sm text-muted-foreground ml-7 mt-1">{section.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>
              Add a new module to your course. Choose the type and provide details.
            </DialogDescription>
          </DialogHeader>
          <Form {...addSectionForm}>
            <form onSubmit={addSectionForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addSectionForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Type</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'lesson' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('lesson')}
                      >
                        <Book className="h-8 w-8 mb-2" />
                        <span>Lesson</span>
                      </Button>
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'quiz' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('quiz')}
                      >
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <span>Quiz</span>
                      </Button>
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'exam' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('exam')}
                      >
                        <Award className="h-8 w-8 mb-2" />
                        <span>Exam</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
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
                      <Textarea placeholder="Enter description" {...field} />
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
                          placeholder="2" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addSectionForm.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/video" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Publish this module</FormLabel>
                      <FormDescription>
                        When enabled, this module will be visible to students
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={addSectionMutation.isPending}>
                  {addSectionMutation.isPending ? "Adding..." : "Add Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>
              Update the details of this module
            </DialogDescription>
          </DialogHeader>
          <Form {...editSectionForm}>
            <form onSubmit={editSectionForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editSectionForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Type</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'lesson' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('lesson')}
                      >
                        <Book className="h-8 w-8 mb-2" />
                        <span>Lesson</span>
                      </Button>
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'quiz' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('quiz')}
                      >
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <span>Quiz</span>
                      </Button>
                      <Button
                        type="button"
                        className={`flex flex-col items-center justify-center h-24 ${field.value === 'exam' ? 'border-primary bg-primary/10' : 'border-input'}`}
                        variant="outline"
                        onClick={() => field.onChange('exam')}
                      >
                        <Award className="h-8 w-8 mb-2" />
                        <span>Exam</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
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
                      <Textarea placeholder="Enter description" {...field} />
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
                          placeholder="2" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editSectionForm.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/video" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Publish this module</FormLabel>
                      <FormDescription>
                        When enabled, this module will be visible to students
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateSectionMutation.isPending}>
                  {updateSectionMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}