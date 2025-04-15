
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Calendar, DollarSign, Tag, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RelatedItems from "./RelatedItems";

interface ItemDetailViewProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted?: () => void;
}

const ItemDetailView: React.FC<ItemDetailViewProps> = ({ 
  item, 
  isOpen, 
  onClose,
  onItemDeleted
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message is empty",
        description: "Please enter a message to the seller.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to contact the seller.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Here you would typically send a message to the seller
      // For example, you could use Supabase to store the message
      
      /* Example implementation:
      const { error } = await supabase.from('marketplace_messages').insert({
        item_id: item.id,
        sender_id: user.id,
        receiver_id: item.seller_id,
        message: message,
        created_at: new Date()
      });
      
      if (error) throw error;
      */
      
      // For now, we'll just simulate a successful message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent!",
        description: "Your message has been sent to the seller."
      });
      
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleDeleteItem = async () => {
    if (!user || user.id !== item.seller_id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own listings.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Delete the item from the database
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      // If there's an image, delete it from storage
      if (item.image_url) {
        const fileName = item.image_url.split('/').pop();
        await supabase.storage
          .from('marketplace-images')
          .remove([fileName]);
      }
      
      toast({
        title: "Item deleted",
        description: "Your item has been removed from the marketplace."
      });
      
      if (onItemDeleted) onItemDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error deleting item",
        description: "There was an error deleting your item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isOwner = user && user.id === item.seller_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{item.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-4">
          {/* Left column - Image and details */}
          <div className="space-y-4">
            {item.image_url ? (
              <div className="w-full h-64 rounded-lg overflow-hidden border">
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {item.category}
              </Badge>
              {item.condition && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {item.condition}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.posted_date)}
              </Badge>
            </div>
            
            <div className="flex items-center text-xl font-semibold">
              <DollarSign className="h-5 w-5 text-sfu-red" />
              <span>{item.price} {item.currency}</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {item.description || "No description provided."}
              </p>
            </div>
          </div>
          
          {/* Right column - Seller info and contact */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Seller Information</h3>
              <div className="space-y-2">
                <p className="text-sm flex items-center gap-2">
                  <span className="font-medium">Name:</span> {item.seller_name}
                </p>
                {item.contact && (
                  <p className="text-sm flex items-center gap-2">
                    <span className="font-medium">Contact:</span> {item.contact}
                  </p>
                )}
              </div>
            </div>
            
            {!isOwner && (
              <div className="space-y-3">
                <h3 className="font-medium">Contact Seller</h3>
                <Textarea
                  placeholder="Write a message to the seller..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
            
            {isOwner && (
              <div className="space-y-3">
                <h3 className="font-medium">Manage Listing</h3>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteItem}
                  disabled={isDeleting}
                  className="w-full"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Listing"}
                </Button>
              </div>
            )}
            
            {/* Related Items Section */}
            <div className="space-y-3 pt-4">
              <h3 className="font-medium">Related Items</h3>
              <RelatedItems currentItemId={item.id} category={item.category} />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailView;
