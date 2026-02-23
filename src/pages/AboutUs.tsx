import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, Star, Mail, Search, Handshake, KeyRound } from 'lucide-react'
import joarFlood from '@/assets/joar-flood.png'
import joelJohansson from '@/assets/joel-johansson.jpg'
import { useLanguage } from '@/contexts/LanguageContext'

const AboutUs = () => {
  const { t } = useLanguage();

  const howWeWork = [
    {
      icon: Search,
      step: "01",
      title: t("about.step1_title", "Property Selection"),
      description: t("about.step1_desc", "We help you find properties that match your preferences and budget in Southern Europe.")
    },
    {
      icon: Handshake,
      step: "02",
      title: t("about.step2_title", "Coordination"),
      description: t("about.step2_desc", "We coordinate with trusted local agents, lawyers, and notaries on your behalf.")
    },
    {
      icon: KeyRound,
      step: "03",
      title: t("about.step3_title", "Guidance to Completion"),
      description: t("about.step3_desc", "We guide you through every step until you receive the keys to your new home.")
    }
  ]

  const values = [
    t("about.value_connecting", "Connecting people and properties"),
    t("about.value_marketing", "Smart digital marketing"),
    t("about.value_insights", "Data-driven insights"),
    t("about.value_showcase", "Professional property showcase")
  ]

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">

          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              {t("about.about_viaestate", "About ViaEstate")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
              {t("about.about", "About")} <span className="text-primary">{t("about.us", "Us")}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("about.founded_desc", "ViaEstate was founded in Karlstad, Sweden, in 2025 with a clear vision: to help Scandinavians buy property in Southern Europe safely and confidently.")}
            </p>
          </div>

          {/* Our Purpose Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about.our_purpose", "Our Purpose")}</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {t("about.purpose_desc1", "Buying property in a foreign country can feel overwhelming. There are different laws, languages, and customs to navigate — often without the support you need.")}
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {t("about.purpose_desc2", "ViaEstate was created to change this. We act as the bridge between Scandinavian buyers and trusted local professionals in Southern Europe, ensuring a smooth and secure property buying experince")}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("about.purpose_desc3", "Our mission is simple: to make your property purchase in Southern Europe as smooth, safe, and confident as possible.")}
                </p>
              </div>
              <div className="relative">
                <Card className="p-8 bg-gradient-subtle border-primary/20">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{t("about.founded_2025", "Founded 2025")}</h3>
                      <p className="text-muted-foreground">{t("about.karlstad_sweden", "Karlstad, Sweden")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {values.map((value, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm text-foreground/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* How We Work Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about.how_we_work", "How We Work")}</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howWeWork.map((item, index) => (
                <Card key={index} className="p-6 hover:shadow-elegant transition-smooth border-t-4 border-t-primary">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-3xl font-bold text-primary/20">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about.meet_founders", "The Team")}</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {/* Joel Johansson */}
              <Card className="p-6 hover:shadow-elegant transition-smooth">
                <CardContent className="p-0">
                  <div className="flex flex-col items-center text-center">
                    <img 
                      src={joelJohansson} 
                      alt="Joel Johansson" 
                      className="w-32 h-32 rounded-full object-cover object-center border-4 border-primary/20 mb-4"
                    />
                    <h3 className="text-xl font-semibold">Joel Johansson</h3>
                    <p className="text-primary font-medium text-sm mb-3">Co-Founder & Business Development Director</p>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      With extensive experience in business development and the Scandinavian market, Joel ensures that every client receives personalized attention and finds their perfect property in Southern Europe.
                    </p>
                    <a 
                      href="mailto:joel.johansson@viaestate.eu" 
                      className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      joel.johansson@viaestate.eu
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              {/* Joar Flood */}
              <Card className="p-6 hover:shadow-elegant transition-smooth">
                <CardContent className="p-0">
                  <div className="flex flex-col items-center text-center">
                    <img 
                      src={joarFlood} 
                      alt="Joar Flood" 
                      className="w-32 h-32 rounded-full object-cover object-center border-4 border-primary/20 mb-4"
                    />
                    <h3 className="text-xl font-semibold">Joar Flood</h3>
                    <p className="text-primary font-medium text-sm mb-3">Co-Founder & Managing Director</p>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      Joar brings deep expertise in international real estate and technology. His vision drives ViaEstate's mission to simplify property purchases for Scandinavian buyers across Europe.
                    </p>
                    <a 
                      href="mailto:joar.flood@viaestate.eu" 
                      className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      joar.flood@viaestate.eu
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Contact CTA Section */}
         
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about.cta_title", "Ready to Find Your Home in Southern Europe?")}</h2>
              <p className="text-lg text-black/80 max-w-2xl mx-auto leading-relaxed mb-8">
                {t("about.cta_desc", "We are here to guide you through every step of buying property abroad. Book a free consultation to discuss your plans.")}
              </p>
              <a 
                href="mailto:info@viaestate.eu"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium border-2 border-black text-black hover:bg-gold hover:text-navy transition-colors"
              >
                {t("about.cta_button", "Get in Touch")}
              </a>
            </div>
          

        </div>
      </main>
    </div>
  )
}

export default AboutUs
