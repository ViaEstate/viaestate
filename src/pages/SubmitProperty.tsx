import TopHeaders from '@/components/TopHeaders';
import CustomerPropertyRequest from '@/components/CustomerPropertyRequest';
import { useLanguage } from '@/contexts/LanguageContext';

const SubmitProperty = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <TopHeaders />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("submit_property.title", "Submit Your Property")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("submit_property.subtitle", "List your property with professional assistance from our certified real estate agents")}
          </p>
        </div>
        
        <CustomerPropertyRequest />
      </main>
    </div>
  );
};

export default SubmitProperty;