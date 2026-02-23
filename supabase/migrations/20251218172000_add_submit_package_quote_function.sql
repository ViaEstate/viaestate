-- Add submit_package_quote function for custom package quotes
CREATE OR REPLACE FUNCTION submit_package_quote(
  p_name TEXT,
  p_email TEXT,
  p_message TEXT,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_selected_features JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO quote_requests (name, email, phone, company, message, selected_features)
  VALUES (p_name, p_email, p_phone, p_company, p_message, p_selected_features);
  
  result := json_build_object('success', true);
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;