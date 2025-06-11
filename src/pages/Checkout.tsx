import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Phone, User } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createPayOSPayment, checkPaymentStatus, updateOrderPaymentStatus } from '../lib/payos'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [paymentUrl, setPaymentUrl] = useState('')
  const [orderCode, setOrderCode] = useState<number>(0)
  const [orderId, setOrderId] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const generateOrderCode = () => {
    return Math.floor(Math.random() * 1000000) + Date.now()
  }

  const createOrder = async () => {
    if (!user) return null

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getTotalPrice(),
          status: 'Pending',
          delivery_name: formData.name,
          delivery_phone: formData.phone,
          delivery_address: formData.address,
          payment_method: 'PayOS',
          payment_status: 'Pending',
          payos_order_id: orderCode.toString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return order.id
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please sign in to place an order')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all delivery information')
      return
    }

    setLoading(true)
    
    try {
      const newOrderCode = generateOrderCode()
      setOrderCode(newOrderCode)

      // Create order in database first
      const newOrderId = await createOrder()
      setOrderId(newOrderId)

      // Prepare PayOS payment data
      const paymentData = {
        orderCode: newOrderCode,
        amount: getTotalPrice(),
        description: `FoodHub Order #${newOrderCode}`,
        returnUrl: `${window.location.origin}/payment-success?orderCode=${newOrderCode}&orderId=${newOrderId}`,
        cancelUrl: `${window.location.origin}/cart`
      }

      // Create PayOS payment
      const paymentResponse = await createPayOSPayment(paymentData)
      
      if (paymentResponse.error === 0 && paymentResponse.data) {
        setPaymentUrl(paymentResponse.data.checkoutUrl)
        toast.success('Payment link created! Redirecting...')
        
        // Redirect to PayOS checkout
        setTimeout(() => {
          window.location.href = paymentResponse.data!.checkoutUrl
        }, 1000)
      } else {
        throw new Error(paymentResponse.message || 'Payment creation failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to create payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Check payment status periodically
  React.useEffect(() => {
    if (orderCode && orderId) {
      const interval = setInterval(async () => {
        try {
          const status = await checkPaymentStatus(orderCode)
          if (status.data?.status === 'PAID') {
            await updateOrderPaymentStatus(orderId, 'Paid', 'Confirmed')
            await clearCart()
            toast.success('Payment successful!')
            navigate('/orders')
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Status check error:', error)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [orderCode, orderId])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to sign in to place an order</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600">Add some items to your cart before checking out</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.menu_items.image_url}
                  alt={item.menu_items.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.menu_items.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatPrice(item.menu_items.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Information & Payment */}
        <div className="space-y-6">
          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline-block w-4 h-4 mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline-block w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Delivery Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your complete delivery address"
                />
              </div>

              {/* Payment Method */}
              <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">PayOS Payment</div>
                      <div className="text-sm text-gray-600">
                        Secure payment via QR code or bank transfer
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Place Order & Pay {formatPrice(getTotalPrice())}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}