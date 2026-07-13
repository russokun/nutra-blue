-- Migration: Fix RPC security settings to bypass RLS during checkout
-- Run this script in the Supabase SQL Editor.

ALTER FUNCTION create_order_with_stock_check(
    p_customer_name text,
    p_email text,
    p_phone text,
    p_address text,
    p_city text,
    p_region text,
    p_items jsonb,
    p_subtotal int,
    p_tax int,
    p_shipping_cost int,
    p_total int
) SECURITY DEFINER;
