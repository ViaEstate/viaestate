-- Add xml_object_id to properties table for tracking imported XML properties
ALTER TABLE properties ADD COLUMN xml_object_id TEXT UNIQUE;