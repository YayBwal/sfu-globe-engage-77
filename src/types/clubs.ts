
export type Club = {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  created_at?: string;
  created_by: string;
};

export type ClubMember = {
  id: string;
  user_id: string;
  club_id: string;
  role: 'coordinator' | 'assistant' | 'member';
  approved: boolean;
  created_at?: string;
  // Additional profile fields through joins
  name?: string;
  email?: string;
  student_id?: string;
};

export type ClubActivity = {
  id: string;
  club_id: string;
  title: string;
  content: string;
  image_url?: string;
  event_date?: string;
  posted_by: string;
  created_at?: string;
  // Poster details from joins
  poster_name?: string;
};

export type ClubNotification = {
  id: string;
  club_id: string;
  message: string;
  created_at?: string;
};

export type ClubMessage = {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  created_at?: string;
  read: boolean;
  // User details from joins
  sender_name?: string;
};

export type ClubGroupChatMessage = {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // User details from joins
  user_name?: string;
  user_role?: string;
};
