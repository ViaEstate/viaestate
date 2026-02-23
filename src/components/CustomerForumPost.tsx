import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CustomerForumPostProps {
  propertyId: string;
  onPostCreated: () => void;
}

const CustomerForumPost = ({ propertyId, onPostCreated }: CustomerForumPostProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    title: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to post questions.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          status: 'pending' // Admin will approve
        });

      if (error) throw error;

      toast({
        title: "Question Submitted",
        description: "Your question has been submitted and will be reviewed by our team."
      });

      setFormData({
        content: '',
        title: ''
      });

      onPostCreated();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <MessageCircle className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Ask a Question</h3>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="What would you like to know about this property?"
              />
            </div>

            <div>
              <Label htmlFor="content">Your Question *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                placeholder="Please describe your question in detail..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Question
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              Your question will be reviewed and published by our moderators.
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <LogIn className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Login Required</h3>
              <p className="text-muted-foreground mb-4">
                You need to be logged in to ask questions about properties.
              </p>
              <Button onClick={() => navigate('/login')}>
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerForumPost;