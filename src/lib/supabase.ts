import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  available: boolean
  created_at: string
}

export type CartItem = {
  id: string
  user_id: string
  menu_item_id: string
  quantity: number
  created_at: string
  menu_items: MenuItem
}

export type Order = {
  id: string
  user_id: string
  total_amount: number
  status: string
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  payment_method: string
  payment_status: string
  payos_order_id?: string
  created_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  created_at: string
  menu_items: MenuItem
}