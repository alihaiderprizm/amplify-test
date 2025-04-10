'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, Card, message } from 'antd';
import Link from 'next/link';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { signIn } from 'next-auth/react';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/userSlice';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    dispatch(loginStart());
    try {
      // First, authenticate with Cognito directly
      const { data } = await axios.post('/api/auth/login', values, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("this is data=====",data)
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.user.accessToken);
      localStorage.setItem('idToken', data.user.idToken);
      localStorage.setItem('refreshToken', data.user.refreshToken);

      // Update Redux store
      dispatch(loginSuccess({
        accessToken: data.user.accessToken,
        idToken: data.user.idToken,
        refreshToken: data.user.refreshToken,
        email: data.user.email,
        preferred_username: data.user.preferred_username,
        phone_number: data.user.phone_number,
        birthdate: data.user.birthdate,
        isAdmin: data.user.is_admin
      }));

      // Create NextAuth session
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
        accessToken: data.user.accessToken,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      message.success(' in successful!');
      router.push('/');
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch(loginFailure(errorMessage));
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          className="mt-8 space-y-6"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Sign in
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link href="/auth/register">
              Don't have an account? Sign up
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
} 