import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, X, MapPin, Euro, Send, User, Calendar, LogIn, Home, Waves, Mountain, Ruler, Bath, ClipboardCheck } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import InquiryModal from "@/components/InquiryModal";
import { Tables } from '@/integrations/supabase/types';
import { useLanguage } from "@/contexts/LanguageContext";

interface PropertyDetailModalProps {
  property: Tables<'properties'> | null;
  isOpen: boolean;
  onClose: () => void;
}

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

const PropertyDetailModal = ({ property, isOpen, onClose }: PropertyDetailModalProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
    const [currentInquiryType, setCurrentInquiryType] = useState<'general' | 'inspection'>('general');

  const { user, profile } = useAuth();
  const { lang } = useLanguage();

  // Get language-specific title and description with fallbacks
  const getLanguageSpecificField = (field: string, fallback: string): string => {
    // Map language codes to database field suffixes
    const languageMap: Record<string, string> = {
      en: "english",
      sv: "swedish",
      fi: "finnish",
      da: "danish",
      nb: "norwegian",
      de: "german",
      fr: "french",
      es: "spanish",
      it: "italian",
      hr: "croatian"
    };

    const languageSuffix = languageMap[lang];
    if (languageSuffix && languageSuffix !== "english" && property) { // English is default
      const languageSpecificField = property[`${languageSuffix}_${field}` as keyof Tables<'properties'>];
      if (languageSpecificField && typeof languageSpecificField === "string") {
        return languageSpecificField;
      }
    }
    
    // Fallback to default field
    return fallback;
  };

  const displayTitle = property ? getLanguageSpecificField("title", property.title) : "";
  const displayDescription = property ? getLanguageSpecificField("description", property.description) : "";
  const { toast } = useToast();
  const navigate = useNavigate();

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
    if (property?.id && isOpen) {
      fetchForumPosts();
    }
  }, [property?.id, isOpen, fetchForumPosts]);


  const handleCreatePost = async () => {
    if (!property?.id || (!newPostContent.trim()) || loading) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to post questions.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

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
        title: "Post Submitted",
        description: "Your post has been submitted for review and will appear shortly."
      });

      // Clear form
      setNewPostContent("");

      // Refresh posts
      fetchForumPosts();
    } catch (error: unknown) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  if (!property) return null;

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
    // Decode HTML entities and handle basic HTML tags
    const decodeHtmlEntities = (text: string) => {
      // First decode common HTML entities manually
      let decoded = text
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/&/g, '&')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/&nbsp;/g, ' ');

      // Then handle <br> tags
      decoded = decoded.replace(/<br\s*\/?>/gi, '\n');

      return decoded;
    };

    const decodedDescription = decodeHtmlEntities(description);

    // Split description into sentences and add line breaks for better readability
    return decodedDescription.split('. ').map((sentence, index) => (
      <span key={index}>
        {sentence.trim()}{sentence.trim() && '.'}
        {index < decodedDescription.split('. ').length - 1 && <br />}
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
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{displayTitle}</DialogTitle>
        </DialogHeader>

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
                   No images available
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
                   Property Details
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                   {/* Bedrooms & Bathrooms Row - Symmetrical Grid */}
                   <div className="grid grid-cols-2 gap-6">
                     <div className="text-center">
                       <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                         <Home className="h-8 w-8 text-primary" />
                       </div>
                       <p className="text-sm text-muted-foreground font-medium mb-1">Bedrooms</p>
                       <p className="text-2xl font-bold text-slate-800">{property.bedrooms || 'N/A'}</p>
                     </div>
                     <div className="text-center">
                       <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                         <Bath className="h-8 w-8 text-primary" />
                       </div>
                       <p className="text-sm text-muted-foreground font-medium mb-1">Bathrooms</p>
                       <p className="text-2xl font-bold text-slate-800">{property.bathrooms || 'N/A'}</p>
                     </div>
                   </div>

                   {/* Area Information */}
                   {(property.area || property.plot_area) && (
                     <div className="border-t pt-6 mt-6">
                       <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 justify-center">
                         <Ruler className="h-4 w-4 text-primary" />
                         Area Information
                       </h4>
                       <div className="grid grid-cols-2 gap-6">
                         <div className="text-center">
                           <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                             <Home className="h-6 w-6 text-primary" />
                           </div>
                           <p className="text-sm text-muted-foreground mb-1">Living Area</p>
                           <p className="text-lg font-bold text-slate-800">{property.area || 'N/A'} {property.area ? 'm²' : ''}</p>
                         </div>
                         <div className="text-center">
                           <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                             <Mountain className="h-6 w-6 text-primary" />
                           </div>
                           <p className="text-sm text-muted-foreground mb-1">Plot Area</p>
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
                         Distance Information
                       </h4>
                       <div className="grid grid-cols-3 gap-4">
                         <div className="text-center">
                           <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                             <MapPin className="h-5 w-5 text-primary" />
                           </div>
                           <p className="text-xs text-muted-foreground mb-1">City Center</p>
                           <p className="text-sm font-bold text-slate-800">{property.distance_to_city ? formatDistance(property.distance_to_city) : 'N/A'}</p>
                         </div>
                         <div className="text-center">
                           <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                             <Waves className="h-5 w-5 text-primary" />
                           </div>
                           <p className="text-xs text-muted-foreground mb-1">To Sea</p>
                           <p className="text-sm font-bold text-slate-800">{property.distance_to_sea ? formatDistance(property.distance_to_sea) : 'N/A'}</p>
                         </div>
                         <div className="text-center">
                           <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                             <Mountain className="h-5 w-5 text-primary" />
                           </div>
                           <p className="text-xs text-muted-foreground mb-1">To Lake</p>
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
             {/* Property Description */}
             <div>
               <div className="flex items-center gap-2 text-muted-foreground mb-4">
                 <MapPin className="h-4 w-4" />
                 <span className="text-base">{property.city}, {property.country}</span>
               </div>
               <div className="flex items-center gap-2 mb-6">
                 <Euro className="h-5 w-5 text-primary" />
                 <span className="text-4xl font-bold">{formatPrice(property.price)}</span>
                 <Badge variant="secondary" className="ml-2">{property.status}</Badge>
               </div>
                <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed text-lg font-medium">
                      {formatDescription(displayDescription || '')}
                    </p>
                </div>
             </div>

             {/* Agent Information */}
             <Card>
               <CardContent className="p-6">
                 <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                   <User className="h-5 w-5" />
                   Agent Information
                 </h3>
                 <div className="text-sm text-muted-foreground space-y-2">
                   <p><span className="font-medium">Type:</span> {property.seller_type}</p>
                   <p><span className="font-medium">Listed:</span> {formatDate(property.created_at)}</p>
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
                 Send Inquiry
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
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailModal;