import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, Building, MapPin, Users, Sparkles, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchFilters {
  country?: string;
  region?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_distance_beach_m?: number;
}

interface SearchResults {
  properties: Tables<'properties'>[];
  filters?: SearchFilters;
  error?: string;
}

const AIAssistant = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"properties" | "agencies">("properties");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [preferences, setPreferences] = useState({
    budget: "",
    location: "",
    propertyType: "",
    specificNeeds: ""
  });

  const parseSearchText = (text: string): SearchFilters => {
    const lowerText = text.toLowerCase();
    const filters: SearchFilters = {};

    const countries = ['spain', 'france', 'italy', 'germany', 'sweden', 'portugal', 'netherlands', 'belgium', 'austria', 'switzerland'];
    for (const country of countries) {
      if (lowerText.includes(country)) {
        filters.country = country.charAt(0).toUpperCase() + country.slice(1);
        break;
      }
    }

    const priceMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|million|m)?\s*(?:€|eur|euro)/i);
    if (priceMatch) {
      let price = parseFloat(priceMatch[1]);
      const unit = priceMatch[2]?.toLowerCase();
      if (unit === 'k' || unit === 'thousand') price *= 1000;
      else if (unit === 'm' || unit === 'million') price *= 1000000;

      if (lowerText.includes('under') || lowerText.includes('below') || lowerText.includes('less than')) {
        filters.max_price = price;
      } else if (lowerText.includes('over') || lowerText.includes('above') || lowerText.includes('more than')) {
        filters.min_price = price;
      } else {
        filters.max_price = price;
      }
    }

    const types = ['apartment', 'house', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex'];
    for (const type of types) {
      if (lowerText.includes(type)) {
        filters.property_type = type;
        break;
      }
    }

    const bedroomMatch = lowerText.match(/(\d+)\s*bed/i);
    if (bedroomMatch) {
      filters.bedrooms = parseInt(bedroomMatch[1]);
    }

    const bathroomMatch = lowerText.match(/(\d+)\s*bath/i);
    if (bathroomMatch) {
      filters.bathrooms = parseInt(bathroomMatch[1]);
    }

    if (lowerText.includes('beach') || lowerText.includes('sea')) {
      const distanceMatch = lowerText.match(/(\d+)\s*(?:km|kilometer|meter|m)/i);
      if (distanceMatch) {
        let distance = parseInt(distanceMatch[1]);
        if (distanceMatch[2]?.toLowerCase().includes('km')) distance *= 1000;
        filters.max_distance_beach_m = distance;
      } else {
        filters.max_distance_beach_m = 5000;
      }
    }

    return filters;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const filters = parseSearchText(query);

      const { data, error } = await supabase
        .rpc('get_filtered_properties', {
          p_country: filters.country,
          p_region: filters.region,
          p_city: filters.city,
          p_min_price: filters.min_price,
          p_max_price: filters.max_price,
          p_property_type: filters.property_type,
          p_bedrooms: filters.bedrooms,
          p_bathrooms: filters.bathrooms,
          p_limit: 10
        });

      if (error) throw error;

      setSearchResults({
        properties: data || [],
        filters: filters
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        properties: [],
        filters: {},
        error: t("ai.search_error", "Search failed. Please try again.")
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aiFeatures = [
    {
      icon: <Search className="h-6 w-6" />,
      title: t("ai.smart_matching", "Smart Property Matching"),
      description: t("ai.smart_matching_desc", "AI analyzes your preferences to find perfect properties across Europe")
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t("ai.agency_finder", "Agency Finder"),
      description: t("ai.agency_finder_desc", "Connect with verified agencies specialized in your target market")
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: t("ai.market_intelligence", "Market Intelligence"),
      description: t("ai.market_intelligence_desc", "Get AI-powered insights on property values and market trends")
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: t("ai.recommendations", "Personalized Recommendations"),
      description: t("ai.recommendations_desc", "Receive tailored suggestions based on your search history")
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
            {t("ai.assistant_title", "AI-Powered")} <span className="text-primary">{t("ai.assistant_subtitle", "Real Estate Assistant")}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("ai.assistant_desc", "Let our advanced AI help you find the perfect property or connect with the right agencies for your real estate needs across Europe.")}
          </p>
        </div>

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

        <div className="max-w-4xl mx-auto">
          <Card className="border-border shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                {t("ai.assistant_title", "AI Assistant")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "properties" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("properties")}
                >
                  <Building className="h-4 w-4 mr-2" />
                  {t("ai.find_properties", "Find Properties")}
                </Button>
                <Button
                  variant={activeTab === "agencies" ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("agencies")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t("ai.find_agencies", "Find Agencies")}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      activeTab === "properties"
                        ? t("ai.property_placeholder", "Describe your ideal property... (e.g., 'I'm looking for a 3-bedroom villa near the beach in Spain with a budget of €1M')")
                        : t("ai.agency_placeholder", "What kind of agency are you looking for... (e.g., 'I need an agency specializing in luxury properties in France')")
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 min-h-[100px]"
                  />
                </div>
                <Button variant="hero" className="w-full" onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? t("ai.searching", "Searching...") : t("ai.ask_assistant", "Ask AI Assistant")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("ai.budget", "Budget Range")}</label>
                  <Input
                    placeholder="e.g., €500K - €1M"
                    value={preferences.budget}
                    onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("ai.location", "Preferred Location")}</label>
                  <Input
                    placeholder="e.g., Spain, France, Italy"
                    value={preferences.location}
                    onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("ai.property_type", "Property Type")}</label>
                  <Input
                    placeholder="e.g., Villa, Apartment, Commercial"
                    value={preferences.propertyType}
                    onChange={(e) => setPreferences({ ...preferences, propertyType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("ai.requirements", "Special Requirements")}</label>
                  <Input
                    placeholder="e.g., Sea view, Pool, Garage"
                    value={preferences.specificNeeds}
                    onChange={(e) => setPreferences({ ...preferences, specificNeeds: e.target.value })}
                  />
                </div>
              </div>

              {searchResults && (
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t("ai.recommendations", "AI Recommendations")}
                  </h3>
                  <div className="space-y-4">
                    {searchResults.properties?.slice(0, 5).map((property: Tables<"properties">, index: number) => (
                      <Card key={property.id || index} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {t("ai.property_badge", "Property")}
                                </Badge>
                                <Badge variant="default" className="text-xs bg-primary/10 text-primary">
                                  {t("ai.ai_match", "AI Match")}
                                </Badge>
                              </div>
                              <h4 className="font-semibold">{property.title}</h4>
                              <p className="text-sm text-muted-foreground">{property.city}, {property.country}</p>
                              <p className="text-sm font-semibold text-primary">€{property.price?.toLocaleString()}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.open(`/${lang}/properties/${property.id}`, '_blank')}>
                              {t("ai.view_details", "View Details")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!searchResults.properties || searchResults.properties.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">
                        {t("ai.no_results", "No properties found matching your criteria. Try adjusting your search.")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIAssistant;
