
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const AdminReview = () => {
  const [pendingProfiles, setPendingProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchPendingProfiles();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(data);
      
      if (!data) {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setIsAdmin(false);
      navigate('/');
    }
  };

  const fetchPendingProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending');
      
      if (error) {
        throw error;
      }
      
      setPendingProfiles(data as UserProfile[]);
    } catch (error: any) {
      console.error('Error fetching pending profiles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pending profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalUpdate = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingIds(prev => ({ ...prev, [userId]: true }));
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          approval_status: status 
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setPendingProfiles(prev => prev.filter(profile => profile.id !== userId));
      
      toast({
        title: 'Success',
        description: `Registration ${status}`,
      });
    } catch (error: any) {
      console.error(`Error ${status} registration:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${status} registration`,
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Review Pending Registrations</h1>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : pendingProfiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending registrations to review
            </div>
          ) : (
            <Table>
              <TableCaption>List of pending student registrations</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>ID Photo</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.student_id}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.major}</TableCell>
                    <TableCell>{profile.batch}</TableCell>
                    <TableCell>
                      {profile.student_id_photo ? (
                        <a 
                          href={profile.student_id_photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View ID
                        </a>
                      ) : (
                        <span className="text-gray-400">No photo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                        onClick={() => handleApprovalUpdate(profile.id, 'approved')}
                        disabled={processingIds[profile.id]}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                        onClick={() => handleApprovalUpdate(profile.id, 'rejected')}
                        disabled={processingIds[profile.id]}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReview;
