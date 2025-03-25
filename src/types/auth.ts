
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
  role: string;
  profile_pic?: string | null; // For compatibility with DB
  cover_pic?: string | null; // For compatibility with DB
};

export type AuthContextType = {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isTeacher: boolean;
  register: (email: string, password: string, name: string, studentId: string, major: string, batch: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};
