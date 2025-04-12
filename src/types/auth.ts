
import { User, Session } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  name: string;
  student_id: string;
  major: string;
  batch: string;
  email: string;
  online: boolean;
  bio: string;
  interests: string[];
  availability: string;
  profilePic: string | null;
  coverPic: string | null;
  profile_pic?: string | null; // For compatibility with DB
  cover_pic?: string | null; // For compatibility with DB
  student_id_photo?: string | null;
  approval_status: string;
  phone?: string; // Added phone field
  notificationPreferences?: NotificationPreferences; // Added notification preferences
  privacySettings?: PrivacySettings; // Added privacy settings
};

export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  app: boolean;
  messages: boolean;
  friends: boolean;
  events: boolean;
  marketplace: boolean;
};

export type PrivacySettings = {
  profileVisibility: string; // "everyone", "friends", "private"
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showActivity: boolean;
  allowFriendRequests: boolean;
};

export type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  register: (email: string, password: string, name: string, studentId: string, major: string, batch: string, studentIdPhoto?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};
