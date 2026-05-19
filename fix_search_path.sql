-- Fix for: Function public.reload_schema_cache has a role mutable search_path
-- Description: Detects functions where the search_path parameter is not set.
-- 
-- Run this script in your Supabase SQL Editor.

ALTER FUNCTION public.reload_schema_cache() SET search_path = '';
