import { Pool } from 'pg';
import { User, Product, Cart, CartItem, Order, OrderItem, CartWithItems, OrderWithItems } from './types';
import { JwtPayload, verify, VerifyOptions, VerifyCallback } from 'jsonwebtoken';
import { GetPublicKeyOrSecret, JwtHeader } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// JWKS client for Cognito
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID}/.well-known/jwks.json`
});

// Get signing key from JWKS
const getKey = (header: JwtHeader | null, callback: (err: Error | null, key?: string) => void) => {
  if (!header?.kid) {
    callback(new Error('No KID in token header'));
    return;
  }
  client.getSigningKey(header.kid, (err: Error | null, key?: jwksClient.SigningKey) => {
    if (err) {
      callback(err);
      return;
    }
    if (!key) {
      callback(new Error('No signing key found'));
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

// Verify access token
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    const options: VerifyOptions = {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID}`,
      audience: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      complete: false
    };

    const callback: VerifyCallback = (err: Error | null, decoded: string | JwtPayload | undefined) => {
      if (err) {
        reject(err);
        return;
      }
      if (!decoded || typeof decoded === 'string') {
        reject(new Error('Token verification failed'));
        return;
      }
      resolve(decoded as JwtPayload);
    };

    verify(token, getKey, options, callback);
  });
}

// Get user by verified access token
export async function getUserByVerifiedAccessToken(accessToken: string): Promise<User | null> {
  try {
    // Verify the token
    const decoded = await verifyAccessToken(accessToken);
    const cognitoId = decoded.sub;

    if (!cognitoId) {
      throw new Error('Invalid token: missing sub claim');
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE cognito_id = $1',
      [cognitoId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// User functions
export async function getUserByCognitoId(cognito_id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE cognito_id = $1',
    [cognito_id]
  );
  return result.rows[0] || null;
}

export async function createUser(cognito_id: string, email: string): Promise<User> {
  const result = await pool.query(
    'INSERT INTO users (cognito_id, email) VALUES ($1, $2) RETURNING *',
    [cognito_id, email]
  );
  return result.rows[0];
}

export async function getUserByAccessToken(accessToken: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT u.* FROM users u JOIN cognito_tokens ct ON u.id = ct.user_id WHERE ct.access_token = $1',
    [accessToken]
  );
  return result.rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

// Product functions
export async function getProducts(): Promise<Product[]> {
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  return result.rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const result = await pool.query(
    'INSERT INTO products (name, description, price, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [product.name, product.description, product.price, product.stock_quantity, product.image_url]
  );
  return result.rows[0];
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
  const fields = Object.keys(product).map((key, index) => `${key} = $${index + 2}`);
  const values = Object.values(product);

  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Cart functions
export async function getCartByUserId(user_id: string): Promise<CartWithItems | null> {
  const cartResult = await pool.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
  if (!cartResult.rows[0]) return null;

  const itemsResult = await pool.query(
    `SELECT ci.*, p.* 
     FROM cart_items ci 
     JOIN products p ON ci.product_id = p.id 
     WHERE ci.cart_id = $1`,
    [cartResult.rows[0].id]
  );

  return {
    ...cartResult.rows[0],
    items: itemsResult.rows
  };
}

export async function createCart(user_id: string): Promise<Cart> {
  const result = await pool.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [user_id]
  );
  return result.rows[0];
}

export async function addToCart(cart_id: string, product_id: string, quantity: number, user_id: string): Promise<CartItem> {
  const result = await pool.query(
    'INSERT INTO cart_items (cart_id, product_id, quantity, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [cart_id, product_id, quantity, user_id]
  );
  return result.rows[0];
}

export async function updateCartItem(cart_id: string, product_id: string, quantity: number): Promise<CartItem | null> {
  const result = await pool.query(
    'UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2 RETURNING *',
    [cart_id, product_id, quantity]
  );
  return result.rows[0] || null;
}

export async function removeFromCart(cart_id: string, product_id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart_id, product_id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// Order functions
export async function createOrder(user_id: string, cart: CartWithItems): Promise<OrderWithItems> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [user_id, cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)]
    );
    const order = orderResult.rows[0];

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const result = await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4) RETURNING *',
          [order.id, item.product_id, item.quantity, item.product.price]
        );
        return result.rows[0];
      })
    );

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    await client.query('COMMIT');

    return {
      ...order,
      items: orderItems.map(item => ({
        ...item,
        product: cart.items.find(ci => ci.product_id === item.product_id)!.product
      }))
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrdersByUserId(user_id: string): Promise<OrderWithItems[]> {
  const ordersResult = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );

  const orders = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await pool.query(
        `SELECT oi.*, p.* 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = $1`,
        [order.id]
      );

      return {
        ...order,
        items: itemsResult.rows
      };
    })
  );

  return orders;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  const result = await pool.query(
    'UPDATE orders SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
}

export async function getCartsItemCount(user_id: string): Promise<{ count: number }> {
  console.log("Getting total cart item quantity for user_id====", user_id);

  // Use SUM(quantity) to get the total number of individual items
  const query = `
    SELECT SUM(quantity) AS total_items
    FROM cart_items
    WHERE user_id = $1;
  `;

  try {
    const result = await pool.query(query, [user_id]);

    // SUM always returns one row.
    // If the user has no items or the user_id doesn't exist in the table,
    // SUM(quantity) will be NULL.
    // We access the value using the alias 'total_items'.
    // We use || 0 to safely handle the NULL case, defaulting the count to 0.
    // Convert the result (which might be a string) to a number.
    const count = Number(result.rows[0]?.total_items || 0);

    console.log(`User ${user_id} has a total quantity of ${count} items in cart.`);
    return { count };

  } catch (error) {
    console.error(`Error fetching cart item count for user ${user_id}:`, error);
    // Re-throwing the error allows the caller to handle it.
    // Alternatively, you could return 0 or a specific error indicator.
    throw error;
  }
}