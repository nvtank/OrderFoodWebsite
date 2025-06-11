import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { checkPaymentStatus, updateOrderPaymentStatus } from '../lib/payos'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [paymentVerified, setPaymentVerified] = useState(false)
  
  const orderCode = searchParams.get('orderCode')
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (orderCode && orderId) {
      verifyPayment()
    } else {
      setLoading(false)
    }
  }, [orderCode, orderId])

  const verifyPayment = async () => {
    if (!orderCode || !orderId) return

    try {
      setLoading(true)
      
      // Check payment status with PayOS
      const status = await checkPaymentStatus(Number(orderCode))
      
      if (status.data?.status === 'PAID') {
        // Update order status in database
        await updateOrderPaymentStatus(orderId, 'Paid', 'Confirmed')
        
        // Clear the cart
        await clearCart()
        
        setPaymentVerified(true)
        toast.success('Payment successful! Your order has been confirmed.')
      } else {
        toast.error('Payment verification failed. Please contact support.')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast.error('Unable to verify payment. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {paymentVerified ? (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Thank you for your order. Your payment has been processed successfully and your order has been confirmed.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Order Code:</strong> #{orderCode}</p>
                  <p><strong>Status:</strong> <span className="text-green-600 font-medium">Confirmed</span></p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>View Order Details</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors duration-200 block"
                >
                  Continue Shopping
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <Package className="h-8 w-8 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Verification Failed
              </h2>
              
              <p className="text-gray-600 mb-6">
                We couldn't verify your payment. This might be a temporary issue. Please check your order history or contact our support team.
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 block"
                >
                  Check Order History
                </Link>
                
                <Link
                  to="/"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors duration-200 block"
                >
                  Back to Menu
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}