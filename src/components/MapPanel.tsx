import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface MapPanelProps {
  properties: Tables<"properties">[];
  onPropertySelect?: (property: Tables<"properties">) => void;
  selectedProperty?: Tables<"properties"> | null;
}

const MapPanel = ({ properties, onPropertySelect, selectedProperty }: MapPanelProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    // Initialize map when component mounts
    if (mapRef.current && !map) {
      initializeMap();
    }

    return () => {
      // Cleanup map on unmount
      if (map) {
        map.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Update markers when properties change
    if (map && properties.length > 0) {
      updateMarkers();
    }
  }, [properties, map]);

  useEffect(() => {
    // Highlight selected property
    if (map && selectedProperty) {
      highlightSelectedProperty();
    }
  }, [selectedProperty, map]);

  const initializeMap = () => {
    // This is a placeholder for map initialization
    // In a real implementation, you would use Leaflet or Mapbox

    // Mock map object for demonstration
    const mockMap = {
      setView: (center: [number, number], zoom: number) => {
      },
      remove: () => {
      }
    };

    setMap(mockMap);

    // Center on Europe if no properties
    if (properties.length === 0) {
      mockMap.setView([50, 10], 4);
    } else {
      // Center on first property
      const firstProp = properties[0];
      if (firstProp.lat && firstProp.lon) {
        mockMap.setView([firstProp.lat, firstProp.lon], 10);
      }
    }
  };

  const updateMarkers = () => {
    // Clear existing markers and add new ones
    properties.forEach((property) => {
      if (property.lat && property.lon) {
        // In real implementation, create markers here
      }
    });
  };

  const highlightSelectedProperty = () => {
    if (selectedProperty && selectedProperty.lat && selectedProperty.lon) {
      // In real implementation, highlight the selected marker
      map?.setView([selectedProperty.lat, selectedProperty.lon], 15);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : 'h-96'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Map
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="w-full h-80 bg-muted rounded-b-lg relative overflow-hidden"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        >
          {/* Map placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Interactive map would be displayed here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {properties.length} properties loaded
              </p>
            </div>
          </div>

          {/* Property markers (mock) */}
          {properties.slice(0, 10).map((property, index) => (
            property.lat && property.lon && (
              <div
                key={property.id}
                className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 ${
                  selectedProperty?.id === property.id
                    ? 'bg-primary ring-2 ring-primary/50'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                style={{
                  left: `${((property.lon + 180) / 360) * 100}%`,
                  top: `${((90 - property.lat) / 180) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => onPropertySelect?.(property)}
                title={property.title}
              />
            )
          ))}
        </div>

        {/* Map controls */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-muted-foreground">
            Zoom in to see property details
          </div>
        </div>

        {/* Property count */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <div className="text-sm font-medium">
            {properties.length} properties
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPanel;