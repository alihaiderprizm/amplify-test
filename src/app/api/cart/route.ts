import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getCartByUserId,
  createCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  getUserByVerifiedAccessToken
} from '@/db/utils';
import { authOptions } from '../auth/[...nextauth]/route';
import { CartWithItems } from '@/db/types';
import api from '@/lib/axios';

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];

  if (!session && !accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let userId: string | undefined;
    
    if (accessToken) {
      const user = await getUserByVerifiedAccessToken(accessToken);
      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = user.id;
    } else if (session?.user?.id) {
      userId = session.user.id;
    }

    if (!userId) {
      console.error('User ID not found - Session:', session, 'Access Token:', !!accessToken);
      return NextResponse.json({ 
        error: 'User ID not found',
        details: 'Please ensure you are properly authenticated'
      }, { status: 400 });
    }

    const cart = await getCartByUserId(userId);
    if (!cart) {
      const newCart = await createCart(userId);
      return NextResponse.json({ ...newCart, items: [] });
    }
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];

  if (!session && !accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let userId: string | undefined;
    
    if (accessToken) {
      const user = await getUserByVerifiedAccessToken(accessToken);
      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = user.id;
    } else if (session?.user?.id) {
      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    let cart = await getCartByUserId(userId);
    if (!cart) {
      console.log('Creating new cart for user:', userId);
      const newCart = await createCart(userId);
      if (!newCart) {
        console.error('Failed to create new cart');
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }
      cart = { ...newCart, items: [] } as CartWithItems;
    }

    console.log('Adding to cart:', { cart_id: cart.id, product_id, quantity, user_id: userId });
    const existingItem = cart.items.find(item => item.id === product_id);
    if (existingItem) {
      console.log('Updating existing cart item:', { cart_id: cart.id, product_id, quantity: existingItem.quantity + quantity });
      await updateCartItem(cart.id, product_id, existingItem.quantity + quantity);
    } else {
      console.log('Adding new cart item:', { cart_id: cart.id, product_id, quantity, user_id: userId });
      await addToCart(cart.id, product_id, quantity, userId);
    }

    const updatedCart = await getCartByUserId(userId);
    if (!updatedCart) {
      console.error('Failed to fetch updated cart after adding item');
      return NextResponse.json({ error: 'Failed to fetch updated cart' }, { status: 500 });
    }
    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ 
      error: 'Failed to add to cart',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    const cart = await getCartByUserId(session.user.id);
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const cartItem = await updateCartItem(cart.id, product_id, quantity);
    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const cart = await getCartByUserId(session.user.id);
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const success = await removeFromCart(cart.id, product_id);
    if (!success) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
} 