import React from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

interface MenuCardProps {
  item: MenuItem
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addToCart, loading } = useCart()
  const { user } = useAuth()
  const [quantity, setQuantity] = React.useState(1)

  const handleAddToCart = async () => {
    await addToCart(item.id, quantity)
    setQuantity(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {!item.available && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded-full text-sm">
              Sold Out
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
            {item.category}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-orange-600">
            {formatPrice(item.price)}
          </span>
          
          {item.available && user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="px-2 py-1 text-sm font-medium min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {!user && (
            <div className="text-sm text-gray-500">
              Sign in to order
            </div>
          )}
        </div>
      </div>
    </div>
  )
}