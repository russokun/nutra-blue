-- Migration: Add extra product details and Google Doc URL columns to products table
-- Run this in the Supabase SQL Editor to support the dynamic sync feature.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS google_doc_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS usage TEXT,
ADD COLUMN IF NOT EXISTS precautions TEXT;
