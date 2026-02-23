import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { Building2, MessageCircle, Package, FileText, Phone, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TopHeaderItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description?: string
}

const topHeaders: TopHeaderItem[] = [
  {
    id: 'properties',
    label: 'Properties',
    icon: Building2,
    path: '/properties',
    description: 'Browse property listings'
  },
  {
    id: 'articles',
    label: 'Articles',
    icon: FileText,
    path: '/articles',
    description: 'Read news and blog posts'
  },
  {
    id: 'forum',
    label: 'Forum',
    icon: MessageCircle,
    path: '/forum',
    description: 'Community discussions'
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: Package,
    path: '/packages',
    description: 'Service packages'
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Phone,
    path: '/about',
    description: 'Get in touch'
  }
]

interface TopHeadersProps {
  className?: string
  showFilters?: boolean
  onFilterChange?: (filters: Record<string, any>) => void
}

export const TopHeaders = ({ className, showFilters = false, onFilterChange }: TopHeadersProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Determine active header based on current path
  const getActiveHeader = () => {
    const path = location.pathname
    if (path === '/' || path.startsWith('/properties')) return 'properties'
    if (path.startsWith('/articles')) return 'articles'
    if (path.startsWith('/forum')) return 'forum'
    if (path.startsWith('/packages')) return 'packages'
    if (path.startsWith('/about') || path.startsWith('/contact')) return 'contact'
    return 'properties' // default
  }

  const activeHeader = getActiveHeader()

  const handleHeaderClick = (header: TopHeaderItem) => {
    // If we're already on the target page, don't navigate
    if (location.pathname === header.path) return

    // Navigate to the target page
    navigate(header.path)
  }

  const handleFilterToggle = () => {
    // This could be expanded to show/hide filters for the current section
    // For now, just a placeholder
  }

  return (
    <div className={cn("border-b border-border bg-background/50 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center items-center py-3">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-muted-foreground">Via</span>
              <span className="text-primary">Estate</span>
            </span>
          </Link>
        </div>

        {/* Desktop Headers */}
        <div className="hidden md:flex items-center justify-center space-x-1 py-3">
          {topHeaders.map((header) => {
            const Icon = header.icon
            const isActive = activeHeader === header.id

            return (
              <Button
                key={header.id}
                variant="ghost"
                size="sm"
                onClick={() => handleHeaderClick(header)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary text-primary-foreground shadow-sm border-primary"
                )}
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{header.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </Button>
            )
          })}
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex justify-center py-3">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">
              <span className="text-muted-foreground">Via</span>
              <span className="text-primary">Estate</span>
            </span>
          </Link>
        </div>

        {/* Mobile Headers */}
        <div className="md:hidden py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {topHeaders.map((header) => {
                const Icon = header.icon
                const isActive = activeHeader === header.id

                return (
                  <Button
                    key={header.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderClick(header)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    role="tab"
                    aria-selected={isActive}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{header.label}</span>
                  </Button>
                )
              })}
            </div>

            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilterToggle}
                className="ml-2 flex-shrink-0"
              >
                Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Header Description */}
        {showFilters && (
          <div className="py-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const activeItem = topHeaders.find(h => h.id === activeHeader)
                  const Icon = activeItem?.icon
                  return (
                    <>
                      {Icon && <Icon className="h-4 w-4 text-primary" />}
                      <span className="text-sm text-muted-foreground">
                        {activeItem?.description}
                      </span>
                    </>
                  )
                })()}
              </div>

              <Badge variant="secondary" className="text-xs">
                {topHeaders.find(h => h.id === activeHeader)?.label}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopHeaders