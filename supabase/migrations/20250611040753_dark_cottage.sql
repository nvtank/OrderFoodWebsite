/*
  # Food Ordering App Database Schema

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `image_url` (text)
      - `category` (text)
      - `available` (boolean)
      - `created_at` (timestamp)
    
    - `carts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `menu_item_id` (uuid, references menu_items)
      - `quantity` (integer)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `total_amount` (decimal)
      - `status` (text)
      - `delivery_name` (text)
      - `delivery_phone` (text)
      - `delivery_address` (text)
      - `payment_method` (text)
      - `payment_status` (text)
      - `payos_order_id` (text)
      - `created_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `menu_item_id` (uuid, references menu_items)
      - `quantity` (integer)
      - `price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  category text NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  menu_item_id uuid REFERENCES menu_items NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'Pending',
  delivery_name text NOT NULL,
  delivery_phone text NOT NULL,
  delivery_address text NOT NULL,
  payment_method text DEFAULT 'PayOS',
  payment_status text DEFAULT 'Pending',
  payos_order_id text,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL,
  menu_item_id uuid REFERENCES menu_items NOT NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for menu_items (public read access)
CREATE POLICY "Anyone can read menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

-- Policies for carts (users can only access their own cart)
CREATE POLICY "Users can read own cart"
  ON carts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart"
  ON carts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON carts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON carts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for orders (users can only access their own orders)
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for order_items (access through orders)
CREATE POLICY "Users can read order items for their orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for their orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, image_url, category) VALUES
('Chicken Fried Rice', 'Delicious fried rice with tender chicken pieces, mixed vegetables and aromatic spices', 85000, 'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg', 'Rice'),
('Beef Pho', 'Traditional Vietnamese beef noodle soup with fresh herbs and spices', 95000, 'https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg', 'Noodles'),
('Crispy Fried Chicken', 'Golden crispy fried chicken with special seasoning', 120000, 'https://images.pexels.com/photos/1260968/pexels-photo-1260968.jpeg', 'Fried Chicken'),
('Fresh Orange Juice', 'Freshly squeezed orange juice, rich in vitamin C', 35000, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg', 'Drinks'),
('Seafood Fried Rice', 'Premium fried rice with fresh seafood and special sauce', 125000, 'https://images.pexels.com/photos/725990/pexels-photo-725990.jpeg', 'Rice'),
('Chicken Pad Thai', 'Thai-style stir-fried noodles with chicken and peanuts', 98000, 'https://images.pexels.com/photos/1143754/pexels-photo-1143754.jpeg', 'Noodles'),
('Buffalo Wings', 'Spicy buffalo chicken wings with ranch dipping sauce', 110000, 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg', 'Fried Chicken'),
('Vietnamese Iced Coffee', 'Traditional Vietnamese coffee with condensed milk and ice', 45000, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg', 'Drinks'),
('Shrimp Fried Rice', 'Fragrant fried rice with fresh shrimp and herbs', 105000, 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg', 'Rice'),
('Spicy Chicken Wings', 'Hot and spicy chicken wings with special chili sauce', 115000, 'https://images.pexels.com/photos/1059943/pexels-photo-1059943.jpeg', 'Fried Chicken');