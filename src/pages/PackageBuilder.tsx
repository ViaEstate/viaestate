import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, Settings } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const PackageBuilder = () => {
  const { user, profile } = useAuth()
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })

  // Pre-fill email with user's email if logged in
  useEffect(() => {
    if (user?.email && !contactForm.email) {
      setContactForm(prev => ({ ...prev, email: user.email! }))
    }
    if (profile?.full_name && !contactForm.name) {
      setContactForm(prev => ({ ...prev, name: profile.full_name }))
    }
  }, [user, profile, contactForm.email, contactForm.name])

  // Pricing options
  const pricingOptions = [
    {
      id: 'commission',
      name: 'Commission-Based',
      subtitle: 'Success-Based Pricing',
      price: 'Commission',
      period: 'on sale',
      description: 'If we help you sell a property, we take a commission on the total sale price. Simple and success-based.',
      icon: <Star className="h-6 w-6" />,
      popular: false,
      features: [
        'No upfront costs',
        'Commission only on successful sales',
        'Professional property presentation',
        'Marketing across our platform',
        'Lead management and follow-up'
      ]
    },
    {
      id: 'basic',
      name: 'Monthly Basic Plan',
      subtitle: 'Essential Marketing',
      price: '€200',
      period: 'month',
      description: 'Perfect for getting started with professional listings',
      icon: <Zap className="h-6 w-6" />,
      popular: false,
      features: [
        'Performance statistics and analytics',
        'Your properties featured on our platform and social media channels',
        'Basic property listings',
        'Standard marketing exposure',
        'Monthly performance reports'
      ]
    },
    {
      id: 'exclusive',
      name: 'Monthly Exclusive Plan',
      subtitle: 'Premium Marketing',
      price: '€450',
      period: 'month',
      description: 'Maximum exposure with professional production',
      icon: <Crown className="h-6 w-6" />,
      popular: true,
      features: [
        'Everything from the Basic Plan, plus:',
        'Professional video editing and tailored promotion',
        'Dedicated photographer for your listings',
        'Premium placement and boosted reach on social media',
        'Advanced analytics and insights',
        'Priority customer support'
      ]
    },
    {
      id: 'mixed',
      name: 'Mixed Categories',
      subtitle: 'Flexible Custom Plan',
      price: 'Custom',
      period: 'pricing',
      description: 'Combine different categories and services based on your specific needs',
      icon: <Settings className="h-6 w-6" />,
      popular: false,
      features: [
        'Mix commission-based and monthly plans',
        'Choose specific services from different tiers',
        'Custom service combinations',
        'Flexible payment terms',
        'Personal consultation included',
        'Tailored marketing strategy'
      ]
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const quoteData = {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone || null,
      company: contactForm.company || null,
      message: contactForm.message,
      selected_features: { plan: 'Custom Quote' },
      status: 'pending'
    }

    try {
      // Save to database via SQL RPC function (allows anonymous access)
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

      // Reset form
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

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Pricing Options */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Choose Your Pricing Option</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingOptions.map((pkg) => (
                <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-primary' : ''}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${pkg.popular ? 'bg-gradient-primary' : 'bg-muted'}`}>
                        <span className={pkg.popular ? 'text-primary-foreground' : 'text-primary'}>
                          {pkg.icon}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{pkg.price}</span>
                      <span className="text-muted-foreground">/{pkg.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>


          {/* Contact Form - Since we now have fixed pricing options, show contact form directly */}
          <Card>
            <CardHeader>
              <CardTitle>Get Started with Your Chosen Plan</CardTitle>
              <CardDescription>
                Contact us to discuss your chosen pricing option and get started
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
                  <Label htmlFor="message">Chosen Plan & Additional Requirements *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please specify which pricing plan you're interested in and any additional requirements or questions."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  Get Started
                </Button>
              </form>
            </CardContent>
          </Card>

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
                  <Label htmlFor="message">Additional Requirements *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your specific needs, number of properties, target markets, etc."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    required
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