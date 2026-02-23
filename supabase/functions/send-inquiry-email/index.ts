import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { lead, property, inquiryData } = await req.json()

    // Send email using Resend (you'll need to set up Resend API)
    const emailData = {
      from: 'ViaEstate <info@viaestate.eu>',
      to: 'info@viaestate.eu',
      subject: `New Property Inquiry: ${property.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Property Inquiry</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Property: ${property.title}</h3>
            <p style="margin: 5px 0; color: #64748b;">Location: ${property.city}, ${property.country}</p>
            <p style="margin: 5px 0; color: #64748b;">Price: €${property.price?.toLocaleString()}</p>
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e293b;">Inquiry Details:</h4>
            <p><strong>Name:</strong> ${inquiryData.name}</p>
            <p><strong>Email:</strong> ${inquiryData.email}</p>
            <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 10px 0;">
              ${inquiryData.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${inquiryData.email}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reply to Inquiry
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center;">
            This inquiry was sent through ViaEstate.eu
          </p>
        </div>
      `
    }

    // For now, just log the email data
    // You can integrate with your preferred email service here
    console.log('New inquiry received:', JSON.stringify({
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      inquiryData: inquiryData,
      property: property
    }, null, 2))

    // TODO: Integrate with your email service
    // Options:
    // 1. Use Supabase's built-in email service (configure SMTP in dashboard)
    // 2. Use a service like Resend, SendGrid, or Mailgun
    // 3. Use Outlook SMTP with proper credentials

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in send-inquiry-email function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})