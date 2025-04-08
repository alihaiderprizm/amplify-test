'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Row, Col, Button, message, Input, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

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
  const user = useSelector((state: RootState) => state.user)
  console.log("data", user)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!session) {
      message.error('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      message.success('Added to cart successfully');
    } catch (error) {
      message.error('Failed to add to cart');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
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
    </div>
  );
}
