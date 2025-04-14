
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceItem, AdminMessage } from '@/types/clubs';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserItemsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserItemsDashboard: React.FC<UserItemsDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [adminMessage, setAdminMessage] = useState<AdminMessage | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserItems();
    }
  }, [isOpen, user]);

  const fetchUserItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('seller_id', user.id);

      if (error) throw error;
      setItems(data as MarketplaceItem[]);
    } catch (error) {
      console.error('Error fetching user items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your marketplace items.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminMessage = async (itemId: string) => {
    try {
      setMessageLoading(true);
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('marketplace_item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAdminMessage(data[0] as AdminMessage);
      } else {
        setAdminMessage(null);
      }
    } catch (error) {
      console.error('Error fetching admin message:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin feedback.',
        variant: 'destructive',
      });
    } finally {
      setMessageLoading(false);
    }
  };

  const handleViewDetails = (e: React.MouseEvent, item: MarketplaceItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem(item);
    if (item.status === 'declined') {
      fetchAdminMessage(item.id);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredItems = activeFilter === 'all' 
    ? items 
    : items.filter(item => item.status === activeFilter);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Your Marketplace Items</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p>You haven't posted any items yet.</p>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="mt-4"
              variant="outline"
            >
              Post an Item
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="all" onValueChange={(value) => setActiveFilter(value as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All ({items.length})</TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">
                  Pending ({items.filter(item => item.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex-1">
                  Approved ({items.filter(item => item.status === 'approved').length})
                </TabsTrigger>
                <TabsTrigger value="declined" className="flex-1">
                  Declined ({items.filter(item => item.status === 'declined').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeFilter} className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {filteredItems.length === 0 ? (
                    <p className="text-center py-6 text-gray-500">No {activeFilter} items found.</p>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base truncate">{item.title}</CardTitle>
                            <Badge className={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-x-4 text-sm">
                            <p><span className="font-medium">Price:</span> {item.price} {item.currency}</p>
                            <p><span className="font-medium">Category:</span> {item.category}</p>
                            <p><span className="font-medium">Posted:</span> {formatDate(item.posted_date)}</p>
                            <p><span className="font-medium">Condition:</span> {item.condition || 'Not specified'}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => handleViewDetails(e, item)}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
      
      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog 
          open={!!selectedItem} 
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="sm:max-w-[600px]" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{selectedItem.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{selectedItem.price} {selectedItem.currency}</span>
                <Badge className={getStatusBadgeColor(selectedItem.status)}>{selectedItem.status}</Badge>
              </div>
              
              {selectedItem.image_url && (
                <div>
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.title}
                    className="w-full h-56 object-contain bg-gray-100 rounded"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Category:</span> {selectedItem.category}</p>
                <p><span className="font-medium">Condition:</span> {selectedItem.condition || 'Not specified'}</p>
                <p><span className="font-medium">Posted:</span> {formatDate(selectedItem.posted_date)}</p>
                <p><span className="font-medium">Available:</span> {selectedItem.is_available ? 'Yes' : 'No'}</p>
              </div>
              
              {selectedItem.description && (
                <div>
                  <h3 className="font-medium mb-1">Description:</h3>
                  <p className="text-gray-700">{selectedItem.description}</p>
                </div>
              )}
              
              {selectedItem.status === 'declined' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800">Your item was declined</h3>
                      {messageLoading ? (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Loading admin feedback...</span>
                        </div>
                      ) : adminMessage ? (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Reason:</h4>
                          <p className="text-sm text-gray-700 mt-1">{adminMessage.message}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1">
                          No specific reason was provided for declining this item.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedItem.status === 'pending' && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-400 mr-2" />
                    <div>
                      <h3 className="font-medium text-amber-800">Your item is pending review</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        This item is currently being reviewed by our admins. You'll be notified when it's approved or declined.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default UserItemsDashboard;
