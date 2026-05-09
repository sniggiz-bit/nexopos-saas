export interface WooProduct {
  id: number;
  name: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'publish' | 'draft' | 'private';
  description?: string;
  short_description?: string;
  sku?: string;
  price: string;
  regular_price: string;
  stock_quantity?: number;
  manage_stock: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  images: WooImage[];
  variations?: number[];
}

export interface WooImage {
  id: number;
  src: string;
  alt?: string;
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  billing: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    city?: string;
    country?: string;
  };
  line_items: WooLineItem[];
  customer_id: number;
}

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  price: number;
  sku?: string;
}

export interface WooWebhook {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'disabled';
  topic: string;
  delivery_url: string;
  secret: string;
}
