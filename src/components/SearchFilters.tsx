import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Euro, Home, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  
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
                placeholder={t("search.placeholder_country", "Country (e.g., Spain, France)")}
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
                <SelectValue placeholder={t("search.property_type", "Property Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">{t("property_types.house", "House")}</SelectItem>
                <SelectItem value="apartment">{t("property_types.apartment", "Apartment")}</SelectItem>
                <SelectItem value="condo">{t("property_types.condo", "Condo")}</SelectItem>
                <SelectItem value="villa">{t("property_types.villa", "Villa")}</SelectItem>
                <SelectItem value="land">{t("property_types.land", "Land")}</SelectItem>
                <SelectItem value="commercial">{t("property_types.commercial", "Commercial")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range */}
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search.max_price", "Max Price")}
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
                {t("search.search", "Search")}
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
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search.min_price", "Min Price")}
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
                  <SelectValue placeholder={t("search.bedrooms", "Bedrooms")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>

              {/* Bathrooms */}
              <Select 
                value={filters.bathrooms} 
                onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("search.bathrooms", "Bathrooms")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
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
                {t("search.clear_all", "Clear All")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
