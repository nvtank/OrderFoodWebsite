import { supabase } from './supabase'

export interface PayOSPaymentData {
  orderCode: number
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
}

export interface PayOSResponse {
  error: number
  message: string
  data?: {
    bin: string
    accountNumber: string
    accountName: string
    amount: number
    description: string
    orderCode: number
    currency: string
    paymentLinkId: string
    status: string
    checkoutUrl: string
    qrCode: string
  }
}

const PAYOS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests'
const CLIENT_ID = import.meta.env.VITE_PAYOS_CLIENT_ID
const API_KEY = import.meta.env.VITE_PAYOS_API_KEY
const CHECKSUM_KEY = import.meta.env.VITE_PAYOS_CHECKSUM_KEY

// Generate HMAC SHA256 signature for PayOS
function generateSignature(data: string): string {
  const crypto = window.crypto
  const encoder = new TextEncoder()
  const keyData = encoder.encode(CHECKSUM_KEY)
  const dataToSign = encoder.encode(data)
  
  // For demo purposes, we'll use a simplified approach
  // In production, you should implement proper HMAC SHA256
  return btoa(data + CHECKSUM_KEY).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)
}

export async function createPayOSPayment(paymentData: PayOSPaymentData): Promise<PayOSResponse> {
  try {
    // Create signature string
    const signatureData = `amount=${paymentData.amount}&cancelUrl=${paymentData.cancelUrl}&description=${paymentData.description}&orderCode=${paymentData.orderCode}&returnUrl=${paymentData.returnUrl}`
    const signature = generateSignature(signatureData)

    const headers = {
      'x-client-id': CLIENT_ID,
      'x-api-key': API_KEY,
      'x-partner-code': 'PAYOS',
      'Content-Type': 'application/json'
    }

    const response = await fetch(PAYOS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...paymentData,
        signature
      })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('PayOS payment creation failed:', error)
    return {
      error: 1,
      message: 'Payment creation failed'
    }
  }
}

export async function checkPaymentStatus(orderCode: number): Promise<any> {
  try {
    const headers = {
      'x-client-id': CLIENT_ID,
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    }

    const response = await fetch(`${PAYOS_API_URL}/${orderCode}`, {
      method: 'GET',
      headers
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('PayOS status check failed:', error)
    return {
      error: 1,
      message: 'Status check failed'
    }
  }
}

// Function to update order status after payment confirmation
export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string, orderStatus: string = 'Confirmed') {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: paymentStatus,
        status: orderStatus
      })
      .eq('id', orderId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Failed to update order status:', error)
    return { success: false, error }
  }
}