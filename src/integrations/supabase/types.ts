export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          id: string
          ip_address: string | null
          location_lat: number | null
          location_lng: number | null
          marked_at: string | null
          marked_by: string | null
          notes: string | null
          scan_method: string | null
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          scan_method?: string | null
          session_id: string
          status: string
          student_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          scan_method?: string | null
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_id: string
          created_at: string | null
          date: string
          id: string
          location: string | null
          location_radius: number | null
          qr_code: string | null
          qr_expiry_time: number | null
          qr_generated_at: string | null
          status: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          location?: string | null
          location_radius?: number | null
          qr_code?: string | null
          qr_expiry_time?: number | null
          qr_generated_at?: string | null
          status?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          location?: string | null
          location_radius?: number | null
          qr_code?: string | null
          qr_expiry_time?: number | null
          qr_generated_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_activities: {
        Row: {
          club_id: string
          content: string
          created_at: string | null
          event_date: string | null
          id: string
          image_url: string | null
          posted_by: string
          title: string
        }
        Insert: {
          club_id: string
          content: string
          created_at?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          posted_by: string
          title: string
        }
        Update: {
          club_id?: string
          content?: string
          created_at?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          posted_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_activities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          approved: boolean | null
          club_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          club_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          club_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages: {
        Row: {
          club_id: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_notifications: {
        Row: {
          club_id: string
          created_at: string | null
          id: string
          message: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          id?: string
          message: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed: boolean | null
          course_name: string
          enrollment_date: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          course_name: string
          enrollment_date?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          course_name?: string
          enrollment_date?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          condition: string | null
          contact: string | null
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          posted_date: string
          price: number
          seller_id: string
          seller_name: string
          title: string
        }
        Insert: {
          category: string
          condition?: string | null
          contact?: string | null
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          posted_date?: string
          price: number
          seller_id: string
          seller_name: string
          title: string
        }
        Update: {
          category?: string
          condition?: string | null
          contact?: string | null
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          posted_date?: string
          price?: number
          seller_id?: string
          seller_name?: string
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          source: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          source: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          source?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          receiver_id: string | null
          share_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          receiver_id?: string | null
          share_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          receiver_id?: string | null
          share_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          batch: string
          bio: string | null
          cover_pic: string | null
          created_at: string | null
          email: string
          id: string
          interests: string[] | null
          major: string
          name: string
          online: boolean | null
          profile_pic: string | null
          role: string | null
          student_id: string
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          availability?: string | null
          batch: string
          bio?: string | null
          cover_pic?: string | null
          created_at?: string | null
          email: string
          id: string
          interests?: string[] | null
          major: string
          name: string
          online?: boolean | null
          profile_pic?: string | null
          role?: string | null
          student_id: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          availability?: string | null
          batch?: string
          bio?: string | null
          cover_pic?: string | null
          created_at?: string | null
          email?: string
          id?: string
          interests?: string[] | null
          major?: string
          name?: string
          online?: boolean | null
          profile_pic?: string | null
          role?: string | null
          student_id?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          completed_at: string
          id: string
          quiz_id: string
          quiz_title: string | null
          score: number
          total_questions: number
          user_id: string
          user_name: string | null
        }
        Insert: {
          completed_at?: string
          id?: string
          quiz_id: string
          quiz_title?: string | null
          score: number
          total_questions: number
          user_id: string
          user_name?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          quiz_id?: string
          quiz_title?: string | null
          score?: number
          total_questions?: number
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          total_questions: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          total_questions?: number
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          host_id: string
          id: string
          location: string | null
          max_participants: number | null
          meeting_link: string | null
          password: string | null
          subject: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          host_id: string
          id?: string
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          password?: string | null
          subject: string
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          host_id?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          password?: string | null
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_detail: Json
          activity_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_detail: Json
          activity_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_detail?: Json
          activity_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_session_qr: {
        Args: {
          session_uuid: string
        }
        Returns: string
      }
      get_user_total_score: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      is_club_manager: {
        Args: {
          club_uuid: string
        }
        Returns: boolean
      }
      verify_attendance_qr: {
        Args: {
          session_uuid: string
          qr_code: string
          lat?: number
          lng?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      club_role: "coordinator" | "assistant" | "member"
      user_role: "student" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
