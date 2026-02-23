import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import TopHeaders from "@/components/TopHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X } from "lucide-react";

type Property = Tables<"properties">;
type PropertyStatus = "draft" | "pending" | "published" | "rejected";

const EditProperty: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // For admin owner selection

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    english_title: "",
    english_description: "",
    swedish_title: "",
    swedish_description: "",
    norwegian_title: "",
    norwegian_description: "",
    danish_title: "",
    danish_description: "",
    finnish_title: "",
    finnish_description: "",
    country: "",
    city: "",
    price: "",
    property_type: "",
    property_type_detail: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    plot_area: "",
    distance_to_city: "",
    distance_to_sea: "",
    distance_to_lake: "",
    listing_type: "sale" as "sale" | "rent",
    status: "draft" as PropertyStatus,
    owner_id: "", // For admins to reassign properties
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  // Fetch property data and users (for admin owner reassignment)
  useEffect(() => {
    if (user && id) {
      fetchProperty();
      if (profile?.role === 'admin') {
        fetchUsers();
      }
    }
  }, [user, id, profile?.role]);

  const fetchProperty = async () => {
    if (!id) return;

    try {
      setLoading(true);

       // Use defensive field selection - include new fields
       const selectFields = `
         id, title, description, english_description,
         swedish_title, swedish_description, norwegian_title, norwegian_description,
         danish_title, danish_description, finnish_title, finnish_description,
         country, city, price, property_type,
         property_type_detail, bedrooms, bathrooms, area, plot_area,
         distance_to_city, distance_to_sea, distance_to_lake, listing_type,
         images, seller_id, seller_type, owner_id, owner_type, status, created_at, updated_at
       `;

      const { data, error } = await supabase
        .from("properties")
        .select(selectFields)
        .eq("id", id)
        .single();

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          // Fallback to basic fields
          const { data: basicData, error: basicError } = await supabase
            .from("properties")
            .select("id, title, description, country, city, price, images, owner_type, status, created_at")
            .eq("id", id)
            .single();

          if (basicError) throw basicError;
          setProperty(basicData as Property);
        } else {
          throw error;
        }
      } else {
        setProperty(data as Property);
      }
    } catch (error: any) {
      console.error("Error fetching property:", error);
      toast({
        title: "Error",
        description: "Failed to load property details.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

   // Populate form when property loads
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        english_title: property.english_title || "",
        english_description: property.english_description || "",
        swedish_title: property.swedish_title || "",
        swedish_description: property.swedish_description || "",
        norwegian_title: property.norwegian_title || "",
        norwegian_description: property.norwegian_description || "",
        danish_title: property.danish_title || "",
        danish_description: property.danish_description || "",
        finnish_title: property.finnish_title || "",
        finnish_description: property.finnish_description || "",
        country: property.country || "",
        city: property.city || "",
        price: property.price?.toString() || "",
        property_type: property.property_type || "",
        property_type_detail: property.property_type_detail || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        area: property.area?.toString() || "",
        plot_area: property.plot_area?.toString() || "",
        distance_to_city: property.distance_to_city?.toString() || "",
        distance_to_sea: property.distance_to_sea?.toString() || "",
        distance_to_lake: property.distance_to_lake?.toString() || "",
        listing_type: (property.listing_type as "sale" | "rent") || "sale",
        status: (property.status as PropertyStatus) || "draft",
        owner_id: property.owner_id || "",
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property || !user) return;

    // Validate required fields
    if (!formData.title || !formData.description || !formData.country || !formData.city || !formData.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        english_title: formData.english_title || null,
        english_description: formData.english_description || null,
        swedish_title: formData.swedish_title || null,
        swedish_description: formData.swedish_description || null,
        norwegian_title: formData.norwegian_title || null,
        norwegian_description: formData.norwegian_description || null,
        danish_title: formData.danish_title || null,
        danish_description: formData.danish_description || null,
        finnish_title: formData.finnish_title || null,
        finnish_description: formData.finnish_description || null,
        country: formData.country,
        city: formData.city,
        price: parseFloat(formData.price),
        property_type: formData.property_type || null,
        property_type_detail: formData.property_type_detail || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseInt(formData.area) : null,
        plot_area: formData.plot_area ? parseInt(formData.plot_area) : null,
        distance_to_city: formData.distance_to_city ? parseInt(formData.distance_to_city) : null,
        distance_to_sea: formData.distance_to_sea ? parseInt(formData.distance_to_sea) : null,
        distance_to_lake: formData.distance_to_lake ? parseInt(formData.distance_to_lake) : null,
        listing_type: formData.listing_type,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      // Admins can reassign property ownership
      if (profile?.role === 'admin' && formData.owner_id) {
        updateData.owner_id = formData.owner_id;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: "Property Updated",
        description: "Your property has been successfully updated.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">You need to be logged in to edit properties.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">The property you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Check if user owns this property or is an admin
  const canEdit =
    profile?.role === 'admin' ||
    property.owner_id === user.id ||
    // Backward/forward-compatible: many flows key ownership by seller_id
    property.seller_id === user.id;

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeaders />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">You don't have permission to edit this property.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeaders />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold mb-2">{t("edit_property.title", "Edit Property")}</h1>
          <p className="text-muted-foreground">{t("edit_property.subtitle", "Update your property information")}</p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{t("edit_property.details", "Property Details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.title_label", "Property Title")} *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={t("edit_property.title_placeholder", "Enter property title")}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.description_label", "Description")} *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder={t("edit_property.description_placeholder", "Enter property description")}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.country_label", "Country")} *</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder={t("edit_property.country_placeholder", "Enter country")}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.city_label", "City")} *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder={t("edit_property.city_placeholder", "Enter city")}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.price_label", "Price")} *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder={t("edit_property.price_placeholder", "Enter price")}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("edit_property.type_label", "Property Type")}</label>
                  <Input
                    value={formData.property_type}
                    onChange={(e) => handleInputChange("property_type", e.target.value)}
                    placeholder={t("edit_property.type_placeholder", "e.g., Apartment, House, Villa")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Property Type Detail</label>
                  <Input
                    value={formData.property_type_detail}
                    onChange={(e) => handleInputChange("property_type_detail", e.target.value)}
                    placeholder="e.g., Luxury Villa, Studio Apartment"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    placeholder="Number of bedrooms"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                  <Input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                    placeholder="Number of bathrooms"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Living Area (m²)</label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    placeholder="Living area in square meters"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Plot Area (m²)</label>
                  <Input
                    type="number"
                    value={formData.plot_area}
                    onChange={(e) => handleInputChange("plot_area", e.target.value)}
                    placeholder="Plot area in square meters"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Distance to City (m)</label>
                  <Input
                    type="number"
                    value={formData.distance_to_city}
                    onChange={(e) => handleInputChange("distance_to_city", e.target.value)}
                    placeholder="Distance to city center in meters"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Distance to Sea (m)</label>
                  <Input
                    type="number"
                    value={formData.distance_to_sea}
                    onChange={(e) => handleInputChange("distance_to_sea", e.target.value)}
                    placeholder="Distance to sea in meters"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Distance to Lake (m)</label>
                  <Input
                    type="number"
                    value={formData.distance_to_lake}
                    onChange={(e) => handleInputChange("distance_to_lake", e.target.value)}
                    placeholder="Distance to lake in meters"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Listing Type</label>
                  <Select
                    value={formData.listing_type}
                    onValueChange={(value) => handleInputChange("listing_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner selection for admins */}
                {profile?.role === 'admin' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Owner</label>
                    <Select
                      value={formData.owner_id}
                      onValueChange={(value) => handleInputChange("owner_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProperty;
