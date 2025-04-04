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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  FolderPlus,
  Folder,
  ListPlus
} from "lucide-react";

// Schema for validating module form inputs
const moduleSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.coerce.number().optional().nullable(),
  unlockDate: z.string().optional(),
  isPublished: z.boolean().default(true)
});

// Schema for validating section form inputs
const sectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  moduleId: z.number().optional().nullable(),
  duration: z.coerce.number().optional().nullable(),
  unlockDate: z.string().optional(),
  videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  contentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
  type: z.enum(["lesson", "quiz", "exam"]).default("lesson")
});

type ModuleFormValues = z.infer<typeof moduleSchema>;
type SectionFormValues = z.infer<typeof sectionSchema>;

// Interface for our course section object
interface CourseSection {
  id: number;
  courseId: number;
  moduleId?: number | null;
  semesterId?: number | null;
  title: string;
  description?: string | null;
  order: number;
  duration?: number | null;
  unlockDate?: string | null;
  videoUrl?: string | null;
  contentUrl?: string | null;
  isPublished?: boolean | null;
  type?: "lesson" | "quiz" | "exam";
}

// Interface for our course module object
interface CourseModule {
  id: number;
  courseId: number;
  semesterId?: number | null;
  title: string;
  description?: string | null;
  order: number;
  duration?: number | null;
  unlockDate?: string | null;
  isPublished?: boolean | null;
}

interface SortableModuleItemProps {
  id: number;
  module: CourseModule;
  sections: CourseSection[];
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (id: number) => void;
  onAddSection: (moduleId: number) => void;
  onEditSection: (section: CourseSection) => void;
  onDeleteSection: (id: number) => void;
}

interface SortableSectionItemProps {
  id: number;
  section: CourseSection;
  onEdit: (section: CourseSection) => void;
  onDelete: (id: number) => void;
}

// Sortable Item Component for each section
function SortableSectionItem({ id, section, onEdit, onDelete }: SortableSectionItemProps) {
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
      className="mb-3 ml-8"
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
              <CardTitle className="text-lg flex items-center">
                {section.type === "quiz" && <span className="mr-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Quiz</span>}
                {section.type === "exam" && <span className="mr-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Exam</span>}
                {section.title}
              </CardTitle>
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

// Sortable Module Item Component with nested sections
function SortableModuleItem({ 
  id, module, sections, onEditModule, onDeleteModule, onAddSection, onEditSection, onDeleteSection 
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: `module-${id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const moduleId = id;
  const moduleSections = sections.filter(section => section.moduleId === moduleId);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-6"
    >
      <Card className="border-primary/20">
        <CardHeader className="py-4 flex flex-row items-center justify-between bg-primary/5">
          <div className="flex items-center">
            <span 
              className="cursor-move p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 mr-2"
              {...attributes}
              {...listeners}
            >
              <Grip className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-xl flex items-center">
                <Folder className="h-5 w-5 mr-2 text-primary" />
                {module.title}
              </CardTitle>
              {module.description && (
                <CardDescription className="text-sm mt-1">{module.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSection(moduleId)}
            >
              <ListPlus className="h-4 w-4 mr-1" />
              Add Section
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditModule(module)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive" 
              onClick={() => onDeleteModule(moduleId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            {module.duration && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{module.duration} hours</span>
              </div>
            )}
            {module.unlockDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Unlocks on {new Date(module.unlockDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <span className={`h-2 w-2 rounded-full mr-1 ${module.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{module.isPublished ? 'Published' : 'Draft'}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <span className="mr-1">{moduleSections.length}</span>
              <span>Sections</span>
            </div>
          </div>

          {/* Module Sections */}
          {moduleSections.length > 0 ? (
            moduleSections.map((section) => (
              <SortableSectionItem
                key={section.id}
                id={section.id}
                section={section}
                onEdit={onEditSection}
                onDelete={onDeleteSection}
              />
            ))
          ) : (
            <div className="text-center py-4 border rounded-lg bg-muted/30 ml-8">
              <p className="text-muted-foreground">
                No sections in this module yet.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onAddSection(moduleId)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface HierarchicalCourseBuilderProps {
  courseId: number;
}

export default function HierarchicalCourseBuilder({ courseId }: HierarchicalCourseBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isAddModuleDialogOpen, setIsAddModuleDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [addToModuleId, setAddToModuleId] = useState<number | null>(null);
  
  // Setting up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch course modules
  const { data: courseModules, isLoading: isLoadingModules } = useQuery({
    queryKey: ['/api/admin/courses', courseId, 'modules'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${courseId}/modules`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course modules:", error);
        return [];
      }
    }
  });

  // Fetch course sections
  const { data: courseSections, isLoading: isLoadingSections } = useQuery({
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

  // Set up forms for adding and editing modules
  const addModuleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined,
      isPublished: true
    }
  });

  const editModuleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: undefined,
      unlockDate: undefined,
      isPublished: true
    }
  });

  // Set up forms for adding and editing sections
  const addSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      moduleId: null,
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
      moduleId: null,
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      isPublished: true,
      type: "lesson"
    }
  });

  // Add new module mutation
  const addModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const newModule = {
        ...data,
        courseId
      };
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify(newModule),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
      setIsAddModuleDialogOpen(false);
      addModuleForm.reset();
      toast({
        title: "Module Added",
        description: "The module has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding module:", error);
      toast({
        title: "Error",
        description: "Failed to add module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CourseModule> }) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
      setIsEditModuleDialogOpen(false);
      toast({
        title: "Module Updated",
        description: "The module has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating module:", error);
      toast({
        title: "Error",
        description: "Failed to update module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      toast({
        title: "Module Deleted",
        description: "The module and its sections have been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting module:", error);
      toast({
        title: "Error",
        description: "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update module order mutation
  const updateModuleOrderMutation = useMutation({
    mutationFn: async (modules: CourseModule[]) => {
      const updates = modules.map((module, index) => ({
        id: module.id,
        order: index + 1
      }));
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ modules: updates }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
    },
    onError: (error) => {
      console.error("Error updating module order:", error);
      toast({
        title: "Error",
        description: "Failed to update module order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      const newSection = {
        ...data,
        courseId,
        moduleId: data.moduleId ?? null
      };
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections`, {
        method: 'POST',
        body: JSON.stringify(newSection),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      setIsAddSectionDialogOpen(false);
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
      setIsEditSectionDialogOpen(false);
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

  // Update local modules and sections when API data changes
  useEffect(() => {
    if (courseModules) {
      const sortedModules = [...courseModules].sort((a, b) => a.order - b.order);
      setModules(sortedModules);
    }
  }, [courseModules]);

  useEffect(() => {
    if (courseSections) {
      const sortedSections = [...courseSections].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    }
  }, [courseSections]);

  // Handle adding a new module
  const onAddModuleSubmit = (data: ModuleFormValues) => {
    addModuleMutation.mutate(data);
  };

  // Handle updating a module
  const onEditModuleSubmit = (data: ModuleFormValues) => {
    if (selectedModule) {
      updateModuleMutation.mutate({
        id: selectedModule.id,
        data: data
      });
    }
  };

  // Handle adding a new section
  const onAddSectionSubmit = (data: SectionFormValues) => {
    addSectionMutation.mutate(data);
  };

  // Handle updating a section
  const onEditSectionSubmit = (data: SectionFormValues) => {
    if (selectedSection) {
      updateSectionMutation.mutate({
        id: selectedSection.id,
        data: data
      });
    }
  };

  // Handle opening edit module dialog
  const handleEditModule = (module: CourseModule) => {
    setSelectedModule(module);
    editModuleForm.reset({
      title: module.title,
      description: module.description || "",
      duration: module.duration,
      unlockDate: module.unlockDate ? new Date(module.unlockDate).toISOString().split('T')[0] : undefined,
      isPublished: module.isPublished === null ? true : module.isPublished !== undefined ? module.isPublished : true
    });
    setIsEditModuleDialogOpen(true);
  };

  // Handle opening edit section dialog
  const handleEditSection = (section: CourseSection) => {
    setSelectedSection(section);
    editSectionForm.reset({
      title: section.title,
      description: section.description || "",
      moduleId: section.moduleId || null,
      duration: section.duration,
      unlockDate: section.unlockDate ? new Date(section.unlockDate).toISOString().split('T')[0] : undefined,
      videoUrl: section.videoUrl || "",
      contentUrl: section.contentUrl || "",
      isPublished: section.isPublished === null ? true : section.isPublished !== undefined ? section.isPublished : true,
      type: section.type || "lesson"
    });
    setIsEditSectionDialogOpen(true);
  };

  // Handle opening add section dialog specific to a module
  const handleAddSectionToModule = (moduleId: number) => {
    setAddToModuleId(moduleId);
    addSectionForm.reset({
      title: "",
      description: "",
      moduleId: moduleId,
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      isPublished: true,
      type: "lesson"
    });
    setIsAddSectionDialogOpen(true);
  };

  // Handle deleting a module
  const handleDeleteModule = (moduleId: number) => {
    if (confirm("Are you sure you want to delete this module? This will also delete all sections in this module. This action cannot be undone.")) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  // Handle deleting a section
  const handleDeleteSection = (sectionId: number) => {
    if (confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
      deleteSectionMutation.mutate(sectionId);
    }
  };

  // Handle drag end event for modules
  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setModules((modules) => {
        const oldIndex = modules.findIndex(module => `module-${module.id}` === active.id);
        const newIndex = modules.findIndex(module => `module-${module.id}` === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newModules = arrayMove(modules, oldIndex, newIndex);
          
          // Update the order in the database
          updateModuleOrderMutation.mutate(newModules);
          
          return newModules;
        }
        
        return modules;
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddSectionDialogOpen(true)} variant="outline">
            <ListPlus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
          <Button onClick={() => setIsAddModuleDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoadingModules || isLoadingSections ? (
          <div className="text-center py-8">
            <p>Loading course content...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-medium">No modules yet</h3>
            <p className="text-muted-foreground mb-4">
              This course doesn't have any modules yet. Add your first module to get started.
            </p>
            <Button onClick={() => setIsAddModuleDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Add First Module
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleModuleDragEnd}
          >
            <SortableContext
              items={modules.map(module => `module-${module.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {modules.map((module) => (
                <SortableModuleItem
                  key={module.id}
                  id={module.id}
                  module={module}
                  sections={sections}
                  onEditModule={handleEditModule}
                  onDeleteModule={handleDeleteModule}
                  onAddSection={handleAddSectionToModule}
                  onEditSection={handleEditSection}
                  onDeleteSection={handleDeleteSection}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Module Dialog */}
      <Dialog open={isAddModuleDialogOpen} onOpenChange={setIsAddModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>
              Add a new module to your course. Modules help organize your content into logical groups.
            </DialogDescription>
          </DialogHeader>
          <Form {...addModuleForm}>
            <form onSubmit={addModuleForm.handleSubmit(onAddModuleSubmit)} className="space-y-4">
              <FormField
                control={addModuleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter module title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addModuleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter module description (optional)" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addModuleForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 2" 
                          min="0"
                          step="0.5"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          value={field.value === null ? "" : field.value || ""}
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addModuleForm.control}
                  name="unlockDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unlock Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addModuleForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Module
                      </FormLabel>
                      <FormDescription>
                        When checked, this module will be visible to students.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModuleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Module</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={isEditModuleDialogOpen} onOpenChange={setIsEditModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>
              Update the details of this module.
            </DialogDescription>
          </DialogHeader>
          <Form {...editModuleForm}>
            <form onSubmit={editModuleForm.handleSubmit(onEditModuleSubmit)} className="space-y-4">
              <FormField
                control={editModuleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter module title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editModuleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter module description (optional)" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editModuleForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 2" 
                          min="0"
                          step="0.5"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          value={field.value === null ? "" : field.value || ""}
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editModuleForm.control}
                  name="unlockDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unlock Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editModuleForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Module
                      </FormLabel>
                      <FormDescription>
                        When checked, this module will be visible to students.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModuleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Module</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Add a new section to your course. Sections can be lessons, quizzes, or exams.
            </DialogDescription>
          </DialogHeader>
          <Form {...addSectionForm}>
            <form onSubmit={addSectionForm.handleSubmit(onAddSectionSubmit)} className="space-y-4">
              <FormField
                control={addSectionForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={addToModuleId ? addToModuleId.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select which module this section belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lesson">Lesson</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of content for this section.
                    </FormDescription>
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
                      <Input {...field} placeholder="Enter section title" />
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
                        {...field} 
                        placeholder="Enter section description (optional)" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addSectionForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number" 
                          placeholder="e.g. 1" 
                          min="0"
                          step="0.5"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
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
                          {...field}
                          type="date" 
                        />
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
                      <Input 
                        {...field}
                        placeholder="Enter video URL (optional)" 
                      />
                    </FormControl>
                    <FormDescription>
                      YouTube or other video hosting URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Enter materials URL (optional)" 
                      />
                    </FormControl>
                    <FormDescription>
                      URL to slides, documents, or other materials.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addSectionForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Section
                      </FormLabel>
                      <FormDescription>
                        When checked, this section will be visible to students.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddSectionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Section</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the details of this section.
            </DialogDescription>
          </DialogHeader>
          <Form {...editSectionForm}>
            <form onSubmit={editSectionForm.handleSubmit(onEditSectionSubmit)} className="space-y-4">
              <FormField
                control={editSectionForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select which module this section belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lesson">Lesson</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of content for this section.
                    </FormDescription>
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
                      <Input {...field} placeholder="Enter section title" />
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
                        {...field} 
                        placeholder="Enter section description (optional)" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editSectionForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number" 
                          placeholder="e.g. 1" 
                          min="0"
                          step="0.5"
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          value={field.value || ""}
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
                          {...field}
                          type="date" 
                        />
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
                      <Input 
                        {...field}
                        placeholder="Enter video URL (optional)" 
                      />
                    </FormControl>
                    <FormDescription>
                      YouTube or other video hosting URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Enter materials URL (optional)" 
                      />
                    </FormControl>
                    <FormDescription>
                      URL to slides, documents, or other materials.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSectionForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Section
                      </FormLabel>
                      <FormDescription>
                        When checked, this section will be visible to students.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditSectionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Section</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}