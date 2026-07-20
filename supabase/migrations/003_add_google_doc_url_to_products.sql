-- Migration: Add google_doc_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS google_doc_url TEXT;
