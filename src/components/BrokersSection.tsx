import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Phone, Mail, Building, Users } from "lucide-react";

const BrokersSection = () => {
  const brokers = [
    {
      id: 1,
      name: "Elena Rodriguez",
      company: "Mediterranean Properties Group",
      location: "Marbella, Spain",
      rating: 4.9,
      reviews: 127,
      specialties: ["Luxury Villas", "Coastal Properties", "Investment"],
      languages: ["Spanish", "English", "French"],
      avatar: "/placeholder.svg",
      properties: 45,
      experience: "12 years"
    },
    {
      id: 2,
      name: "Marco Benetti",
      company: "Italian Estate Solutions",
      location: "Rome, Italy",
      rating: 4.8,
      reviews: 94,
      specialties: ["Historic Properties", "City Apartments", "Commercial"],
      languages: ["Italian", "English", "German"],
      avatar: "/placeholder.svg",
      properties: 38,
      experience: "8 years"
    },
    {
      id: 3,
      name: "Sophie Dubois",
      company: "Paris Premium Real Estate",
      location: "Paris, France",
      rating: 4.9,
      reviews: 156,
      specialties: ["Luxury Apartments", "Historic Buildings", "Investment"],
      languages: ["French", "English", "Spanish"],
      avatar: "/placeholder.svg",
      properties: 62,
      experience: "15 years"
    },
    {
      id: 4,
      name: "Hans Mueller",
      company: "Alpine Properties",
      location: "Munich, Germany",
      rating: 4.7,
      reviews: 83,
      specialties: ["Mountain Properties", "Modern Homes", "Eco-Friendly"],
      languages: ["German", "English", "Italian"],
      avatar: "/placeholder.svg",
      properties: 29,
      experience: "10 years"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Connect with <span className="text-primary">Expert Brokers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our verified real estate professionals across Europe are ready to help you 
            find your perfect property or sell your current one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {brokers.map((broker) => (
            <Card key={broker.id} className="group cursor-pointer overflow-hidden border-border hover:shadow-elegant transition-smooth bg-card">
              <CardContent className="p-6">
                {/* Avatar and Basic Info */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg">{broker.name}</h3>
                  <p className="text-sm text-muted-foreground">{broker.company}</p>
                  
                  {/* Location */}
                  <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {broker.location}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-center mt-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{broker.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">({broker.reviews} reviews)</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div className="bg-background rounded-lg p-2">
                    <div className="font-semibold text-sm">{broker.properties}</div>
                    <div className="text-xs text-muted-foreground">Properties</div>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <div className="font-semibold text-sm">{broker.experience}</div>
                    <div className="text-xs text-muted-foreground">Experience</div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="text-xs font-semibold mb-2">Specialties:</div>
                  <div className="flex flex-wrap gap-1">
                    {broker.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <div className="text-xs font-semibold mb-2">Languages:</div>
                  <div className="text-xs text-muted-foreground">
                    {broker.languages.join(", ")}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button variant="hero" size="sm" className="w-full">
                    <Mail className="h-3 w-3 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Building className="h-3 w-3 mr-2" />
                    View Properties
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action for Brokers */}
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <h3 className="text-2xl font-bold mb-4">Are you a Real Estate Professional?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our network of verified brokers and gain access to qualified leads, 
            professional tools, and a premium platform to showcase your properties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Join as Broker
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrokersSection;