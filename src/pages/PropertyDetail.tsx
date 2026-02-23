import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, MapPin, Euro, MessageCircle, Send, User, Calendar, LogIn, Home, Waves, Mountain, Ruler, Bath, ArrowLeft, ClipboardCheck } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import InquiryModal from "@/components/InquiryModal";
import { Tables } from '@/integrations/supabase/types';
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslatedTitle, getTranslatedDescription } from "@/utils/translation";

interface ForumPost {
  id: string;
  content: string;
  title: string;
  user_id?: string;
  created_at: string;
  status: string;
  profiles?: {
    full_name: string;
  };
}

const PropertyDetail = () => {
  const { lang, id } = useParams<{ lang: string; id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [property, setProperty] = useState<Tables<'properties'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [currentInquiryType, setCurrentInquiryType] = useState<'general' | 'inspection'>('general');

  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id, title, description, 
            english_description, english_title,
            swedish_description, swedish_title, 
            norwegian_description, norwegian_title,
            danish_description, danish_title, 
            finnish_description, finnish_title,
            croatian_description, croatian_title,
            german_description, german_title,
            french_description, french_title,
            spanish_description, spanish_title,
            italian_description, italian_title,
            country, city, price, property_type,
            property_type_detail, bedrooms, bathrooms, area, plot_area,
            distance_to_city, distance_to_sea, distance_to_lake, listing_type,
            images, videos, seller_id, seller_type, status, package_id,
            rejection_reason, created_at, updated_at, region, address,
            lat, lon, features, distance_to_beach_m, views, verified, currency
          `)
          .eq('id', id)
          .eq('status', 'published')
          .single();

        if (error) throw error;
        if (data) {
          setProperty(data as Tables<'properties'>);
        } else {
          toast({
            title: t("properties.not_found", "Property not found"),
            description: t("properties.not_found_desc", "The property you're looking for doesn't exist or is no longer available."),
            variant: "destructive"
          });
          navigate(`/${lang}/properties`);
        }
      } catch (error: any) {
        console.error('Error fetching property:', error);
        toast({
          title: t("common.error", "Error"),
          description: t("properties.error_loading", "Failed to load property details."),
          variant: "destructive"
        });
        navigate(`/${lang}/properties`);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate, toast]);

  const displayTitle = property ? getTranslatedTitle(property, lang) : "";
  const displayDescription = property ? getTranslatedDescription(property, lang) : "";

  // Fetch forum posts for this property
  const fetchForumPosts = useCallback(async () => {
    if (!property?.id) return;

    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('property_id', property.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForumPosts(data || []);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
    }
  }, [property?.id]);

  useEffect(() => {
    if (property?.id) {
      fetchForumPosts();
    }
  }, [property?.id, fetchForumPosts]);

  const handleCreatePost = async () => {
    if (!property?.id || (!newPostContent.trim()) || posting) return;

    if (!user) {
      toast({
        title: t("auth.login_required", "Login Required"),
        description: t("auth.login_required_desc", "Please log in to post questions."),
        variant: "destructive"
      });
      return;
    }

    setPosting(true);

    try {
      const postData = {
        property_id: property.id,
        user_id: user.id,
        content: newPostContent.trim(),
        status: 'pending',
        title: 'Property Question'
      };

      const { error } = await supabase
        .from('forum_posts')
        .insert([postData]);

      if (error) throw error;

      toast({
        title: t("forum.post_submitted", "Post Submitted"),
        description: t("forum.post_submitted_desc", "Your post has been submitted for review and will appear shortly.")
      });

      // Clear form
      setNewPostContent("");

      // Refresh posts
      fetchForumPosts();
    } catch (error: unknown) {
      console.error('Error creating post:', error);
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : t("forum.post_error", "Failed to create post. Please try again."),
        variant: "destructive"
      });
    } finally {
      setPosting(false);
    }
  };

  const handleSendInquiry = () => {
    setCurrentInquiryType('general');
    setInquiryModalOpen(true);
  };

  const handleBookInspection = () => {
    setCurrentInquiryType('inspection');
    setInquiryModalOpen(true);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  const nextImage = () => {
    if (property.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDescription = (description: string) => {
    // Split description into sentences and add line breaks for better readability
    return description.split('. ').map((sentence, index) => (
      <span key={index}>
        {sentence.trim()}{sentence.trim() && '.'}
        {index < description.split('. ').length - 1 && <br />}
      </span>
    ));
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return 'N/A';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.setItem('returningFromDetail', 'true');
            const savedFilters = JSON.parse(sessionStorage.getItem('propertyFilters') || '{}');
            const queryString = new URLSearchParams(savedFilters).toString();
            navigate(`/${lang}/properties${queryString ? '?' + queryString : ''}`);
          }}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("properties.back_to_properties", "Back to Properties")}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Images and Property Details */}
          <div className="space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-white">
              {property.images && property.images.length > 0 ? (
                <>
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t("properties.no_images", "No images available")}
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {property.images && property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {property.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Property Details */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-2">
                  <Home className="h-6 w-6 text-primary" />
                  {t("properties.property_details", "Property Details")}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Bedrooms & Bathrooms Row - Symmetrical Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Home className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">{t("properties.bedrooms", "Bedrooms")}</p>
                      <p className="text-2xl font-bold text-slate-800">{property.bedrooms || 'N/A'}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Bath className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">{t("properties.bathrooms", "Bathrooms")}</p>
                      <p className="text-2xl font-bold text-slate-800">{property.bathrooms || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Area Information */}
                  {(property.area || property.plot_area) && (
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 justify-center">
                        <Ruler className="h-4 w-4 text-primary" />
                        {t("properties.area_info", "Area Information")}
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{t("properties.living_area", "Living Area")}</p>
                          <p className="text-lg font-bold text-slate-800">{property.area || 'N/A'} {property.area ? 'm²' : ''}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Mountain className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{t("properties.plot_area", "Plot Area")}</p>
                          <p className="text-lg font-bold text-slate-800">{property.plot_area || 'N/A'} {property.plot_area ? 'm²' : ''}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Distance Information */}
                  {(property.distance_to_city || property.distance_to_sea || property.distance_to_lake) && (
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t("properties.distance_info", "Distance Information")}
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{t("properties.city_center", "City Center")}</p>
                          <p className="text-sm font-bold text-slate-800">{property.distance_to_city ? formatDistance(property.distance_to_city) : 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Waves className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{t("properties.to_sea", "To Sea")}</p>
                          <p className="text-sm font-bold text-slate-800">{property.distance_to_sea ? formatDistance(property.distance_to_sea) : 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Mountain className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{t("properties.to_lake", "To Lake")}</p>
                          <p className="text-sm font-bold text-slate-800">{property.distance_to_lake ? formatDistance(property.distance_to_lake) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Property Description, Agent Info, and Actions */}
          <div className="space-y-6">
            {/* Property Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{displayTitle}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span className="text-base">{property.city}, {property.country}</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <Euro className="h-5 w-5 text-primary" />
                <span className="text-4xl font-bold">{formatPrice(property.price)}</span>
                <Badge variant="secondary" className="ml-2">{property.status}</Badge>
              </div>
            </div>

            {/* Property Description */}
            <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed text-lg font-medium">
                    {formatDescription(displayDescription || '')}
                  </p>
            </div>

            {/* Agent Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  {t("properties.agent_info", "Agent Information")}
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><span className="font-medium">{t("properties.seller_type", "Type:")}</span> {property.seller_type}</p>
                  <p><span className="font-medium">{t("properties.listed_date", "Listed:")}</span> {formatDate(property.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                className="flex-1 py-3 text-lg"
                onClick={handleSendInquiry}
              >
                <Send className="h-5 w-5 mr-2" />
                {t("properties.send_inquiry", "Send Inquiry")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-3 text-lg"
                onClick={handleBookInspection}
              >
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Book an independent inspector
              </Button>
            </div>
          </div>
        </div>


        {/* Inquiry Modal */}
        <InquiryModal
          isOpen={inquiryModalOpen}
          onClose={() => setInquiryModalOpen(false)}
          property={property}
          inquiryType={currentInquiryType}
        />
      </div>
    </div>
  );
};

export default PropertyDetail;