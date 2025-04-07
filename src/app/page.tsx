'use client';

import { ConfigProvider } from 'antd';
import TodoList from '../components/TodoList';

export default function Home() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800">Todo App</h1>
            <p className="text-gray-600 mt-2">Manage your tasks efficiently</p>
          </header>
          <TodoList />
        </div>
      </main>
    </ConfigProvider>
  );
}
