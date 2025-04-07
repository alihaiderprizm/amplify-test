'use client';

import { useState, useEffect } from 'react';
// import { generateClient } from 'aws-amplify/api';
import { Todo } from '../types/todo';
import { v4 as uuidv4 } from 'uuid';

// const client = generateClient();

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      // TODO: Implement API call to fetch todos
      // const result = await client.graphql({
      //   query: listTodos
      // });
      // setTodos(result.data.listTodos.items);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

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
      console.error('Error creating todo:', error);
    }
  };

  const toggleTodo = async (id: string) => {
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
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      // TODO: Implement API call to delete todo
      // await client.graphql({
      //   query: deleteTodo,
      //   variables: { input: { id } }
      // });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <div className="flex mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="flex-1 p-2 border rounded-l"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded-r"
        >
          Add
        </button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mr-2"
              />
              <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                {todo.title}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 