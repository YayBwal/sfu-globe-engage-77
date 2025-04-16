
import React, { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PostItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onItemPosted: (item: any) => void;
}

const PostItemForm = ({ isOpen, onClose, onItemPosted }: PostItemFormProps) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [currency, setCurrency] = useState("MMK");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure user is logged in and approved
  if (!user || !profile || profile.approval_status !== 'approved') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent>
          <SheetHeader className="mb-6">
            <SheetTitle>Post an Item</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 w-full">
              <p className="text-amber-800">
                {!user ? 
                  "Please log in to post items to the marketplace." : 
                  profile?.approval_status === 'pending' ? 
                    "Your account is pending approval. You'll be able to post items once an administrator approves your account." : 
                    "Your account has been rejected. You cannot post items to the marketplace."
                }
              </p>
            </div>
            <Button 
              onClick={onClose} 
              className="mt-4"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to post items",
          variant: "destructive"
        });
        return;
      }
      
      // Validate form
      if (!title || !price || !category) {
        toast({
          title: "Missing Information",
          description: "Please fill out all required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Upload image if there is one
      let imageUrl = null;
      if (image) {
        // Create a unique file path
        const filePath = `marketplace/${user.id}/${Date.now()}-${image.name}`;
        
        // Upload to storage
        const { error: uploadError, data } = await supabase.storage
          .from('marketplace')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('marketplace')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      // Insert item into database
      const { data: item, error } = await supabase
        .from('marketplace_items')
        .insert({
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          currency,
          image_url: imageUrl,
          seller_id: user.id,
          seller_name: profile?.name || "Unknown",
          status: 'pending', // All items start as pending
          is_available: true
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Clear form
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setCondition("");
      setCurrency("MMK");
      setImage(null);
      setImagePreview(null);
      
      // Close the dialog
      onClose();
      
      // Notify parent component
      onItemPosted(item);
      
    } catch (error: any) {
      console.error("Error posting item:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error posting your item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Post an Item</SheetTitle>
          <SheetDescription>
            Fill out the details below to post a new item to the marketplace.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-right">
                Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMK">MMK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-right">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Notes">Notes</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select condition (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Like New">Like New</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Item Image (Optional)</Label>
            <div className="border-2 border-dashed rounded-md p-4 text-center">
              {imagePreview ? (
                <div className="space-y-2">
                  <img 
                    src={imagePreview} 
                    alt="Item preview" 
                    className="h-40 mx-auto object-contain"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearImage}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col items-center justify-center py-2">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG or WEBP (max 5MB)</p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
            <p className="text-sm text-amber-700">
              Your item will be reviewed by an administrator before being published to the marketplace.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Post Item
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PostItemForm;
