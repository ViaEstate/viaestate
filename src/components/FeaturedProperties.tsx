import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

const FeaturedProperties = () => {
  // Mock data for featured properties
  const properties = [
    {
      id: "1",
      title: "Modern Luxury Villa in Santorini",
      price: 2500000,
      location: "Santorini, Greece",
      bedrooms: 4,
      bathrooms: 3,
      area: 3200,
      images: [property5],
      type: "sale" as const,
      featured: true,
    },
    {
      id: "2",
      title: "Penthouse with Ocean View",
      price: 8500,
      location: "Miami Beach, FL",
      bedrooms: 3,
      bathrooms: 2,
      area: 2100,
      images: [property1],
      type: "rent" as const,
      featured: true,
    },
    {
      id: "3",
      title: "Historic Townhouse in London",
      price: 1850000,
      location: "Kensington, London",
      bedrooms: 5,
      bathrooms: 4,
      area: 2800,
      images: [property2],
      type: "sale" as const,
      featured: true,
    },
    {
      id: "4",
      title: "Contemporary Apartment in Tokyo",
      price: 4200,
      location: "Shibuya, Tokyo",
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      images: [property3],
      type: "rent" as const,
    },
    {
      id: "5",
      title: "Beachfront Villa in Malibu",
      price: 8500000,
      location: "Malibu, CA",
      bedrooms: 6,
      bathrooms: 5,
      area: 4500,
      images: [property4],
      type: "sale" as const,
      featured: true,
    },
    {
      id: "6",
      title: "Luxury Ski Chalet in Aspen",
      price: 12000,
      location: "Aspen, CO",
      bedrooms: 4,
      bathrooms: 3,
      area: 2600,
      images: [property6],
      type: "rent" as const,
    },
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Featured 
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Properties</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover handpicked luxury properties from around the world, 
            curated by our expert real estate professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="px-8 py-4 h-auto text-lg">
            View All Properties
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;