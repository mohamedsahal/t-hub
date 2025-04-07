import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, User, Terminal, Search, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserWithSessionInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  activeSessions: number;
  suspiciousSessions: number;
  lastActivity: string | null;
  lastLocation: string | null;
  lastIp: string | null;
  lastDevice: string | null;
}

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch all users with session information
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/users/sessions-summary'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/users/sessions-summary');
      return response as UserWithSessionInfo[];
    }
  });

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      (user.lastLocation && user.lastLocation.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Users Management</h2>
          <div className="w-64 h-10">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading User Data</CardTitle>
            <CardDescription>Please wait while we fetch user information...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load user data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Users Management</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Last Location</TableHead>
                    <TableHead>Last Device</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{user.activeSessions} active</Badge>
                            {user.suspiciousSessions > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                {user.suspiciousSessions}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastActivity ? (
                            <span>{formatTimeAgo(user.lastActivity)}</span>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLocation ? (
                            <span>{user.lastLocation}</span>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastDevice ? (
                            <span>{user.lastDevice}</span>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/users/${user.id}/sessions`}>
                            <Button size="sm" variant="outline">
                              View Sessions
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }
}