// Import necessary modules and components
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from '@/hooks/use-toast';
import { MoreVertical, Edit, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createNotification } from "@/utils/notificationHelpers";

// Define the schema for the edit form
const formSchema = z.object({
  approval_status: z.enum(['pending', 'approved', 'rejected', 'deleted']),
  message: z.string().optional(),
})

// AdminReview Component
const AdminReview: React.FC = () => {
  // State variables
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Function to fetch profiles from Supabase
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to fetch profiles. Please try again.",
          variant: "destructive",
        });
      }

      if (data) {
        setProfiles(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle profile approval
  const handleApprove = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', profileId);

      if (error) {
        console.error("Error approving profile:", error);
        toast({
          title: "Error",
          description: "Failed to approve profile. Please try again.",
          variant: "destructive",
        });
      } else {
        // Optimistically update the UI
        setProfiles(profiles.map(profile =>
          profile.id === profileId ? { ...profile, approval_status: 'approved' } : profile
        ));
        toast({
          title: "Success",
          description: "Profile approved successfully.",
        });
      }
    } catch (error) {
      console.error("Unexpected error approving profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle profile rejection
  const handleReject = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', profileId);

      if (error) {
        console.error("Error rejecting profile:", error);
        toast({
          title: "Error",
          description: "Failed to reject profile. Please try again.",
          variant: "destructive",
        });
      } else {
        // Optimistically update the UI
        setProfiles(profiles.map(profile =>
          profile.id === profileId ? { ...profile, approval_status: 'rejected' } : profile
        ));
        toast({
          title: "Success",
          description: "Profile rejected successfully.",
        });
      }
    } catch (error) {
      console.error("Unexpected error rejecting profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle profile deletion
  const handleDelete = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'deleted' })
        .eq('id', profileId);

      if (error) {
        console.error("Error deleting profile:", error);
        toast({
          title: "Error",
          description: "Failed to delete profile. Please try again.",
          variant: "destructive",
        });
      } else {
        // Optimistically update the UI
        setProfiles(profiles.map(profile =>
          profile.id === profileId ? { ...profile, approval_status: 'deleted' } : profile
        ));
        toast({
          title: "Success",
          description: "Profile deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Unexpected error deleting profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to open the edit dialog
  const openEditDialog = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsEditDialogOpen(true);
  };

  // Function to close the edit dialog
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
  };

  // Function to open the message dialog
  const openMessageDialog = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsMessageDialogOpen(true);
  };

  // Function to close the message dialog
  const closeMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setSelectedProfile(null);
    setMessage('');
  };

  // Function to send a notification to the user
  const sendNotification = async (userId: string) => {
    try {
      // Call the notifyMarketplaceActivity function
      await notifyUser(
        userId,
        'Account Update',
        'Your account status has been updated by an administrator.'
      );

      toast({
        title: "Success",
        description: "Notification sent to user.",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle sending a message to the user
  const handleSendMessage = async () => {
    if (!selectedProfile) return;

    try {
      // Send the notification
      await sendNotification(selectedProfile.id);

      toast({
        title: "Success",
        description: "Message sent to user.",
      });

      closeMessageDialog();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      approval_status: selectedProfile?.approval_status as z.infer<typeof formSchema>["approval_status"] || 'pending',
      message: '',
    },
    mode: "onChange",
  })

  // Function to handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedProfile) return;

    try {
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: values.approval_status })
        .eq('id', selectedProfile.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      } else {
        // Optimistically update the UI
        setProfiles(profiles.map(profile =>
          profile.id === selectedProfile.id ? { ...profile, approval_status: values.approval_status } : profile
        ));

        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });

        // Send a notification to the user
        await sendNotification(selectedProfile.id);

        closeEditDialog();
      }
    } catch (error) {
      console.error("Unexpected error updating profile:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to send a notification to the user
  const notifyUser = async (userId: string, title: string, message: string) => {
    return await createNotification(
      userId,
      title,
      message,
      'info',
      'marketplace'
    );
  };

  // Render the component
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Admin Review</h1>

      {loading ? (
        <p>Loading profiles...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>User Profiles</CardTitle>
            <CardDescription>Review and manage user profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.id}</TableCell>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>{profile.student_id}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.approval_status}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(profile)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMessageDialog(profile)}>
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {profile.approval_status !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleApprove(profile.id)}>
                              <Check className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                          )}
                          {profile.approval_status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleReject(profile.id)}>
                              <X className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(profile.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to the user profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="approval_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="deleted">Deleted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This is the user's current approval status.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <Button onClick={handleSendMessage}>Send Message</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReview;
