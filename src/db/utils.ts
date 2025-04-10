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
// const client = jwksClient({
//   jwksUri: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID}/.well-known/jwks.json`
// });

const client = jwksClient({
  jwksUri: `${process.env.COGNITO_ISSUER}/.well-known/jwks.json`
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
// export async function verifyAccessToken(token: string): Promise<JwtPayload> {
//   try {
//     const expectedAudience = process.env.COGNITO_CLIENT_ID;
//     console.log('Verifying token with audience:', expectedAudience);
    
//     if (!expectedAudience) {
//       throw new Error('COGNITO_CLIENT_ID environment variable is not set');
//     }

//     const decoded = await new Promise<JwtPayload>((resolve, reject) => {
//       verify(
//         token,
//         (header, callback) => {
//           client.getSigningKey(header.kid, (err, key) => {
//             if (err) {
//               console.error('Error getting signing key:', err);
//               callback(err);
//               return;
//             }
//             if (!key) {
//               callback(new Error('No signing key found'));
//               return;
//             }
//             const signingKey = key.getPublicKey();
//             callback(null, signingKey);
//           });
//         },
//         {
//           algorithms: ['RS256'],
//           issuer: process.env.COGNITO_ISSUER,
//           audience: expectedAudience,
//           complete: false
//         },
//         (err, decoded) => {
//           if (err) {
//             console.error('Token verification error:', err);
//             reject(err);
//             return;
//           }
//           if (!decoded) {
//             reject(new Error('Token verification failed: no decoded payload'));
//             return;
//           }
//           resolve(decoded as JwtPayload);
//         }
//       );
//     });

//     console.log('Token successfully verified');
//     return decoded;
//   } catch (error) {
//     console.error('Token verification failed:', error);
//     throw error;
//   }
// }
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  // No need for try/catch here if the Promise handles rejection
  // const expectedAudience = process.env.COGNITO_CLIENT_ID; // Keep this if checking client_id later
  const issuer = process.env.COGNITO_ISSUER;

  // Basic validation of environment variables
  if (!issuer) {
      console.error('COGNITO_ISSUER environment variable is not set');
      throw new Error('COGNITO_ISSUER environment variable is not set');
  }
  // Keep the check for COGNITO_CLIENT_ID if you plan to check the payload's client_id later
  // if (!expectedAudience) {
  //   throw new Error('COGNITO_CLIENT_ID environment variable is not set');
  // }

  return new Promise<JwtPayload>((resolve, reject) => {
    verify(
      token,
      (header, callback) => {
        // Ensure header and header.kid exist
        if (!header || !header.kid) {
          return callback(new Error('Token header is missing \'kid\''));
        }
        client.getSigningKey(header.kid, (err, key) => {
          if (err) {
            console.error('Error getting signing key:', err);
            return callback(err); // Pass the error correctly
          }
          // Ensure key is not undefined and has getPublicKey method
          if (!key || typeof (key as any).getPublicKey !== 'function') {
              console.error("Invalid key received from JWKS endpoint:", key);
              return callback(new Error('Invalid key received from JWKS endpoint'));
          }
          const signingKey = (key as jwksClient.RsaSigningKey).getPublicKey();
          callback(null, signingKey);
        });
      },
      {
        algorithms: ['RS256'],
        issuer: issuer,
        // audience: expectedAudience, // <-- REMOVE OR COMMENT OUT THIS LINE
        complete: false // 'complete: false' is default, can be omitted
      },
      (err, decoded) => {
        if (err) {
          // Log the specific JWT error name and message
          console.error('Token verification error:', err.name, err.message);
          return reject(err); // Reject the promise
        }
        if (!decoded) {
          // This case might be redundant if 'err' is always set on failure
          console.error('Token verification failed: no decoded payload');
          return reject(new Error('Token verification failed: no decoded payload'));
        }

        // --- Optional Check ---
        // If you need to ensure the token was issued for your client app:
        // const payload = decoded as JwtPayload & { client_id?: string };
        // if (payload.client_id !== process.env.COGNITO_CLIENT_ID) {
        //    console.error('Token verification error: client_id mismatch in payload');
        //    return reject(new Error('Invalid client_id in token payload'));
        // }
        // --- End Optional Check ---


        console.log('Token successfully verified (Signature and Issuer)');
        resolve(decoded as JwtPayload); // Resolve the promise
      }
    );
  });
  // Removed outer try/catch - let Promise rejection handle errors
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

    // Get user from database using cognito_id
    const result = await pool.query(
      'SELECT * FROM users WHERE cognito_id = $1',
      [cognitoId]
    );

    if (!result.rows[0]) {
      console.error('No user found for cognito_id:', cognitoId);
      return null;
    }

    return result.rows[0];
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
  try {
    // First get the cart
    const cartResult = await pool.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [user_id]
    );

    console.log("cartResult", cartResult)

    if (!cartResult.rows[0]) {
      return null;
    }

    // Then get the cart items
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
  } catch (error) {
    console.error('Error in getCartByUserId:', error);
    throw error;
  }
}

export async function createCart(user_id: string): Promise<Cart | null> {
  try {
    const result = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
      [user_id]
    );

    if (!result.rows[0]) {
      console.error('Failed to create cart for user:', user_id);
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
}

export async function addToCart(cart_id: string, product_id: string, quantity: number, user_id: string): Promise<CartItem> {
  try {
    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, user_id) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (cart_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3 
       RETURNING *`,
      [cart_id, product_id, quantity, user_id]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to add item to cart');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error in addToCart:', error);
    throw error;
  }
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
    console.log("user_id", user_id)
    console.log("cart.items", cart.items)
    console.log("cart.items.product.price", cart.items.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * parseFloat(item.quantity.toString())), 0))
    const totalAmount = cart.items.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * parseFloat(item.quantity.toString())), 0)
    // Create order
    console.log("totalAmount=====", totalAmount)
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [user_id, totalAmount]
    );
    console.log("this si order result", orderResult)
    const order = orderResult.rows[0];

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const result = await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4) RETURNING *',
          [order.id, item.id, item.quantity, item.price]
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
        product: cart.items.find(ci => ci.id === item.product_id)!.id
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

export async function getOrders(): Promise<OrderWithItems[]> {
  try {
    const result = await pool.query(
      `SELECT o.*, oi.*, p.*, u.email as user_email
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    // Group items by order
    const ordersMap = new Map<string, OrderWithItems>();
    result.rows.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          items: []
        });
      }
      if (row.product_id) {
        ordersMap.get(row.order_id)!.items.push({
          id: row.id,
          order_id: row.order_id,
          quantity: row.quantity,
          price: row.price_at_time,
          name: row.name,
          description: row.description,
          stock_quantity: row.stock_quantity,
          image_url: row.image_url,
          created_at: row.product_created_at,
          updated_at: row.product_updated_at
        });
      }
    });

    return Array.from(ordersMap.values());
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderWithItems | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update order status
    const result = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    // If order is being confirmed, reduce stock quantity
    if (status === 'confirmed') {
      // Get all order items with their quantities
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      // Update stock quantity for each product
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    // Get the updated order with its items
    const orders = await getOrders();
    return orders.find(order => order.id === id) || null;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updateOrderStatus:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getCartsItemCount(user_id: string): Promise<{ count: number }> {
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