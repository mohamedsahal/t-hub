import { MemStorage } from "./storage";
import { 
  UserSession, 
  InsertUserSession, 
  UserLocationHistory,
  InsertUserLocationHistory
} from "@shared/schema";

// Session tracking methods to extend MemStorage class
export const sessionTrackingMethods = {
  // User Session operations
  async getUserSession(this: MemStorage, id: number): Promise<UserSession | undefined> {
    return this.userSessions.get(id);
  },

  async getUserSessionBySessionId(this: MemStorage, sessionId: string): Promise<UserSession | undefined> {
    for (const session of Array.from(this.userSessions.values())) {
      if (session.sessionId === sessionId) {
        return session;
      }
    }
    return undefined;
  },

  async getUserSessions(this: MemStorage, userId: number): Promise<UserSession[]> {
    return Array.from(this.userSessions.values()).filter(session => session.userId === userId);
  },

  async createUserSession(this: MemStorage, session: InsertUserSession): Promise<UserSession> {
    const id = this.userSessionIdCounter++;
    const newSession: UserSession = {
      ...session,
      id,
      lastActivity: new Date(),
      createdAt: new Date(),
      status: session.status || 'active' as const,
      location: session.location || null,
      deviceInfo: session.deviceInfo || null,
      ipAddress: session.ipAddress || null,
      isMobile: session.isMobile || null,
      expiresAt: session.expiresAt || null,
      revocationReason: null
    };
    
    this.userSessions.set(id, newSession);
    return newSession;
  },

  async updateUserSession(this: MemStorage, id: number, sessionData: Partial<UserSession>): Promise<UserSession | undefined> {
    const session = this.userSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...sessionData };
    this.userSessions.set(id, updatedSession);
    return updatedSession;
  },

  async updateUserSessionActivity(this: MemStorage, sessionId: string): Promise<boolean> {
    const session = await this.getUserSessionBySessionId(sessionId);
    if (!session) return false;
    
    const updatedSession = { 
      ...session, 
      lastActivity: new Date() 
    };
    
    this.userSessions.set(session.id, updatedSession);
    return true;
  },

  async revokeUserSession(this: MemStorage, id: number, reason?: string): Promise<boolean> {
    const session = this.userSessions.get(id);
    if (!session) return false;
    
    const updatedSession = { 
      ...session, 
      status: 'revoked' as const, 
      revocationReason: reason || 'Manual revocation' 
    };
    
    this.userSessions.set(id, updatedSession);
    return true;
  },

  async revokeAllUserSessions(this: MemStorage, userId: number, exceptSessionId?: string): Promise<boolean> {
    const userSessions = await this.getUserSessions(userId);
    if (userSessions.length === 0) return false;
    
    let success = true;
    for (const session of userSessions) {
      // Skip the current session if exceptSessionId is provided
      if (exceptSessionId && session.sessionId === exceptSessionId) {
        continue;
      }
      
      const result = await this.revokeUserSession(session.id, 'Revoked as part of revoking all sessions');
      if (!result) success = false;
    }
    
    return success;
  },

  async getActiveSessions(this: MemStorage, userId: number): Promise<UserSession[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(session => session.status === 'active');
  },

  async getSuspiciousSessions(this: MemStorage): Promise<UserSession[]> {
    return Array.from(this.userSessions.values()).filter(session => session.status === 'suspicious');
  },

  // User Location History operations
  async getUserLocationHistory(this: MemStorage, id: number): Promise<UserLocationHistory | undefined> {
    return this.userLocationHistory.get(id);
  },

  async getUserLocationsByUser(this: MemStorage, userId: number): Promise<UserLocationHistory[]> {
    return Array.from(this.userLocationHistory.values())
      .filter(location => location.userId === userId);
  },

  async getUserLocationsBySession(this: MemStorage, sessionId: number): Promise<UserLocationHistory[]> {
    return Array.from(this.userLocationHistory.values())
      .filter(location => location.sessionId === sessionId);
  },

  async createUserLocation(this: MemStorage, location: InsertUserLocationHistory): Promise<UserLocationHistory> {
    const id = this.userLocationHistoryIdCounter++;
    const newLocation: UserLocationHistory = {
      ...location,
      id,
      createdAt: new Date(),
      countryCode: location.countryCode || null,
      countryName: location.countryName || null,
      regionName: location.regionName || null,
      city: location.city || null,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      isSuspicious: location.isSuspicious || false
    };
    
    this.userLocationHistory.set(id, newLocation);
    return newLocation;
  },

  async getSuspiciousLocations(this: MemStorage): Promise<UserLocationHistory[]> {
    return Array.from(this.userLocationHistory.values())
      .filter(location => location.isSuspicious);
  },

  async markLocationAsSuspicious(this: MemStorage, id: number): Promise<boolean> {
    const location = this.userLocationHistory.get(id);
    if (!location) return false;
    
    const updatedLocation = { ...location, isSuspicious: true };
    this.userLocationHistory.set(id, updatedLocation);
    
    // Also mark the associated session as suspicious
    const session = this.userSessions.get(location.sessionId);
    if (session) {
      const updatedSession = { ...session, status: 'suspicious' as const };
      this.userSessions.set(session.id, updatedSession);
    }
    
    return true;
  },
  
  // Function to detect if a new session is suspicious based on patterns
  async detectSuspiciousActivity(
    this: MemStorage, 
    userId: number,
    currentSessionId: string,
    ipAddress: string,
    location: string | null,
    deviceInfo: string | null
  ): Promise<{ isSuspicious: boolean, reason: string | null }> {
    // Get user's recent sessions
    const userSessions = await this.getUserSessions(userId);
    if (userSessions.length <= 1) {
      // First login, not suspicious
      return { isSuspicious: false, reason: null };
    }
    
    // Sort sessions by last activity
    const recentSessions = userSessions
      .filter(s => s.sessionId !== currentSessionId) // Exclude current session
      .sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    
    if (recentSessions.length === 0) {
      // No previous sessions to compare with
      return { isSuspicious: false, reason: null };
    }
    
    const mostRecentSession = recentSessions[0];
    
    // Check for rapid location change (impossible travel)
    if (
      location && 
      mostRecentSession.location && 
      location !== mostRecentSession.location &&
      mostRecentSession.lastActivity
    ) {
      // Calculate time difference in hours
      const timeDiff = (new Date().getTime() - new Date(mostRecentSession.lastActivity).getTime()) / (1000 * 60 * 60);
      
      // If location changed in less than 6 hours (impossible travel)
      if (timeDiff < 6) {
        return { 
          isSuspicious: true, 
          reason: `Rapid location change: ${mostRecentSession.location} to ${location} in ${timeDiff.toFixed(1)} hours` 
        };
      }
    }
    
    // Check for device switching in short period
    if (
      deviceInfo && 
      mostRecentSession.deviceInfo && 
      deviceInfo !== mostRecentSession.deviceInfo &&
      mostRecentSession.lastActivity
    ) {
      // Calculate time difference in minutes
      const timeDiff = (new Date().getTime() - new Date(mostRecentSession.lastActivity).getTime()) / (1000 * 60);
      
      // If device changed in less than 10 minutes
      if (timeDiff < 10) {
        return { 
          isSuspicious: true, 
          reason: `Rapid device change in ${timeDiff.toFixed(1)} minutes` 
        };
      }
    }
    
    // Check for multiple different device types
    const distinctDeviceTypes = new Set();
    const distinctBrowserNames = new Set();
    const distinctOSNames = new Set();
    
    // Add current session info
    if (deviceInfo) distinctDeviceTypes.add(deviceInfo);
    
    // Add previous sessions info
    recentSessions.slice(0, 5).forEach(session => {
      if (session.deviceInfo) distinctDeviceTypes.add(session.deviceInfo);
      if (session.browserName) distinctBrowserNames.add(session.browserName);
      if (session.osName) distinctOSNames.add(session.osName);
    });
    
    // If there are more than 3 distinct device signatures in recent sessions
    if (distinctDeviceTypes.size > 3) {
      return { 
        isSuspicious: true, 
        reason: `Multiple different devices used (${distinctDeviceTypes.size} devices)` 
      };
    }
    
    // If there are many different browser/OS combinations
    if (distinctBrowserNames.size > 2 && distinctOSNames.size > 2) {
      return { 
        isSuspicious: true, 
        reason: `Unusual variety of browsers and operating systems` 
      };
    }
    
    // Check for concurrent active sessions
    const activeSessions = userSessions.filter(s => 
      s.status === 'active' && s.sessionId !== currentSessionId
    );
    
    if (activeSessions.length >= 3) {
      return { 
        isSuspicious: true, 
        reason: `Too many concurrent active sessions (${activeSessions.length + 1} including current)` 
      };
    }
    
    // No suspicious patterns detected
    return { isSuspicious: false, reason: null };
  },
  
  // Function to automatically detect and mark suspicious locations/sessions
  async analyzeSuspiciousActivity(this: MemStorage, userId: number): Promise<boolean> {
    // Get all user locations
    const locations = await this.getUserLocationsByUser(userId);
    if (locations.length <= 1) return false;
    
    // Sort by creation date
    locations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Flag any suspicious activity
    let suspiciousFound = false;
    
    // Loop through locations to find suspicious patterns
    for (let i = 0; i < locations.length - 1; i++) {
      const current = locations[i];
      const previous = locations[i + 1];
      
      // Skip already marked locations
      if (current.isSuspicious) continue;
      
      // Calculate time difference in hours
      const timeDiff = (
        new Date(current.createdAt).getTime() - 
        new Date(previous.createdAt).getTime()
      ) / (1000 * 60 * 60);
      
      // If locations are different but time difference is small
      if (
        current.ipAddress !== previous.ipAddress && 
        timeDiff < 12 // Less than 12 hours between logins from different locations
      ) {
        // Mark current location as suspicious
        await this.markLocationAsSuspicious(current.id);
        suspiciousFound = true;
      }
    }
    
    return suspiciousFound;
  }
};