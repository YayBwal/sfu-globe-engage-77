import React, { useState, useEffect } from "react";
import { Filter, Search, ShoppingBag, Tag, ArrowUpDown, Grid, List, Loader2, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PostItemForm from "@/components/marketplace/PostItemForm";
import ItemDetailView from "@/components/marketplace/ItemDetailView";
import UserItemsDashboard from "@/components/marketplace/UserItemsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MarketplaceItem } from "@/types/clubs";

const Marketplace = () => {
  const { user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPostItemOpen, setIsPostItemOpen] = useState(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingItemNotice, setPendingItemNotice] = useState("");
  
  // Fetch marketplace items
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('marketplace_items')
          .select('*');
          
        // Only admins can see all items including pending and declined ones
        if (!isAdmin) {
          query = query.or(`status.eq.approved,seller_id.eq.${user?.id}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching marketplace items:", error);
          toast({
            title: "Error",
            description: "Failed to load marketplace items.",
            variant: "destructive",
          });
          return;
        }
        
        // Ensure proper typing for the data
        const typedItems: MarketplaceItem[] = (data || []).map(item => ({
          ...item,
          status: item.status as 'pending' | 'approved' | 'declined'
        }));
        
        setMarketplaceItems(typedItems);

        // Check if the user has any pending items
        if (user) {
          const pendingItemsCount = typedItems.filter(item => 
            item.seller_id === user.id && item.status === 'pending'
          ).length || 0;
          
          if (pendingItemsCount > 0) {
            setPendingItemNotice(`You have ${pendingItemsCount} item${pendingItemsCount > 1 ? 's' : ''} pending admin approval.`);
          } else {
            setPendingItemNotice("");
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Something went wrong while loading the marketplace.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketplaceItems();
  }, [user, isAdmin]);
  
  // Filter items
  const filteredItems = marketplaceItems.filter(item => {
    // Only show approved items in the main marketplace (unless it's your own item)
    if (!isAdmin && item.status !== 'approved' && item.seller_id !== user?.id) {
      return false;
    }
    
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
    
    // Show notification about pending approval
    toast({
      title: "Item Posted Successfully",
      description: "Your item is pending admin approval and will be visible once approved.",
      duration: 5000,
    });

    setPendingItemNotice("You have items pending admin approval.");
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
              
              <div className="flex space-x-2 w-full md:w-auto">
                <Button 
                  className="bg-sfu-red hover:bg-sfu-red/90 flex-1 md:flex-auto"
                  onClick={() => setIsPostItemOpen(true)}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Post an Item
                </Button>
                
                {user && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 flex-1 md:flex-auto"
                    onClick={() => setIsUserDashboardOpen(true)}
                  >
                    <Package2 className="mr-2 h-4 w-4" />
                    My Items
                  </Button>
                )}
              </div>
            </div>

            {/* Pending items notice */}
            {pendingItemNotice && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      {pendingItemNotice}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-amber-700 p-0 h-auto"
                      onClick={() => setIsUserDashboardOpen(true)}
                    >
                      View your items
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {isAdmin && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      As an admin, you can review pending marketplace items in the admin panel.
                    </p>
                    <p className="mt-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/admin/review'}
                      >
                        Go to Admin Review
                      </Button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
                    className={`overflow-hidden transition-all hover:shadow-md ${viewMode === "list" ? "flex flex-col md:flex-row" : ""} cursor-pointer ${item.status === 'pending' ? 'border-amber-300' : ''}`}
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
                      {item.status === 'pending' && (
                        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                          Pending
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

      {/* User Items Dashboard */}
      <UserItemsDashboard
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
      />
    </div>
  );
};

export default Marketplace;
