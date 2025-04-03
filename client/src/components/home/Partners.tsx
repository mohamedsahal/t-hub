import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Partner {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

const Partners = () => {
  const { data: partners, isLoading, error } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: async () => {
      const response = await fetch("/api/partners?active=true");
      if (!response.ok) {
        throw new Error("Failed to fetch partners");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Our Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="flex flex-col items-center p-6">
                  <div className="h-16 w-16 rounded-full bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Our Partners</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Failed to load partners. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Our Partners</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {partners?.map((partner) => (
            <a 
              key={partner.id} 
              href={partner.websiteUrl || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="transition-all duration-300 hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-6">
                  <Avatar className="h-16 w-16 mb-4">
                    {partner.logoUrl ? (
                      <AvatarImage src={partner.logoUrl} alt={partner.name} />
                    ) : null}
                    <AvatarFallback className="text-lg font-bold">
                      {partner.name.split(" ").map(word => word[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-center mb-2">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-sm text-center text-gray-500 line-clamp-2">{partner.description}</p>
                  )}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Partners;