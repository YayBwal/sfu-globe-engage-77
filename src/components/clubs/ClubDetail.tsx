import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/contexts/ClubContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Users,
  Calendar,
  Bell,
  Lock,
  Plus,
  UserPlus,
  ImagePlus,
  Check,
  X,
  MessageSquare,
  Send,
  Trash2,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Club, ClubActivity, ClubMember, ClubNotification, ClubMessage } from "@/types/clubs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { 
    requestToJoinClub, 
    isClubManager,
    isClubCoordinator,
    fetchClubMembers, 
    fetchClubActivities, 
    fetchClubNotifications,
    fetchClubMessages,
    sendClubMessage,
    markMessageAsRead,
    approveClubMember,
    createClubActivity,
    createClubNotification,
    userCanCreateClub
  } = useClub();

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(true);
  
  // Activity form states
  const [activityTitle, setActivityTitle] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityImage, setActivityImage] = useState<File | null>(null);
  const [activityImagePreview, setActivityImagePreview] = useState<string | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  
  // Activity deletion state
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [coordinatorPassword, setCoordinatorPassword] = useState("");
  const [isCoordinatorMode, setIsCoordinatorMode] = useState(false);

  const isManager = id ? isClubManager(id) : false;
  const isCoordinator = id ? isClubCoordinator(id) : false;
  const pendingMembers = members.filter(m => !m.approved);
  const approvedMembers = members.filter(m => m.approved);
  const unreadMessages = messages.filter(m => !m.read).length;

  useEffect(() => {
    if (id) {
      fetchClubDetails();
      loadClubData();
      
      // Set up realtime subscriptions
      const activitiesChannel = supabase
        .channel('club-activity-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'club_activities', filter: `club_id=eq.${id}` },
          () => fetchAndSetActivities()
        )
        .subscribe();
        
      const membersChannel = supabase
        .channel('club-member-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'club_members', filter: `club_id=eq.${id}` },
          () => fetchAndSetMembers()
        )
        .subscribe();
        
      const notificationsChannel = supabase
        .channel('club-notification-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'club_notifications', filter: `club_id=eq.${id}` },
          () => fetchAndSetNotifications()
        )
        .subscribe();

      const messagesChannel = supabase
        .channel('club-message-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'club_messages', filter: `club_id=eq.${id}` },
          () => fetchAndSetMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(activitiesChannel);
        supabase.removeChannel(membersChannel);
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [id]);

  const fetchClubDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClub(data);
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast({
        title: "Error",
        description: "Failed to load club details",
        variant: "destructive",
      });
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  };

  const loadClubData = async () => {
    if (!id) return;
    fetchAndSetMembers();
    fetchAndSetActivities();
    fetchAndSetNotifications();
    fetchAndSetMessages();
  };

  const fetchAndSetMembers = async () => {
    if (!id) return;
    setMemberLoading(true);
    const data = await fetchClubMembers(id);
    setMembers(data);
    setMemberLoading(false);
  };

  const fetchAndSetActivities = async () => {
    if (!id) return;
    setActivityLoading(true);
    const data = await fetchClubActivities(id);
    setActivities(data);
    setActivityLoading(false);
  };

  const fetchAndSetNotifications = async () => {
    if (!id) return;
    setNotificationLoading(true);
    const data = await fetchClubNotifications(id);
    setNotifications(data);
    setNotificationLoading(false);
  };

  const fetchAndSetMessages = async () => {
    if (!id) return;
    setMessageLoading(true);
    const data = await fetchClubMessages(id);
    setMessages(data);
    setMessageLoading(false);
  };

  const handleJoinRequest = () => {
    if (id) {
      requestToJoinClub(id);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!id) return;
    await approveClubMember(memberId, id);
    fetchAndSetMembers();
  };

  // Handle image file selection with preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActivityImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setActivityImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing the selected image
  const handleRemoveImage = () => {
    setActivityImage(null);
    setActivityImagePreview(null);
  };

  const handleSubmitActivity = async () => {
    if (!id || !user) return;
    
    let imageUrl = undefined;
    
    // Upload image if exists
    if (activityImage) {
      const fileName = `${Date.now()}-${activityImage.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('club-images')
        .upload(fileName, activityImage);
        
      if (uploadError) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
      } else if (uploadData) {
        const { data } = supabase.storage.from('club-images').getPublicUrl(uploadData.path);
        imageUrl = data.publicUrl;
      }
    }
    
    await createClubActivity({
      club_id: id,
      title: activityTitle,
      content: activityContent,
      image_url: imageUrl,
      event_date: activityDate || undefined,
    });
    
    // Reset form
    setActivityTitle("");
    setActivityContent("");
    setActivityDate("");
    setActivityImage(null);
    setActivityImagePreview(null);
    setActivityDialogOpen(false);
    
    // Reload activities
    fetchAndSetActivities();
  };

  // Delete activity function
  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    try {
      const { error } = await supabase
        .from('club_activities')
        .delete()
        .eq('id', activityToDelete)
        .eq('club_id', id);
      
      if (error) throw error;
      
      toast({
        title: "Activity Deleted",
        description: "The activity has been deleted successfully",
      });
      
      // Close the dialog and refresh activities
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      fetchAndSetActivities();
      
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const handleSubmitNotification = async () => {
    if (!id) return;
    
    await createClubNotification({
      club_id: id,
      message: notificationMessage,
    });
    
    // Reset form
    setNotificationMessage("");
    setNotificationDialogOpen(false);
    
    // Reload notifications
    fetchAndSetNotifications();
  };

  const handleSubmitMessage = async () => {
    if (!id || !messageText.trim()) return;
    
    await sendClubMessage(id, messageText);
    setMessageText("");
    
    // Reload messages
    fetchAndSetMessages();
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    await markMessageAsRead(messageId);
    // Update local state
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const handleCoordinatorLogin = () => {
    // In a real app, you would validate this against a database value
    // For this example, we're using a simple hardcoded password: 'coordinator123'
    if (coordinatorPassword === 'coordinator123') {
      setIsCoordinatorMode(true);
      setPasswordDialogOpen(false);
      
      toast({
        title: "Coordinator Mode Enabled",
        description: "You now have access to coordinator features",
      });
    } else {
      toast({
        title: "Invalid Password",
        description: "The coordinator password is incorrect",
        variant: "destructive",
      });
    }
  };

  const userMembership = members.find(member => user && member.user_id === user.id);
  const isMember = !!userMembership?.approved;
  const hasPendingRequest = !!userMembership && !userMembership.approved;

  if (loading) {
    return (
      <div className="container-narrow max-w-4xl mx-auto p-4 mt-24">
        <div className="text-center py-20">Loading club details...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container-narrow max-w-4xl mx-auto p-4 mt-24">
        <div className="text-center py-20">Club not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-narrow max-w-4xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="pl-0 mb-2" 
            onClick={() => navigate('/clubs')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Clubs
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">{club.name}</h1>
              <p className="text-gray-600 mt-1 mb-4">{club.description}</p>
            </div>
            
            <div className="flex gap-3">
              {isAuthenticated ? (
                isMember ? (
                  <Button variant="outline" disabled>
                    <Check size={16} className="mr-2" />
                    Member
                  </Button>
                ) : hasPendingRequest ? (
                  <Button variant="outline" disabled>
                    Request Pending
                  </Button>
                ) : !isManager && (
                  <Button variant="outline" onClick={handleJoinRequest}>
                    <UserPlus size={16} className="mr-2" />
                    Join Club
                  </Button>
                )
              ) : (
                <Button variant="outline" disabled>
                  Login to Join
                </Button>
              )}

              {(isManager) && (
                <Button 
                  variant={isCoordinatorMode ? "default" : "outline"} 
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <Lock size={16} className="mr-2" />
                  {isCoordinatorMode ? "Coordinator Mode" : "Login as Coordinator"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {(isCoordinator || isCoordinatorMode) && (
              <TabsTrigger value="messages" className="relative">
                Messages
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px] absolute -top-1 -right-1">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {(isManager || isCoordinatorMode) && (
              <TabsTrigger value="notifications">
                Notifications
                {notifications.length > 0 && (
                  <span className="ml-1 text-xs bg-sfu-red text-white rounded-full w-5 h-5 inline-flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6">
            {(isManager || isCoordinatorMode) ? (
              <div className="mb-6">
                <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto">
                      <Plus size={16} className="mr-2" />
                      Create New Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create New Activity</DialogTitle>
                      <DialogDescription>
                        Add a new activity or event for your club members.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="activityTitle">Activity Title</Label>
                        <Input 
                          id="activityTitle" 
                          value={activityTitle} 
                          onChange={(e) => setActivityTitle(e.target.value)} 
                          placeholder="Enter activity title"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="activityDate">Date (Optional)</Label>
                        <Input 
                          id="activityDate" 
                          type="datetime-local" 
                          value={activityDate} 
                          onChange={(e) => setActivityDate(e.target.value)} 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="activityContent">Description</Label>
                        <Textarea 
                          id="activityContent" 
                          value={activityContent} 
                          onChange={(e) => setActivityContent(e.target.value)} 
                          placeholder="Describe the activity" 
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="activityImage" className="flex items-center gap-2">
                          <Image size={16} />
                          Image (Optional)
                        </Label>
                        {activityImagePreview ? (
                          <div className="relative">
                            <img 
                              src={activityImagePreview} 
                              alt="Activity preview" 
                              className="w-full max-h-60 object-cover rounded-md"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                              onClick={handleRemoveImage}
                            >
                              <X size={16} className="mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-md p-6 text-center">
                            <ImagePlus className="mx-auto mb-4 text-gray-400" size={40} />
                            <Input 
                              id="activityImage" 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <Label htmlFor="activityImage" className="cursor-pointer inline-block">
                              <Button variant="outline" type="button" className="w-full">
                                Upload Image
                              </Button>
                            </Label>
                            <p className="text-xs text-gray-500 mt-2">
                              Upload an image to showcase your activity (max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setActivityDialogOpen(false);
                        setActivityTitle("");
                        setActivityContent("");
                        setActivityDate("");
                        setActivityImage(null);
                        setActivityImagePreview(null);
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmitActivity} 
                        disabled={!activityTitle || !activityContent}
                      >
                        Create Activity
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : null}
            
            {activityLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 w-full">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10 bg-sfu-lightgray rounded-xl">
                <Calendar size={40} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No activities posted yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden">
                    {activity.image_url && (
                      <div className="h-48 w-full overflow-hidden">
                        <img 
                          src={activity.image_url} 
                          alt={activity.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle>{activity.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {activity.event_date && (
                          <>
                            <Calendar size={14} />
                            <span>{new Date(activity.event_date).toLocaleString()}</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="whitespace-pre-line">{activity.content}</p>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between text-sm text-gray-500 border-t p-4">
                      <div>
                        Posted by {activity.poster_name || "Club Coordinator"} 
                        {activity.created_at && (
                          <span className="ml-2">
                            • {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Delete button for coordinators */}
                      {((isCoordinator || isCoordinatorMode) && user && (activity.posted_by === user.id || isCoordinator)) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setActivityToDelete(activity.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            {memberLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(isManager || isCoordinatorMode) && pendingMembers.length > 0 && (
                  <div className="bg-sfu-lightgray p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Pending Requests ({pendingMembers.length})</h3>
                    <div className="space-y-2">
                      {pendingMembers.map((member) => (
                        <div key={member.id} className="flex justify-between items-center bg-white p-3 rounded">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.student_id}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600"
                              onClick={() => handleApproveMember(member.id)}
                            >
                              <Check size={16} />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-3">Members ({approvedMembers.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {approvedMembers.map((member) => (
                      <div key={member.id} className="flex justify-between items-center border p-3 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.student_id}</div>
                        </div>
                        {member.role !== 'member' && (
                          <div className="pill bg-sfu-red/10 text-sfu-red text-xs px-2 py-1 rounded-full">
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {(isCoordinator || isCoordinatorMode) && (
            <TabsContent value="messages" className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-semibold">Club Messages</h3>
                  <p className="text-xs text-gray-500">Messages from members to the club coordinator</p>
                </div>
                
                <ScrollArea className="h-[400px] p-4">
                  {messageLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare size={40} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-3 rounded-lg ${!message.read ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
                          onClick={() => !message.read && handleMarkMessageAsRead(message.id)}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium">{message.sender_name || 'Unknown member'}</div>
                            <div className="text-xs text-gray-500">
                              {message.created_at && new Date(message.created_at).toLocaleString()}
                              {!message.read && (
                                <Badge variant="secondary" className="ml-2">New</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          )}

          {(isManager || isCoordinatorMode) && (
            <TabsContent value="notifications" className="mt-6">
              <div className="mb-6">
                <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto">
                      <Plus size={16} className="mr-2" />
                      Send New Notification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Notification</DialogTitle>
                      <DialogDescription>
                        Send an important notification to club coordinators and assistants.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="notificationMessage">Message</Label>
                        <Textarea 
                          id="notificationMessage" 
                          value={notificationMessage} 
                          onChange={(e) => setNotificationMessage(e.target.value)} 
                          placeholder="Type your notification message" 
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleSubmitNotification} 
                        disabled={!notificationMessage}
                      >
                        Send Notification
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {notificationLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 bg-sfu-lightgray rounded-xl">
                  <Bell size={40} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Alert key={notification.id}>
                      <Bell className="h-4 w-4" />
                      <AlertTitle>
                        {notification.created_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        )}
                      </AlertTitle>
                      <AlertDescription>
                        {notification.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Message Input - Visible to all members */}
        {isMember && !isManager && (
          <div className="mt-8">
            <Separator className="my-4" />
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Send Message to Club Coordinator</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message to the club coordinator..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSubmitMessage} disabled={!messageText.trim()}>
                  <Send size={16} className="mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirm Delete Activity Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setActivityToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteActivity}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Coordinator Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coordinator Access</DialogTitle>
            <DialogDescription>
              Enter the coordinator password to access additional features and notifications.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor
