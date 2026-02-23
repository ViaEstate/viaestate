import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Tables<'properties'>;
  inquiryType?: 'general' | 'inspection';
}

const InquiryModal = ({ isOpen, onClose, property, inquiryType = 'general' }: InquiryModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
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

    setLoading(true);

    try {
      // Create the inquiry/lead - the database trigger will send the email
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          property_id: property.id,
          inquiry_type: inquiryType
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Send email notification to admin
      try {
        const { error: emailError } = await supabase.functions.invoke('send-inquiry-email', {
          body: {
            lead: lead,
            property: property,
            inquiryData: formData
          }
        });

        if (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't show error to user, just log it
        }
      } catch (emailError) {
        console.error('Error calling email function:', emailError);
        // Don't show error to user, just log it
      }

      toast({
        title: t("inquiry.success"),
        description: t("inquiry.success_desc", "Thank you for your inquiry. We will contact you soon.")
      });

      // Reset form and close modal
      setFormData({ name: '', email: '', phone: '', message: '' });
      onClose();

    } catch (error: unknown) {
      console.error('Error sending inquiry:', error);
      toast({
        title: t("common.error"),
        description: t("inquiry.error"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {inquiryType === 'inspection' ? t("inquiry.inspection_title", "Book an Independent Inspector") : t("inquiry.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("inquiry.name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t("inquiry.name_placeholder", "Enter your full name")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("inquiry.email")} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t("inquiry.email_placeholder", "Enter your email address")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("inquiry.phone")} ({t("common.optional", "Optional")})</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t("inquiry.phone_placeholder", "Enter your phone number")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("inquiry.message")} *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t("inquiry.message_placeholder", "I'm interested in this property...")}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t("inquiry.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("inquiry.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t("inquiry.send")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InquiryModal;