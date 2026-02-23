import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Building, Users } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

type OwnerType = 'broker' | 'private'

function deriveOwnerType(role?: string | null): OwnerType {
  return role === 'private_user' ? 'private' : 'broker'
}

const ListProperty = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    english_title: '',
    english_description: '',
    swedish_title: '',
    swedish_description: '',
    norwegian_title: '',
    norwegian_description: '',
    danish_title: '',
    danish_description: '',
    finnish_title: '',
    finnish_description: '',
    country: '',
    city: '',
    price: '',
    property_type: '',
    package_id: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    plot_area: '',
    distance_to_city: '',
    distance_to_sea: '',
    distance_to_lake: ''
  })

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("auth.sign_in")}</h1>
          <p className="text-muted-foreground mb-8">{t("list_property.sign_in_required", "You need to be logged in to list a property.")}</p>
          <Button onClick={() => navigate('/login')}>{t("auth.sign_in")}</Button>
        </div>
      </div>
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages(prev => [...prev, ...files].slice(0, 10)) // Max 10 images
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setVideos(prev => [...prev, ...files].slice(0, 3)) // Max 3 videos
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
  }

  // Upload helper used after property is created
  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const urls: string[] = []

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(`${folder}/${fileName}`, file)

      if (error) throw error

      const { data: publicData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path)

      if (publicData?.publicUrl) {
        urls.push(publicData.publicUrl)
      }
    }

    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const form = formData

      // Basic validation
      if (!form.title || !form.description || !form.country || !form.city || !form.price) {
        throw new Error('Please fill in all required fields.')
      }

      const priceNumber = Number(form.price)
      if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
        throw new Error('Please enter a valid price.')
      }

      // Parse optional numeric fields
      const bedrooms = form.bedrooms ? Number(form.bedrooms) : null
      const bathrooms = form.bathrooms ? Number(form.bathrooms) : null
      const area = form.area ? Number(form.area) : null
      const plotArea = form.plot_area ? Number(form.plot_area) : null
      const distanceToCity = form.distance_to_city ? Number(form.distance_to_city) : null
      const distanceToSea = form.distance_to_sea ? Number(form.distance_to_sea) : null
      const distanceToLake = form.distance_to_lake ? Number(form.distance_to_lake) : null

      // seller_id must match profiles.id for FK + RLS
      const seller_id = user.id
      const seller_type: OwnerType = deriveOwnerType(profile?.role)
      const status = (profile?.role === 'admin' || profile?.role === 'broker') ? 'published' : 'pending' as const

      // Insert property first (no media yet to avoid blocking on uploads)
      const propertyInsert = {
        title: form.title.trim(),
        description: form.description.trim(),
        english_title: form.english_title ? form.english_title.trim() : null,
        english_description: form.english_description ? form.english_description.trim() : null,
        swedish_title: form.swedish_title ? form.swedish_title.trim() : null,
        swedish_description: form.swedish_description ? form.swedish_description.trim() : null,
        norwegian_title: form.norwegian_title ? form.norwegian_title.trim() : null,
        norwegian_description: form.norwegian_description ? form.norwegian_description.trim() : null,
        danish_title: form.danish_title ? form.danish_title.trim() : null,
        danish_description: form.danish_description ? form.danish_description.trim() : null,
        finnish_title: form.finnish_title ? form.finnish_title.trim() : null,
        finnish_description: form.finnish_description ? form.finnish_description.trim() : null,
        country: form.country.trim(),
        city: form.city.trim(),
        price: priceNumber,
        property_type: form.property_type ? form.property_type.trim() : null,
        package_id: form.package_id ? form.package_id.trim() : null,
        bedrooms,
        bathrooms,
        area,
        plot_area: plotArea,
        distance_to_city: distanceToCity,
        distance_to_sea: distanceToSea,
        distance_to_lake: distanceToLake,
        seller_id,
        seller_type, // required by schema (NOT NULL, default exists but we set explicitly)
        // Keep owner_* in sync so other parts of the app that filter by owner_id still work
        owner_id: user.id,
        owner_type: seller_type,
        status      // safe default for policies
      }



      // Insert property with timeout handling
      const insertQuery = supabase
        .from('properties')
        .insert([propertyInsert])
        .select('*')
        .single()

      // Use Promise.race for timeout instead of AbortController
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 20000)
      )

      const { data: created, error: insertError } = await Promise.race([
        insertQuery,
        timeoutPromise
      ]) as any

      if (insertError) {
        console.error('Insert error details:', insertError)
        throw insertError
      }

      if (!created?.id) {
        throw new Error('Property creation returned no record. Please try again.')
      }

      // Try media uploads; do not fail the whole flow if media fails
      let imageUrls: string[] = []
      let videoUrls: string[] = []
      try {
        if (images.length > 0) {
          imageUrls = await uploadFiles(images, `images/${seller_id}`)
        }
        if (videos.length > 0) {
          videoUrls = await uploadFiles(videos, `videos/${seller_id}`)
        }
      } catch (mediaErr: any) {
        console.error('Media upload failed:', mediaErr)
        toast({
          title: 'Property created, but media upload failed',
          description: mediaErr?.message || 'Please try adding images/videos later from your dashboard.',
          variant: 'destructive'
        })
      }

      // If we have any media, update the property row
      if ((imageUrls && imageUrls.length) || (videoUrls && videoUrls.length)) {
        const { error: mediaUpdateError } = await supabase
          .from('properties')
          .update({
            images: imageUrls && imageUrls.length ? imageUrls : null,
            videos: videoUrls && videoUrls.length ? videoUrls : null
          })
          .eq('id', created.id)

        if (mediaUpdateError) {
          console.error('Failed to update media URLs on property:', mediaUpdateError)
          // Non-fatal
        }
      }

      setSuccessMsg('Property listed successfully!')
      toast({
        title: 'Property listed successfully!',
        description:
          profile?.role === 'private_user'
            ? "Your property has been submitted. Our team will contact you soon to connect you with a professional broker."
            : 'Your property has been published successfully and is now live.'
      })

      navigate('/dashboard')
    } catch (error: any) {
      // Show as much detail as possible to diagnose RLS/FK issues
      console.error('Full error details:', error)
      const desc =
        error?.message ||
        error?.hint ||
        error?.details ||
        error?.error_description ||
        'Failed to list property.'
      setErrorMsg('Failed to list property: ' + desc)
      toast({
        title: 'Error listing property',
        description: desc,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Account Type Badge */}
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm">
              {profile?.role === 'broker' ? (
                <>
                  <Building className="h-4 w-4 mr-1" />
                  Professional Broker Account
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-1" />
                  Private Seller Account
                </>
              )}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>Provide the basic details about your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Luxury Villa with Sea View"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country || ''}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sweden">Sweden</SelectItem>
                        <SelectItem value="Norway">Norway</SelectItem>
                        <SelectItem value="Denmark">Denmark</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Spain">Spain</SelectItem>
                        <SelectItem value="Italy">Italy</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Stockholm"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (EUR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 850000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select
                      value={formData.property_type || ''}
                      onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      placeholder="e.g., 3"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Living Area (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="plot_area">Plot Area (m²)</Label>
                    <Input
                      id="plot_area"
                      type="number"
                      placeholder="e.g., 800"
                      value={formData.plot_area}
                      onChange={(e) => setFormData({ ...formData, plot_area: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="distance_to_city">Distance to City (m)</Label>
                    <Input
                      id="distance_to_city"
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.distance_to_city}
                      onChange={(e) => setFormData({ ...formData, distance_to_city: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="distance_to_sea">Distance to Sea (m)</Label>
                    <Input
                      id="distance_to_sea"
                      type="number"
                      placeholder="e.g., 200"
                      value={formData.distance_to_sea}
                      onChange={(e) => setFormData({ ...formData, distance_to_sea: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="distance_to_lake">Distance to Lake (m)</Label>
                    <Input
                      id="distance_to_lake"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.distance_to_lake}
                      onChange={(e) => setFormData({ ...formData, distance_to_lake: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Property Media</CardTitle>
                <CardDescription>Upload high-quality images and videos of your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Images */}
                <div>
                  <Label>Images (Max 10)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer block w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-smooth"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload images or drag and drop</p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {images.map((file, index) => (
                        <div key={index} className="relative">
                          <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <Label>Videos (Max 3)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer block w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-smooth"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload videos or drag and drop</p>
                    </label>
                  </div>

                  {videos.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {videos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                          <span className="text-sm">{file.name}</span>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeVideo(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'List Property'}
              </Button>
            </div>

            {/* Error and Success Messages */}
            {errorMsg && <div className="text-red-600 mt-2">{errorMsg}</div>}
            {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
          </form>
        </div>
      </main>
    </div>
  )
}

export default ListProperty;
