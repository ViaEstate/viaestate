import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, Building, MapPin, Users, Sparkles, Send } from "lucide-react";
import { useState } from "react";

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState<"properties" | "agencies">("properties");
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState({
    budget: "",
    location: "",
    propertyType: "",
    specificNeeds: ""
  });

  const aiFeatures = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Property Matching",
      description: "AI analyzes your preferences to find perfect properties across Europe"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Agency Finder",
      description: "Connect with verified agencies specialized in your target market"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Market Intelligence",
      description: "Get AI-powered insights on property values and market trends"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Personalized Recommendations",
      description: "Receive tailored suggestions based on your search history"
    }
  ];

  const mockRecommendations = [
    {
      type: "property",
      title: "Luxury Villa in Marbella",
      location: "Spain",
      price: "€2,500,000",
      match: "95%"
    },
    {
      type: "property",
      title: "Modern Apartment in Paris",
      location: "France",
      price: "€850,000",
      match: "88%"
    },
    {
      type: "agency",
      title: "Mediterranean Properties Group",
      location: "Spain & France",
      specialty: "Luxury Coastal Properties",
      rating: "4.9/5"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Bot className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            AI-Powered <span className="text-primary">Real Estate Assistant</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Let our advanced AI help you find the perfect property or connect with the right agencies 
            for your real estate needs across Europe.
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {aiFeatures.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-elegant transition-smooth border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary">{feature.icon}</span>
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-border shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "properties" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("properties")}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Find Properties
                </Button>
                <Button
                  variant={activeTab === "agencies" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("agencies")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Agencies
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Quick Query */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      activeTab === "properties"
                        ? "Describe your ideal property... (e.g., 'I'm looking for a 3-bedroom villa near the beach in Spain with a budget of €1M')"
                        : "What kind of agency are you looking for... (e.g., 'I need an agency specializing in luxury properties in France')"
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 min-h-[100px]"
                  />
                </div>
                <Button variant="hero" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Ask AI Assistant
                </Button>
              </div>

              {/* Detailed Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Budget Range</label>
                  <Input
                    placeholder="e.g., €500K - €1M"
                    value={preferences.budget}
                    onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred Location</label>
                  <Input
                    placeholder="e.g., Spain, France, Italy"
                    value={preferences.location}
                    onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type</label>
                  <Input
                    placeholder="e.g., Villa, Apartment, Commercial"
                    value={preferences.propertyType}
                    onChange={(e) => setPreferences({ ...preferences, propertyType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Special Requirements</label>
                  <Input
                    placeholder="e.g., Sea view, Pool, Garage"
                    value={preferences.specificNeeds}
                    onChange={(e) => setPreferences({ ...preferences, specificNeeds: e.target.value })}
                  />
                </div>
              </div>

              {/* Mock AI Recommendations */}
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Recommendations
                </h3>
                <div className="space-y-4">
                  {mockRecommendations.map((rec, index) => (
                    <Card key={index} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {rec.type === "property" ? "Property" : "Agency"}
                              </Badge>
                              {rec.type === "property" && (
                                <Badge variant="default" className="text-xs bg-primary/10 text-primary">
                                  {rec.match} Match
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground">{rec.location}</p>
                            {rec.type === "property" && (
                              <p className="text-sm font-semibold text-primary">{rec.price}</p>
                            )}
                            {rec.type === "agency" && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <p>{rec.specialty}</p>
                                <p>Rating: {rec.rating}</p>
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIAssistant;