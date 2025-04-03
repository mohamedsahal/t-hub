import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Laptop, ShoppingCart, School, Building } from "lucide-react";

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
}

const SaasProducts = () => {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products?active=true");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold text-center mb-10">Our SaaS Solutions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[480px] shadow-md animate-pulse">
              <CardHeader className="bg-gray-200 h-20"></CardHeader>
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
              </CardContent>
              <CardFooter className="bg-gray-200 h-14 mt-auto"></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold text-center mb-10">Our SaaS Solutions</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load products. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get icon based on product type
  const getProductIcon = (type: string) => {
    switch(type) {
      case "shop":
        return <ShoppingCart className="h-10 w-10" />;
      case "school":
        return <School className="h-10 w-10" />;
      case "hospital":
        return <Building className="h-10 w-10" />;
      default:
        return <Laptop className="h-10 w-10" />;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-10">Our SaaS Solutions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products?.map((product) => (
          <Card key={product.id} className="h-full flex flex-col shadow-md transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                {getProductIcon(product.type)}
                <Badge variant="outline">{product.type}</Badge>
              </div>
              <CardTitle className="mt-4">{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {product.price && (
                <div className="font-bold text-xl mb-4">${product.price.toFixed(2)}/month</div>
              )}
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {product.features?.map((feature, index) => (
                  <li key={index} className="text-sm">{feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4 mt-auto">
              <Button variant="outline" asChild>
                <a href={product.demoUrl || "#"} target="_blank" rel="noopener noreferrer">
                  View Demo
                </a>
              </Button>
              <Button>Get Started</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SaasProducts;