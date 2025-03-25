import React, { useState, useEffect } from "react";
import { Filter, Search, ShoppingBag, Tag, ArrowUpDown, Grid, List, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PostItemForm from "@/components/marketplace/PostItemForm";
import ItemDetailView from "@/components/marketplace/ItemDetailView";
import RelatedItems from "@/components/marketplace/RelatedItems";
import { MarketplaceItemDisplay, toDisplayModel } from "@/types/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Initial marketplace items (will be replaced with Supabase data)
const INITIAL_MARKETPLACE_ITEMS: MarketplaceItemDisplay[] = [
  {
    id: "1",
    title: "Calculus Textbook - 5th Edition",
    description: "Excellent condition textbook for MATH 101. Some highlights but no writing.",
    price: 45,
    currency: "MMK",
    category: "Books",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "Alex Wong",
      id: "ST12345"
    },
    postedDate: "2023-06-10T08:30:00.000Z",
    contact: "alex@example.com",
    isAvailable: true
  },
  {
    id: "2",
    title: "Scientific Calculator - Texas Instruments",
    description: "TI-84 Plus graphing calculator. Used for one semester only.",
    price: 35,
    currency: "MMK",
    category: "Electronics",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "Sarah Johnson",
      id: "ST67890"
    },
    postedDate: "2023-06-12T10:15:00.000Z",
    contact: "sarah@example.com",
    isAvailable: true
  },
  {
    id: "3",
    title: "Computer Science Notes Bundle",
    description: "Complete notes for CS 101, 201, and 301. Includes diagrams and example code.",
    price: 25,
    currency: "MMK",
    category: "Notes",
    condition: "N/A",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "Mike Chen",
      id: "ST24680"
    },
    postedDate: "2023-06-05T14:20:00.000Z",
    contact: "mike@example.com",
    isAvailable: true
  },
  {
    id: "4",
    title: "Study Desk - Adjustable Height",
    description: "Adjustable height desk, perfect for studying. Minor scratches on the surface.",
    price: 80,
    currency: "MMK",
    category: "Furniture",
    condition: "Used",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "David Kim",
      id: "ST13579"
    },
    postedDate: "2023-06-08T09:45:00.000Z",
    contact: "david@example.com",
    isAvailable: true
  },
  {
    id: "5",
    title: "USB Flash Drive - 128GB",
    description: "High-speed USB 3.0 flash drive. Never used, still in packaging.",
    price: 18,
    currency: "MMK",
    category: "Electronics",
    condition: "New",
    image: "https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "Emma Liu",
      id: "ST97531"
    },
    postedDate: "2023-06-15T16:30:00.000Z",
    contact: "emma@example.com",
    isAvailable: true
  },
  {
    id: "6",
    title: "Modern Physics by Serway - 4th Edition",
    description: "Comprehensive physics textbook covering modern theories. Like new condition.",
    price: 50,
    currency: "MMK",
    category: "Books",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop",
    seller: {
      name: "James Wilson",
      id: "ST86420"
    },
    postedDate: "2023-06-09T11:00:00.000Z",
    contact: "james@example.com",
    isAvailable: true
  }
];

const Marketplace = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItemDisplay | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  
  // State for marketplace items
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItemDisplay[]>(INITIAL_MARKETPLACE_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch marketplace items from Supabase
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .order('posted_date', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Convert database model to display model
          const displayItems = data.map(item => toDisplayModel(item));
          setMarketplaceItems(displayItems);
        }
      } catch (error) {
        console.error("Error fetching marketplace items:", error);
        // Keep the initial items as fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    // Try to fetch from Supabase, but use initial data if not available
    fetchMarketplaceItems().catch(() => {
      // Silent fallback to initial data
    });
  }, []);
  
  // Filter and sort items
  const filteredItems = marketplaceItems.filter(item => {
    // Filter by search term
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by category
    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }
    
    // Only show available items
    return item.isAvailable;
  }).sort((a, b) => {
    // Sort items
    if (sortBy === "price-low") {
      return a.price - b.price;
    } else if (sortBy === "price-high") {
      return b.price - a.price;
    }
    
    // Default: newest
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });

  // Handle creating a new item
  const handleItemPosted = (newItem: MarketplaceItemDisplay) => {
    setMarketplaceItems(prev => [newItem, ...prev]);
  };
  
  // Handle deleting an item
  const handleDeleteItem = (itemId: string) => {
    setMarketplaceItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  // Open detail view for an item
  const handleViewItemDetails = (item: MarketplaceItemDisplay) => {
    setSelectedItem(item);
    setIsDetailViewOpen(true);
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
                onClick={() => setIsPostFormOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
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
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
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
              <>
                <div className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
                  {filteredItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`overflow-hidden transition-all hover:shadow-md ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}
                    >
                      <div 
                        className={`${viewMode === "list" ? "md:w-1/3" : "w-full"} h-48 bg-cover bg-center cursor-pointer`}
                        style={{ backgroundImage: `url(${item.image || '/placeholder.svg'})` }}
                        onClick={() => handleViewItemDetails(item)}
                      />
                      <CardContent className={`p-4 ${viewMode === "list" ? "md:w-2/3" : ""}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-sfu-red"
                              onClick={() => handleViewItemDetails(item)}>
                            {item.title}
                          </h3>
                          <span className="font-bold text-sfu-red">{item.price} {item.currency}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="px-2 py-1 text-xs">
                            {item.category}
                          </Badge>
                          {item.condition && (
                            <Badge variant="outline" className="px-2 py-1 text-xs">
                              {item.condition}
                            </Badge>
                          )}
                        </div>
                        {viewMode === "list" && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description || "No description provided."}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{item.seller.name}</span>
                          <span>{new Date(item.postedDate).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedCategory !== "all" && (
                  <RelatedItems 
                    currentCategory={selectedCategory}
                    items={marketplaceItems.filter(item => 
                      item.category === selectedCategory && 
                      !filteredItems.some(filtered => filtered.id === item.id)
                    )}
                    onItemClick={handleViewItemDetails}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Post Item Form */}
      <PostItemForm 
        isOpen={isPostFormOpen} 
        onClose={() => setIsPostFormOpen(false)}
        onItemPosted={handleItemPosted}
      />
      
      {/* Item Detail View */}
      <ItemDetailView 
        item={selectedItem}
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        onDelete={handleDeleteItem}
      />
      
      <Footer />
    </div>
  );
};

export default Marketplace;
