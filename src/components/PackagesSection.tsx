import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Sparkles, Users } from "lucide-react";

const PackagesSection = () => {
  const packages = [
    {
      id: "commission",
      name: "Commission-Based",
      subtitle: "Success-Based Pricing",
      price: "Commission",
      period: "on sale",
      description: "If we help you sell a property, we take a commission on the total sale price. Simple and success-based.",
      icon: <Users className="h-6 w-6" />,
      popular: false,
      features: [
        "No upfront costs",
        "Commission only on successful sales",
        "Professional property presentation",
        "Marketing across our platform",
        "Lead management and follow-up"
      ]
    },
    {
      id: "basic",
      name: "Monthly Basic Plan",
      subtitle: "Essential Marketing",
      price: "€200",
      period: "month",
      description: "Perfect for getting started with professional listings",
      icon: <Star className="h-6 w-6" />,
      popular: false,
      features: [
        "Performance statistics and analytics",
        "Your properties featured on our platform and social media channels",
        "Basic property listings",
        "Standard marketing exposure",
        "Monthly performance reports"
      ]
    },
    {
      id: "exclusive",
      name: "Monthly Exclusive Plan",
      subtitle: "Premium Marketing",
      price: "€450",
      period: "month",
      description: "Maximum exposure with professional production",
      icon: <Crown className="h-6 w-6" />,
      popular: true,
      features: [
        "Everything from the Basic Plan, plus:",
        "Professional video editing and tailored promotion",
        "Dedicated photographer for your listings",
        "Premium placement and boosted reach on social media",
        "Advanced analytics and insights",
        "Priority customer support"
      ]
    },
    {
      id: "mixed",
      name: "Mixed Categories",
      subtitle: "Flexible Custom Plan",
      price: "Custom",
      period: "pricing",
      description: "Drag and drop features to build your custom plan",
      icon: <Sparkles className="h-6 w-6" />,
      popular: false,
      features: [
        "Mix commission-based and monthly plans",
        "Choose specific services from different tiers",
        "Custom service combinations",
        "Flexible payment terms",
        "Personal consultation included",
        "Tailored marketing strategy"
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
            Choose Your <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We offer flexible plans depending on your goals and level of exposure.
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
                  {pkg.id === "mixed" ? "Build Custom Package" : "Get Started"}
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
