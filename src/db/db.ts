import { Pool } from 'pg';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function getTodos(userId: string): Promise<Todo[]> {
  const result = await pool.query(
    'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createTodo(todo: CreateTodoInput, userId: string): Promise<Todo> {
  const result = await pool.query(
    `INSERT INTO todos (title, user_id, priority, due_date, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [todo.title, userId, todo.priority, todo.dueDate, todo.tags]
  );
  return result.rows[0];
}

export async function updateTodo(todo: UpdateTodoInput, userId: string): Promise<Todo> {
  const result = await pool.query(
    `UPDATE todos 
     SET title = COALESCE($1, title),
         completed = COALESCE($2, completed),
         priority = COALESCE($3, priority),
         due_date = COALESCE($4, due_date),
         tags = COALESCE($5, tags)
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [todo.title, todo.completed, todo.priority, todo.dueDate, todo.tags, todo.id, userId]
  );
  return result.rows[0];
}

export async function deleteTodo(id: string, userId: string): Promise<void> {
  await pool.query(
    'DELETE FROM todos WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
}

export async function isAdmin(userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT is_admin FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.is_admin || false;
} 