
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  image: string | null;
  seller: {
    name: string;
    id: string;
  };
  postedDate: string;
  contact?: string;
  isAvailable: boolean;
}
