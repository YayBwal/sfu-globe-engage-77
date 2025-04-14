import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AdminReview = () => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchPendingUsers();
  }, [isAdmin, navigate]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Map database fields to UserProfile type
        const mappedProfiles: UserProfile[] = data.map(profile => ({
          id: profile.id,
          name: profile.name,
          student_id: profile.student_id,
          major: profile.major,
          batch: profile.batch,
          email: profile.email,
          online: Boolean(profile.online),
          bio: profile.bio || "",
          interests: profile.interests || [],
          availability: profile.availability || "",
          profilePic: profile.profile_pic,
          coverPic: profile.cover_pic,
          student_id_photo: profile.student_id_photo,
          approval_status: profile.approval_status || 'pending',
          phone: profile.phone,
          // Convert JSON to proper TypeScript objects
          notificationPreferences: profile.notification_preferences ? 
            profile.notification_preferences as any : undefined,
          privacySettings: profile.privacy_settings ? 
            profile.privacy_settings as any : undefined,
          // Keep original DB fields for compatibility
          profile_pic: profile.profile_pic,
          cover_pic: profile.cover_pic,
          theme_preference: profile.theme_preference,
        }));
        
        setPendingUsers(mappedProfiles);
      } else {
        setPendingUsers([]);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setProcessingId(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "approved" })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast({
        title: "User Approved",
        description: "The user can now log in to the platform",
      });

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setProcessingId(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast({
        title: "User Rejected",
        description: "The user has been rejected",
      });

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-24">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Admin Review Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending approvals at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Student ID Card Image */}
                            <div className="flex justify-center items-center bg-gray-100 p-4">
                              {user.student_id_photo ? (
                                <img
                                  src={user.student_id_photo}
                                  alt="Student ID Card"
                                  className="max-h-64 object-contain"
                                />
                              ) : (
                                <p className="text-gray-500 italic">No ID card uploaded</p>
                              )}
                            </div>

                            {/* User Information */}
                            <div className="p-6 md:col-span-2">
                              <h3 className="font-bold text-lg mb-4">{user.name}</h3>
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                  <p className="text-gray-600 text-sm">Email</p>
                                  <p>{user.email}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 text-sm">Student ID</p>
                                  <p>{user.student_id}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 text-sm">Major</p>
                                  <p>{user.major}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 text-sm">Batch</p>
                                  <p>{user.batch}</p>
                                </div>
                              </div>

                              <div className="space-x-2">
                                <Button
                                  onClick={() => handleApprove(user.id)}
                                  disabled={processingId === user.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {processingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(user.id)}
                                  disabled={processingId === user.id}
                                >
                                  {processingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReview;
