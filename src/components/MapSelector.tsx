import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, Locate } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MapSelectorProps {
  location: { lat: number; lng: number };
  onLocationChange: (location: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
}

// Buenaventura boundaries (approximate)
const BUENAVENTURA_BOUNDS = {
  north: 3.92,
  south: 3.84,
  east: -77.00,
  west: -77.08,
};

const BUENAVENTURA_CENTER = {
  lat: 3.8801,
  lng: -77.0312,
};

export function MapSelector({ location, onLocationChange, onAddressChange }: MapSelectorProps) {
  const [zoom, setZoom] = useState(13);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState<string>('Cargando dirección...');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;
        
        // Create the map
        if (mapContainerRef.current && !mapRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [location.lat, location.lng],
            zoom: zoom,
            zoomControl: false,
            maxBounds: [
              [BUENAVENTURA_BOUNDS.south - 0.05, BUENAVENTURA_BOUNDS.west - 0.05],
              [BUENAVENTURA_BOUNDS.north + 0.05, BUENAVENTURA_BOUNDS.east + 0.05]
            ],
            maxBoundsViscosity: 0.8,
            minZoom: 12,
            maxZoom: 18,
          });

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          // Custom marker icon
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="position: relative;">
              <svg width="40" height="50" viewBox="0 0 24 24" fill="#10b981" stroke="#fff" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3" fill="#fff"/>
              </svg>
            </div>`,
            iconSize: [40, 50],
            iconAnchor: [20, 50],
          });

          // Add marker
          const marker = L.marker([location.lat, location.lng], {
            icon: customIcon,
            draggable: true,
          }).addTo(map);

          // Handle marker drag
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            onLocationChange({ lat: position.lat, lng: position.lng });
            fetchAddress(position.lat, position.lng);
          });

          // Handle map click
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            onLocationChange({ lat, lng });
            fetchAddress(lat, lng);
          });

          mapRef.current = map;
          markerRef.current = marker;
          setMapLoaded(true);
          
          // Fetch initial address
          fetchAddress(location.lat, location.lng);
        }
      } catch {
        setMapLoaded(false);
      }
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when location prop changes
  useEffect(() => {
    if (markerRef.current && mapLoaded) {
      markerRef.current.setLatLng([location.lat, location.lng]);
      if (mapRef.current) {
        mapRef.current.panTo([location.lat, location.lng]);
      }
    }
  }, [location, mapLoaded]);

  // Fetch address from coordinates using Nominatim (OpenStreetMap)
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setAddress('Obteniendo dirección...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Format address for Buenaventura
        const addressParts = [];
        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.house_number) addressParts.push(`#${data.address.house_number}`);
        if (data.address.neighbourhood || data.address.suburb) {
          addressParts.push(data.address.neighbourhood || data.address.suburb);
        }
        if (addressParts.length === 0) {
          addressParts.push(data.address.city || 'Buenaventura');
        }
        addressParts.push('Buenaventura, Valle del Cauca');
        
        const finalAddress = addressParts.join(', ');
        setAddress(finalAddress);
        if (onAddressChange) {
          onAddressChange(finalAddress);
        }
      } else {
        const defaultAddress = 'Buenaventura, Valle del Cauca, Colombia';
        setAddress(defaultAddress);
        if (onAddressChange) {
          onAddressChange(defaultAddress);
        }
      }
    } catch {
      const defaultAddress = 'Buenaventura, Valle del Cauca, Colombia';
      setAddress(defaultAddress);
      if (onAddressChange) {
        onAddressChange(defaultAddress);
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
      setZoom(mapRef.current.getZoom());
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
      setZoom(mapRef.current.getZoom());
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([BUENAVENTURA_CENTER.lat, BUENAVENTURA_CENTER.lng], 13);
      onLocationChange(BUENAVENTURA_CENTER);
    }
  };



  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-lime-50 border-2 border-green-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-900">Ubicación del Problema *</span>
          </div>
          <Badge className="bg-green-100 text-green-800">
            <Locate className="w-3 h-3 mr-1" />
            Buenaventura
          </Badge>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-80 bg-gradient-to-br from-green-100 to-yellow-100 rounded-lg overflow-hidden border-2 border-green-300">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
            style={{ background: '#e0f2fe' }}
          />
          
          {/* Map Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleZoomIn}
              className="bg-white hover:bg-green-50 shadow-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleZoomOut}
              className="bg-white hover:bg-green-50 shadow-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleRecenter}
              className="bg-white hover:bg-green-50 shadow-lg"
              title="Centrar en Buenaventura"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {/* Instructions overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-3 z-[999]">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta
            </p>
          </div>
        </div>

        {/* Address Display */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Dirección seleccionada:</p>
              <p className="text-sm text-green-900">{address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet CSS - Inline styles */}
      <style>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 0.5rem;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-control-attribution {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.7);
          padding: 2px 5px;
        }
        .leaflet-tile-pane {
          filter: saturate(0.9) brightness(1.05);
        }
      `}</style>
    </Card>
  );
}
