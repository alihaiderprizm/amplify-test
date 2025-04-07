'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Todo } from '../types/todo';
import { v4 as uuidv4 } from 'uuid';
import { Alert, Button, Input, List, Spin } from 'antd';

const client = generateClient();

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement API call to fetch todos
      // const result = await client.graphql({
      //   query: listTodos
      // });
      // setTodos(result.data.listTodos.items);
    } catch (error) {
      setError('Failed to fetch todos. Please try again later.');
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) {
      setError('Todo title cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    const todo: Todo = {
      id: uuidv4(),
      title: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // TODO: Implement API call to create todo
      // await client.graphql({
      //   query: createTodo,
      //   variables: { input: todo }
      // });
      setTodos([...todos, todo]);
      setNewTodo('');
    } catch (error) {
      setError('Failed to create todo. Please try again.');
      console.error('Error creating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement API call to update todo
      // await client.graphql({
      //   query: updateTodo,
      //   variables: { input: { id, completed: !todos.find(t => t.id === id)?.completed } }
      // });
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    } catch (error) {
      setError('Failed to update todo. Please try again.');
      console.error('Error updating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement API call to delete todo
      // await client.graphql({
      //   query: deleteTodo,
      //   variables: { input: { id } }
      // });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      setError('Failed to delete todo. Please try again.');
      console.error('Error deleting todo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      
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
              <List.Item.Meta
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
                description={`Created: ${new Date(todo.createdAt).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
} 