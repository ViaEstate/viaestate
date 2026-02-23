import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FilterOptions {
  property_types: string[];
  features: string[];
  min_price: number;
  max_price: number;
  min_area: number;
  max_area: number;
  bedrooms: number[];
  bathrooms: number[];
  listing_type: string;
  verified_only: boolean;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

const FilterPanel = ({ filters, onFiltersChange, onReset }: FilterPanelProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const propertyTypeOptions = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'commercial', label: 'Commercial' }
  ];

  const featureOptions = [
    { value: 'pool', label: 'Swimming Pool' },
    { value: 'garden', label: 'Garden' },
    { value: 'garage', label: 'Garage' },
    { value: 'terrace', label: 'Terrace' },
    { value: 'sea_view', label: 'Sea View' },
    { value: 'mountain_view', label: 'Mountain View' },
    { value: 'air_conditioning', label: 'Air Conditioning' },
    { value: 'heating', label: 'Heating' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'parking', label: 'Parking' },
    { value: 'elevator', label: 'Elevator' },
    { value: 'balcony', label: 'Balcony' }
  ];

  const updateFilter = (key: keyof FilterOptions, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const togglePropertyType = (type: string) => {
    const current = filters.property_types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('property_types', updated);
  };

  const toggleFeature = (feature: string) => {
    const current = filters.features || [];
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    updateFilter('features', updated);
  };

  const activeFiltersCount = [
    filters.property_types?.length || 0,
    filters.features?.length || 0,
    filters.min_price > 0 ? 1 : 0,
    filters.max_price > 0 ? 1 : 0,
    filters.min_area > 0 ? 1 : 0,
    filters.max_area > 0 ? 1 : 0,
    filters.bedrooms?.length || 0,
    filters.bathrooms?.length || 0,
    filters.verified_only ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        {t("filter.filters", "Filters")}
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 left-0 z-50 w-96 max-h-96 overflow-y-auto shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("filter.filters", "Filters")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t("filter.reset", "Reset")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Property Types */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.property_type", "Property Type")}</h4>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypeOptions.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.property_types?.includes(type.value) || false}
                      onCheckedChange={() => togglePropertyType(type.value)}
                    />
                    <label htmlFor={type.value} className="text-sm">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.price_range", "Price Range")} (€)</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t("filter.min", "Min")}
                    className="flex-1 px-3 py-1 border rounded text-sm"
                    value={filters.min_price || ''}
                    onChange={(e) => updateFilter('min_price', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    placeholder={t("filter.max", "Max")}
                    className="flex-1 px-3 py-1 border rounded text-sm"
                    value={filters.max_price || ''}
                    onChange={(e) => updateFilter('max_price', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Area Range */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.area", "Area")} (m²)</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t("filter.min", "Min")}
                    className="flex-1 px-3 py-1 border rounded text-sm"
                    value={filters.min_area || ''}
                    onChange={(e) => updateFilter('min_area', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    placeholder={t("filter.max", "Max")}
                    className="flex-1 px-3 py-1 border rounded text-sm"
                    value={filters.max_area || ''}
                    onChange={(e) => updateFilter('max_area', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.bedrooms", "Bedrooms")}</h4>
              <Select
                value={filters.bedrooms?.[0]?.toString() || ""}
                onValueChange={(value) => updateFilter('bedrooms', value ? [parseInt(value)] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filter.any", "Any")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("filter.any", "Any")}</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bathrooms */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.bathrooms", "Bathrooms")}</h4>
              <Select
                value={filters.bathrooms?.[0]?.toString() || ""}
                onValueChange={(value) => updateFilter('bathrooms', value ? [parseInt(value)] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("filter.any", "Any")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("filter.any", "Any")}</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-medium mb-3">{t("filter.features", "Features")}</h4>
              <div className="grid grid-cols-2 gap-2">
                {featureOptions.map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.value}
                      checked={filters.features?.includes(feature.value) || false}
                      onCheckedChange={() => toggleFeature(feature.value)}
                    />
                    <label htmlFor={feature.value} className="text-sm">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.verified_only || false}
                  onCheckedChange={(checked) => updateFilter('verified_only', checked)}
                />
                <label htmlFor="verified" className="text-sm font-medium">
                  {t("filter.verified_only", "Verified properties only")}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilterPanel;