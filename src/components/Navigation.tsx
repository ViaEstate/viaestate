import { Button } from "@/components/ui/button";
import { Search, User, Menu, Building2, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-muted-foreground">Via</span>
              <span className="text-primary">Estate</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/properties" className="text-foreground hover:text-primary transition-smooth">
              Properties
            </Link>
            <Link to="/packages" className="text-foreground hover:text-primary transition-smooth">
              Packages
            </Link>
            <Link to="/forum" className="text-foreground hover:text-primary transition-smooth">
              Forum
            </Link>
            {user && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-smooth">
                Dashboard
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-smooth">
                Admin
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {profile?.full_name}
                  </span>
                  {profile?.role && (
                    <Badge variant="secondary" className="text-xs">
                      {profile.role === 'broker' ? 'Broker' : profile.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate('/list-property')}>
                  List Property
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate('/list-property')}>
                  List Property
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/properties" 
                className="block px-3 py-2 text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Properties
              </Link>
              <Link 
                to="/packages" 
                className="block px-3 py-2 text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Packages
              </Link>
              <Link 
                to="/forum" 
                className="block px-3 py-2 text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Forum
              </Link>
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-2 text-foreground hover:text-primary transition-smooth"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-3 py-2 text-foreground hover:text-primary transition-smooth"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
              <div className="border-t border-border pt-4 pb-3">
                {user ? (
                  <div className="px-3 space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">{profile?.full_name}</p>
                      {profile?.role && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {profile.role === 'broker' ? 'Broker' : profile.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      <Button 
                        variant="hero" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          navigate('/list-property');
                          setIsMenuOpen(false);
                        }}
                      >
                        List Property
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-3 space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        navigate('/list-property');
                        setIsMenuOpen(false);
                      }}
                    >
                      List Property
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;