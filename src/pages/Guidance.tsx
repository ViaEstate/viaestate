import { useLanguage } from "@/contexts/LanguageContext";

const Guidance = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
              {t("guidance.title", "Guidance")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("guidance.subtitle", "Your step-by-step guide to buying property in Southern Europe")}
            </p>
          </div>

          {/* Coming Soon / Placeholder */}
          <div className="bg-white rounded-2xl p-12 text-center border border-border">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-4">
                {t("guidance.coming_soon", "Coming Soon")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("guidance.description", "We are working on comprehensive step-by-step guides to help you buy property in Spain, France, Italy, Croatia, Greece and more. Check back soon for detailed guidance.")}
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              {t("guidance.have_questions", "Have questions?")}
            </p>
            <a 
              href="mailto:info@viaestate.eu" 
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t("guidance.contact_us", "Contact Us")}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Guidance;
