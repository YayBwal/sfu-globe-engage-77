
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";

interface PostItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onItemPosted: (newItem: any) => void;
}

const CATEGORIES = [
  "Books",
  "Electronics",
  "Notes",
  "Furniture",
  "Clothing",
  "Services",
  "Other"
];

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Used",
  "Worn"
];

const CURRENCIES = [
  "MMK",
  "USD",
  "SGD",
  "EUR",
  "GBP"
];

const PostItemForm: React.FC<PostItemFormProps> = ({ isOpen, onClose, onItemPosted }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "MMK",
    category: "",
    condition: "",
    contact: "",
    sellerId: user?.id || "",
    sellerName: user?.displayName || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a unique ID for the item
      const itemId = uuidv4();
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${itemId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('marketplace-images')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }
      
      // Create new marketplace item
      const newItem = {
        id: itemId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        condition: formData.condition,
        image: imageUrl,
        seller: {
          name: formData.sellerName,
          id: formData.sellerId
        },
        contact: formData.contact,
        postedDate: new Date().toISOString(),
        isAvailable: true
      };
      
      // Add to database (if connected to Supabase)
      const { error } = await supabase
        .from('marketplace_items')
        .insert(newItem);
        
      if (error) throw error;
      
      // Success!
      toast({
        title: "Item posted successfully!",
        description: "Your item is now listed in the marketplace.",
      });
      
      // Pass the new item back to parent component
      onItemPosted(newItem);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        currency: "MMK",
        category: "",
        condition: "",
        contact: "",
        sellerId: user?.id || "",
        sellerName: user?.displayName || ""
      });
      setImageFile(null);
      setImagePreview(null);
      
      // Close dialog
      onClose();
      
    } catch (error) {
      console.error("Error posting item:", error);
      toast({
        title: "Error posting item",
        description: "There was an error posting your item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Post an Item for Sale</DialogTitle>
          <DialogDescription>
            List your item on the student marketplace for others to purchase
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-140px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 py-2">
              {/* Image Upload */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex items-center gap-2">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-full h-48 object-contain border rounded-md"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/30 hover:bg-black/50"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-36 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload an image</p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    id="image" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              
              {/* Title */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="title" className="text-md">Product Name <span className="text-red-500">*</span></Label>
                <Input 
                  type="text" 
                  id="title" 
                  name="title"
                  placeholder="Enter product name" 
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {/* Description */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description" className="text-md">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Describe your product (condition, features, etc.)" 
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              {/* Price and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="price" className="text-md">Price <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    id="price" 
                    name="price"
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="currency" className="text-md">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => handleSelectChange("currency", value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Category and Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="category" className="text-md">Category <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="condition" className="text-md">Condition</Label>
                  <Select 
                    value={formData.condition} 
                    onValueChange={(value) => handleSelectChange("condition", value)}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(condition => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Seller Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="sellerName" className="text-md">Seller Name</Label>
                  <Input 
                    type="text" 
                    id="sellerName" 
                    name="sellerName"
                    placeholder="Your name" 
                    value={formData.sellerName}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="sellerId" className="text-md">Student ID</Label>
                  <Input 
                    type="text" 
                    id="sellerId" 
                    name="sellerId"
                    placeholder="Your student ID" 
                    value={formData.sellerId}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contact" className="text-md">Contact Information</Label>
                <Input 
                  type="text" 
                  id="contact" 
                  name="contact"
                  placeholder="Phone number or email" 
                  value={formData.contact}
                  onChange={handleChange}
                />
              </div>
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Posting..." : "Post Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostItemForm;
