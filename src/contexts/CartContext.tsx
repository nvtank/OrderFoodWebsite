import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface CartContextType {
  cartItems: CartItem[]
  loading: boolean
  addToCart: (menuItemId: string, quantity?: number) => Promise<void>
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalPrice: () => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setCartItems([])
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      setCartItems(data || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast.error('Failed to load cart items')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (menuItemId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    setLoading(true)
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.menu_item_id === menuItemId)
      
      if (existingItem) {
        // Update quantity
        await updateCartItem(existingItem.id, existingItem.quantity + quantity)
      } else {
        // Add new item
        const { error } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            menu_item_id: menuItemId,
            quantity
          })

        if (error) throw error
        await fetchCartItems()
        toast.success('Item added to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setLoading(false)
    }
  }

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    if (!user) return

    setLoading(true)
    try {
      if (quantity <= 0) {
        await removeFromCart(cartItemId)
        return
      }

      const { error } = await supabase
        .from('carts')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCartItems()
    } catch (error) {
      console.error('Error updating cart item:', error)
      toast.error('Failed to update cart item')
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchCartItems()
      toast.success('Item removed from cart')
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Failed to remove item from cart')
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setCartItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.menu_items.price * item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    cartItems,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}