
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Club, ClubMember, ClubActivity, ClubNotification, ClubMessage } from "@/types/clubs";

type ClubContextType = {
  clubs: Club[];
  loading: boolean;
  userClubs: ClubMember[];
  isClubManager: (clubId: string) => boolean;
  isClubCoordinator: (clubId: string) => boolean;
  fetchClubMembers: (clubId: string) => Promise<ClubMember[]>;
  fetchClubActivities: (clubId: string) => Promise<ClubActivity[]>;
  fetchClubNotifications: (clubId: string) => Promise<ClubNotification[]>;
  fetchClubMessages: (clubId: string) => Promise<ClubMessage[]>;
  sendClubMessage: (clubId: string, message: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  requestToJoinClub: (clubId: string) => Promise<void>;
  approveClubMember: (memberId: string, clubId: string) => Promise<void>;
  createClub: (club: Omit<Club, "id" | "created_at" | "created_by">) => Promise<Club | null>;
  createClubActivity: (activity: Omit<ClubActivity, "id" | "created_at" | "posted_by" | "poster_name">) => Promise<void>;
  createClubNotification: (notification: Omit<ClubNotification, "id" | "created_at">) => Promise<void>;
  userCanCreateClub: boolean;
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCanCreateClub, setUserCanCreateClub] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch all clubs on load
  useEffect(() => {
    fetchClubs();

    // Set up realtime subscription for clubs
    const clubsChannel = supabase
      .channel('club-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clubs' },
        () => fetchClubs()
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(clubsChannel);
    };
  }, []);

  // Fetch user's club memberships when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserClubMemberships();
    } else {
      setUserClubs([]);
    }
  }, [isAuthenticated, user]);

  // Check if user is already a coordinator
  useEffect(() => {
    if (userClubs.length > 0) {
      const isCoordinator = userClubs.some(club => club.role === 'coordinator' && club.approved);
      setUserCanCreateClub(!isCoordinator);
    } else {
      setUserCanCreateClub(true);
    }
  }, [userClubs]);

  // Fetch all clubs
  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast({
        title: "Error",
        description: "Failed to load clubs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's club memberships
  const fetchUserClubMemberships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*, clubs:club_id(name)')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserClubs(data || []);
    } catch (error) {
      console.error('Error fetching user club memberships:', error);
    }
  };

  // Check if the current user is a manager (coordinator or assistant) of a club
  const isClubManager = (clubId: string): boolean => {
    if (!user || !userClubs.length) return false;
    return userClubs.some(
      membership => 
        membership.club_id === clubId && 
        ['coordinator', 'assistant'].includes(membership.role) && 
        membership.approved
    );
  };

  // Check if the current user is specifically a coordinator of a club
  const isClubCoordinator = (clubId: string): boolean => {
    if (!user || !userClubs.length) return false;
    return userClubs.some(
      membership => 
        membership.club_id === clubId && 
        membership.role === 'coordinator' && 
        membership.approved
    );
  };

  // Fetch members of a specific club
  const fetchClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles:user_id(name, email, student_id)
        `)
        .eq('club_id', clubId);

      if (error) throw error;
      
      // Transform the data to include profile information
      return (data || []).map(item => ({
        ...item,
        name: item.profiles?.name,
        email: item.profiles?.email,
        student_id: item.profiles?.student_id
      }));
    } catch (error) {
      console.error('Error fetching club members:', error);
      toast({
        title: "Error",
        description: "Failed to load club members",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch activities of a specific club
  const fetchClubActivities = async (clubId: string): Promise<ClubActivity[]> => {
    try {
      const { data, error } = await supabase
        .from('club_activities')
        .select(`
          *,
          profiles:posted_by(name)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include profile information
      return (data || []).map(item => ({
        ...item,
        poster_name: item.profiles?.name
      }));
    } catch (error) {
      console.error('Error fetching club activities:', error);
      toast({
        title: "Error",
        description: "Failed to load club activities",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch notifications of a specific club
  const fetchClubNotifications = async (clubId: string): Promise<ClubNotification[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('club_notifications')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching club notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load club notifications",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch messages of a specific club
  const fetchClubMessages = async (clubId: string): Promise<ClubMessage[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('club_messages')
        .select(`
          *,
          profiles:user_id(name)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include sender information
      return (data || []).map(item => ({
        ...item,
        sender_name: item.profiles?.name
      }));
    } catch (error) {
      console.error('Error fetching club messages:', error);
      toast({
        title: "Error",
        description: "Failed to load club messages",
        variant: "destructive",
      });
      return [];
    }
  };

  // Send a message to a club
  const sendClubMessage = async (clubId: string, message: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to send messages",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_messages')
        .insert({
          club_id: clubId,
          user_id: user.id,
          message,
          read: false
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the club",
      });
    } catch (error) {
      console.error('Error sending club message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Mark a message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('club_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Request to join a club
  const requestToJoinClub = async (clubId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to join clubs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already a member or has a pending request
      const { data: existingMembership } = await supabase
        .from('club_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .maybeSingle();

      if (existingMembership) {
        toast({
          title: "Already Requested",
          description: existingMembership.approved 
            ? "You are already a member of this club" 
            : "Your membership request is pending approval",
        });
        return;
      }

      // Create new membership request
      const { error } = await supabase
        .from('club_members')
        .insert({
          user_id: user.id,
          club_id: clubId,
          role: 'member',
          approved: false
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your request to join the club has been sent",
      });

      // Refresh user club memberships
      fetchUserClubMemberships();
    } catch (error) {
      console.error('Error requesting to join club:', error);
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive",
      });
    }
  };

  // Approve a club member
  const approveClubMember = async (memberId: string, clubId: string) => {
    if (!user || !isClubManager(clubId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to approve members",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_members')
        .update({ approved: true })
        .eq('id', memberId)
        .eq('club_id', clubId);

      if (error) throw error;

      toast({
        title: "Member Approved",
        description: "Club member has been approved",
      });
    } catch (error) {
      console.error('Error approving club member:', error);
      toast({
        title: "Error",
        description: "Failed to approve club member",
        variant: "destructive",
      });
    }
  };

  // Create a new club
  const createClub = async (clubData: Omit<Club, "id" | "created_at" | "created_by">): Promise<Club | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to create a club",
        variant: "destructive",
      });
      return null;
    }

    // Check if user is already a coordinator
    if (!userCanCreateClub) {
      toast({
        title: "Permission Denied",
        description: "You are already a coordinator for another club",
        variant: "destructive",
      });
      return null;
    }

    try {
      const newClub = {
        ...clubData,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('clubs')
        .insert(newClub)
        .select()
        .single();

      if (error) throw error;

      // Automatically make the creator a coordinator
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          user_id: user.id,
          club_id: data.id,
          role: 'coordinator',
          approved: true
        });

      if (memberError) throw memberError;

      toast({
        title: "Club Created",
        description: "Your club has been created successfully",
      });

      // Refresh data
      fetchClubs();
      fetchUserClubMemberships();

      return data;
    } catch (error) {
      console.error('Error creating club:', error);
      toast({
        title: "Error",
        description: "Failed to create club",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create a club activity
  const createClubActivity = async (activityData: Omit<ClubActivity, "id" | "created_at" | "posted_by" | "poster_name">) => {
    if (!user || !isClubManager(activityData.club_id)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create activities",
        variant: "destructive",
      });
      return;
    }

    try {
      const newActivity = {
        ...activityData,
        posted_by: user.id
      };

      const { error } = await supabase
        .from('club_activities')
        .insert(newActivity);

      if (error) throw error;

      toast({
        title: "Activity Created",
        description: "The activity has been created successfully",
      });
    } catch (error) {
      console.error('Error creating club activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity",
        variant: "destructive",
      });
    }
  };

  // Create a club notification
  const createClubNotification = async (notificationData: Omit<ClubNotification, "id" | "created_at">) => {
    if (!user || !isClubManager(notificationData.club_id)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create notifications",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_notifications')
        .insert(notificationData);

      if (error) throw error;

      toast({
        title: "Notification Created",
        description: "The notification has been created successfully",
      });
    } catch (error) {
      console.error('Error creating club notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    }
  };

  return (
    <ClubContext.Provider value={{
      clubs,
      loading,
      userClubs,
      isClubManager,
      isClubCoordinator,
      fetchClubMembers,
      fetchClubActivities,
      fetchClubNotifications,
      fetchClubMessages,
      sendClubMessage,
      markMessageAsRead,
      requestToJoinClub,
      approveClubMember,
      createClub,
      createClubActivity,
      createClubNotification,
      userCanCreateClub
    }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
};
