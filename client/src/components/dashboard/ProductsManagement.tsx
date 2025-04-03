import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Trash2, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number | null;
  features: string[];
  imageUrl: string | null;
  demoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum([
    "custom",
    "restaurant", 
    "school", 
    "laundry", 
    "inventory", 
    "task", 
    "hotel", 
    "hospital", 
    "dental", 
    "realestate", 
    "travel", 
    "shop"
  ]),
  price: z.coerce.number().min(0).nullish(),
  features: z.string().transform(val => val.split(',').map(item => item.trim())).or(z.array(z.string())),
  imageUrl: z.string().url("Must be a valid URL").nullable(),
  demoUrl: z.string().url("Must be a valid URL").nullable(),
  isActive: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductsManagement = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductFormValues }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'custom',
      price: 0,
      features: '',
      imageUrl: '',
      demoUrl: '',
      isActive: true
    }
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'custom',
      price: 0,
      features: '',
      imageUrl: '',
      demoUrl: '',
      isActive: true
    }
  });

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description,
      type: product.type as any,
      price: product.price,
      features: product.features ? product.features.join(', ') : '',
      imageUrl: product.imageUrl,
      demoUrl: product.demoUrl,
      isActive: product.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (product: Product) => {
    setCurrentProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleSubmitAdd = (data: ProductFormValues) => {
    createMutation.mutate(data);
  };

  const handleSubmitEdit = (data: ProductFormValues) => {
    if (currentProduct) {
      updateMutation.mutate({ id: currentProduct.id, data });
    }
  };

  const formatProductType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getProductTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'bg-red-100 text-red-800';
      case 'school':
        return 'bg-blue-100 text-blue-800';
      case 'hotel':
        return 'bg-yellow-100 text-yellow-800';
      case 'hospital':
        return 'bg-green-100 text-green-800';
      case 'laundry':
        return 'bg-purple-100 text-purple-800';
      case 'shop':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">SaaS Products Management</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">SaaS Products Management</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Failed to load products. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SaaS Products Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New SaaS Product</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new SaaS product to the platform.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleSubmitAdd)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., T-Hub Restaurant Management" {...field} />
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
                        <FormLabel>Product Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="laundry">Laundry</SelectItem>
                              <SelectItem value="inventory">Inventory</SelectItem>
                              <SelectItem value="task">Task Management</SelectItem>
                              <SelectItem value="hotel">Hotel</SelectItem>
                              <SelectItem value="hospital">Hospital</SelectItem>
                              <SelectItem value="dental">Dental</SelectItem>
                              <SelectItem value="realestate">Real Estate</SelectItem>
                              <SelectItem value="travel">Travel</SelectItem>
                              <SelectItem value="shop">Shop/Retail</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Comprehensive description of the product..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="E.g., 99.99" 
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for custom pricing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Display this product on the website
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
                <FormField
                  control={addForm.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Inventory tracking, Customer management, Receipt printing, Sales reports, Cloud backup"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        List features separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to product image or screenshot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="demoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Demo URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://demo.example.com" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to live demo site
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SaaS Product</DialogTitle>
            <DialogDescription>
              Update the details of the SaaS product.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., T-Hub Restaurant Management" {...field} />
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
                      <FormLabel>Product Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="laundry">Laundry</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="task">Task Management</SelectItem>
                            <SelectItem value="hotel">Hotel</SelectItem>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="dental">Dental</SelectItem>
                            <SelectItem value="realestate">Real Estate</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="shop">Shop/Retail</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comprehensive description of the product..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="E.g., 99.99" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for custom pricing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <FormDescription>
                          Display this product on the website
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
              <FormField
                control={editForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Inventory tracking, Customer management, Receipt printing, Sales reports, Cloud backup"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List features separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Link to product image or screenshot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demo URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://demo.example.com" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Link to live demo site
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  {currentProduct.imageUrl ? (
                    <div className="rounded-md overflow-hidden border">
                      <img 
                        src={currentProduct.imageUrl} 
                        alt={currentProduct.name} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-md flex items-center justify-center h-40">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-bold">{currentProduct.name}</h3>
                    <Badge variant="outline" className={getProductTypeBadgeColor(currentProduct.type)}>
                      {formatProductType(currentProduct.type)}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-600">Description</h4>
                    <p>{currentProduct.description}</p>
                  </div>
                  
                  {currentProduct.price !== null && (
                    <div>
                      <h4 className="font-medium text-gray-600">Pricing</h4>
                      <p className="text-xl font-semibold">${currentProduct.price.toFixed(2)}/month</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-600 mr-2">Status:</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentProduct.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {currentProduct.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-600 mb-2">Features</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {currentProduct.features && currentProduct.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>

              {currentProduct.demoUrl && (
                <div>
                  <h4 className="font-medium text-gray-600 mb-2">Demo</h4>
                  <p>
                    <a 
                      href={currentProduct.demoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {currentProduct.demoUrl}
                    </a>
                  </p>
                </div>
              )}
              
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All SaaS Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getProductTypeBadgeColor(product.type)}>
                        {formatProductType(product.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.price !== null ? `$${product.price.toFixed(2)}/month` : 'Custom'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleView(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">No SaaS products found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsManagement;