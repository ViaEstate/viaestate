-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send inquiry email directly
CREATE OR REPLACE FUNCTION send_inquiry_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  property_data JSONB;
  inquiry_data JSONB;
  email_subject TEXT;
  email_body TEXT;
BEGIN
  -- Get property details
  SELECT json_build_object(
    'id', p.id,
    'title', p.title,
    'city', p.city,
    'country', p.country,
    'price', p.price,
    'owner_id', p.owner_id
  ) INTO property_data
  FROM properties p
  WHERE p.id = NEW.property_id;

  -- Build inquiry data
  inquiry_data := json_build_object(
    'name', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'message', NEW.message
  );

  -- Build email content
  email_subject := 'New Property Inquiry: ' || (property_data->>'title');
  email_body := '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Property Inquiry</h2>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b;">Property: ' || (property_data->>'title') || '</h3>
        <p style="margin: 5px 0; color: #64748b;">Location: ' || (property_data->>'city') || ', ' || (property_data->>'country') || '</p>
        <p style="margin: 5px 0; color: #64748b;">Price: €' || (property_data->>'price')::text || '</p>
      </div>

      <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1e293b;">Inquiry Details:</h4>
        <p><strong>Name:</strong> ' || (inquiry_data->>'name') || '</p>
        <p><strong>Email:</strong> ' || (inquiry_data->>'email') || '</p>
        <p><strong>Phone:</strong> ' || COALESCE(inquiry_data->>'phone', 'Not provided') || '</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 10px 0;">
          ' || REPLACE(inquiry_data->>'message', '\n', '<br>') || '
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:' || (inquiry_data->>'email') || '"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reply to Inquiry
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; text-align: center;">
        This inquiry was sent through ViaEstate.eu
      </p>
    </div>
  ';

  -- Send email via your preferred service
  -- Replace this with your email service API call
  -- Example for a generic email service:
  /*
  PERFORM
    net.http_post(
      url := 'https://your-email-service.com/api/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer your-api-key'
      ),
      body := jsonb_build_object(
        'to', 'info@viaestate.eu',
        'from', 'ViaEstate <noreply@viaestate.eu>',
        'subject', email_subject,
        'html', email_body
      )
    );
  */

  -- For now, just log the email (replace with actual email sending)
  RAISE LOG 'New inquiry email would be sent to info@viaestate.eu with subject: %', email_subject;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on leads table
CREATE TRIGGER send_inquiry_email_on_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION send_inquiry_email_trigger();