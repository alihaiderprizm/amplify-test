'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, Button, Input, List, Spin, message } from 'antd';
import { Todo } from '../types/todo';
import { getTodos, createTodo, updateTodo, deleteTodo, isAdmin } from '../db/db';

export default function TodoList() {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
      fetchTodos();
    }
  }, [session]);

  const checkAdminStatus = async () => {
    if (session?.user?.id) {
      const admin = await isAdmin(session.user.id);
      setIsUserAdmin(admin);
    }
  };

  const fetchTodos = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userTodos = await getTodos(session.user.id);
      setTodos(userTodos);
    } catch (error) {
      setError('Failed to fetch todos. Please try again later.');
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!session?.user?.id) return;
    if (!newTodo.trim()) {
      setError('Todo title cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const todo = await createTodo(
        { title: newTodo },
        session.user.id
      );
      setTodos([...todos, todo]);
      setNewTodo('');
      message.success('Todo added successfully');
    } catch (error) {
      setError('Failed to create todo. Please try again.');
      console.error('Error creating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const updatedTodo = await updateTodo(
        { id, completed: !todo.completed },
        session.user.id
      );
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      message.success('Todo updated successfully');
    } catch (error) {
      setError('Failed to update todo. Please try again.');
      console.error('Error updating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    try {
      await deleteTodo(id,);
      setTodos(todos.filter(todo => todo.id !== id));
      message.success('Todo deleted successfully');
    } catch (error) {
      setError('Failed to delete todo. Please try again.');
      console.error('Error deleting todo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center py-8">
        <Alert
          message="Authentication Required"
          description="Please log in to view your todos."
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Todo List</h1>
        {isUserAdmin && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            Admin
          </span>
        )}
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <div className="flex mb-4">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          onPressEnter={addTodo}
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="primary"
          onClick={addTodo}
          loading={loading}
          className="ml-2"
        >
          Add
        </Button>
      </div>

      {loading && todos.length === 0 ? (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <List
          dataSource={todos}
          renderItem={(todo) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  danger
                  onClick={() => deleteTodo(todo.id)}
                  disabled={loading}
                >
                  Delete
                </Button>
              ]}
            >
              {/* <List.Item.Meta
                avatar={
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    disabled={loading}
                    className="mr-2"
                  />
                }
                title={
                  <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                    {todo.title}
                  </span>
                }
                description={`Created: ${new Date(todo.created_at).toLocaleDateString()}`}
              /> */}
            </List.Item>
          )}
        />
      )}
    </div>
  );
} 