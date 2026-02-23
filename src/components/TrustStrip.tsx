import { Handshake, MapPin, MessageCircle, Heart, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustStrip = () => {
  const { t } = useLanguage();

  const trustItems = [
    {
      icon: Handshake,
      title: t("trust.personal_guidance", "Personal Guidance"),
      description: t("trust.personal_guidance_desc", "Personal guidance throughout the entire buying process"),
    },
    {
      icon: MapPin,
      title: t("trust.local_partners", "Certified Local Partners"),
      description: t("trust.local_partners_desc", "Verified and certified local partners in Southern Europe"),
    },
    {
      icon: MessageCircle,
      title: t("trust.transparent", "Transparent Communication"),
      description: t("trust.transparent_desc", "Transparent communication at every step"),
    },
    {
      icon: Heart,
      title: t("trust.scandinavian", "Scandinavian-Focused Service"),
      description: t("trust.scandinavian_desc", "Service designed specifically for Scandinavian buyers"),
    },
    {
      icon: ClipboardCheck,
      title: t("trust.independent_inspection", "Certified Independent Inspection"),
      description: t("trust.independent_inspection_desc", "Professional property inspections by certified independent experts"),
    },
  ];

  return (
    <section className="py-8 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
