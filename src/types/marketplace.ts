
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  condition: string | null;
  image_url: string | null;
  seller_id: string;
  seller_name: string;
  posted_date: string;
  contact: string | null;
  is_available: boolean;
}

// This interface helps transition between our frontend model and database model
export interface MarketplaceItemDisplay {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  condition: string | null;
  image: string | null; // Frontend uses 'image' property
  seller: {
    name: string;
    id: string;
  };
  postedDate: string;
  contact: string | null;
  isAvailable: boolean;
}

// Convert database model to display model
export function toDisplayModel(item: MarketplaceItem): MarketplaceItemDisplay {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.price,
    currency: item.currency,
    category: item.category,
    condition: item.condition,
    image: item.image_url,
    seller: {
      name: item.seller_name,
      id: item.seller_id
    },
    postedDate: item.posted_date,
    contact: item.contact,
    isAvailable: item.is_available
  };
}

// Convert display model to database model
export function toDatabaseModel(item: MarketplaceItemDisplay): MarketplaceItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.price,
    currency: item.currency,
    category: item.category,
    condition: item.condition,
    image_url: item.image,
    seller_id: item.seller.id,
    seller_name: item.seller.name,
    posted_date: item.postedDate,
    contact: item.contact,
    is_available: item.isAvailable
  };
}
