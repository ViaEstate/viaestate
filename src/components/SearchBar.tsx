import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Home, Euro } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchFilters {
  country?: string;
  region?: string;
  city?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

const SearchBar = ({ onSearch, initialFilters = {} }: SearchBarProps) => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load regions when country changes
  useEffect(() => {
    if (filters.country) {
      loadRegions(filters.country);
    } else {
      setRegions([]);
      setCities([]);
    }
  }, [filters.country]);

  // Load cities when region changes
  useEffect(() => {
    if (filters.country && filters.region) {
      loadCities(filters.country, filters.region);
    } else {
      setCities([]);
    }
  }, [filters.country, filters.region]);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries_with_counts')
        .select('*')
        .order('count', { ascending: false });

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadRegions = async (country: string) => {
    try {
      const { data, error } = await supabase
        .from('regions_by_country')
        .select('region')
        .eq('country', country);

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadCities = async (country: string, region: string) => {
    try {
      const { data, error } = await supabase
        .from('cities_by_location')
        .select('city')
        .eq('country', country)
        .eq('region', region)
        .limit(50);

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("search.country", "Country")}
            </label>
            <Select value={filters.country || ""} onValueChange={(value) => updateFilter('country', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("search.select_country", "Select country")} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.country} value={country.country}>
                    {country.country} ({country.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("search.region", "Region")}</label>
            <Select
              value={filters.region || ""}
              onValueChange={(value) => updateFilter('region', value)}
              disabled={!filters.country}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("search.select_region", "Select region")} />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.region} value={region.region}>
                    {region.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("search.city", "City")}</label>
            <Select
              value={filters.city || ""}
              onValueChange={(value) => updateFilter('city', value)}
              disabled={!filters.region}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("search.select_city", "Select city")} />
              </SelectTrigger>
              <SelectContent>
                {cities.slice(0, 50).map((city) => (
                  <SelectItem key={city.city} value={city.city}>
                    {city.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t("search.property_type", "Property Type")}
            </label>
            <Select value={filters.property_type || ""} onValueChange={(value) => updateFilter('property_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("search.any_type", "Any type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Min Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              {t("search.min_price", "Min Price")}
            </label>
            <Input
              type="number"
              placeholder={t("search.min_price_placeholder", "Min price")}
              value={filters.min_price || ""}
              onChange={(e) => updateFilter('min_price', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Max Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              {t("search.max_price", "Max Price")}
            </label>
            <Input
              type="number"
              placeholder={t("search.max_price_placeholder", "Max price")}
              value={filters.max_price || ""}
              onChange={(e) => updateFilter('max_price', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("search.bedrooms", "Bedrooms")}</label>
            <Select value={filters.bedrooms?.toString() || ""} onValueChange={(value) => updateFilter('bedrooms', value ? parseInt(value) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder={t("search.any", "Any")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleSearch} disabled={loading} size="lg" className="px-8">
            <Search className="h-4 w-4 mr-2" />
            {loading ? t("search.searching", "Searching...") : t("search.search_properties", "Search Properties")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchBar;