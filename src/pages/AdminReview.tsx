
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, X, Eye } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const AdminReview = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    } else if (!authLoading) {
      fetchPendingUsers();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending');

      if (error) throw error;

      // Map the data to match the UserProfile type
      const mappedData = data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        major: user.major,
        batch: user.batch,
        bio: user.bio || '',
        interests: user.interests || [],
        availability: user.availability || '',
        online: user.online || false,
        profilePic: user.profile_pic,
        coverPic: user.cover_pic,
        student_id_photo: user.student_id_photo,
        approval_status: user.approval_status,
        profile_pic: user.profile_pic,
        cover_pic: user.cover_pic
      })) as UserProfile[];

      setPendingUsers(mappedData);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending registrations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setProcessingId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      toast({
        title: 'User Approved',
        description: 'The user registration has been approved.',
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve user.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      setProcessingId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      toast({
        title: 'User Rejected',
        description: 'The user registration has been rejected.',
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject user.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Pending Registrations</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No pending registrations to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <Badge variant="outline">{user.approval_status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Student ID:</span> {user.student_id}</p>
                    <p><span className="font-medium">Major:</span> {user.major}</p>
                    <p><span className="font-medium">Batch:</span> {user.batch}</p>
                    
                    {user.student_id_photo && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => setViewPhoto(user.student_id_photo)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View ID Photo
                      </Button>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 bg-gray-50">
                  <Button 
                    variant="default" 
                    className="w-1/2 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveUser(user.id)}
                    disabled={processingId === user.id}
                  >
                    {processingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-1/2"
                    onClick={() => handleRejectUser(user.id)}
                    disabled={processingId === user.id}
                  >
                    {processingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student ID Photo</DialogTitle>
            <DialogDescription>
              Verify that the photo matches the provided information.
            </DialogDescription>
          </DialogHeader>
          {viewPhoto && (
            <div className="flex justify-center py-4">
              <img
                src={viewPhoto}
                alt="Student ID"
                className="max-h-[60vh] rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReview;
