import { NavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user, profile } = useAuth();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const isAdminOrAgent =
    profile?.role === "admin" || profile?.role === "broker";

  // Get current path without language prefix
  const getPathWithoutLang = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    if (["en", "sv", "da", "de", "it", "es", "hr", "fr"].includes(segments[0])) {
      return "/" + segments.slice(1).join("/");
    }
    return path;
  };

  // Navigation items with translated labels
  const navItems = [
    { to: `/${lang}/properties`, label: t("nav.properties", "Properties") },
    { to: `/${lang}/guidance`, label: t("nav.guidance", "Guidance") },
    { to: `/${lang}/articles`, label: t("nav.articles", "Articles") },
    { to: `/${lang}/work-with-us`, label: t("nav.work_with_us", "Work with Us") },
    { to: `/${lang}/about`, label: t("nav.about_us", "About Us") },
  ];

  const NavLinks = ({ mobile = false, onClick = () => {} }: { mobile?: boolean; onClick?: () => void }) => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`text-sm hover:text-amber-600 ${mobile ? 'block py-2' : ''}`}
          onClick={onClick}
        >
          {item.label}
        </NavLink>
      ))}

      {/* PANEL ONLY IF AUTHORIZED */}
      {isAdminOrAgent && (
        <NavLink
          to={`/${lang}/panel`}
          className={`text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full ${mobile ? 'block w-fit mt-2' : ''}`}
          onClick={onClick}
        >
          {t("nav.panel", "Panel")}
        </NavLink>
      )}
    </>
  );

  return (
    <nav className="w-full border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">

        {/* LOGO */}
        <NavLink to={`/${lang}`} className="text-xl font-semibold">
          <span className="text-muted-foreground">Via</span>
          <span className="text-primary">Estate</span>
        </NavLink>

        {/* DESKTOP MENU */}
        {!isMobile && (
          <div className="flex items-center space-x-6">
            <NavLinks />
            <LanguageSwitcher />
          </div>
        )}
        
        {/* Debug log */}
        {process.env.NODE_ENV === 'development' && (
          <div className="hidden">
            {/* Debug log for language parameter */}
            <script dangerouslySetInnerHTML={{ 
              __html: `console.log('Navigation component language parameter:', '${lang}');` 
            }} />
          </div>
        )}

        {/* MOBILE MENU */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                <NavLinks mobile onClick={() => setIsOpen(false)} />
                <div className="pt-4 border-t">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
