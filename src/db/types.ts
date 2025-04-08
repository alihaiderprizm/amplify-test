export interface User {
  id: string;
  cognito_id: string;
  email: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
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
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  created_at: Date;
}

export interface CartWithItems extends Cart {
  items: (CartItem & { product: Product })[];
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product })[];
} 