import { useState, useEffect, ChangeEvent } from "react";
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
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
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
  ListPlus,
  FilePlus,
  FileQuestion,
  FileCheck,
  AlertTriangle,
  Info
} from "lucide-react";

// Schema for validating module form inputs
const moduleSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  unlockDate: z.string().optional().nullable(),
  isPublished: z.boolean().default(true)
});

// Schema for validating section form inputs
const sectionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().or(z.literal('')),
  moduleId: z.number(),
  duration: z.number().optional().nullable(),
  unlockDate: z.string().optional().nullable().or(z.literal('')),
  videoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  contentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  contentType: z.enum(["text", "video"]).default("text").optional(),
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
  type: "lesson" | "quiz" | "exam";
  contentType?: "text" | "video" | null;
  content?: string | null;
  videoUrl?: string | null;
  contentUrl?: string | null;
  duration?: number | null;
  unlockDate?: string | null;
  isPublished?: boolean | null;
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

interface Course {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  price: number;
  duration: number;
  status: string;
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
  onSectionDragEnd: (event: DragEndEvent, moduleId: number) => void;
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
  } = useSortable({ id: `section-${id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Get icon based on section type
  const getSectionIcon = () => {
    switch(section.type) {
      case 'quiz':
        return <FileQuestion className="h-4 w-4 mr-2 text-blue-600" />;
      case 'exam':
        return <FileCheck className="h-4 w-4 mr-2 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 mr-2 text-primary" />;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-3 ml-8"
    >
      <Card className={`border-l-4 ${
        section.type === 'quiz' 
          ? 'border-l-blue-500' 
          : section.type === 'exam'
            ? 'border-l-purple-500'
            : 'border-l-primary'
      }`}>
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
                {getSectionIcon()}
                {section.title}
                {section.type === "quiz" && <Badge className="ml-2 bg-blue-500">Quiz</Badge>}
                {section.type === "exam" && <Badge className="ml-2 bg-purple-500">Exam</Badge>}
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
                <span>Video Content</span>
              </div>
            )}
            {section.contentUrl && (
              <div className="flex items-center text-muted-foreground">
                <FileText className="h-4 w-4 mr-1" />
                <span>Additional Materials</span>
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
  id, module, sections, onEditModule, onDeleteModule, onAddSection, 
  onEditSection, onDeleteSection, onSectionDragEnd 
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
  
  // Setting up sensors for drag detection for sections
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    } as any)
  );

  // Handle dropping a section within a module
  const handleSectionDragEnd = (event: DragEndEvent) => {
    onSectionDragEnd(event, moduleId);
  };

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
              variant="outline"
              size="sm"
              onClick={() => onAddSection(moduleId)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Content
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
            <div className="flex items-center">
              <span className="mr-1 px-2 py-1 bg-gray-100 rounded-md">{moduleSections.length}</span>
              <span>Items</span>
            </div>
          </div>

          {/* Module Sections with drag-and-drop */}
          {moduleSections.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={moduleSections.map(section => `section-${section.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {moduleSections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    id={section.id}
                    section={section}
                    onEdit={onEditSection}
                    onDelete={onDeleteSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-4 border rounded-lg bg-muted/30 ml-8">
              <p className="text-muted-foreground">
                No content in this module yet
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onAddSection(moduleId)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Content
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface EnhancedCourseBuilderProps {
  courseId: number;
}

export default function EnhancedCourseBuilder({ courseId }: EnhancedCourseBuilderProps) {
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
  const [activeTab, setActiveTab] = useState<string>("lesson");
  
  // Setting up sensors for drag detection for modules
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    } as any)
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

  // Update state when data loads
  useEffect(() => {
    if (courseModules) {
      // Sort modules by order
      const sortedModules = [...courseModules].sort((a, b) => a.order - b.order);
      setModules(sortedModules);
    }
  }, [courseModules]);

  useEffect(() => {
    if (courseSections) {
      // Sort sections by order within their modules
      const sortedSections = [...courseSections].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    }
  }, [courseSections]);

  // Set up forms for adding and editing modules
  const addModuleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: null,
      duration: null,
      unlockDate: null,
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
      moduleId: 0,
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      content: "",
      contentType: "text",
      isPublished: true,
      type: "lesson"
    }
  });

  const editSectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
      moduleId: 0,
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      content: "",
      contentType: "text",
      isPublished: true,
      type: "lesson"
    }
  });

  // Add new module mutation
  const addModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const newModule = {
        ...data,
        courseId,
        order: modules.length + 1
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
        description: "The module has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to add module:", error);
      toast({
        title: "Error",
        description: "Failed to add module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Edit existing module mutation
  const editModuleMutation = useMutation({
    mutationFn: async (data: { id: number; data: ModuleFormValues }) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
      setIsEditModuleDialogOpen(false);
      editModuleForm.reset();
      
      toast({
        title: "Module Updated",
        description: "The module has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update module:", error);
      toast({
        title: "Error",
        description: "Failed to update module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      
      toast({
        title: "Module Deleted",
        description: "The module and all its sections have been deleted.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete module:", error);
      toast({
        title: "Error",
        description: "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update module order mutation
  const updateModuleOrderMutation = useMutation({
    mutationFn: async (updatedModules: CourseModule[]) => {
      const orderData = {
        modules: updatedModules.map((module, idx) => ({
          id: module.id,
          order: idx + 1
        }))
      };
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/modules/reorder`, {
        method: 'PATCH',
        body: JSON.stringify(orderData),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'modules'] });
    },
    onError: (error) => {
      console.error("Failed to update module order:", error);
      toast({
        title: "Error",
        description: "Failed to reorder modules. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      // Count the number of existing sections for this module to set order
      const moduleId = data.moduleId;
      const existingSections = sections.filter(s => s.moduleId === moduleId);
      
      // Clean up data to handle empty strings and null values properly
      const cleanedData = {
        ...data,
        description: data.description || null,
        contentType: data.contentType || null,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        contentUrl: data.contentUrl || null,
        duration: data.duration || null,
        unlockDate: data.unlockDate || null,
        isPublished: data.isPublished === undefined ? true : data.isPublished,
      };
      
      const newSection = {
        ...cleanedData,
        courseId,
        order: existingSections.length + 1
      };
      
      console.log("Sending section data:", newSection);
      
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
        description: "The section has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to add section:", error);
      toast({
        title: "Error",
        description: "Failed to add section. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Edit existing section mutation
  const editSectionMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<SectionFormValues> }) => {
      // Clean up data to handle empty strings and null values properly
      const cleanedData = {
        ...data.data,
        description: data.data.description || null,
        contentType: data.data.contentType || null,
        content: data.data.content || null,
        videoUrl: data.data.videoUrl || null,
        contentUrl: data.data.contentUrl || null,
        duration: data.data.duration || null,
        unlockDate: data.data.unlockDate || null,
        isPublished: data.data.isPublished === undefined ? true : data.data.isPublished,
      };
      
      console.log("Sending update section data:", cleanedData);
      
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanedData),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
      setIsEditSectionDialogOpen(false);
      editSectionForm.reset();
      
      toast({
        title: "Section Updated",
        description: "The section has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update section:", error);
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
      const response = await apiRequest(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
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
      console.error("Failed to delete section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update section order mutation
  const updateSectionOrderMutation = useMutation({
    mutationFn: async (data: { moduleId: number; sections: CourseSection[] }) => {
      // For each section, update its order
      for (const [index, section] of data.sections.entries()) {
        await apiRequest(`/api/admin/courses/${courseId}/sections/${section.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ order: index + 1 }),
        });
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId, 'sections'] });
    },
    onError: (error) => {
      console.error("Failed to update section order:", error);
      toast({
        title: "Error",
        description: "Failed to reorder sections. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onAddModuleSubmit = (data: ModuleFormValues) => {
    // Clean up the module data - only send title and defaults for best practice
    const moduleData = {
      title: data.title,
      description: null,
      duration: null,
      unlockDate: null,
      isPublished: true
    };
    
    addModuleMutation.mutate(moduleData);
  };

  const onEditModuleSubmit = (data: ModuleFormValues) => {
    if (!selectedModule) return;
    
    editModuleMutation.mutate({
      id: selectedModule.id,
      data
    });
  };

  const onAddSectionSubmit = (data: SectionFormValues) => {
    addSectionMutation.mutate(data);
  };

  const onEditSectionSubmit = (data: SectionFormValues) => {
    if (!selectedSection) return;
    
    editSectionMutation.mutate({
      id: selectedSection.id,
      data
    });
  };

  // Handle opening edit module dialog
  const handleEditModule = (module: CourseModule) => {
    setSelectedModule(module);
    
    editModuleForm.reset({
      title: module.title,
      description: module.description || "",
      duration: module.duration !== null ? module.duration : undefined,
      unlockDate: module.unlockDate ? new Date(module.unlockDate).toISOString().split('T')[0] : undefined,
      isPublished: module.isPublished !== undefined ? module.isPublished : true
    });
    
    setIsEditModuleDialogOpen(true);
  };

  // Handle opening edit section dialog
  const handleEditSection = (section: CourseSection) => {
    setSelectedSection(section);
    setActiveTab(section.type || "lesson");
    
    editSectionForm.reset({
      title: section.title,
      description: section.description || "",
      moduleId: section.moduleId || 0,
      duration: section.duration !== null ? section.duration : undefined,
      unlockDate: section.unlockDate ? new Date(section.unlockDate).toISOString().split('T')[0] : undefined,
      videoUrl: section.videoUrl || "",
      contentUrl: section.contentUrl || "",
      content: section.content || "",
      contentType: section.contentType || "text",
      isPublished: section.isPublished === null ? true : section.isPublished !== undefined ? section.isPublished : true,
      type: section.type || "lesson"
    });
    setIsEditSectionDialogOpen(true);
  };

  // Handle opening add section dialog specific to a module
  const handleAddSectionToModule = (moduleId: number) => {
    setAddToModuleId(moduleId);
    setActiveTab("lesson");
    addSectionForm.reset({
      title: "",
      description: "",
      moduleId: moduleId,
      duration: undefined,
      unlockDate: undefined,
      videoUrl: "",
      contentUrl: "",
      content: "",
      contentType: "text",
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

  // Handle drag end event for sections within a module
  const handleSectionDragEnd = (event: DragEndEvent, moduleId: number) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the sections for this moduleId
      const moduleSections = sections.filter(section => section.moduleId === moduleId);
      
      // Find the indices within the filtered array
      const oldIndex = moduleSections.findIndex(section => `section-${section.id}` === active.id);
      const newIndex = moduleSections.findIndex(section => `section-${section.id}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder the sections within the module
        const newModuleSections = arrayMove(moduleSections, oldIndex, newIndex);
        
        // Update the full sections array
        const newSections = [...sections];
        for (const section of newSections) {
          if (section.moduleId === moduleId) {
            // Remove it so we can replace with the new order
            const idx = newSections.findIndex(s => s.id === section.id);
            if (idx !== -1) {
              newSections.splice(idx, 1);
            }
          }
        }
        
        // Add back the reordered sections
        newSections.push(...newModuleSections);
        
        // Update state
        setSections(newSections);
        
        // Update the order in the database
        updateSectionOrderMutation.mutate({
          moduleId,
          sections: newModuleSections
        });
      }
    }
  };

  // Handle tab change in section dialogs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the section type in the form
    if (isAddSectionDialogOpen) {
      addSectionForm.setValue("type", value as "lesson" | "quiz" | "exam");
    } else if (isEditSectionDialogOpen) {
      editSectionForm.setValue("type", value as "lesson" | "quiz" | "exam");
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
          <Button onClick={() => setIsAddModuleDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      {!modules.length && !isLoadingModules && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            Start by adding a module to organize your course content. Then, add lessons, quizzes, and exams to each module.
          </AlertDescription>
        </Alert>
      )}

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
                  onSectionDragEnd={handleSectionDragEnd}
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
              Add a new module to your course. Other details can be added after creation.
            </DialogDescription>
          </DialogHeader>
          <Form {...addModuleForm}>
            <form onSubmit={addModuleForm.handleSubmit(onAddModuleSubmit)} className="space-y-4">
              <FormField
                control={addModuleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter module name" autoFocus />
                    </FormControl>
                    <FormDescription>
                      Enter a descriptive name for this module. Other details can be added later.
                    </FormDescription>
                    <FormMessage />
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
                <Button type="submit" disabled={addModuleMutation.isPending}>
                  {addModuleMutation.isPending ? "Adding..." : "Add Module"}
                </Button>
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
                          value={field.value === undefined ? "" : field.value}
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
                <Button type="submit" disabled={editModuleMutation.isPending}>
                  {editModuleMutation.isPending ? "Updating..." : "Update Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
            <DialogDescription>
              Add new content to your course module. Choose the type of content below.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="lesson" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" /> Lesson
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center">
                <FileQuestion className="mr-2 h-4 w-4" /> Quiz
              </TabsTrigger>
              <TabsTrigger value="exam" className="flex items-center">
                <FileCheck className="mr-2 h-4 w-4" /> Exam
              </TabsTrigger>
            </TabsList>
            
            <Form {...addSectionForm}>
              <form onSubmit={addSectionForm.handleSubmit(onAddSectionSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={addSectionForm.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
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
                        Select which module this content belongs to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <TabsContent value="lesson" className="space-y-4 mt-0">
                  <FormField
                    control={addSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter lesson title" />
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
                            placeholder="Enter lesson description" 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addSectionForm.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(value as "text" | "video")} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Lesson</SelectItem>
                              <SelectItem value="video">Video Lesson</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Choose whether this lesson contains text or video content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Text content area - shown only when contentType is "text" */}
                  {addSectionForm.watch('contentType') === 'text' && (
                    <FormField
                      control={addSectionForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter the lesson content with formatting..." 
                              rows={10}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the main content for your text lesson. You can use basic formatting:
                            <ul className="list-disc list-inside mt-1 ml-2 text-xs">
                              <li>**bold text** for <span className="font-bold">bold text</span></li>
                              <li>*italic text* for <span className="italic">italic text</span></li>
                              <li>- item for bullet lists</li>
                              <li>1. item for numbered lists</li>
                            </ul>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addSectionForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 1.5" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  {/* Video URL field - show only when contentType is not text (backward compatibility) */}
                  {addSectionForm.watch('contentType') !== 'text' && (
                    <FormField
                      control={addSectionForm.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter YouTube or video URL" 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a YouTube, Vimeo, or other video URL for this lesson.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={addSectionForm.control}
                    name="contentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Materials URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter URL for slides, PDF, or other materials" 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a URL for additional learning materials like PDFs, slides, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="quiz" className="space-y-4 mt-0">
                  <FormField
                    control={addSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter quiz title" />
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
                            placeholder="Enter quiz description" 
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
                              type="number" 
                              placeholder="e.g. 0.5" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      After creating this quiz, you'll be able to add questions and answers in the next step.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="exam" className="space-y-4 mt-0">
                  <FormField
                    control={addSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter exam title" />
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
                            placeholder="Enter exam description" 
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
                              type="number" 
                              placeholder="e.g. 2" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      After creating this exam, you'll be able to add questions, set passing criteria, and configure time limits in the next step.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
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
                          Publish Content
                        </FormLabel>
                        <FormDescription>
                          When checked, this content will be visible to students.
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
                  <Button type="submit" disabled={addSectionMutation.isPending}>
                    {addSectionMutation.isPending ? "Adding..." : "Add Content"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Update the content details.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="lesson" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" /> Lesson
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center">
                <FileQuestion className="mr-2 h-4 w-4" /> Quiz
              </TabsTrigger>
              <TabsTrigger value="exam" className="flex items-center">
                <FileCheck className="mr-2 h-4 w-4" /> Exam
              </TabsTrigger>
            </TabsList>
            
            <Form {...editSectionForm}>
              <form onSubmit={editSectionForm.handleSubmit(onEditSectionSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={editSectionForm.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
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
                        Move this content to a different module if needed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <TabsContent value="lesson" className="space-y-4 mt-0">
                  <FormField
                    control={editSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter lesson title" />
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
                            placeholder="Enter lesson description" 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editSectionForm.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(value as "text" | "video")} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Lesson</SelectItem>
                              <SelectItem value="video">Video Lesson</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Choose whether this lesson contains text or video content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Text content area - shown only when contentType is "text" */}
                  {editSectionForm.watch('contentType') === 'text' && (
                    <FormField
                      control={editSectionForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter the lesson content with formatting..." 
                              rows={10}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the main content for your text lesson. You can use basic formatting:
                            <ul className="list-disc list-inside mt-1 ml-2 text-xs">
                              <li>**bold text** for <span className="font-bold">bold text</span></li>
                              <li>*italic text* for <span className="italic">italic text</span></li>
                              <li>- item for bullet lists</li>
                              <li>1. item for numbered lists</li>
                            </ul>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editSectionForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 1.5" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  {/* Video URL field - show only when contentType is not text */}
                  {editSectionForm.watch('contentType') !== 'text' && (
                    <FormField
                      control={editSectionForm.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter YouTube or video URL" 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a YouTube, Vimeo, or other video URL for this lesson.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={editSectionForm.control}
                    name="contentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Materials URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter URL for slides, PDF, or other materials" 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a URL for additional learning materials like PDFs, slides, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="quiz" className="space-y-4 mt-0">
                  <FormField
                    control={editSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter quiz title" />
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
                            placeholder="Enter quiz description" 
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
                              type="number" 
                              placeholder="e.g. 0.5" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      You'll soon be able to edit quiz questions and answers here.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="exam" className="space-y-4 mt-0">
                  <FormField
                    control={editSectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter exam title" />
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
                            placeholder="Enter exam description" 
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
                              type="number" 
                              placeholder="e.g. 2" 
                              min="0"
                              step="0.25"
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
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
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      You'll soon be able to edit exam questions, passing criteria, and time limits here.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
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
                          Publish Content
                        </FormLabel>
                        <FormDescription>
                          When checked, this content will be visible to students.
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
                  <Button type="submit" disabled={editSectionMutation.isPending}>
                    {editSectionMutation.isPending ? "Updating..." : "Update Content"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}