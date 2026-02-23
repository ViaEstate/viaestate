import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import heroVilla from "@/assets/hero-villa.jpg";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-110"
          style={{ filter: 'brightness(0.7)', animationDuration: '3s' }}
          poster={heroVilla}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/40 to-white/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl lg:max-w-4xl">
          <div className="mb-6">
            
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-primary">
            {t('hero.viaestate_title')}
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-black mb-4 sm:mb-6 max-w-2xl leading-relaxed">
            {t('hero.viaestate_subtitle')}
          </p>

          <p className="text-base sm:text-lg text-gray-800 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
            {t('hero.viaestate_description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto"
              onClick={() => navigate(`/${lang}/properties`)}
            >
              {t('hero.view_properties')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto border-white/30 text-black hover:bg-white hover:text-black"
              onClick={() => navigate(`/${lang}/about`)}
            >
              {t('hero.book_consultation')}
            </Button>
          </div>
        </div>
     
      
      </div>
    </section>
  );
};

export default HeroSection;
