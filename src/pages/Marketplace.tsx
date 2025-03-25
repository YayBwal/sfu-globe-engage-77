
import React, { useState, useEffect } from "react";
import { Filter, Search, ShoppingBag, Tag, ArrowUpDown, Grid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PostItemForm from "@/components/marketplace/PostItemForm";
import ItemDetailView from "@/components/marketplace/ItemDetailView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Marketplace = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPostItemOpen, setIsPostItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch marketplace items
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('marketplace_items')
          .select('*')
          .eq('is_available', true);
          
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching marketplace items:", error);
          return;
        }
        
        setMarketplaceItems(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketplaceItems();
  }, []);
  
  // Filter items
  const filteredItems = marketplaceItems.filter(item => {
    // Filter by search term
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by category
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort items
    if (sortBy === "price-low") {
      return a.price - b.price;
    } else if (sortBy === "price-high") {
      return b.price - a.price;
    }
    
    // Default: newest
    return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
  });
  
  const handlePostItem = (newItem: any) => {
    setMarketplaceItems(prev => [newItem, ...prev]);
  };
  
  const handleDeleteItem = () => {
    setMarketplaceItems(prev => prev.filter(item => item.id !== selectedItem.id));
    setSelectedItem(null);
  };
  
  const formatPostedDate = (dateString: string) => {
    const postedDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold">Marketplace</h1>
                <p className="text-gray-500">Buy and sell items with fellow students</p>
              </div>
              
              <Button 
                className="bg-sfu-red hover:bg-sfu-red/90"
                onClick={() => setIsPostItemOpen(true)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Post an Item
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]">
                    <Tag className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Notes">Notes</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="hidden md:flex">
                <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
                  <TabsList>
                    <TabsTrigger value="grid">
                      <Grid className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-sfu-red animate-spin mb-4" />
                <p className="text-gray-500">Loading marketplace items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">No items found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`overflow-hidden transition-all hover:shadow-md ${viewMode === "list" ? "flex flex-col md:flex-row" : ""} cursor-pointer`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div 
                      className={`${viewMode === "list" ? "md:w-1/3" : "w-full"} h-48 bg-cover bg-center`}
                      style={{ 
                        backgroundImage: item.image_url ? `url(${item.image_url})` : 'none',
                        backgroundColor: !item.image_url ? '#f4f4f4' : 'transparent',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {!item.image_url && (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-400">No image</p>
                        </div>
                      )}
                    </div>
                    <CardContent className={`p-4 ${viewMode === "list" ? "md:w-2/3" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                        <span className="font-bold text-sfu-red">{item.price} {item.currency}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          {item.category}
                        </span>
                        {item.condition && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                            {item.condition}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{item.seller_name}</span>
                        <span>{formatPostedDate(item.posted_date)}</span>
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Post Item Dialog */}
      <PostItemForm 
        isOpen={isPostItemOpen}
        onClose={() => setIsPostItemOpen(false)}
        onItemPosted={handlePostItem}
      />
      
      {/* Item Detail Dialog */}
      {selectedItem && (
        <ItemDetailView 
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onItemDeleted={handleDeleteItem}
        />
      )}
    </div>
  );
};

export default Marketplace;
