import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { GripVertical, X } from 'lucide-react'

const features: Feature[] = [
  { id: 'performance_stats', name: 'Performance Statistics & Analytics', description: 'Detailed analytics and performance reports', price: 50, type: 'monthly' },
  { id: 'platform_listing', name: 'Platform Listing', description: 'Property listed on our platform', price: 30, type: 'monthly' },
  { id: 'social_media_basic', name: 'Basic Social Media Promotion', description: 'Basic promotion on social media channels', price: 40, type: 'monthly' },
  { id: 'basic_listing', name: 'Basic Property Listings', description: 'Standard property listing setup', price: 20, type: 'monthly' },
  { id: 'standard_marketing', name: 'Standard Marketing Exposure', description: 'Standard marketing and visibility', price: 50, type: 'monthly' },
  { id: 'monthly_reports', name: 'Monthly Performance Reports', description: 'Monthly performance and analytics reports', price: 30, type: 'monthly' },
  { id: 'professional_video', name: 'Professional Video Editing', description: 'Professional video editing and tailored promotion', price: 150, type: 'monthly' },
  { id: 'dedicated_photographer', name: 'Dedicated Photographer', description: 'Professional photographer for your listings', price: 200, type: 'monthly' },
  { id: 'premium_social', name: 'Premium Social Media Placement', description: 'Premium placement and boosted reach on social media', price: 100, type: 'monthly' },
  { id: 'advanced_analytics', name: 'Advanced Analytics & Insights', description: 'Advanced analytics and market insights', price: 80, type: 'monthly' },
  { id: 'priority_support', name: 'Priority Customer Support', description: 'Priority support and assistance', price: 60, type: 'monthly' },
  { id: 'property_campaign', name: 'Property-Specific Marketing Campaign', description: 'Custom marketing campaign for specific property', price: 250, type: 'one-time' },
  { id: 'commission_based', name: 'Commission-Based Compensation', description: '0.6% commission on final sales price', price: 0, type: 'commission' },
]

interface Feature {
  id: string
  name: string
  description: string
  price: number
  type: 'monthly' | 'one-time' | 'commission'
}

interface DraggableFeatureProps {
  feature: Feature
  isSelected: boolean
}

function DraggableAvailableFeature({ feature, isSelected }: DraggableFeatureProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: feature.id })
  const style = {
    transform: CSS.Transform.toString(transform),
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''} ${isSelected ? 'bg-primary/10 border-primary' : 'bg-background'}`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="font-medium">{feature.name}</div>
          <div className="text-sm text-muted-foreground">{feature.description}</div>
          <div className="text-sm font-bold text-primary">
            {feature.type === 'commission' ? '0.6% commission' : `€${feature.price}/${feature.type === 'monthly' ? 'month' : 'one-time'}`}
          </div>
        </div>
        {isSelected && <Badge variant="secondary">Selected</Badge>}
      </div>
    </div>
  )
}

function DraggableSelectedFeature({ feature, onRemove }: { feature: Feature, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: feature.id })
  const style = {
    transform: CSS.Transform.toString(transform),
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-3 bg-primary/10 border border-primary rounded-lg cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <div>
        <div className="font-medium">{feature.name}</div>
        <div className="text-sm text-primary font-bold">
          {feature.type === 'commission' ? '0.6% commission' : `€${feature.price}/${feature.type === 'monthly' ? 'month' : 'one-time'}`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

const CustomPackageBuilder = () => {
  const { user, profile } = useAuth()
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([])
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })

  useEffect(() => {
    if (user?.email && !contactForm.email) {
      setContactForm(prev => ({ ...prev, email: user.email! }))
    }
    if (profile?.full_name && !contactForm.name) {
      setContactForm(prev => ({ ...prev, name: profile.full_name }))
    }
  }, [user, profile])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const featureId = active.id as string
    const feature = features.find(f => f.id === featureId)
    if (!feature) return
    if (over.id === 'custom-plan') {
      if (!selectedFeatures.find(f => f.id === featureId)) {
        setSelectedFeatures(prev => [...prev, feature])
      }
    } else if (over.id === 'available-features') {
      setSelectedFeatures(prev => prev.filter(f => f.id !== featureId))
    }
  }

  const removeFeature = (featureId: string) => {
    setSelectedFeatures(prev => prev.filter(f => f.id !== featureId))
  }

  const calculateTotal = () => {
    const monthly = selectedFeatures.filter(f => f.type === 'monthly').reduce((sum, f) => sum + f.price, 0)
    const oneTime = selectedFeatures.filter(f => f.type === 'one-time').reduce((sum, f) => sum + f.price, 0)
    return { monthly, oneTime }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { monthly, oneTime } = calculateTotal()
    const quoteData = {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone || null,
      company: contactForm.company || null,
      message: contactForm.message,
      selected_features: {
        features: selectedFeatures.map(f => ({ id: f.id, name: f.name, price: f.price, type: f.type })),
        total_monthly: monthly,
        total_one_time: oneTime
      },
      status: 'pending'
    }
    try {
      const { data, error } = await supabase.rpc('submit_package_quote', {
        p_name: quoteData.name,
        p_email: quoteData.email,
        p_message: quoteData.message,
        p_phone: quoteData.phone,
        p_company: quoteData.company,
        p_selected_features: quoteData.selected_features
      })
      if (error) throw error
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit quote request')
      }
      toast({
        title: "Quote request sent!",
        description: "We'll contact you within 24 hours with your custom quote."
      })
      setSelectedFeatures([])
      setContactForm({
        name: user?.email ? (profile?.full_name || '') : '',
        email: user?.email || '',
        phone: '',
        company: '',
        message: ''
      })
    } catch (error: any) {
      console.error('Error sending quote request:', error)
      toast({
        title: "Error",
        description: "Failed to send quote request. Please try again.",
        variant: "destructive"
      })
    }
  }

  const { monthly, oneTime } = calculateTotal()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Build Your Custom Package</h1>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Available Features</CardTitle>
                  <p className="text-sm text-muted-foreground">Drag features to your custom plan</p>
                </CardHeader>
                <CardContent>
                  <div id="available-features" className="space-y-2 min-h-[400px]">
                    {features.map(feature => (
                      <DraggableAvailableFeature
                        key={feature.id}
                        feature={feature}
                        isSelected={selectedFeatures.some(f => f.id === feature.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Your Custom Plan</CardTitle>
                  <p className="text-sm text-muted-foreground">Drop features here to build your package</p>
                </CardHeader>
                <CardContent>
                  <div id="custom-plan" className="space-y-2 min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {selectedFeatures.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Drop features here to start building your custom package
                      </div>
                    ) : (
                      selectedFeatures.map(feature => (
                        <DraggableSelectedFeature
                          key={feature.id}
                          feature={feature}
                          onRemove={() => removeFeature(feature.id)}
                        />
                      ))
                    )}
                  </div>
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-bold mb-2">Price Summary</h3>
                    {monthly > 0 && <div>Monthly: €{monthly}</div>}
                    {oneTime > 0 && <div>One-time: €{oneTime}</div>}
                    {monthly === 0 && oneTime === 0 && <div className="text-muted-foreground">No features selected</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DndContext>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Request Your Custom Quote</CardTitle>
              <p className="text-sm text-muted-foreground">Tell us more about your needs</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Additional Requirements</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your specific needs, number of properties, target markets, etc."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={selectedFeatures.length === 0}>
                  Request Custom Quote
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CustomPackageBuilder