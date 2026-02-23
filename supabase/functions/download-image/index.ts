import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { imageUrl, propertyId, imageIndex } = await req.json()

    if (!imageUrl || !propertyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing imageUrl or propertyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Downloading image: ${imageUrl} for property ${propertyId}`)

    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PropertyImport/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBlob = await response.blob()

    // Create unique filename
    const fileExtension = contentType.split('/')[1] || 'jpg'
    const fileName = `property-${propertyId}-${imageIndex}.${fileExtension}`

    console.log(`Uploading to storage: ${fileName}`)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('properties')
      .upload(fileName, imageBlob, {
        contentType: contentType,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('properties')
      .getPublicUrl(fileName)

    console.log(`Successfully uploaded: ${publicUrl}`)

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in download-image function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})