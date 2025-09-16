import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Heart, Eye } from "lucide-react";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  type: "sale" | "rent";
  featured?: boolean;
}

const PropertyCard = ({
  title,
  price,
  location,
  bedrooms,
  bathrooms,
  area,
  images,
  type,
  featured = false,
}: PropertyCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="group cursor-pointer overflow-hidden border-border hover:shadow-elegant transition-smooth bg-card">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={images[0] || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {featured && (
            <Badge variant="default" className="bg-gradient-primary text-primary-foreground border-0">
              Featured
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize">
            For {type}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
          <Button size="sm" variant="secondary" className="w-9 h-9 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="w-9 h-9 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 left-4">
          <Badge variant="default" className="bg-background/90 text-foreground border-border text-lg font-bold px-3 py-1">
            {formatPrice(price)}
            {type === "rent" && <span className="text-sm font-normal">/month</span>}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
          {title}
        </h3>
        
        <div className="flex items-center text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{area.toLocaleString()} sq ft</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;