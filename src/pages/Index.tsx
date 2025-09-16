import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SearchFilters from "@/components/SearchFilters";
import FeaturedProperties from "@/components/FeaturedProperties";
import PackagesSection from "@/components/PackagesSection";
import AIAssistant from "@/components/AIAssistant";
import BrokersSection from "@/components/BrokersSection";
import ForumSection from "@/components/ForumSection";

const Index = () => {
  const handleSearch = (filters: any) => {
    console.log("Search filters:", filters);
    // Handle search logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Search Section */}
        <section className="py-16 -mt-20 relative z-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SearchFilters onSearch={handleSearch} />
          </div>
        </section>

        {/* Featured Properties */}
        <FeaturedProperties />

        {/* Packages Section */}
        <PackagesSection />

        {/* AI Assistant */}
        <AIAssistant />

        {/* Brokers Section */}
        <BrokersSection />

        {/* Forum Section */}
        <ForumSection />

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Why Choose 
                <span className="text-primary"> ViaEstate</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of real estate with our premium platform designed for 
                discerning buyers, sellers, and brokers worldwide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-smooth">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Premium Properties</h3>
                <p className="text-muted-foreground">
                  Access exclusive luxury properties from verified brokers across 50+ countries worldwide.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-smooth">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Our intelligent system matches you with perfect properties based on your preferences.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-card border border-border hover:shadow-elegant transition-smooth">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Expert Brokers</h3>
                <p className="text-muted-foreground">
                  Connect with certified real estate professionals who understand your market.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl font-bold">
                <span className="text-muted-foreground">Via</span>
                <span className="text-primary">Estate</span>
              </span>
            </div>
            <p className="text-muted-foreground">
              Your gateway to premium real estate worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;