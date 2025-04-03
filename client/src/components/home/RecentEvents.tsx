import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string | null;
  isActive: boolean;
}

const RecentEvents = () => {
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events?upcoming=true&active=true");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
              <CardFooter className="bg-gray-200 h-12"></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Upcoming Events</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load events. Please try again later.</p>
        </div>
      </div>
    );
  }

  // If no events are found
  if (!events || events.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Upcoming Events</h2>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-6 rounded text-center">
          <p className="text-lg">No upcoming events at the moment. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-10">Upcoming Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          // Parse the date string to Date object
          const eventDate = new Date(event.date);
          
          return (
            <Card key={event.id} className="overflow-hidden flex flex-col h-full shadow-md transition-all duration-300 hover:shadow-lg">
              {event.imageUrl ? (
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${event.imageUrl})` }}
                ></div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-white" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center text-sm text-blue-600 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(eventDate, 'MMMM dd, yyyy')}</span>
                  <Clock className="h-4 w-4 ml-4 mr-1" />
                  <span>{format(eventDate, 'h:mm a')}</span>
                </div>
                <CardTitle>{event.title}</CardTitle>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{event.location}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="line-clamp-3">
                  {event.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-4 mt-auto">
                <Button className="w-full">Register Now</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecentEvents;