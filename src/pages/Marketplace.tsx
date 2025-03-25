
import React, { useState } from "react";
import { Filter, Search, ShoppingBag, Tag, ArrowUpDown, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Sample marketplace items
const MARKETPLACE_ITEMS = [
  {
    id: 1,
    title: "Calculus Textbook - 5th Edition",
    price: 45,
    category: "Books",
    condition: "Good",
    image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=1000&auto=format&fit=crop",
    seller: "Alex Wong",
    postedDate: "2 days ago"
  },
  {
    id: 2,
    title: "Scientific Calculator - Texas Instruments",
    price: 35,
    category: "Electronics",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=1000&auto=format&fit=crop",
    seller: "Sarah Johnson",
    postedDate: "3 days ago"
  },
  {
    id: 3,
    title: "Computer Science Notes Bundle",
    price: 25,
    category: "Notes",
    condition: "N/A",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop",
    seller: "Mike Chen",
    postedDate: "1 week ago"
  },
  {
    id: 4,
    title: "Study Desk - Adjustable Height",
    price: 80,
    category: "Furniture",
    condition: "Used",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop",
    seller: "David Kim",
    postedDate: "5 days ago"
  },
  {
    id: 5,
    title: "USB Flash Drive - 128GB",
    price: 18,
    category: "Electronics",
    condition: "New",
    image: "https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?q=80&w=1000&auto=format&fit=crop",
    seller: "Emma Liu",
    postedDate: "Yesterday"
  },
  {
    id: 6,
    title: "Modern Physics by Serway - 4th Edition",
    price: 50,
    category: "Books",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop",
    seller: "James Wilson",
    postedDate: "4 days ago"
  }
];

const Marketplace = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const filteredItems = MARKETPLACE_ITEMS.filter(item => {
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
    return a.id < b.id ? 1 : -1;
  });

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
              
              <Button className="bg-sfu-red hover:bg-sfu-red/90">
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
            
            {filteredItems.length === 0 ? (
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
                    className={`overflow-hidden transition-all hover:shadow-md ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}
                  >
                    <div 
                      className={`${viewMode === "list" ? "md:w-1/3" : "w-full"} h-48 bg-cover bg-center`}
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <CardContent className={`p-4 ${viewMode === "list" ? "md:w-2/3" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                        <span className="font-bold text-sfu-red">${item.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          {item.category}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          {item.condition}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{item.seller}</span>
                        <span>{item.postedDate}</span>
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
    </div>
  );
};

export default Marketplace;
