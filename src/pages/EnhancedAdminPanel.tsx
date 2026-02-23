import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Upload, FileText, Building2, CheckCircle, XCircle, Languages } from "lucide-react";

import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UnifiedPanel: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);

  // XML Import states
  const [xmlUrl, setXmlUrl] = useState('');
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlImportResults, setXmlImportResults] = useState<any>(null);
  const [isImportingXml, setIsImportingXml] = useState(false);

  // Translation states
  const [translationResults, setTranslationResults] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Gate and load initial data
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (profile) {
      fetchProperties();
    }
  }, [user, profile, navigate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, description, country, city, price, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleXmlImport = async () => {
    if (!xmlUrl.trim() && !xmlFile) {
      toast({
        title: "Missing Input",
        description: "Please provide a valid XML URL or upload an XML file.",
        variant: "destructive",
      });
      return;
    }

    setIsImportingXml(true);
    setXmlImportResults(null);

    try {
      let importUrl = xmlUrl.trim();

      // If file is uploaded, upload to Supabase storage first
      if (xmlFile) {
        const fileName = `temp/xml-imports/${Date.now()}-${xmlFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, xmlFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        importUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase.rpc('process_xml_properties', {
        xml_url: importUrl,
        owner_id: user?.id
      });

      if (error) throw error;

      setXmlImportResults(data);

      if (data.success) {
        toast({
          title: "XML Import Completed",
          description: `Successfully imported ${data.created} out of ${data.processed} properties.`,
        });
        await fetchProperties();
      } else {
        toast({
          title: "XML Import Failed",
          description: data.error || "Unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error importing XML:", error);
      toast({
        title: "Import Error",
        description: error?.message || "Failed to import XML properties.",
        variant: "destructive",
      });
      setXmlImportResults({ success: false, error: error?.message });
    } finally {
      setIsImportingXml(false);
    }
  };

  const handleTranslateProperties = async () => {
    setIsTranslating(true);
    setTranslationResults(null);

    try {
      // Call the Supabase Edge Function for translation
      const { data, error } = await supabase.functions.invoke('swift-api');

      if (error) throw error;

      setTranslationResults(data);

      if (data.success) {
        toast({
          title: "Translation Completed",
          description: `Successfully translated ${data.processed} properties.`,
        });
        await fetchProperties();
      } else {
        toast({
          title: "Translation Failed",
          description: data.error || "Unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error translating properties:", error);
      toast({
        title: "Translation Error",
        description: error?.message || "Failed to translate properties.",
        variant: "destructive",
      });
      setTranslationResults({ success: false, error: error?.message });
    } finally {
      setIsTranslating(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (!user || (profile && profile.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You need admin privileges to access this panel.</p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-muted-foreground">Via</span>
              <span className="text-primary">Estate</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Complete control over properties, users, and community content
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published Properties</p>
                  <p className="text-2xl font-bold">{properties.filter(p => p.status === 'published').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Properties</p>
                  <p className="text-2xl font-bold">{properties.filter(p => p.status === 'pending').length}</p>
                </div>
                <Upload className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">XML Imports</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="xml-import">XML Import</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Card key={property.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{property.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{property.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>
                              {property.city}, {property.country}
                            </span>
                            <span>{formatPrice(property.price)}</span>
                            <span>{formatDate(property.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={property.status === "published" ? "default" : "secondary"}>{property.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* XML Import Tab */}
          <TabsContent value="xml-import">
            <Card>
              <CardHeader>
                <CardTitle>XML Property Import</CardTitle>
                <CardDescription>
                  Import multiple properties from an XML file hosted at a URL.{' '}
                  <a
                    href="/xml-property-schema.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View XML schema documentation
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">KYERO Import</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    For KYERO XML feeds, use the command line script instead of this panel.
                  </p>
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                    npm run import
                  </code>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="xml-url">XML File URL</Label>
                    <Input
                      id="xml-url"
                      type="url"
                      placeholder="https://example.com/properties.xml"
                      value={xmlUrl}
                      onChange={(e) => setXmlUrl(e.target.value)}
                      disabled={!!xmlFile}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the full URL to an XML file containing property data
                    </p>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">or</div>

                  <div>
                    <Label htmlFor="xml-file">Upload XML File</Label>
                    <Input
                      id="xml-file"
                      type="file"
                      accept=".xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setXmlFile(file);
                        if (file) setXmlUrl(''); // Clear URL if file selected
                      }}
                      disabled={!!xmlUrl}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an XML file from your computer
                    </p>
                    {xmlFile && (
                      <p className="text-sm text-green-600 mt-1">
                        Selected: {xmlFile.name}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleXmlImport}
                    disabled={isImportingXml || (!xmlUrl.trim() && !xmlFile)}
                    className="w-full"
                  >
                    {isImportingXml ? 'Importing...' : 'Import Properties from XML'}
                  </Button>
                </div>

                {/* Import Results */}
                {xmlImportResults && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Import Results</h3>
                    {xmlImportResults.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Import completed successfully</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Properties processed: {xmlImportResults.processed}</p>
                          <p>Properties created: {xmlImportResults.created}</p>
                          {xmlImportResults.property_ids && xmlImportResults.property_ids.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Created property IDs:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {xmlImportResults.property_ids.map((id: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {id.slice(0, 8)}...
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Import failed: {xmlImportResults.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample XML Format */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2">Sample XML Format</h4>
                  <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`<properties>
  <property>
    <title>Luxury Villa with Sea View</title>
    <description>A beautiful luxury villa...</description>
    <country>Spain</country>
    <city>Barcelona</city>
    <price>850000</price>
    <property_type>villa</property_type>
    <images>
      <image>https://example.com/image1.jpg</image>
    </images>
  </property>
</properties>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations">
            <Card>
              <CardHeader>
                <CardTitle>Property Translations</CardTitle>
                <CardDescription>
                  Translate property descriptions to English for better user experience.
                  This will automatically detect non-English descriptions and create English translations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    AI-Powered Translation
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    Uses OpenAI GPT to automatically translate property descriptions to English.
                    Only properties without English translations will be processed.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleTranslateProperties}
                    disabled={isTranslating}
                    className="w-full"
                    size="lg"
                  >
                    {isTranslating ? (
                      <>
                        <Languages className="h-5 w-5 mr-2 animate-spin" />
                        Translating Properties...
                      </>
                    ) : (
                      <>
                        <Languages className="h-5 w-5 mr-2" />
                        Translate All Properties
                      </>
                    )}
                  </Button>
                </div>

                {/* Translation Results */}
                {translationResults && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Translation Results</h3>
                    {translationResults.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Translation completed successfully</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Total properties: {translationResults.total}</p>
                          <p>Properties translated: {translationResults.processed}</p>
                          <p>Errors: {translationResults.errors}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Translation failed: {translationResults.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Migration Instructions */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2">Manual Database Setup</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you need to set up the translation feature manually in Supabase:
                  </p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Run the SQL from <code className="bg-background px-1 py-0.5 rounded text-xs">supabase-manual-migration.sql</code></li>
                    <li>Deploy the Edge Function from <code className="bg-background px-1 py-0.5 rounded text-xs">supabase/functions/translate-properties/</code></li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View performance metrics and insights for your properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">Detailed analytics and reporting features will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">User Management</h3>
                  <p className="text-muted-foreground">User management features will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedPanel;