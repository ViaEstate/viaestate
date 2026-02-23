import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const BlogSection = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const articles = [
    {
      id: 1,
      title: t("blog.article1_title", "Buying Property in Spain as a Scandinavian"),
      excerpt: t("blog.article1_excerpt", "Everything you need to know about purchasing property in Spain, from legal requirements to finding the right location."),
      category: t("blog.category_guide", "Guide"),
      slug: "buying-property-spain-scandinavian"
    },
    {
      id: 2,
      title: t("blog.article2_title", "Legal Considerations When Purchasing Abroad"),
      excerpt: t("blog.article2_excerpt", "Understanding the legal process, taxes, and documentation needed when buying property in Southern Europe."),
      category: t("blog.category_legal", "Legal"),
      slug: "legal-considerations-purchasing-abroad"
    },
    {
      id: 3,
      title: t("blog.article3_title", "Best Regions in Southern Europe for Retirees"),
      excerpt: t("blog.article3_excerpt", "Explore the most popular regions for Scandinavian retirees in Spain, Portugal, Italy, and Greece."),
      category: t("blog.category_lifestyle", "Lifestyle"),
      slug: "best-regions-southern-europe-retirees"
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <BookOpen className="h-4 w-4 mr-2" />
            {t("blog.badge", "Guides & Resources")}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            {t("blog.title", "Guides for Buying Property in Southern Europe")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("blog.subtitle", "Expert insights to help you make informed decisions about your property purchase")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-elegant transition-smooth cursor-pointer group" onClick={() => navigate(`/${lang}/articles`)}>
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-4 text-xs">
                  {article.category}
                </Badge>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="flex items-center text-primary font-medium text-sm">
                  {t("blog.read_more", "Read More")}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <a 
            href={`/${lang}/articles`}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            {t("blog.view_all", "View All Articles")}
          </a>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
