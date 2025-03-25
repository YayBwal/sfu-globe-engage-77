
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Camera, Edit2, Calendar, Book, Users, Award, Gamepad, 
  Clock, ArrowLeft, Upload, User, Image, School, 
  FileText, Briefcase, MapPin, Mail, Hash, Save
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

const Profile = () => {
  const { profile, user, logout, updateUserStatus } = useAuth();
  const { userClubs } = useClub();
  const { toast } = useToast();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [userQuizzes, setUserQuizzes] = useState<UserQuiz[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [clubs, setClubs] = useState<UserClub[]>([]);
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      major: profile?.major || "",
      studentId: profile?.studentId || "",
      batch: profile?.batch || "",
    },
  });
  
  // Fetch user's quiz results
  useEffect(() => {
    if (user) {
      fetchUserQuizzes();
      fetchUserCourses();
      fetchUserActivities();
      fetchUserClubs();
    }
  }, [user]);
  
  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        bio: profile.bio || "",
        major: profile.major,
        studentId: profile.studentId,
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
      setActivities(data || []);
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
  
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          bio: values.bio,
          major: values.major,
          student_id: values.studentId,
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
        .update({ profilePic: publicUrl })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
      
      // Add activity
      await addActivity('profile_update', { type: 'profile_picture' });
      
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
        .update({ coverPic: publicUrl })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Cover image updated",
        description: "Your cover image has been updated successfully.",
      });
      
      // Add activity
      await addActivity('profile_update', { type: 'cover_picture' });
      
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
      case 'profile_update':
        icon = <User className="h-4 w-4 text-orange-500" />;
        message = `Updated ${activity_detail.type.replace('_', ' ')}`;
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
          <div className="h-80 w-full bg-gradient-to-r from-blue-400 to-indigo-500 overflow-hidden">
            {profile?.coverPic ? (
              <img 
                src={profile.coverPic} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 opacity-80" />
            )}
            
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Cover Photo Upload Button */}
            <label 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 cursor-pointer text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 shadow-lg"
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
          
          {/* Profile Info Section - Positioned to overflow cover image */}
          <div className="max-w-5xl mx-auto px-4 relative -mt-24">
            <div className="bg-white rounded-xl shadow-lg p-6 pt-28 relative">
              {/* Profile Picture - Position it outside the white card */}
              <div className="absolute -top-20 left-8 flex justify-center">
                <div className="relative group">
                  <Avatar className="h-36 w-36 border-4 border-white bg-sfu-lightgray shadow-xl">
                    <AvatarImage src={profile?.profilePic} alt={profile?.name} className="object-cover" />
                    <AvatarFallback className="text-4xl font-medium bg-gradient-to-br from-sfu-red to-pink-600 text-white">
                      {profile ? getInitials(profile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-2">
                <div className="flex-1 pl-1 md:pl-32 pt-8 md:pt-0">
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
                        />
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                            <Save className="h-4 w-4 mr-2" />
                            Save Profile
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditMode(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <div>
                          <h1 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            {profile?.name}
                          </h1>
                          <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4" />
                            {profile?.email}
                          </p>
                          {profile?.bio && (
                            <p className="text-gray-700 mt-3 max-w-xl">{profile.bio}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="rounded-lg border-slate-200 hover:bg-gray-100 hover:text-sfu-black"
                            onClick={() => setIsEditMode(true)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button 
                            variant="outline" 
                            className="rounded-lg border-slate-200 hover:bg-gray-100 hover:text-sfu-black"
                            onClick={logout}
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <School className="h-3 w-3 mr-1" />
                          {profile?.major === 'CS' ? 'Computer Science' : 
                           profile?.major === 'BBA' ? 'Business Administration' : 
                           profile?.major === 'ENG' ? 'Engineering' : 
                           profile?.major === 'MED' ? 'Medical Sciences' : 
                           profile?.major === 'ART' ? 'Arts & Humanities' : profile?.major}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          Batch {profile?.batch}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Hash className="h-3 w-3 mr-1" />
                          ID: {profile?.studentId}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-none bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-4 flex flex-col items-center justify-center relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-2">
                        <stat.icon className="h-5 w-5 text-indigo-500" />
                      </div>
                      <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full bg-white mb-6 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="activity" className="flex-1 rounded-lg">Activity</TabsTrigger>
              <TabsTrigger value="clubs" className="flex-1 rounded-lg">Clubs</TabsTrigger>
              <TabsTrigger value="quizzes" className="flex-1 rounded-lg">Quizzes</TabsTrigger>
              <TabsTrigger value="courses" className="flex-1 rounded-lg">Courses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="bg-white rounded-xl shadow-sm p-6 mt-0">
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="border-none bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition duration-200">
                      <CardContent className="p-4">
                        {renderActivityDetails(activity)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-800 mb-2">No recent activity</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Your recent activities will appear here as you engage with classes, clubs, and quizzes.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="clubs" className="bg-white rounded-xl shadow-sm p-6 mt-0">
              {clubs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubs.map((club) => (
                    <Card key={club.id} className="overflow-hidden group hover:shadow-lg transition duration-200">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <CardContent className="p-4 pt-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-white">
                            {club.logo_url ? (
                              <AvatarImage src={club.logo_url} alt={club.name} className="p-1" />
                            ) : (
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                {getInitials(club.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-slate-900">{club.name}</h4>
                            <div className="flex gap-1.5 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {club.role}
                              </span>
                              {!club.approved && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-800 mb-2">No clubs joined yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Join clubs to connect with other students and participate in engaging activities.
                  </p>
                  <Link to="/clubs">
                    <Button className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                      Browse Clubs
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quizzes" className="bg-white rounded-xl shadow-sm p-6 mt-0">
              {userQuizzes.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-white">
                      <TableRow>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userQuizzes.map((quiz) => (
                        <TableRow key={quiz.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{quiz.quiz_title}</TableCell>
                          <TableCell>
                            <span className={`font-medium rounded-full px-2 py-1 text-xs ${
                              (quiz.score / quiz.total_questions) >= 0.7 
                                ? 'bg-green-100 text-green-800' 
                                : (quiz.score / quiz.total_questions) >= 0.5 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {quiz.score}/{quiz.total_questions}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(quiz.completed_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-800 mb-2">No quizzes taken yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Complete quizzes to test your knowledge and improve your ranking.
                  </p>
                  <Link to="/quizzes">
                    <Button className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                      Start a Quiz
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="courses" className="bg-white rounded-xl shadow-sm p-6 mt-0">
              {userCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCourses.map((course) => (
                    <Card key={course.id} className="overflow-hidden group hover:shadow-md transition duration-200 border-none bg-gradient-to-br from-slate-50 to-white">
                      <div className={`h-1.5 ${course.completed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              course.completed 
                                ? 'bg-green-100' 
                                : 'bg-blue-100'
                            }`}>
                              <Book className={`h-5 w-5 ${
                                course.completed 
                                  ? 'text-green-600' 
                                  : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{course.course_name}</h4>
                              <p className="text-sm text-gray-500">Enrolled: {formatDate(course.enrollment_date)}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {course.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-800 mb-2">No courses enrolled</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Enroll in courses to start learning and track your progress.
                  </p>
                  <Button className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    Browse Courses
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
