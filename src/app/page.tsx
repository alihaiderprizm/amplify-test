'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Row, Col, Button, message, Input, Space, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import api from '@/lib/axios';
import { setCartCount } from '@/store/slices/userSlice';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
}

export default function HomePage() {
  const { data: session } = useSession();
  const dispatch = useDispatch()

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    timestamp?: string;
  }>({});

  useEffect(() => {
    fetchProducts();
    getCartCount();
    testConnection();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // if (!response.ok) throw new Error('Failed to fetch products');
      // const data = await response.json();
      setLoading(false)
      if (Array.isArray(response.data)) {
        setProducts(response.data);
        return;
      }
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // console.log("this si suer====", user)

  const getCartCount = async () => {
    const response = await api.get('/cart/count');

    if (response.data.count !== null && response.data.count !== undefined) {
      dispatch(setCartCount(response.data.count))
    }
    // const data = await response.json();
    // console.log("data", data)
  }
  const addToCart = async (productId: string) => {
    if (!session) {
      message.error('Please login to add items to cart');
      return;
    }

    try {
      const body = {
        product_id: productId,
        quantity: 1,
      }
      const response = await api.post('/cart', body)
      console.log("this si response to add to cart=====", response)

      getCartCount()
      // if (!response.ok) throw new Error('Failed to add to cart');
      message.success('Added to cart successfully');
    } catch (error) {
      message.error('Failed to add to cart');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return loading ? <Spin /> : (
    <div>
      {/* {loading && <Spin />} */}
      <Space direction="vertical" size="large" className="w-full">
        <Input.Search
          placeholder="Search products..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <Row gutter={[16, 16]}>
          {filteredProducts.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={product.name}
                    src={product.image_url || '/placeholder.png'}
                    className="h-48 object-cover"
                  />
                }
                actions={[
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => addToCart(product.id)}
                    disabled={!session || product.stock_quantity === 0}
                  >
                    Add to Cart
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <div>
                      <p className="text-gray-600">{product.description}</p>
                      {product.price && <p className="text-lg font-bold mt-2">
                        ${product?.price}
                      </p>}
                      <p className="text-sm text-gray-500">
                        {product.stock_quantity} in stock
                      </p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Database Connection Status</h2>
        {loading ? (
          <div className="bg-gray-100 p-4 rounded-lg">
            <p>Testing database connection...</p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg ${connectionStatus.success
            ? 'bg-green-100 border border-green-400'
            : 'bg-red-100 border border-red-400'
            }`}>
            <p className="font-semibold">
              Status: {connectionStatus.success ? 'Connected' : 'Failed'}
            </p>
            <p className="mt-2">{connectionStatus.message}</p>
            {connectionStatus.timestamp && (
              <p className="mt-2 text-sm">
                Server time: {new Date(connectionStatus.timestamp).toLocaleString()}
              </p>
            )}
            {connectionStatus.error && (
              <p className="mt-2 text-red-600">{connectionStatus.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
