
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
};

export type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, password: string, name: string, studentId: string, major: string, batch: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};
