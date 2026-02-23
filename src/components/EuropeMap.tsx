import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Use common countries - will be updated dynamically if DB works
const DEFAULT_COUNTRIES = ['Spain', 'Sweden', 'Germany', 'France', 'Italy', 'Portugal', 'Greece', 'Finland', 'Norway', 'Netherlands', 'Denmark', 'Belgium', 'Austria', 'Switzerland'];

// Country code to name mapping
const COUNTRY_CODE_MAP: Record<string, string> = {
  'AL': 'Albania',
  'AD': 'Andorra',
  'AM': 'Armenia',
  'AT': 'Austria',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BA': 'Bosnia and Herzegovina',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'FI': 'Finland',
  'FR': 'France',
  'DE': 'Germany',
  'GR': 'Greece',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IE': 'Ireland',
  'IT': 'Italy',
  'XK': 'Kosovo',
  'LV': 'Latvia',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MK': 'Macedonia',
  'MT': 'Malta',
  'MD': 'Moldova',
  'MC': 'Monaco',
  'ME': 'Montenegro',
  'NL': 'Netherlands',
  'NO': 'Norway',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'RS': 'Serbia',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'ES': 'Spain',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'TR': 'Turkey',
  'UA': 'Ukraine',
  'GB': 'United Kingdom',
  'VA': 'Vatican City'
};

const EuropeMap = () => {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [availableCountries, setAvailableCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Load the SVG file
  useEffect(() => {
    fetch('/europe-map-new.svg')
      .then(response => response.text())
      .then(setSvgContent)
      .catch(err => console.error('Failed to load SVG:', err));
  }, []);

  // Try to fetch countries from database
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('country')
          .limit(500);

        if (!error && data && data.length > 0) {
          const uniqueCountries = [...new Set(data.map(p => p.country).filter(Boolean))];
          if (uniqueCountries.length > 0) {
            setAvailableCountries(uniqueCountries);
          }
        }
      } catch (error) {
        console.log('Using default countries');
      }
    };

    fetchCountries();
  }, []);

  // Color palette matching website's gold theme
  const colors = {
    sea: '#FFFFFF',
    seaGradient: '#FFFFFF',
    available: '#D97706',      // Gold (primary color from website)
    availableStroke: '#B45309',
    unavailable: '#E5E7EB',   // Light gray for unavailable
    unavailableStroke: '#9CA3AF',
    highlight: '#D97706',    // Gold (primary color from website)
    highlightStroke: '#B45309',
  };

  const isHighlighted = (country: string) => availableCountries.includes(country);

  const handleCountryClick = (countryName: string) => {
    // Track country click
    trackCountryClick(countryName, availableCountries.includes(countryName) ? 'view' : 'inquiry');
    
    if (availableCountries.includes(countryName)) {
      navigate(`/${lang}/properties?country=${encodeURIComponent(countryName)}`);
    } else {
      // Show inquiry modal for unavailable countries
      setSelectedCountry(countryName);
      setInquiryModalOpen(true);
    }
  };

  // Track country click in database
  const trackCountryClick = async (countryName: string, clickType: 'view' | 'inquiry') => {
    try {
      await supabase
        .from('country_clicks')
        .insert({
          country: countryName,
          click_type: clickType,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking country click:', error);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t("common.error", "Error"),
        description: t("auth.fill_required", "Please fill in all required fields."),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Insert lead with null property_id for country inquiry
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: `${formData.message}\n\nCountry Request: ${selectedCountry}`,
          property_id: null,
          inquiry_type: 'general'
        });

      if (leadError) throw leadError;

      toast({
        title: t("inquiry.success"),
        description: t("inquiry.success_desc", "Thank you for your inquiry. We will contact you soon.")
      });

      setFormData({ name: '', email: '', phone: '', message: '' });
      setInquiryModalOpen(false);
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: t("common.error"),
        description: t("inquiry.error"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update SVG styling after content loads
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const updateSvgStyling = () => {
      const container = svgContainerRef.current;
      if (!container) return;

      const paths = container.querySelectorAll('path[id]');
      
      paths.forEach((path) => {
        const pathElement = path as SVGPathElement;
        const countryId = pathElement.getAttribute('id');
        const countryName = countryId ? COUNTRY_CODE_MAP[countryId] : pathElement.getAttribute('name');
        
        if (!countryName) return;
        
        const isAvailable = availableCountries.includes(countryName);
        
        // Set fill and stroke colors
        pathElement.setAttribute('fill', isAvailable ? colors.available : colors.unavailable);
        pathElement.setAttribute('stroke', isAvailable ? colors.availableStroke : colors.unavailableStroke);
        pathElement.setAttribute('stroke-width', '0.5');
        
        // Set cursor and opacity
        if (isAvailable) {
          pathElement.style.cursor = 'pointer';
          pathElement.style.opacity = '1';
          pathElement.classList.add('hover:opacity-80');
        } else {
          pathElement.style.cursor = 'not-allowed';
          pathElement.style.opacity = '0.4';
        }
        
        // Add click handler
        pathElement.onclick = () => handleCountryClick(countryName);
        
        // Add hover handlers
        pathElement.onmouseenter = (e) => {
          setHoveredCountry(countryName);
          const rect = container.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };
        pathElement.onmousemove = (e) => {
          const rect = container.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };
        pathElement.onmouseleave = () => setHoveredCountry(null);
        
        // Add title for tooltip using setAttribute
        pathElement.setAttribute('title', countryName + (isAvailable ? '' : ' (No properties)'));
        
        // Also add data attribute for easier debugging
        pathElement.setAttribute('data-country', countryName);
      });
      
      // Hide small territory circles
      const circles = container.querySelectorAll('circle[id]');
      circles.forEach((circle) => {
        (circle as SVGElement).style.display = 'none';
      });
    };

    // Small delay to ensure SVG is rendered
    const timer = setTimeout(updateSvgStyling, 100);
    return () => clearTimeout(timer);
  }, [svgContent, availableCountries, hoveredCountry]);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-800">
            {t("map.title", "Explore Our Properties")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("map.subtitle", "Click on a highlighted country to view available properties")}
          </p>
        </div>

        <div className="relative w-full max-w-5xl mx-auto">
          <div 
            ref={svgContainerRef}
            className="w-full h-auto"
            style={{ 
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))',
              background: '#FFFFFF',
              borderRadius: '8px'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          
          {/* Country tooltip following mouse */}
          {hoveredCountry && (
            <div 
              className="absolute bg-slate-800 text-white px-3 py-1.5 rounded shadow-lg text-sm font-medium z-10 pointer-events-none"
              style={{ 
                left: mousePos.x + 15, 
                top: mousePos.y - 35,
                transform: 'translateX(-50%)'
              }}
            >
              {hoveredCountry}
              {!availableCountries.includes(hoveredCountry) && (
                <span className="ml-1.5 text-slate-400 text-xs">(No properties)</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: colors.available }}
            />
            <span className="text-sm text-slate-600">
              {t("map.available", "Properties available")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded opacity-40" 
              style={{ backgroundColor: colors.unavailable }}
            />
            <span className="text-sm text-slate-600">
              {t("map.noProperties", "No properties")}
            </span>
          </div>
        </div>
        
        {/* Country Inquiry Modal */}
        <Dialog open={inquiryModalOpen} onOpenChange={setInquiryModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("map.coming_soon", "Coming Soon!")}
              </DialogTitle>
            </DialogHeader>
            
            <p className="text-sm text-muted-foreground mb-4">
              {t("map.inquiry_message", `We don't have any properties in ${selectedCountry} yet. Send us a request and we'll see if we can help you!`)}
            </p>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inquiry-name">{t("inquiry.name")} *</Label>
                <Input
                  id="inquiry-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t("inquiry.name_placeholder", "Enter your full name")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-email">{t("inquiry.email")} *</Label>
                <Input
                  id="inquiry-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t("inquiry.email_placeholder", "Enter your email address")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-phone">{t("inquiry.phone")} ({t("common.optional", "Optional")})</Label>
                <Input
                  id="inquiry-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("inquiry.phone_placeholder", "Enter your phone number")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-message">{t("inquiry.message")} *</Label>
                <Textarea
                  id="inquiry-message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={t("inquiry.message_placeholder", "Tell us about what you're looking for...")}
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setInquiryModalOpen(false)} className="flex-1">
                  {t("inquiry.cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("inquiry.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t("inquiry.send")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default EuropeMap;
