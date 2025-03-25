
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

interface RelatedItemsProps {
  currentItemId: string;
  category: string;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ currentItemId, category }) => {
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRelatedItems = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('category', category)
          .neq('id', currentItemId)
          .eq('is_available', true)
          .order('posted_date', { ascending: false })
          .limit(3);
          
        if (error) throw error;
        setRelatedItems(data || []);
      } catch (error) {
        console.error("Error fetching related items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (category && currentItemId) {
      fetchRelatedItems();
    }
  }, [category, currentItemId]);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }
  
  if (relatedItems.length === 0) {
    return <p className="text-sm text-gray-500">No related items found</p>;
  }
  
  return (
    <div className="space-y-2">
      {relatedItems.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3 flex items-center gap-3">
            {item.image_url ? (
              <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="font-medium text-sm truncate">{item.title}</h4>
              <div className="flex items-center text-sm font-semibold text-sfu-red">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>{item.price} {item.currency}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{item.condition || item.category}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RelatedItems;
