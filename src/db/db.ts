import { Pool } from 'pg';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';
import { User, Cart, CartItem } from '../types';

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

export async function createUser(cognitoId: string, email: string): Promise<User> {
  const result = await pool.query(
    'INSERT INTO users (cognito_id, email, is_admin) VALUES ($1, $2, false) RETURNING *',
    [cognitoId, email]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function getCartByUserId(userId: string): Promise<Cart | null> {
  const result = await pool.query(
    'SELECT * FROM carts WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function createCart(userId: string): Promise<Cart> {
  const result = await pool.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return result.rows[0];
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const result = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = $1',
    [cartId]
  );
  return result.rows;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT is_admin FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.is_admin || false;
} 