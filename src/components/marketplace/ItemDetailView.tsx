
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash, Mail, ExternalLink, Calendar, Tag, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MarketplaceItemDisplay } from "@/types/marketplace";

interface ItemDetailViewProps {
  item: MarketplaceItemDisplay | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (itemId: string) => void;
}

const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, isOpen, onClose, onDelete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = item?.postedDate 
    ? new Date(item.postedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';
    
  const isCurrentUserSeller = user?.id === item?.seller.id;
  
  const handleSendMessage = async () => {
    if (!message.trim() || !item) return;
    
    setIsSending(true);
    
    try {
      // In a real app, this would send a message to the seller
      // For now we'll just simulate it with a toast
      
      // If connected to Supabase, you could store the message:
      /*
      const { error } = await supabase
        .from('marketplace_messages')
        .insert({
          item_id: item.id,
          sender_id: user?.id,
          recipient_id: item.seller.id,
          message: message,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      */
      
      // Success message
      toast({
        title: "Message sent!",
        description: `Your message about "${item.title}" has been sent to the seller.`,
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
    if (!item) return;
    
    setIsDeleting(true);
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Delete image if exists
      if (item.image) {
        const imagePath = item.image.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('marketplace-images')
            .remove([imagePath]);
        }
      }
      
      toast({
        title: "Item deleted",
        description: "Your item has been removed from the marketplace.",
      });
      
      onDelete(item.id);
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
  
  if (!item) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.title}</DialogTitle>
          <DialogDescription className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-3.5 w-3.5" />
            Posted on {formattedDate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {item.image ? (
              <div className="overflow-hidden rounded-md border">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-64 object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted rounded-md border">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {item.category}
              </Badge>
              
              {item.condition && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {item.condition}
                </Badge>
              )}
              
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                <CircleDollarSign className="h-3.5 w-3.5" />
                {item.price} {item.currency}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {item.description || "No description provided."}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm mb-2">Seller Information</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-2 font-medium">Name</TableCell>
                    <TableCell className="py-2">{item.seller.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 font-medium">Student ID</TableCell>
                    <TableCell className="py-2">{item.seller.id}</TableCell>
                  </TableRow>
                  {item.contact && (
                    <TableRow>
                      <TableCell className="py-2 font-medium">Contact</TableCell>
                      <TableCell className="py-2">{item.contact}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {!isCurrentUserSeller && (
              <div>
                <h3 className="font-medium text-sm mb-2">Contact Seller</h3>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Write a message to the seller..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    className="w-full" 
                    disabled={!message.trim() || isSending}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          {isCurrentUserSeller ? (
            <Button 
              variant="destructive" 
              onClick={handleDeleteItem}
              disabled={isDeleting}
            >
              <Trash className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>See something suspicious? <a href="#" className="underline">Report item</a></p>
            </div>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailView;
