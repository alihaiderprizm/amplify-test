export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  stock_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CartWithItems extends Cart {
  items: CartItem[];
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  user_email: string;
  items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_time: number;

    // id: string;
    name: string;
    description: string;
    price: string;
    image_url: string;
    stock_quantity: number;
    created_at: Date;
    updated_at: Date;
  }>;
} 