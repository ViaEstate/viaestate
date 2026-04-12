import PropertyDetailModal from "./PropertyDetailModal";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Property = Tables<"properties">;

const FeaturedProperties = () => {
  const { t } = useLanguage();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const selectFields = `
          id, title, description, country, city, price, property_type,
          property_type_detail, bedrooms, bathrooms, area, plot_area,
          distance_to_city, distance_to_sea, distance_to_lake, listing_type,
          images, seller_id, seller_type, status, created_at, updated_at,
          region, address, lat, lon, features, distance_to_beach_m, views, verified, currency
        `;

        const SOUTHERN_EUROPEAN_COUNTRIES = [
          'France', 'Spain', 'Italy', 'Croatia', 'Greece', 'Cyprus', 'Portugal',
        ];

        const { data, error } = await supabase
          .from('properties')
          .select(selectFields)
          .eq('status', 'published')
          .in('country', SOUTHERN_EUROPEAN_COUNTRIES)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error("Error fetching featured properties:", error);
          setProperties([]);
        } else {
          // Pick one property per country (most recent)
          const seen = new Set<string>();
          const featuredPerCountry = (data || []).filter((p) => {
            const key = p.country?.toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setProperties(featuredPerCountry as Property[]);
        }
      } catch (error) {
        console.error("Error fetching featured properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Auto-scroll effect - changes every 3 seconds
  useEffect(() => {
    if (properties.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % properties.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [properties.length]);

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getImageUrl = (url: string) => {
    if (!url || url === "/placeholder.svg") {
      return "/placeholder.svg";
    }
    if (url.includes('supabase.co/storage')) {
      return url;
    }
    if (url.includes('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=600&h=400&fit=cover&q=80`;
    }
    return url;
  };

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            {t("featured.title")}
            <span className="bg-gradient-primary bg-clip-text text-transparent"> </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("featured.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="relative w-full max-w-6xl mx-auto">
            {/* Carousel track */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="w-full flex-shrink-0 px-4"
                  >
                    <Card
                      className="cursor-pointer overflow-hidden border-border hover:shadow-elegant transition-smooth bg-card w-full max-w-3xl mx-auto"
                      onClick={() => setSelectedProperty(property)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-white">
                        <img
                          src={getImageUrl(property.images?.[0] || "/placeholder.svg")}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Price Badge */}
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="default" className="bg-background/95 text-foreground border border-border text-2xl font-bold px-4 py-2">
                            {formatPrice(property.price)}
                          </Badge>
                        </div>
                        {/* Country Badge */}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="capitalize bg-primary text-primary-foreground border-0">
                            {property.country}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center text-muted-foreground justify-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <p className="text-sm">{property.city}, {property.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next arrows */}
            {properties.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-md transition-colors"
                  aria-label="Previous property"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % properties.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-md transition-colors"
                  aria-label="Next property"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {properties.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to property ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {properties.length > 0 && (
        <div className="text-center mt-12">
          <Button variant="hero" size="lg" className="px-8 py-4 h-auto text-lg" onClick={() => navigate(`/${lang}/properties`)}>
            {t("featured.view_all")}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
        )}
      </div>
      
      <PropertyDetailModal 
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </section>
  );
};

export default FeaturedProperties;
