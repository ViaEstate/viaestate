import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Phone } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslatedTitle, getTranslatedDescription } from "@/utils/translation";

type Property = Tables<"properties">;

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  onClick?: () => void;
  filters?: Record<string, string>;
}

const PropertyCard = ({
  property,
  featured = false,
  onClick,
  filters,
}: PropertyCardProps) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Extract data from property object with fallbacks
  const {
    id,
    title,
    description,
    price,
    city,
    country,
    bedrooms = 0,
    bathrooms = 0,
    area = 0,
    plot_area,
    distance_to_city,
    distance_to_sea,
    distance_to_lake,
    images = [],
    listing_type = 'sale',
    property_type_detail,
    seller_type,
    property_type,
    status,
    created_at,
    verified = false,
    features = []
  } = property;

  const displayTitle = getTranslatedTitle(property, lang);
  const displayDescription = getTranslatedDescription(property, description);

  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(images[0] || "/placeholder.svg");

  // Function to handle external images with proxy to avoid CORS issues
  const getImageUrl = (url: string) => {
    if (!url || url === "/placeholder.svg") {
      return "/placeholder.svg";
    }

    // If it's a Supabase Storage URL, use it directly (no proxy needed)
    if (url.includes('supabase.co/storage')) {
      return url;
    }

    // If it's an external URL, use a proxy service
    if (url.includes('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      // Using Weserv.nl as a proxy service for external images
      // This handles CORS and resizes images for better performance
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=300&fit=cover&q=80`;
    }

    return url;
  };

  const location = `${city || 'Unknown'}, ${country || 'Unknown'}`;
  const type = (listing_type || 'sale') as "sale" | "rent";

  const formatDistance = (meters: number | null) => {
    if (!meters) return null;
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Save scroll position before navigating to property detail
      sessionStorage.setItem('propertiesScrollPosition', window.scrollY.toString());
      // Navigate to the shareable property link with language prefix
      navigate(`/${lang}/properties/${property.id}`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/${lang}/properties/${property.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: shareUrl,
        });
      } catch (error) {
        // Error sharing - user can manually copy URL
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(`Link copied to clipboard: ${shareUrl}`);
      } catch (error) {
        // Fallback: show the URL
        alert(`Share this link: ${shareUrl}`);
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
    // Try next image if available
    const currentIndex = images.findIndex(img => img === currentImageSrc);
    if (currentIndex < images.length - 1) {
      setCurrentImageSrc(images[currentIndex + 1]);
      setImageError(false);
    } else {
      // All images failed, show placeholder
      setCurrentImageSrc("/placeholder.svg");
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border hover:shadow-elegant transition-smooth bg-card"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <img
          src={getImageUrl(currentImageSrc)}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary" className="capitalize bg-primary text-primary-foreground border-0">
            {type === "sale" ? "For Sale" : "For Rent"}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-background/90 hover:bg-background/80 text-foreground border-border"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 left-4">
          <Badge variant="default" className="bg-background/95 text-foreground border border-border text-lg font-bold px-3 py-1">
            {formatPrice(price)}
            {type === "rent" && <span className="text-sm font-normal ml-1">{t("time_month")}</span>}
          </Badge>
        </div>

        {/* Image Error Indicator */}
        {imageError && images.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="bg-red-500/90 text-white border-0 text-xs px-2 py-1">
              {t("image_unavailable")}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
          {displayTitle}
        </h3>

        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <p className="text-sm line-clamp-1">{location}</p>
        </div>

        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
          {displayDescription}
        </p>

        <div className="flex items-center gap-4 mt-4 text-sm">
          {bedrooms > 0 && (
            <div className="flex items-center text-muted-foreground">
              <span className="mr-1">{bedrooms}</span>
              <span>{t("property_bedrooms", "Bedrooms")}</span>
            </div>
          )}
          
          {bathrooms > 0 && (
            <div className="flex items-center text-muted-foreground">
              <span className="mr-1">{bathrooms}</span>
              <span>{t("property_bathrooms", "Bathrooms")}</span>
            </div>
          )}
          
          {area > 0 && (
            <div className="flex items-center text-muted-foreground">
              <span className="mr-1">{area}</span>
              <span>{t("property_area", "m²")}</span>
            </div>
          )}
        </div>

        {/* Speak to Advisor CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${lang}/about`);
            }}
          >
            {t("property_speak_advisor", "Speak to Advisor")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
