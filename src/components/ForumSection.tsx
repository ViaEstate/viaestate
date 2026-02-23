import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Eye, Clock, User, TrendingUp } from "lucide-react";

const ForumSection = () => {
  const forumPosts = [
    {
      id: 1,
      title: "Best neighborhoods to invest in Barcelona 2024",
      author: "MariaS_Investor",
      category: "Investment Tips",
      replies: 24,
      views: 1240,
      likes: 45,
      timeAgo: "2 hours ago",
      excerpt: "After analyzing market trends and rental yields, here are my top 5 neighborhoods...",
      trending: true
    },
    {
      id: 2,
      title: "Tax implications of buying property in Portugal as EU citizen",
      author: "TaxExpert_John",
      category: "Legal & Tax",
      replies: 18,
      views: 892,
      likes: 32,
      timeAgo: "5 hours ago",
      excerpt: "Understanding the Portuguese tax system for property purchases can be complex...",
      trending: false
    },
    {
      id: 3,
      title: "Renovation costs in Italian historic properties - my experience",
      author: "RenovationPro",
      category: "Renovation",
      replies: 31,
      views: 1560,
      likes: 58,
      timeAgo: "1 day ago",
      excerpt: "Just completed a major renovation of a 18th century villa in Tuscany. Here's what I learned...",
      trending: true
    },
    {
      id: 4,
      title: "French mortgage process for non-residents - step by step guide",
      author: "FrenchProperty_Guide",
      category: "Financing",
      replies: 12,
      views: 678,
      likes: 28,
      timeAgo: "2 days ago",
      excerpt: "Getting a mortgage in France as a non-resident has specific requirements...",
      trending: false
    }
  ];

  const categories = [
    { name: "Investment Tips", count: 245, color: "bg-blue-500" },
    { name: "Legal & Tax", count: 189, color: "bg-green-500" },
    { name: "Market Analysis", count: 156, color: "bg-purple-500" },
    { name: "Renovation", count: 134, color: "bg-orange-500" },
    { name: "Financing", count: 98, color: "bg-red-500" },
    { name: "Location Guides", count: 87, color: "bg-yellow-500" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Community <span className="text-primary">Forum</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with fellow investors, share experiences, and get expert advice 
            from our community of real estate professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Create Post Button */}
            <Card className="border-border mt-6">
              <CardContent className="p-4">
                <Button variant="hero" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Forum Posts */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {forumPosts.map((post) => (
                <Card key={post.id} className="border-border hover:shadow-elegant transition-smooth cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{post.category}</Badge>
                          {post.trending && (
                            <Badge variant="default" className="bg-primary/10 text-primary">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-smooth">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {post.author}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {post.timeAgo}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.replies} replies
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.views} views
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {post.likes} likes
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Posts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForumSection;