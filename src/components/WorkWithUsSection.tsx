import { Card, CardContent } from "@/components/ui/card";
import { Mail, Building2, Calendar, Smartphone, Globe } from "lucide-react";
import joarFlood from "@/assets/joar-flood.png";
import joelJohansson from "@/assets/joel-johansson.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const WorkWithUsSection = () => {
  const { t } = useLanguage();
  const features = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: t("work_with_us.broker_grow", "We Help Brokers Grow"),
      description: t("work_with_us.broker_grow_desc", "We offer a modern platform that helps real estate brokers reach more customers and streamline their business. With our network, you get access to thousands of potential buyers and sellers.")
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: t("work_with_us.international_reach", "International Reach"),
      description: t("work_with_us.international_reach_desc", "Through our global network, you can market properties to buyers from around the world. We handle multilingual content and internationalization for you.")
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: t("work_with_us.mobile_app", "Coming Soon: Mobile App"),
      description: t("work_with_us.mobile_app_desc", "We are developing a modern app that will make it even easier to manage your properties and contacts. Designed to save time and increase efficiency.")
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: t("work_with_us.booking_system", "Coming Soon: Booking System"),
      description: t("work_with_us.booking_system_desc", "A new booking system is under development that will allow you to schedule viewings, manage meetings, and follow up with potential customers directly in the platform.")
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Introduction Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            {t("work_with_us.work_with", "Work With")} <span className="text-primary">{t("work_with_us.us", "Us")}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            {t("work_with_us.intro", "ViaEstate is a modern real estate platform that helps brokers grow their business. We offer tools and services that make it easier to reach customers, market properties, and streamline your daily work as a real estate broker.")}
          </p>
        </div>

        {/* How We Help Brokers Section */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">
            {t("work_with_us.what_offer", "What We Offer to Brokers")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground">
                        {feature.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/20 mb-16">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {t("work_with_us.get_started", "Ready to Get Started?")}
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("work_with_us.contact_desc", "Contact us today to discuss how we can help you grow your brokerage business. We'll help you find the right solution for your needs.")}
            </p>
            <a 
              href="mailto:info@viaestate.eu"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-5 w-5" />
              info@viaestate.eu
            </a>
          </div>
        </div>

        {/* Team Section */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {/* Joel Johansson */}
          <div className="flex flex-col items-center text-center">
            <img 
              src={joelJohansson} 
              alt="Joel Johansson" 
              className="w-28 h-28 rounded-full object-cover object-center border-4 border-primary/20 mb-4"
            />
            <h3 className="text-lg font-semibold">Joel Johansson</h3>
            <p className="text-primary font-medium text-sm mb-1">Co-Founder & Business Development Director</p>
            <a 
              href="mailto:joel.johansson@viaestate.eu" 
              className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3 mr-2" />
              joel.johansson@viaestate.eu
            </a>
          </div>
          {/* Joar Flood */}
          <div className="flex flex-col items-center text-center">
            <img 
              src={joarFlood} 
              alt="Joar Flood" 
              className="w-28 h-28 rounded-full object-cover object-center border-4 border-primary/20 mb-4"
            />
            <h3 className="text-lg font-semibold">Joar Flood</h3>
            <p className="text-primary font-medium text-sm mb-1">Co-Founder & Managing Director</p>
            <a 
              href="mailto:joar.flood@viaestate.eu" 
              className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3 mr-2" />
              joar.flood@viaestate.eu
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WorkWithUsSection;
