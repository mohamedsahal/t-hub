import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Clock, Info, Shield, ShieldAlert, Terminal, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserSession {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'revoked' | 'suspicious';
  deviceInfo: string | null;
  location: string | null;
  ipAddress: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  isMobile: boolean | null;
  sessionId: string;
  expiresAt: string | null;
  revocationReason: string | null;
  isCurrentSession?: boolean;
}

export default function SessionManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sessions
  const { data: allSessions = [], isLoading: isLoadingAll, error: errorAll } = useQuery({
    queryKey: ['/api/admin/sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/sessions');
      return response as UserSession[];
    }
  });

  // Fetch suspicious sessions
  const { data: suspiciousSessions = [], isLoading: isLoadingSuspicious, error: errorSuspicious } = useQuery({
    queryKey: ['/api/admin/sessions/suspicious'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/sessions/suspicious');
      return response as UserSession[];
    }
  });

  // Get user sessions if a user is selected
  const { data: userSessions = [], isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/admin/users', selectedUserId, 'sessions'],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const response = await apiRequest(`/api/admin/users/${selectedUserId}/sessions`);
      return response as UserSession[];
    },
    enabled: !!selectedUserId
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions/suspicious'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUserId, 'sessions'] });
      }
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions/suspicious'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUserId, 'sessions'] });
      }
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions/suspicious'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUserId, 'sessions'] });
      }
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
    let sessions: UserSession[] = [];
    
    if (activeTab === 'all') {
      sessions = allSessions;
    } else if (activeTab === 'suspicious') {
      sessions = suspiciousSessions;
    } else if (activeTab === 'user' && selectedUserId) {
      sessions = userSessions;
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sessions = sessions.filter(session => 
        (session.userName && session.userName.toLowerCase().includes(term)) ||
        (session.userEmail && session.userEmail.toLowerCase().includes(term)) ||
        (session.deviceInfo && session.deviceInfo.toLowerCase().includes(term)) ||
        (session.location && session.location.toLowerCase().includes(term)) ||
        (session.ipAddress && session.ipAddress.toLowerCase().includes(term)) ||
        (session.browserName && session.browserName.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      sessions = sessions.filter(session => session.status === filterStatus);
    }
    
    return sessions;
  }, [activeTab, allSessions, suspiciousSessions, userSessions, searchTerm, filterStatus, selectedUserId]);

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

  const handleRevokeAllSessions = (userId: number) => {
    if (window.confirm('Are you sure you want to revoke all sessions for this user?')) {
      revokeAllSessionsMutation.mutate(userId);
    }
  };

  const handleViewUserSessions = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setActiveTab('user');
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

  if (isLoadingAll || isLoadingSuspicious || (activeTab === 'user' && isLoadingUser)) {
    return <div className="flex justify-center items-center h-96">Loading session data...</div>;
  }

  if (errorAll || errorSuspicious) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load session data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Session Management</h2>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {suspiciousSessions.length > 0 && (
          <Alert className="bg-amber-100 border-amber-600">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Warning</AlertTitle>
            <AlertDescription className="text-amber-800">
              There are {suspiciousSessions.length} suspicious sessions detected in the system.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span>All Sessions</span>
              <Badge variant="outline">{allSessions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="suspicious" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span>Suspicious</span>
              <Badge variant="destructive">{suspiciousSessions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="user" disabled={!selectedUserId} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>User</span>
              {selectedUserId && <Badge variant="outline">{userSessions.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <SessionsTable 
              sessions={filteredSessions}
              onViewUser={handleViewUserSessions}
              onRevoke={handleRevokeClick}
              onMarkSuspicious={handleMarkSuspicious}
              formatDate={formatDate}
              getTimeElapsed={getTimeElapsed}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          <TabsContent value="suspicious" className="mt-4">
            {suspiciousSessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Suspicious Sessions</CardTitle>
                  <CardDescription>
                    There are currently no suspicious sessions detected in the system.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <SessionsTable 
                sessions={filteredSessions}
                onViewUser={handleViewUserSessions}
                onRevoke={handleRevokeClick}
                onMarkSuspicious={handleMarkSuspicious}
                formatDate={formatDate}
                getTimeElapsed={getTimeElapsed}
                getStatusColor={getStatusColor}
              />
            )}
          </TabsContent>

          <TabsContent value="user" className="mt-4">
            {selectedUserId && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      Sessions for {userSessions[0]?.userName || `User #${selectedUserId}`}
                    </h3>
                    <p className="text-muted-foreground">{userSessions[0]?.userEmail}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleRevokeAllSessions(selectedUserId)}
                    disabled={userSessions.length === 0}
                  >
                    Revoke All Sessions
                  </Button>
                </div>
                
                {userSessions.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Sessions</CardTitle>
                      <CardDescription>
                        This user has no active sessions.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <SessionsTable 
                    sessions={filteredSessions}
                    onViewUser={handleViewUserSessions}
                    onRevoke={handleRevokeClick}
                    onMarkSuspicious={handleMarkSuspicious}
                    formatDate={formatDate}
                    getTimeElapsed={getTimeElapsed}
                    getStatusColor={getStatusColor}
                    hideUserColumns
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

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
                  <p className="text-sm text-muted-foreground">User: {selectedSession.userName}</p>
                  <p className="text-sm text-muted-foreground">Device: {selectedSession.deviceInfo}</p>
                  <p className="text-sm text-muted-foreground">Location: {selectedSession.location}</p>
                  <p className="text-sm text-muted-foreground">Created: {formatDate(selectedSession.createdAt)}</p>
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
  );
}

interface SessionsTableProps {
  sessions: UserSession[];
  onViewUser: (userId: number, userName: string) => void;
  onRevoke: (session: UserSession) => void;
  onMarkSuspicious: (session: UserSession) => void;
  formatDate: (dateString: string) => string;
  getTimeElapsed: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  hideUserColumns?: boolean;
}

// SessionsTable component for displaying sessions
function SessionsTable({
  sessions,
  onViewUser,
  onRevoke,
  onMarkSuspicious,
  formatDate,
  getTimeElapsed,
  getStatusColor,
  hideUserColumns = false
}: SessionsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                {!hideUserColumns && (
                  <>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                  </>
                )}
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hideUserColumns ? 7 : 9} className="text-center py-10">
                    No sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className={session.status === 'suspicious' ? 'bg-amber-50' : ''}>
                    <TableCell>
                      {session.status === 'suspicious' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Suspicious activity detected</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    
                    {!hideUserColumns && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {session.userName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span 
                              className="cursor-pointer hover:underline"
                              onClick={() => onViewUser(session.userId, session.userName || `User #${session.userId}`)}
                            >
                              {session.userName || `User #${session.userId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{session.userEmail}</TableCell>
                      </>
                    )}
                    
                    <TableCell>{session.deviceInfo || 'Unknown'}</TableCell>
                    <TableCell>{session.location || 'Unknown'}</TableCell>
                    <TableCell>
                      {session.browserName ? 
                        `${session.browserName} ${session.browserVersion || ''}` : 
                        'Unknown'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(session.status)} text-white`}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{getTimeElapsed(session.createdAt)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatDate(session.createdAt)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {session.lastActivity ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{getTimeElapsed(session.lastActivity)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatDate(session.lastActivity)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {session.status !== 'suspicious' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onMarkSuspicious(session)}
                          >
                            <ShieldAlert className="h-4 w-4 mr-1" />
                            Mark Suspicious
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => onRevoke(session)}
                          disabled={session.status === 'revoked'}
                        >
                          Revoke
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
    </Card>
  );
}