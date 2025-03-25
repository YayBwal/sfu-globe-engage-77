import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Camera, Edit2, Calendar, Book, Users, Award, Gamepad, 
  Clock, ArrowLeft, Upload, User, Image, School, 
  FileText, Briefcase, MapPin, Mail, Hash, Save,
  Circle, UserCheck, UserPlus, UserX, MessageSquare
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Header from "@/components/layout/Header";
import FriendMessageModal from "@/components/profile/FriendMessageModal";

// Define forms schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().optional(),
  major: z.string(),
  studentId: z.string(),
  batch: z.string(),
});

// Types
interface UserClub {
  id: string;
  club_id: string;
  role: string;
  approved: boolean;
  name: string;
  logo_url?: string;
}

interface UserQuiz {
  id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface UserCourse {
  id: string;
  course_name: string;
  enrollment_date: string;
  completed: boolean;
}

interface UserActivity {
  id: string;
  activity_type: string;
  activity_detail: any;
  created_at: string;
}

interface Friend {
  id: string;
  name: string;
  profile_pic?: string;
  online: boolean;
  student_id: string;
  major: string;
}

// Add a new StatDetailDialog component at the top level of the file
interface StatDetailProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  open: boolean;
  onClose: () => void;
}

const StatDetailDialog: React.FC<StatDetailProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  open, 
  onClose 
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            <span>{title} Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sfu-red/10 to-amber-400/10 flex items-center justify-center mb-4">
              {React.cloneElement(icon as React.ReactElement, { className: "h-10 w-10 text-sfu-red" })}
            </div>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sfu-red to-amber-500">{value}</p>
          </div>
          <p className="text-center text-gray-600">{description}</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Modify the Card component in Profile.tsx
// Here we're creating a new StatCard component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, description }) => {
  const [showDetail, setShowDetail] = useState(false);
  
  return (
    <>
      <Card 
        className="border-none bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition duration-200 cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-sfu-red/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-4 flex flex-col items-center justify-center relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sfu-red/10 to-amber-400/10 flex items-center justify-center mb-2">
            <Icon className="h-5 w-5 text-sfu-red" />
          </div>
          <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-sfu-red to-amber-500">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </CardContent>
      </Card>
      
      <StatDetailDialog
        title={label}
        value={value}
        icon={<Icon className="h-5 w-5" />}
        description={description}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
};

// Create Friend Message component to avoid rendering hooks directly in map function
const FriendCard = ({ friend, onRemove }: { friend: Friend, onRemove: (id: string) => Promise<void> }) => {
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card key={friend.id} className="overflow-hidden group hover:shadow-lg transition duration-200">
      <div className={`h-2 ${friend.online ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-gray-300 to-gray-200'}`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white relative">
            {friend.profile_pic ? (
              <AvatarImage src={friend.profile_pic} alt={friend.name} className="p-1" />
            ) : (
              <AvatarFallback className="rounded-full bg-gradient-to-br from-sfu-red to-amber-500 text-white">
                {getInitials(friend.name)}
              </AvatarFallback>
            )}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${friend.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900">{friend.name}</h4>
            <div className="flex gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                <School className="h-3 w-3 mr-1" />
                {friend.major}
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                <Hash className="h-3 w-3 mr-1" />
                {friend.student_id}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <Button 
            size="sm" 
            variant="message"
            className="flex-1 text-xs"
            onClick={() => setIsMessageOpen(true)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Message
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="text-xs text-gray-500"
            onClick={() => onRemove(friend.id)}
          >
            <UserX className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
        {isMessageOpen && (
          <FriendMessageModal
            isOpen={isMessageOpen}
            onClose={() => setIsMessageOpen(false)}
            friend={{
              id: friend.id,
              name: friend.name
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  const { profile, user, logout } = useAuth();
  const { userClubs } = useClub();
  const { toast } = useToast();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [userQuizzes, setUserQuizzes] = useState<UserQuiz[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState("activity");
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      major: profile?.major || "",
      studentId: profile?.student_id || "", // Fixed property name
      batch: profile?.batch || "",
    },
  });
  
  // Fetch user's quiz results and other data
  useEffect(() => {
    if (user) {
      fetchUserQuizzes();
      fetchUserCourses();
      fetchUserActivities();
      fetchUserClubs();
      fetchFriends();
    }
  }, [user]);
  
  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        bio: profile.bio || "",
        major: profile.major,
        studentId: profile.student_id, // Fixed property name
        batch: profile.batch,
      });
    }
  }, [profile, form]);
  
  const fetchUserQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      setUserQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
    }
  };
  
  const fetchUserCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user?.id)
        .order('enrollment_date', { ascending: false });
      
      if (error) throw error;
      setUserCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  
  const fetchUserActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Filter out profile update activities
      const filteredActivities = data?.filter(activity => 
        activity.activity_type !== 'profile_update'
      ) || [];
      
      setActivities(filteredActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };
  
  const fetchUserClubs = async () => {
    try {
      // Get club memberships with club details
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          id,
          club_id,
          role,
          approved,
          clubs (
            name,
            logo_url
          )
        `)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      const formattedClubs = data?.map(club => ({
        id: club.id,
        club_id: club.club_id,
        role: club.role,
        approved: club.approved,
        name: club.clubs.name,
        logo_url: club.clubs.logo_url
      })) || [];
      
      setClubs(formattedClubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      if (!user) return;
      
      // Get all connections where the user is either the sender or receiver
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      
      if (connectionsError) throw connectionsError;
      
      if (connections && connections.length > 0) {
        // Get the IDs of the friends
        const friendIds = connections.map(conn => 
          conn.user_id === user.id ? conn.friend_id : conn.user_id
        );
        
        // Get the profile data for each friend
        const { data: friendProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_pic, online, student_id, major')
          .in('id', friendIds);
          
        if (profilesError) throw profilesError;
        
        setFriends(friendProfiles as Friend[] || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          bio: values.bio,
          major: values.major,
          student_id: values.studentId, // Fixed property name
          batch: values.batch,
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };
  
  const uploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      setUploadingProfile(true);
      
      // Upload to Supabase storage
      const filePath = `${user?.id}/profile-${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_pic: publicUrl })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
      
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploadingProfile(false);
    }
  };
  
  const uploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      setUploadingCover(true);
      
      // Upload to Supabase storage
      const filePath = `${user?.id}/cover-${new Date().getTime()}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_pic: publicUrl })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Cover image updated",
        description: "Your cover image has been updated successfully.",
      });
      
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your cover image.",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };
  
  const addActivity = async (type: string, detail: any) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user?.id,
          activity_type: type,
          activity_detail: detail
        });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      if (!user) return;

      // Delete the connection in both directions
      await supabase
        .from('connections')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
      
      // Update friends list
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your list.",
      });

      // Add to activity
      await addActivity('friend_remove', { friend_id: friendId });
      
      // Refresh activities
      fetchUserActivities();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  const renderActivityDetails = (activity: UserActivity) => {
    const { activity_type, activity_detail, created_at } = activity;
    
    let icon = <Calendar className="h-4 w-4 text-gray-500" />;
    let message = "Unknown activity";
    
    switch (activity_type) {
      case 'club_join':
        icon = <Users className="h-4 w-4 text-blue-500" />;
        message = `Joined the ${activity_detail.club_name} club`;
        break;
      case 'quiz_complete':
        icon = <FileText className="h-4 w-4 text-purple-500" />;
        message = `Completed quiz: ${activity_detail.quiz_title}`;
        break;
      case 'course_enroll':
        icon = <Book className="h-4 w-4 text-green-500" />;
        message = `Enrolled in: ${activity_detail.course_name}`;
        break;
      case 'study_session_join':
        icon = <Users className="h-4 w-4 text-blue-500" />;
        message = `Joined a study session: ${activity_detail.subject}`;
        break;
      case 'friend_add':
        icon = <UserPlus className="h-4 w-4 text-green-500" />;
        message = `Added a new friend`;
        break;
      case 'friend_remove':
        icon = <UserX className="h-4 w-4 text-red-500" />;
        message = `Removed a friend`;
        break;
      default:
        break;
    }
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
          <p className="text-xs text-gray-500">{formatDate(created_at)} at {formatTime(created_at)}</p>
        </div>
      </div>
    );
  };
  
  // Update the getStatDescription function
  const getStatDescription = (label: string): string => {
    switch (label) {
      case "Courses":
        return "Total number of courses you have enrolled in. Each course contributes to your academic progress and skill development.";
      case "Hours":
        return "Estimated total study hours across all your enrolled courses. This is calculated based on course workload and your engagement.";
      case "Quizzes":
        return "Total number of quizzes you have completed. Regular quiz-taking helps reinforce your learning and identify areas for improvement.";
      case "Clubs":
        return "Number of approved clubs you are a member of. Club participation enhances your networking and extracurricular experiences.";
      default:
        return "Click for more details about this statistic.";
    }
  };
  
  // Modify the stats section to render our new StatCard component
  const renderStats = () => {
    const statItems = [
      { 
        icon: Book, 
        label: "Courses", 
        value: userCourses.length.toString(),
        description: getStatDescription("Courses")
      },
      { 
        icon: Clock, 
        label: "Hours", 
        value: (userCourses.length * 12).toString(),
        description: getStatDescription("Hours")
      },
      { 
        icon: Award, 
        label: "Quizzes", 
        value: userQuizzes.length.toString(),
        description: getStatDescription("Quizzes") 
      },
      { 
        icon: Users, 
        label: "Clubs", 
        value: clubs.filter(c => c.approved).length.toString(),
        description: getStatDescription("Clubs")
      },
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {statItems.map((stat, index) => (
          <StatCard 
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            description={stat.description}
          />
        ))}
      </div>
    );
  };
  
  // Stats based on real data
  const stats = [
    { 
      icon: Book, 
      label: "Courses", 
      value: userCourses.length.toString() 
    },
    { 
      icon: Clock, 
      label: "Hours", 
      value: (userCourses.length * 12).toString()  // Estimate based on courses
    },
    { 
      icon: Award, 
      label: "Quizzes", 
      value: userQuizzes.length.toString() 
    },
    { 
      icon: Users, 
      label: "Clubs", 
      value: clubs.filter(c => c.approved).length.toString() 
    },
  ];
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You are not logged in</h2>
          <p className="mb-6">Please log in to view your profile</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <main className="pt-16 pb-16">
        {/* Cover Photo Section */}
        <div className="relative w-full">
          <div className="h-64 sm:h-80 w-full bg-gradient-to-r from-blue-500 to-sfu-red overflow-hidden">
            {profile?.cover_pic ? (
              <img 
                src={profile.cover_pic} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sfu-red via-amber-500 to-sfu-lightgray opacity-80" />
            )}
            
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Cover Photo Upload Button */}
            <label 
              className="absolute top-4 right-4 bg-white/30 hover:bg-white/50 cursor-pointer text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 shadow-lg"
            >
              <Upload className="h-4 w-4" />
              Change Cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadCoverImage}
                disabled={uploadingCover}
              />
            </label>
          </div>
        </div>
        
        {/* Profile Info Section */}
        <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 pt-24 md:pt-6 relative">
            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* Profile Picture - Position it so it overlaps the cover image */}
              <div className="absolute -top-20 left-1/2 md:left-8 transform -translate-x-1/2 md:translate-x-0 flex justify-center z-20">
                <div className="relative group">
                  <Avatar className="h-36 w-36 border-4 border-white shadow-xl">
                    <AvatarImage src={profile?.profile_pic} alt={profile?.name} className="object-cover" />
                    <AvatarFallback className="text-4xl font-medium bg-gradient-to-br from-sfu-red to-amber-500 text-white">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-sfu-red to-amber-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadProfileImage}
                      disabled={uploadingProfile}
                    />
                  </label>
                </div>
              </div>
              
              {/* Profile Info Content */}
              <div className="flex flex-col md:flex-row justify-between items-start mt-8 md:mt-0 w-full">
                <div className="flex-1 md:pl-44 text-center md:text-left">
                  {isEditMode ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your student ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="major"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Major</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your major" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="batch"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Batch</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your batch" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Write a short bio about yourself" 
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
