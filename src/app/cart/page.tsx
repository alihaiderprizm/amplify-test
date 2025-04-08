'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Table, Button, message, InputNumber, Space, Typography, Card } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    fetchCart();
  }, [session]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCartItems(data.items || []);
    } catch (error) {
      message.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      fetchCart();
    } catch (error) {
      message.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const response = await fetch(`/api/cart?product_id=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove item');
      message.success('Item removed from cart');
      fetchCart();
    } catch (error) {
      message.error('Failed to remove item');
    }
  };

  const checkout = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create order');
      message.success('Order created successfully');
      router.push('/orders');
    } catch (error) {
      message.error('Failed to create order');
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'name',
      render: (_: any, record: CartItem) => (
        <div className="flex items-center">
          <img
            src={record.product.image_url || '/placeholder.png'}
            alt={record.product.name}
            className="w-16 h-16 object-cover mr-4"
          />
          <span>{record.product.name}</span>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: ['product', 'price'],
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: CartItem) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => updateQuantity(record.product_id, value || 1)}
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_: any, record: CartItem) => (
        `$${(record.product.price * record.quantity).toFixed(2)}`
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.product_id)}
        />
      ),
    },
  ];

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div>
      <Title level={2}>Shopping Cart</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={cartItems}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
        <div className="mt-4 text-right">
          <Space size="large">
            <Title level={4}>Total: ${total.toFixed(2)}</Title>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={checkout}
              disabled={cartItems.length === 0}
            >
              Checkout
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
} 