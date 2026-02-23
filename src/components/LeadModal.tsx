import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface LeadModalProps {
  property: Tables<"properties">;
  trigger?: React.ReactNode;
}

const LeadModal = ({ property, trigger }: LeadModalProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t("common.error", "Error"),
        description: t("auth.fill_required", "Please fill in all required fields."),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('create_lead', {
          p_property_id: property.id,
          p_name: formData.name,
          p_email: formData.email,
          p_phone: formData.phone,
          p_message: formData.message,
          p_source: 'web'
        });

      if (error) throw error;

      toast({
        title: t("lead.success"),
        description: t("lead.success_desc", "The property owner will contact you soon.")
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsOpen(false);

    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: t("common.error"),
        description: t("lead.error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("lead.contact_agent", "Contact Agent")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("lead.inquire_title", "Inquire About Property")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-semibold text-sm">{property.title}</h4>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.country} • €{property.price?.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("lead.name", "Name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder={t("lead.name_placeholder", "Your full name")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("lead.phone", "Phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("lead.email", "Email")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("lead.message", "Message")} *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder={t("lead.message_placeholder", "Tell the agent what you're looking for...")}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                {t("lead.cancel", "Cancel")}
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("lead.sending")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("lead.send")}
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            {t("lead.agree_terms", "By submitting this form, you agree to be contacted by the property agent.")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;