'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Table, Button, message, InputNumber, Space, Typography, Card } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import { setCartCount } from '@/store/slices/userSlice';
import { useDispatch } from 'react-redux';

const { Title } = Typography;

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useDispatch()
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Only fetch cart if we have a session
    if (status && status === 'authenticated') {
      fetchCart();
    }
  }, [status, session]);

  const getCartCount = async () => {
    const response = await api.get('/cart/count');

    if (response.data.count) {
      dispatch(setCartCount(response.data.count))
    }
    // const data = await response.json();
    // console.log("data", data)
  }
  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      console.log("Cart data:", data);
      setCartItems(data.items || []);
      getCartCount()
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      message.error(error.response?.data?.error || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [])

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      await api.put('/cart', {
        product_id: productId,
        quantity,
      });
      fetchCart();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      message.error(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api.delete(`/cart?product_id=${productId}`);
      message.success('Item removed from cart');
      fetchCart();
    } catch (error: any) {
      console.error('Error removing item:', error);
      message.error(error.response?.data?.error || 'Failed to remove item');
    }
  };

  const checkout = async () => {
    try {
      await api.post('/orders');
      message.success('Order created successfully');
      router.push('/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      message.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: CartItem) => (
        <div className="flex items-center" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            style={{ width: "25px", height: "25px", alignSelf: "center" }}
            src={record.image_url || '/placeholder.png'}
            alt={record.name}
            className="w-16 h-16 object-cover mr-4"
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => `$${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: CartItem) => (
        <InputNumber
          min={1}
          max={record.stock_quantity}
          value={quantity}
          onChange={(value) => updateQuantity(record.product_id, value || 1)}
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_: any, record: CartItem) => (
        `$${(parseFloat(record.price) * record.quantity).toFixed(2)}`
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
    (sum, item) => (sum ?? 0) + (parseFloat(item.price ?? '0') * (item.quantity ?? 1)),
    0
  );

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

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