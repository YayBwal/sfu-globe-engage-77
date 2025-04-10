
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceItem } from '@/types/clubs';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const AdminReview = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [declineMessage, setDeclineMessage] = useState('');
  const [declineProcessing, setDeclineProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    } else if (!authLoading) {
      fetchPendingItems();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;
      setPendingItems(data as MarketplaceItem[]);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending marketplace items.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      setProcessingId(itemId);
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: 'approved' })
        .eq('id', itemId);

      if (error) throw error;

      setPendingItems(pendingItems.filter(item => item.id !== itemId));
      toast({
        title: 'Item Approved',
        description: 'The item is now visible in the marketplace.',
      });
    } catch (error) {
      console.error('Error approving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve item.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openDeclineDialog = (itemId: string) => {
    setSelectedItemId(itemId);
    setDeclineDialogOpen(true);
    setDeclineMessage('');
  };

  const handleDeclineItem = async () => {
    if (!selectedItemId) return;
    
    try {
      setDeclineProcessing(true);
      
      // First update the item status to declined
      const { error: updateError } = await supabase
        .from('marketplace_items')
        .update({ status: 'declined' })
        .eq('id', selectedItemId);

      if (updateError) throw updateError;

      // Then save the decline message if provided
      if (declineMessage.trim()) {
        const { error: messageError } = await supabase
          .from('admin_messages')
          .insert({
            marketplace_item_id: selectedItemId,
            message: declineMessage.trim()
          });

        if (messageError) throw messageError;
      }

      setPendingItems(pendingItems.filter(item => item.id !== selectedItemId));
      setDeclineDialogOpen(false);
      setSelectedItemId(null);
      
      toast({
        title: 'Item Declined',
        description: 'The item has been rejected and will not be listed in the marketplace.',
      });
    } catch (error) {
      console.error('Error declining item:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline item.',
        variant: 'destructive',
      });
    } finally {
      setDeclineProcessing(false);
    }
  };

  const formatCurrency = (price: number, currency: string) => {
    return `${price} ${currency}`;
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Review: Marketplace Items</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/marketplace')}
          >
            Back to Marketplace
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No pending items to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                    <Badge variant="outline">{formatCurrency(item.price, item.currency)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Seller:</span> {item.seller_name}</p>
                    <p><span className="font-medium">Category:</span> {item.category}</p>
                    {item.condition && (
                      <p><span className="font-medium">Condition:</span> {item.condition}</p>
                    )}
                    
                    {item.description && (
                      <div>
                        <p className="font-medium">Description:</p>
                        <p className="text-gray-600 line-clamp-3">{item.description}</p>
                      </div>
                    )}
                    
                    {item.image_url && (
                      <div className="mt-2">
                        <div 
                          className="h-40 bg-contain bg-center bg-no-repeat cursor-pointer"
                          style={{ backgroundImage: `url(${item.image_url})` }}
                          onClick={() => setViewImage(item.image_url || null)}
                        />
                      </div>
                    )}
                    
                    {!item.image_url && (
                      <div className="bg-gray-100 h-20 flex items-center justify-center rounded mt-2">
                        <p className="text-gray-400 text-sm">No image provided</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 bg-gray-50 pt-4">
                  <Button 
                    variant="default" 
                    className="w-1/2 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveItem(item.id)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
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
                    onClick={() => openDeclineDialog(item.id)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Decline
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

      {/* Image Preview Dialog */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Item Image</DialogTitle>
            <DialogDescription>
              Preview of the uploaded item image.
            </DialogDescription>
          </DialogHeader>
          {viewImage && (
            <div className="flex justify-center py-4">
              <img
                src={viewImage}
                alt="Item"
                className="max-h-[60vh] rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Reason Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Decline Item</DialogTitle>
            <DialogDescription>
              Provide a reason why this item is being declined. This message will be visible to the seller.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            className="min-h-[100px]"
            placeholder="Enter reason for declining the item (optional)"
            value={declineMessage}
            onChange={(e) => setDeclineMessage(e.target.value)}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeclineDialogOpen(false)}
              disabled={declineProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeclineItem}
              disabled={declineProcessing}
            >
              {declineProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Decline Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReview;
