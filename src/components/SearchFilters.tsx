import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, DollarSign, Home, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface SearchFiltersProps {
  onSearch?: (filters: SearchFilter) => void;
}

interface SearchFilter {
  location: string;
  priceMin: number;
  priceMax: number;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
}

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilter>({
    location: "",
    priceMin: 0,
    priceMax: 0,
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch?.(filters);
  };

  return (
    <Card className="bg-card/95 backdrop-blur-md border-border shadow-elegant">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Primary Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="City, Country, or Area"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Property Type */}
            <Select 
              value={filters.propertyType} 
              onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
            >
              <SelectTrigger>
                <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Max Price"
                type="number"
                value={filters.priceMax || ""}
                onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })}
                className="pl-10"
              />
            </div>

            {/* Search Button */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="hero" className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {/* Min Price */}
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Min Price"
                  type="number"
                  value={filters.priceMin || ""}
                  onChange={(e) => setFilters({ ...filters, priceMin: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>

              {/* Bedrooms */}
              <Select 
                value={filters.bedrooms} 
                onValueChange={(value) => setFilters({ ...filters, bedrooms: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Bedroom</SelectItem>
                  <SelectItem value="2">2+ Bedrooms</SelectItem>
                  <SelectItem value="3">3+ Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>

              {/* Bathrooms */}
              <Select 
                value={filters.bathrooms} 
                onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Bathroom</SelectItem>
                  <SelectItem value="2">2+ Bathrooms</SelectItem>
                  <SelectItem value="3">3+ Bathrooms</SelectItem>
                  <SelectItem value="4">4+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  location: "",
                  priceMin: 0,
                  priceMax: 0,
                  propertyType: "",
                  bedrooms: "",
                  bathrooms: "",
                })}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;