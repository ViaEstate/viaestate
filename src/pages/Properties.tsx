import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Euro, Filter } from 'lucide-react'
import PropertyCard from '@/components/PropertyCard'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext';

type Property = Tables<"properties">;

const Properties = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLanguage();
  
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [countryImages, setCountryImages] = useState<{ [key: string]: string }>({})
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    status: 'published'
  })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      country: searchParams.get('country') || '',
      city: searchParams.get('city') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      bedrooms: searchParams.get('bedrooms') || '',
      bathrooms: searchParams.get('bathrooms') || '',
      propertyType: searchParams.get('propertyType') || '',
      status: 'published'
    };
    const hasUrlFilters = Object.values(urlFilters).some(value => value !== '' && value !== 'published');

    if (hasUrlFilters) {
      setFilters(urlFilters);
      if (urlFilters.country) {
        setSelectedCountry(urlFilters.country);
      }
      sessionStorage.removeItem('returningFromDetail');
    } else {
      const returningFromDetail = sessionStorage.getItem('returningFromDetail') === 'true';
      if (returningFromDetail) {
        const savedFilters = JSON.parse(sessionStorage.getItem('propertyFilters') || '{}');
        const savedCountry = sessionStorage.getItem('selectedCountry') || '';
        const hasSavedFilters = Object.values(savedFilters).some(value => value !== '' && value !== 'published');
        if (hasSavedFilters) {
          setFilters(savedFilters);
          if (savedCountry) {
            setSelectedCountry(savedCountry);
          }
        }
        sessionStorage.removeItem('returningFromDetail');
      }
    }
  }, [searchParams])

  useEffect(() => {
    fetchCountries();
  }, [])

  useEffect(() => {
    fetchProperties();
  }, [filters])

  useEffect(() => {
    sessionStorage.setItem('propertyFilters', JSON.stringify(filters));
    sessionStorage.setItem('selectedCountry', selectedCountry || '');
  }, [filters, selectedCountry])

  // Restore scroll position when returning from property detail
  useEffect(() => {
    const returningFromDetail = sessionStorage.getItem('returningFromDetail') === 'true';
    if (returningFromDetail) {
      const savedScrollPosition = sessionStorage.getItem('propertiesScrollPosition');
      if (savedScrollPosition) {
        // Small delay to ensure the page is fully rendered
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
          sessionStorage.removeItem('propertiesScrollPosition');
        }, 100);
      }
    }
  }, []);

  const fetchProperties = async () => {
    try {
      const selectFields = `
        id, title, description, 
        english_description, english_title,
        swedish_title, swedish_description, 
        norwegian_title, norwegian_description,
        danish_title, danish_description, 
        finnish_title, finnish_description,
        croatian_title, croatian_description,
        german_title, german_description,
        french_title, french_description,
        spanish_title, spanish_description,
        italian_title, italian_description,
        country, city, price, property_type,
        property_type_detail, bedrooms, bathrooms, area, plot_area,
        distance_to_city, distance_to_sea, distance_to_lake, listing_type,
        images, videos, seller_id, seller_type, status, package_id,
        rejection_reason, created_at, updated_at, region, address,
        lat, lon, features, distance_to_beach_m, views, verified, currency
      `

      let query = supabase
        .from('properties')
        .select(selectFields)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (filters.country && filters.country.trim() !== '') {
        query = query.ilike('country', `%${filters.country}%`)
      }

      if (filters.city && filters.city.trim() !== '') {
        query = query.ilike('city', `%${filters.city}%`)
      }

      if (filters.search && filters.search.trim() !== '') {
        // Search in title and description fields based on current language
        let searchFields = `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,english_description.ilike.%${filters.search}%`
        
        switch(lang) {
          case 'sv':
            searchFields += `,swedish_title.ilike.%${filters.search}%,swedish_description.ilike.%${filters.search}%`
            break
          case 'no':
            searchFields += `,norwegian_title.ilike.%${filters.search}%,norwegian_description.ilike.%${filters.search}%`
            break
          case 'da':
            searchFields += `,danish_title.ilike.%${filters.search}%,danish_description.ilike.%${filters.search}%`
            break
          case 'fi':
            searchFields += `,finnish_title.ilike.%${filters.search}%,finnish_description.ilike.%${filters.search}%`
            break
          case 'de':
            searchFields += `,german_title.ilike.%${filters.search}%,german_description.ilike.%${filters.search}%`
            break
          case 'fr':
            searchFields += `,french_title.ilike.%${filters.search}%,french_description.ilike.%${filters.search}%`
            break
          case 'es':
            searchFields += `,spanish_title.ilike.%${filters.search}%,spanish_description.ilike.%${filters.search}%`
            break
          case 'it':
            searchFields += `,italian_title.ilike.%${filters.search}%,italian_description.ilike.%${filters.search}%`
            break
          case 'hr':
            searchFields += `,croatian_title.ilike.%${filters.search}%,croatian_description.ilike.%${filters.search}%`
            break
        }
        
        query = query.or(searchFields)
      }

      if (filters.minPrice && filters.minPrice.trim() !== '' && !isNaN(parseInt(filters.minPrice))) {
        query = query.gte('price', parseInt(filters.minPrice))
      }

      if (filters.maxPrice && filters.maxPrice.trim() !== '' && !isNaN(parseInt(filters.maxPrice))) {
        query = query.lte('price', parseInt(filters.maxPrice))
      }

      if (filters.bedrooms && filters.bedrooms.trim() !== '' && !isNaN(parseInt(filters.bedrooms))) {
        query = query.gte('bedrooms', parseInt(filters.bedrooms))
      }

      if (filters.bathrooms && filters.bathrooms.trim() !== '' && !isNaN(parseInt(filters.bathrooms))) {
        query = query.gte('bathrooms', parseInt(filters.bathrooms))
      }

      if (filters.propertyType && filters.propertyType.trim() !== '') {
        query = query.ilike('property_type', `%${filters.propertyType}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching properties:', error)
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          const basicQuery = supabase
            .from('properties')
            .select('id, title, description, english_description, country, city, price, images, seller_type, status, created_at')
            .eq('status', 'published')
            .order('created_at', { ascending: false })

          const { data: basicData, error: basicError } = await basicQuery
          if (basicError) throw basicError
          setProperties((basicData as Property[]) || [])
        } else {
          throw error
        }
      } else {
        setProperties((data as Property[]) || [])
      }
    } catch (error: any) {
      console.error('Error in fetchProperties:', error)
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("properties.error_loading", "Failed to load properties. Please try again."),
        variant: "destructive"
      })
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('country')
        .eq('status', 'published')
        .not('country', 'is', null)

      if (error) throw error

      const uniqueCountries = [...new Set(data.map(p => p.country).filter(Boolean))].sort()
      setAvailableCountries(uniqueCountries)

      const images: { [key: string]: string } = {}
      for (const country of uniqueCountries) {
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('images')
          .eq('status', 'published')
          .ilike('country', `%${country}%`)
          .limit(1)

        if (!propError && propData && propData[0] && propData[0].images && propData[0].images.length > 0) {
          images[country] = propData[0].images[0]
        }
      }
      setCountryImages(images)
    } catch (error: any) {
      console.error('Error fetching countries:', error)
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("properties.error_countries", "Failed to load countries."),
        variant: "destructive"
      })
    }
  }

  const handleAddProperty = async () => {
    const { data, error } = await supabase
      .from("properties")
      .insert([
        { title: "Villa i Spanien", price: 200000 }
      ]);
    if (error) {
      toast({
        title: t("common.error", "Error"),
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: t("properties.property_added", "Property added"),
        description: t("properties.property_success", "Property successfully added!"),
        variant: "default"
      });
      fetchProperties();
    }
  };

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const noFiltersActive = !filters.search && !filters.country && !filters.city && !filters.minPrice && !filters.maxPrice

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {selectedCountry === null && !filters.country ? (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{t("properties.select_country", "Select a Country")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {availableCountries.map(country => (
                <Card key={country} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedCountry(country); setFilters(prev => ({...prev, country: country})) }}>
                  {countryImages[country] && (
                    <img src={countryImages[country]} alt={country} className="w-full h-32 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold">{country}</h3>
                  </CardContent>
                </Card>
              ))}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedCountry('all'); setFilters(prev => ({...prev, country: ''})) }}>
                <img src="https://storage0.dms.mpinteractiv.ro/media/401/341/5528/15974131/5/europa.jpg" alt="Europe Map" className="w-full h-32 object-cover rounded-t-lg" />
                <CardContent className="p-6 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-lg font-semibold">{t("properties.show_all", "Show All")}</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("properties.search_filter", "Search & Filter Properties")}
            </CardTitle>
            <CardDescription>
              {t("properties.search_filter_desc", "Find your perfect property with our advanced search tools")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="xl:col-span-2">
                <Input
                  placeholder={t("properties.search_placeholder", "Search properties...")}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full"
                />
              </div>
              <Input
                placeholder={t("properties.country_placeholder", "Country (e.g., Spain, France, Italy)")}
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              />
              <Input
                placeholder={t("properties.city_placeholder", "City")}
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
              <Input
                placeholder={t("properties.min_price_placeholder", "Min Price (€)")}
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <Input
                placeholder={t("properties.max_price_placeholder", "Max Price (€)")}
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                filters={filters}
              />
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              {noFiltersActive ? (
                <>
                  <h3 className="text-lg sm:text-xl font-semibold">{t("properties.no_properties", "No properties available yet")}</h3>
                  <p className="text-muted-foreground">{t("properties.no_properties_desc", "Coming soon. Be the first to list a property or check back shortly.")}</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button variant="outline" onClick={() => navigate(`/${lang}`)}>{t("properties.back_home", "Back to Home")}</Button>
                    <Button onClick={() => navigate(`/${lang}/list-property`)}>{t("properties.list_your_property", "List Your Property")}</Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-semibold">{t("properties.no_match", "No properties match your filters")}</h3>
                  <p className="text-muted-foreground">{t("properties.no_match_desc", "Try clearing filters or adjusting your search.")}</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button variant="outline" onClick={() => setFilters({ search: '', country: '', city: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', propertyType: '', status: 'published' })}>{t("properties.clear_filters", "Clear Filters")}</Button>
                    <Button onClick={() => navigate(`/${lang}`)}>{t("properties.back_home", "Back to Home")}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
          </>
        )}
      </main>
    </div>
  )
}

export default Properties
