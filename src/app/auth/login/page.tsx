'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, Card, message } from 'antd';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', values);
console.log("this si data====",data)
      // Store tokens in localStorage or cookies
      localStorage.setItem('accessToken', data.user.accessToken);
      localStorage.setItem('idToken', data.user.idToken);
      localStorage.setItem('refreshToken', data.user.refreshToken);

      message.success('Login successful!');
      // router.push('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card title="Login" className="w-full max-w-md">
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link href="/auth/register" className="text-blue-500 hover:text-blue-700">
              Don't have an account? Register
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
} 