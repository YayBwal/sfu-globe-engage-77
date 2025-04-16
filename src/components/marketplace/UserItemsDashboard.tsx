
import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ItemRejectionMessage from "./ItemRejectionMessage";

interface UserItemsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserItemsDashboard: React.FC<UserItemsDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [rejectedItems, setRejectedItems] = useState<any[]>([]);
  const [selectedRejectedItemId, setSelectedRejectedItemId] = useState<string | null>(null);
  const [showingRejectionFeedback, setShowingRejectionFeedback] = useState(false);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('seller_id', user.id)
          .order('posted_date', { ascending: false });
        
        if (error) throw error;
        
        const activeItems = data.filter(item => item.status === 'approved' && item.is_available);
        const pendingItems = data.filter(item => item.status === 'pending');
        const rejectedItems = data.filter(item => item.status === 'declined');
        
        setActiveItems(activeItems);
        setPendingItems(pendingItems);
        setRejectedItems(rejectedItems);
      } catch (err: any) {
        console.error("Error fetching user items:", err);
        toast({
          title: "Error",
          description: "Failed to load your marketplace items",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserItems();
  }, [user]);

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setActiveItems(prev => prev.filter(item => item.id !== itemId));
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
      setRejectedItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Item Deleted",
        description: "Your item has been deleted from the marketplace"
      });
    } catch (err: any) {
      console.error("Error deleting item:", err);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const markItemAsSold = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ is_available: false })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setActiveItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Item Marked as Sold",
        description: "Your item has been marked as sold and removed from the marketplace"
      });
    } catch (err: any) {
      console.error("Error marking item as sold:", err);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive"
      });
    }
  };
  
  const showRejectionFeedback = (itemId: string) => {
    setSelectedRejectedItemId(itemId);
    setShowingRejectionFeedback(true);
  };

  if (showingRejectionFeedback) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent>
          <SheetHeader className="mb-6">
            <SheetTitle>Rejection Feedback</SheetTitle>
          </SheetHeader>
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => setShowingRejectionFeedback(false)}
          >
            ← Back to Dashboard
          </Button>
          
          <ItemRejectionMessage itemId={selectedRejectedItemId || undefined} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader className="mb-6">
          <SheetTitle>My Items Dashboard</SheetTitle>
        </SheetHeader>
        
        {!user ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p className="text-gray-500 mb-4">Please log in to view your marketplace items</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-gray-500">Loading your items...</p>
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({activeItems.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedItems.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="pt-4">
              {activeItems.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-700 mb-1">No active items</h3>
                  <p className="text-gray-500">You don't have any active listings right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <div key={item.id} className="border rounded-md overflow-hidden shadow-sm">
                      <div className="flex">
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {item.price} {item.currency} • {item.category}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markItemAsSold(item.id)}
                            >
                              Mark as Sold
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="pt-4">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-700 mb-1">No pending items</h3>
                  <p className="text-gray-500">You don't have any items awaiting approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="border rounded-md overflow-hidden shadow-sm border-amber-200 bg-amber-50">
                      <div className="flex">
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{item.title}</h3>
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {item.price} {item.currency} • {item.category}
                          </p>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="pt-4">
              {rejectedItems.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <XCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-700 mb-1">No rejected items</h3>
                  <p className="text-gray-500">You don't have any rejected listings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedItems.map((item) => (
                    <div key={item.id} className="border rounded-md overflow-hidden shadow-sm border-red-200 bg-red-50">
                      <div className="flex">
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{item.title}</h3>
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                              Rejected
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {item.price} {item.currency} • {item.category}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => showRejectionFeedback(item.id)}
                            >
                              View Feedback
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UserItemsDashboard;
