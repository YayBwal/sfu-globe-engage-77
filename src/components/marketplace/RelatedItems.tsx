
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceItemDisplay } from "@/types/marketplace";

interface RelatedItemsProps {
  currentCategory: string;
  items: MarketplaceItemDisplay[];
  onItemClick: (item: MarketplaceItemDisplay) => void;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ 
  currentCategory, 
  items, 
  onItemClick 
}) => {
  // Filter items by current category and limit to 4
  const relatedItems = items
    .filter(item => item.category === currentCategory)
    .slice(0, 4);
    
  if (relatedItems.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Related Items</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {relatedItems.map(item => (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div 
              className="h-32 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${item.image || '/placeholder.svg'})` }}
              onClick={() => onItemClick(item)}
            />
            <CardContent className="p-3">
              <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold text-sfu-red">
                  {item.price} {item.currency}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => onItemClick(item)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatedItems;
