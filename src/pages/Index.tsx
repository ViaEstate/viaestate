import TopHeaders from "@/components/TopHeaders";
import HeroSection from "@/components/HeroSection";
import TrustStrip from "@/components/TrustStrip";
import SearchFilters from "@/components/SearchFilters";
import FeaturedProperties from "@/components/FeaturedProperties";
import EuropeMap from "@/components/EuropeMap";
import PackagesSection from "@/components/PackagesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BlogSection from "@/components/BlogSection";
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLanguage();

  const handleSearch = (filters: any) => {
    const searchParams = new URLSearchParams();

    if (filters.location) {
      searchParams.set('country', filters.location.trim());
    }

    if (filters.priceMin && filters.priceMin > 0) searchParams.set('minPrice', filters.priceMin.toString());
    if (filters.priceMax && filters.priceMax > 0) searchParams.set('maxPrice', filters.priceMax.toString());
    if (filters.propertyType) searchParams.set('propertyType', filters.propertyType);
    if (filters.bedrooms) searchParams.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms) searchParams.set('bathrooms', filters.bathrooms);

    navigate(`/${lang}/properties?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Trust Strip */}
        <TrustStrip />

        {/* Featured Properties */}
        <FeaturedProperties />

        {/* Europe Map */}
        <EuropeMap />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Blog / Knowledge Section */}
        <BlogSection />

      </main>

      {/* Footer */}
      <footer className="bg-slate-100 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand & Description */}
            <div className="md:col-span-1">
              <a 
                href={`/${lang}/login`}
                className="text-2xl font-bold block mb-4 hover:opacity-80 transition-opacity"
                aria-label="Login to ViaEstate"
              >
                <span className="text-muted-foreground">Via</span>
                <span className="text-primary">Estate</span>
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t("footer.quick_links", "Quick Links")}</h4>
              <ul className="space-y-2">
                <li><a href={`/${lang}/properties`} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.properties", "Properties")}</a></li>
                <li><a href={`/${lang}/guidance`} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.guidance", "Guidance")}</a></li>
                <li><a href={`/${lang}/articles`} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.articles", "Articles")}</a></li>
                <li><a href={`/${lang}/work-with-us`} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.work_with_us", "Work with Us")}</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t("footer.contact", "Contact")}</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a href="mailto:info@viaestate.eu" className="hover:text-primary transition-colors">
                    info@viaestate.eu
                  </a>
                </li>
                <li>+46 76 273 43 07</li>
                <li>+46 76 776 98 48</li>
                <li className="pt-2 text-sm">
                  {t("footer.based_sweden", "Based in Karlstad, Sweden")}
                </li>
              </ul>
            </div>

            {/* Professional Message */}
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t("footer.get_in_touch", "Get in Touch")}</h4>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {t("footer.closing_message", "We look forward to helping you find your home in Southern Europe.")}
              </p>
              <a 
                href={`/${lang}/about`}
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {t("footer.book_consultation", "Book a Consultation")}
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 ViaEstate. {t("footer.all_rights", "All rights reserved.")}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.privacy", "Privacy Policy")}</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.gdpr", "GDPR")}</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.terms", "Terms")}</a>
            </div>
            {/* Social Media Icons */}
            <div className="flex justify-center space-x-4">
              <a 
                href="https://www.instagram.com/viaestate.eu/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Follow ViaEstate on Instagram"
              >
                <Instagram className="h-5 w-5 text-primary-foreground" />
              </a>
            
              <a 
                href="https://www.facebook.com/profile.php?id=61579269959759" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Follow ViaEstate on Facebook"
              >
                <Facebook className="h-5 w-5 text-primary-foreground" />
              </a>
              
              <a 
                href="https://x.com/ViaEstateEU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Follow ViaEstate on X"
              >
                <Twitter className="h-5 w-5 text-primary-foreground" />
              </a>

              <a 
                href="https://www.linkedin.com/company/viaestate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Follow ViaEstate on LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-primary-foreground" />
              </a>

              <a 
                href="https://www.tiktok.com/@viaestate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                aria-label="Follow ViaEstate on TikTok"
              >
                <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              
             
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
