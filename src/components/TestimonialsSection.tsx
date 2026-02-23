import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Heart } from "lucide-react";
import joarFlood from "@/assets/joar-flood.png";
import joelJohansson from "@/assets/joel-johansson.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const TestimonialsSection = () => {
  const { t } = useLanguage();

  const teamMembers = [
    {
      id: 1,
      name: "Joel Johansson",
      role: t("team.joel_role", "Co-Founder & Business Development Director"),
      image: joelJohansson,
      quote: t("team.joel_quote", "Every client deserves personalized guidance through their property journey.")
    },
    {
      id: 2,
      name: "Joar Flood",
      role: t("team.joar_role", "Co-Founder & Managing Director"),
      image: joarFlood,
      quote: t("team.joar_quote", "We help Scandinavians buy property in Southern Europe with clarity, security and full support throughout the process.")
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Team Section with Trust Message */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Users className="h-4 w-4 mr-2" />
            {t("team.badge", "Meet Your Guides")}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-3 text-foreground">
            {t("team.title", "From Scandinavia to Southern Europe")}
          </h2>
          <h3 className="text-4xl sm:text-4xl font-bold mb-6 text-primary">
            {t("team.title2", "We Guide You Every Step of the Way")}
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("team.subtitle", "We understand the Scandinavian way of doing business — transparent, reliable, and personal.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto mb-16">
          {teamMembers.map((member) => (
            <Card key={member.id} className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mb-6 border-4 border-primary/20"
                  />
                  <h3 className="text-xl font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-primary font-medium text-sm mb-4">{member.role}</p>
                  <div className="flex items-center justify-center text-muted-foreground italic">
                    <Heart className="h-4 w-4 text-primary mr-2" />
                    <span>"{member.quote}"</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Appreciation Message */}
        <div className="bg-slate-50 rounded-2xl p-10 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-primary fill-current" />
                ))}
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              {t("team.customer_appreciation_title", "Our Clients Appreciate Our Personal Approach")}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("team.customer_appreciation_text", "Many of our clients come through recommendations from satisfied customers who valued our transparent process and dedicated support throughout their property purchase in Spain, Southern France, Italy, Croatia and Greece")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
