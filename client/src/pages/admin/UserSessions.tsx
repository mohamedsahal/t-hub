import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  CardFooter,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Trash2,
  MapPin,
  Terminal,
  Globe,
  Laptop,
  Smartphone,
  Info,
  Search,
  Calendar,
  Clock,
  Key,
  User
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface UserSession {
  id: number;
  userId: number;
  sessionId: string;
  status: 'active' | 'inactive' | 'revoked' | 'suspicious';
  createdAt: string;
  lastActivity: string;
  deviceInfo: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  isMobile: boolean | null;
  ipAddress: string | null;
  location: string | null;
  city: string | null;
  regionName: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  expiresAt: string | null;
  revocationReason: string | null;
  userName?: string;
  userEmail?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UserSessions() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user information
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/admin/users', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/users/${userId}`);
      return response as User;
    }
  });

  // Fetch sessions for the user
  const { data: sessions = [], isLoading: isLoadingSessions, error } = useQuery({
    queryKey: ['/api/admin/users', userId, 'sessions'],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/users/${userId}/sessions`);
      return response as UserSession[];
    }
  });

  // Mutation to revoke a session
  const revokeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: number, reason: string }) => {
      return apiRequest(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        data: { reason }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Session revoked successfully',
        description: 'The user session has been revoked.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', userId, 'sessions'] });
      setShowRevokeDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke session',
        description: 'An error occurred while revoking the session.',
        variant: 'destructive'
      });
    }
  });

  // Mutation to mark a session as suspicious
  const markSuspiciousMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest(`/api/admin/sessions/${sessionId}/mark-suspicious`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Session marked as suspicious',
        description: 'The session has been flagged for review.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', userId, 'sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark session',
        description: 'An error occurred while marking the session as suspicious.',
        variant: 'destructive'
      });
    }
  });

  // Mutation to revoke all sessions for a user
  const revokeAllSessionsMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}/sessions`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'All sessions revoked',
        description: 'All sessions for this user have been revoked.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', userId, 'sessions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke sessions',
        description: 'An error occurred while revoking all sessions.',
        variant: 'destructive'
      });
    }
  });

  // Filter sessions based on search term and status
  const filteredSessions = React.useMemo(() => {
    let filtered = sessions;
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(session => 
        (session.deviceInfo && session.deviceInfo.toLowerCase().includes(term)) ||
        (session.location && session.location.toLowerCase().includes(term)) ||
        (session.ipAddress && session.ipAddress.toLowerCase().includes(term)) ||
        (session.browserName && session.browserName.toLowerCase().includes(term)) ||
        (session.city && session.city.toLowerCase().includes(term)) ||
        (session.countryName && session.countryName.toLowerCase().includes(term)) ||
        (session.regionName && session.regionName.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [sessions, searchTerm, filterStatus]);

  const handleRevokeClick = (session: UserSession) => {
    setSelectedSession(session);
    setShowRevokeDialog(true);
  };

  const handleConfirmRevoke = () => {
    if (selectedSession) {
      revokeSessionMutation.mutate({
        sessionId: selectedSession.id,
        reason: revokeReason || 'Revoked by admin'
      });
    }
  };

  const handleMarkSuspicious = (session: UserSession) => {
    markSuspiciousMutation.mutate(session.id);
  };

  const handleRevokeAllSessions = () => {
    if (window.confirm('Are you sure you want to revoke all sessions for this user?')) {
      revokeAllSessionsMutation.mutate(userId);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate time elapsed
  const getTimeElapsed = (dateString: string) => {
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
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'revoked':
        return 'bg-red-500';
      case 'suspicious':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Determine device icon
  const getDeviceIcon = (session: UserSession) => {
    if (session.isMobile) {
      return <Smartphone className="h-4 w-4" />;
    } else {
      return <Laptop className="h-4 w-4" />;
    }
  };

  if (isLoadingUser || isLoadingSessions) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
              </Button>
            </Link>
            <Skeleton className="h-8 w-48" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(5).fill(0).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
            </Button>
          </Link>
          
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load user sessions data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const suspiciousSessions = sessions.filter(s => s.status === 'suspicious').length;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
              </Button>
            </Link>
            <h2 className="text-3xl font-bold">Sessions for {user.name}</h2>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> {user.name}
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleRevokeAllSessions}
                  disabled={sessions.length === 0 || sessions.every(s => s.status === 'revoked')}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Revoke All Sessions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Session Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-primary" />
                        <span>Total Sessions</span>
                      </div>
                      <Badge variant="outline">{sessions.length}</Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Active Sessions</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100">{activeSessions}</Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <span>Suspicious Sessions</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-100">{suspiciousSessions}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Last Known Location</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    {sessions.length > 0 && sessions.some(s => s.city || s.countryName) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {sessions.find(s => s.city)?.city || 'Unknown City'}, 
                            {sessions.find(s => s.regionName)?.regionName ? ` ${sessions.find(s => s.regionName)?.regionName},` : ''} 
                            {sessions.find(s => s.countryName)?.countryName || 'Unknown Country'}
                          </span>
                        </div>
                        {sessions.find(s => s.ipAddress) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            <span>{sessions.find(s => s.ipAddress)?.ipAddress}</span>
                          </div>
                        )}
                        {sessions.find(s => s.latitude && s.longitude) && (
                          <div className="text-xs text-muted-foreground">
                            Lat: {sessions.find(s => s.latitude)?.latitude}, 
                            Lng: {sessions.find(s => s.longitude)?.longitude}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <MapPin className="h-8 w-8 mb-2 opacity-30" />
                        <span>No location data available</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Last Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    {sessions.length > 0 ? (
                      <div className="space-y-2">
                        {sessions.some(s => s.lastActivity) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {getTimeElapsed(sessions.sort((a, b) => 
                                new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
                              )[0].lastActivity)}
                            </span>
                          </div>
                        )}
                        {sessions.some(s => s.createdAt) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              First seen: {formatDate(sessions.sort((a, b) => 
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                              )[0].createdAt)}
                            </span>
                          </div>
                        )}
                        {sessions.some(s => s.deviceInfo) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getDeviceIcon(sessions.find(s => s.deviceInfo) as UserSession)}
                            <span>{sessions.find(s => s.deviceInfo)?.deviceInfo}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-30" />
                        <span>No activity data available</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Tabs defaultValue="all" className="w-[400px]">
                    <TabsList>
                      <TabsTrigger value="all" onClick={() => setFilterStatus('all')}>All</TabsTrigger>
                      <TabsTrigger value="active" onClick={() => setFilterStatus('active')}>Active</TabsTrigger>
                      <TabsTrigger value="suspicious" onClick={() => setFilterStatus('suspicious')}>Suspicious</TabsTrigger>
                      <TabsTrigger value="revoked" onClick={() => setFilterStatus('revoked')}>Revoked</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <ScrollArea className="h-[500px] w-full rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[200px]">Device / Browser</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Session Start</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No sessions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
                        <TableRow key={session.id} className={session.status === 'suspicious' ? 'bg-amber-50' : ''}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              {getDeviceIcon(session)}
                              <div>
                                <div className="font-medium">
                                  {session.deviceInfo || 'Unknown Device'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {session.browserName && session.browserVersion && (
                                    <span>{session.browserName} {session.browserVersion}</span>
                                  )}
                                  {!session.browserName && <span>Unknown Browser</span>}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium">
                                  {session.city || 'Unknown City'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {session.regionName && <span>{session.regionName}, </span>}
                                  {session.countryName || 'Unknown Country'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {session.ipAddress || 'Unknown IP'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${getStatusColor(session.status)}`}></span>
                              <span className="capitalize">{session.status}</span>
                              {session.status === 'suspicious' && (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            {session.status === 'revoked' && session.revocationReason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.revocationReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              {formatDate(session.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.sessionId && (
                                <div className="flex items-center gap-0.5">
                                  <Key className="h-3 w-3" />
                                  <span className="font-mono">{session.sessionId.substring(0, 8)}...</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTimeElapsed(session.lastActivity)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkSuspicious(session)}
                                disabled={session.status === 'suspicious' || session.status === 'revoked'}
                                className="h-8"
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRevokeClick(session)}
                                disabled={session.status === 'revoked'}
                                className="h-8"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground flex justify-between">
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>Showing {filteredSessions.length} of {sessions.length} sessions</span>
              </div>
              {sessions.length > 0 && (
                <div>
                  Last updated: {formatDate(new Date().toISOString())}
                </div>
              )}
            </CardFooter>
          </Card>

          {selectedSession && (
            <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Revoke Session</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke this session? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Revocation</Label>
                    <Input
                      id="reason"
                      placeholder="Enter reason for revocation"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Session Details</h4>
                    <p className="text-sm">Device: {selectedSession.deviceInfo || 'Unknown Device'}</p>
                    <p className="text-sm">Location: {`${selectedSession.city || 'Unknown'}, ${selectedSession.countryName || 'Unknown'}`}</p>
                    <p className="text-sm">IP Address: {selectedSession.ipAddress || 'Unknown'}</p>
                    <p className="text-sm">Created: {formatDate(selectedSession.createdAt)}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleConfirmRevoke}>Revoke Session</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}