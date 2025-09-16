import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, Star, Zap, Crown, Settings } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { toast } from '@/hooks/use-toast'

interface PackageFeature {
  id: string
  name: string
  description: string
  price: number
  included_in: string[]
  category: 'marketing' | 'photography' | 'video' | 'advertising' | 'support'
}

const PackageBuilder = () => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })

  // Base packages
  const basePackages = [
    {
      id: 'basic',
      name: 'Basic - Starter Package',
      price: 199,
      icon: <Star className="h-6 w-6" />,
      features: [
        'Property listing on ViaEstate.eu',
        'Lead forwarding via contact form',
        'Visibility in search filters (country & city)',
        'Professional photography (standard, web-optimized)',
        'Basic photo editing'
      ]
    },
    {
      id: 'standard',
      name: 'Standard - Growth Package',
      price: 399,
      icon: <Zap className="h-6 w-6" />,
      popular: true,
      features: [
        'Everything in Basic',
        'Up to 2 properties/month promoted on ViaEstate social media',
        'Lead forwarding with notifications + basic statistics',
        'Short video presentation (1–2 minutes, simple walkthrough)',
        'Advanced photo editing (light, color, sharpness)',
        'Featured placement in search results'
      ]
    },
    {
      id: 'premium',
      name: 'Premium - Exclusive Exposure',
      price: 799,
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Everything in Standard',
        'Up to 5 properties/month promoted on social media',
        'Priority placement on ViaEstate\'s homepage',
        'Drone photography/aerial footage',
        'Professional video presentation (3–5 minutes, storytelling)',
        'Lifestyle photography (details, environment)',
        'Custom ad campaign across EU (Meta Ads/Google Ads)',
        'Access to leads via CRM overview'
      ]
    }
  ]

  // Additional features that can be added to any package
  const additionalFeatures: PackageFeature[] = [
    {
      id: 'extra_social',
      name: 'Extra Social Media Promotion',
      description: 'Additional property promotions on social media platforms',
      price: 50,
      included_in: [],
      category: 'marketing'
    },
    {
      id: '360_tour',
      name: '360° Virtual Tour',
      description: 'Interactive 360° virtual tour of the property',
      price: 200,
      included_in: [],
      category: 'photography'
    },
    {
      id: 'vr_viewing',
      name: 'VR Viewing Experience',
      description: 'Virtual reality viewing experience for potential buyers',
      price: 300,
      included_in: [],
      category: 'photography'
    },
    {
      id: 'voice_over',
      name: 'Professional Voice-over',
      description: 'Professional voice-over for video presentations',
      price: 150,
      included_in: [],
      category: 'video'
    },
    {
      id: 'custom_campaign_video',
      name: 'Custom Campaign Video',
      description: 'Custom video content for social media campaigns',
      price: 400,
      included_in: [],
      category: 'video'
    },
    {
      id: 'pr_articles',
      name: 'PR & External Articles',
      description: 'Articles and PR on external real estate platforms',
      price: 300,
      included_in: [],
      category: 'advertising'
    },
    {
      id: 'exclusive_advertising',
      name: 'Exclusive Advertising Strategy',
      description: 'Tailored advertising strategy for maximum exposure',
      price: 500,
      included_in: [],
      category: 'advertising'
    },
    {
      id: 'personal_meetings',
      name: 'Personal Advisory Meetings',
      description: 'One-on-one strategy meetings with our experts',
      price: 200,
      included_in: [],
      category: 'support'
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      description: '24/7 priority customer support',
      price: 100,
      included_in: [],
      category: 'support'
    }
  ]

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const calculateTotalPrice = () => {
    const selectedAdditionalFeatures = additionalFeatures.filter(feature =>
      selectedFeatures.includes(feature.id)
    )
    return selectedAdditionalFeatures.reduce((total, feature) => total + feature.price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedFeatureDetails = additionalFeatures.filter(feature =>
      selectedFeatures.includes(feature.id)
    )

    const quoteData = {
      ...contactForm,
      selected_features: selectedFeatureDetails,
      total_additional_cost: calculateTotalPrice(),
      created_at: new Date().toISOString()
    }

    // Here you would typically send this to your backend
    console.log('Quote request:', quoteData)
    
    toast({
      title: "Quote request submitted!",
      description: "We'll contact you within 24 hours with a customized proposal."
    })

    // Reset form
    setContactForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    })
    setSelectedFeatures([])
  }

  const categoryColors = {
    marketing: 'bg-blue-100 text-blue-800',
    photography: 'bg-green-100 text-green-800',
    video: 'bg-purple-100 text-purple-800',
    advertising: 'bg-orange-100 text-orange-800',
    support: 'bg-pink-100 text-pink-800'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Build Your Perfect Package</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with one of our base packages and customize it with additional features 
              to create the perfect solution for your business needs.
            </p>
          </div>

          {/* Base Packages */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Choose Your Base Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {basePackages.map((pkg) => (
                <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-primary' : ''}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-primary text-white">
                        {pkg.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription className="text-2xl font-bold text-primary">
                          €{pkg.price}/month
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-12" />

          {/* Additional Features */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Customize With Additional Features</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {additionalFeatures.map((feature) => (
                <Card key={feature.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={feature.id}
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor={feature.id} className="font-semibold cursor-pointer">
                            {feature.name}
                          </Label>
                          <Badge variant="outline" className={categoryColors[feature.category]}>
                            {feature.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {feature.description}
                        </p>
                        <div className="text-lg font-bold text-primary">
                          +€{feature.price}/month
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          {selectedFeatures.length > 0 && (
            <Card className="mb-8 bg-gradient-subtle">
              <CardHeader>
                <CardTitle>Package Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Package (choose one above)</span>
                    <span>€199 - €799/month</span>
                  </div>
                  {additionalFeatures
                    .filter(feature => selectedFeatures.includes(feature.id))
                    .map(feature => (
                      <div key={feature.id} className="flex justify-between text-sm">
                        <span>{feature.name}</span>
                        <span>+€{feature.price}/month</span>
                      </div>
                    ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Additional Features Total</span>
                    <span className="text-primary">+€{calculateTotalPrice()}/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Get Your Custom Quote</CardTitle>
              <CardDescription>
                Fill out this form and we'll create a personalized proposal for you
              </CardDescription>
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
                <Button type="submit" className="w-full md:w-auto">
                  Request Custom Quote
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default PackageBuilder