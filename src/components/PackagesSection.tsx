import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Sparkles, Users } from "lucide-react";

const PackagesSection = () => {
  const packages = [
    {
      id: "basic",
      name: "Basic",
      subtitle: "Starter Package",
      price: "€199",
      period: "month",
      description: "Perfect for getting started with professional listings",
      icon: <Users className="h-6 w-6" />,
      popular: false,
      features: [
        "Property listing on ViaEstate.eu",
        "Lead forwarding via contact form",
        "Visibility in search filters (country & city)",
        "Professional photography (standard, web-optimized)",
        "Basic photo editing"
      ]
    },
    {
      id: "standard",
      name: "Standard",
      subtitle: "Growth Package",
      price: "€399",
      period: "month",
      description: "Best value for growing your property business",
      icon: <Star className="h-6 w-6" />,
      popular: true,
      features: [
        "Everything in Basic",
        "Up to 2 properties/month promoted on ViaEstate social media",
        "Lead forwarding with notifications + basic statistics",
        "Short video presentation (1–2 minutes, simple walkthrough)",
        "Advanced photo editing (light, color, sharpness)",
        "Featured placement in search results"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      subtitle: "Exclusive Exposure",
      price: "€799",
      period: "month",
      description: "Maximum exposure for premium properties",
      icon: <Crown className="h-6 w-6" />,
      popular: false,
      features: [
        "Everything in Standard",
        "Up to 5 properties/month promoted on social media",
        "Priority placement on ViaEstate's homepage",
        "Drone photography/aerial footage",
        "Professional video presentation (3–5 minutes, storytelling)",
        "Lifestyle photography (details, environment)",
        "Custom ad campaign across EU (Meta Ads/Google Ads)",
        "Access to leads via CRM overview"
      ]
    },
    {
      id: "custom",
      name: "Custom Quote",
      subtitle: "Tailored Solution",
      price: "Upon",
      period: "Request",
      description: "Fully customized solutions for unique requirements",
      icon: <Sparkles className="h-6 w-6" />,
      popular: false,
      features: [
        "Tailored services based on client needs",
        "Premium production options: 360° tours, VR viewings",
        "Voice-over for video presentations",
        "Custom campaign videos for social media",
        "PR & articles on external platforms",
        "Exclusive advertising strategies",
        "Personal advisory meetings included"
      ]
    }
  ];

  const addOns = [
    {
      name: "Property-specific marketing campaign",
      price: "€250 per campaign"
    },
    {
      name: "Commission-based compensation",
      price: "0.6% of final sales price"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Choose Your <span className="text-primary">Package</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional real estate marketing packages designed to showcase your properties 
            and connect you with qualified buyers across Europe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary shadow-elegant' : 'border-border'} hover:shadow-elegant transition-smooth`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
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
                
                <Button 
                  variant={pkg.popular ? "hero" : "outline"} 
                  className="w-full"
                >
                  {pkg.id === "custom" ? "Contact Us" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-bold text-center mb-6">Available Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addOns.map((addOn, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-background rounded-xl border border-border">
                <span className="font-medium">{addOn.name}</span>
                <span className="text-primary font-bold">{addOn.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;