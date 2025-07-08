// components/map/MapboxMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import UserMarker from './UserMarker';
import { mapApi } from '../../services/mapApi';
import { ITALIAN_CITIES, formatDistance } from '../../utils/coordinates';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxMap = ({ 
  center = [14.2681, 40.8518], // Naples center
  zoom = 13,
  users = [],
  onUserClick,
  onVenueClick = (venue) => console.log('Venue clicked:', venue),
  className = "w-full h-full",
  mapboxToken
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const venueMarkersRef = useRef(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);

  // ============================================
  // MAP INITIALIZATION
  // ============================================

  useEffect(() => {
    if (map.current) return;

    if (!mapboxToken) {
      console.error('Mapbox token not provided');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom,
        attributionControl: false,
        logoPosition: 'bottom-left'
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
      }), 'top-right');

      map.current.on('load', () => {
        console.log('🗺️ Map loaded successfully');
        setMapLoaded(true);
        fetchNaplesVenues();
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.remove());
      venueMarkersRef.current.forEach(marker => marker.remove());
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, center, zoom]);

  // ============================================
  // FETCH NAPLES VENUES
  // ============================================

  const fetchNaplesVenues = async () => {
    try {
      setLoading(true);
      
      // Try to get real Naples venues from API
      const response = await mapApi.getNaplesVenues();
      
      if (response && response.venues) {
        setVenues(response.venues);
      } else {
        // Fallback to static Naples venues
        setVenues(getFallbackNaplesVenues());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues(getFallbackNaplesVenues());
      setLoading(false);
    }
  };

  // ============================================
  // FALLBACK NAPLES VENUES
  // ============================================

  const getFallbackNaplesVenues = () => [
    {
      id: 'gambrinus',
      name: 'Gran Caffè Gambrinus',
      latitude: 40.8378,
      longitude: 14.2488,
      rating: 4.2,
      userRatingsTotal: 2847,
      priceLevel: 3,
      address: 'Via Chiaia, 1, Napoli',
      openNow: true,
      types: ['cafe', 'restaurant'],
      description: 'Historic café since 1860, famous for Neapolitan pastries'
    },
    {
      id: 'scaturchio',
      name: 'Scaturchio',
      latitude: 40.8467,
      longitude: 14.2529,
      rating: 4.5,
      userRatingsTotal: 1542,
      priceLevel: 2,
      address: 'Piazza San Domenico Maggiore, Napoli',
      openNow: true,
      types: ['cafe', 'bakery'],
      description: 'Famous for sfogliatelle and traditional Neapolitan coffee'
    },
    {
      id: 'mexico',
      name: 'Caffè Mexico',
      latitude: 40.8534,
      longitude: 14.2558,
      rating: 4.3,
      userRatingsTotal: 987,
      priceLevel: 1,
      address: 'Via Toledo, Napoli',
      openNow: true,
      types: ['cafe'],
      description: 'Traditional Neapolitan espresso since 1970'
    },
    {
      id: 'centrale',
      name: 'Caffè Centrale',
      latitude: 40.8518,
      longitude: 14.2681,
      rating: 4.1,
      userRatingsTotal: 756,
      priceLevel: 2,
      address: 'Via Università, Napoli',
      openNow: true,
      types: ['cafe', 'bar'],
      description: 'Modern café with excellent cappuccino'
    },
    {
      id: 'nilo',
      name: 'Bar Nilo',
      latitude: 40.8472,
      longitude: 14.2553,
      rating: 4.4,
      userRatingsTotal: 632,
      priceLevel: 1,
      address: 'Via San Biagio dei Librai, Napoli',
      openNow: true,
      types: ['bar', 'cafe'],
      description: 'Famous for Maradona shrine and strong espresso'
    }
  ];

  // ============================================
  // ADD VENUE MARKERS
  // ============================================

  useEffect(() => {
    if (!map.current || !mapLoaded || venues.length === 0) return;

    // Clear existing venue markers
    venueMarkersRef.current.forEach(marker => marker.remove());
    venueMarkersRef.current.clear();

    venues.forEach(venue => {
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'venue-marker';
      markerEl.innerHTML = '☕';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background: ${getVenueColor(venue)};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        position: relative;
      `;

      // Add rating badge
      if (venue.rating) {
        const ratingBadge = document.createElement('div');
        ratingBadge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #FFD700;
          color: #333;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 8px;
          border: 1px solid white;
          min-width: 20px;
          text-align: center;
        `;
        ratingBadge.textContent = venue.rating.toFixed(1);
        markerEl.appendChild(ratingBadge);
      }

      // Hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.2)';
        markerEl.style.zIndex = '1000';
      });

      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.zIndex = '1';
      });

      // Create marker
      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map.current);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'venue-popup'
      }).setHTML(createVenuePopupHTML(venue));

      marker.setPopup(popup);

      // Click handler
      markerEl.addEventListener('click', () => {
        setSelectedVenue(venue);
        onVenueClick(venue);
      });

      venueMarkersRef.current.set(venue.id, marker);
    });
  }, [venues, mapLoaded, onVenueClick]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getVenueColor = (venue) => {
    const rating = venue.rating || 0;
    if (rating >= 4.5) return 'linear-gradient(45deg, #FFD700, #FFA500)'; // Gold
    if (rating >= 4.0) return 'linear-gradient(45deg, #32CD32, #228B22)'; // Green
    if (rating >= 3.5) return 'linear-gradient(45deg, #FF6347, #DC143C)'; // Orange-Red
    return 'linear-gradient(45deg, #8B4513, #A0522D)'; // Brown
  };

  const createVenuePopupHTML = (venue) => {
    const openStatus = venue.openNow === null ? '' : 
      venue.openNow ? '<span style="color: #10B981;">🟢 Aperto</span>' : 
      '<span style="color: #EF4444;">🔴 Chiuso</span>';

    return `
      <div style="padding: 16px; min-width: 280px; max-width: 350px;">
        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-weight: bold; font-size: 18px; color: #1F2937; margin: 0; line-height: 1.2;">${venue.name}</h3>
          ${venue.rating ? `
            <div style="display: flex; align-items: center; background: #FEF3C7; padding: 4px 8px; border-radius: 20px; margin-left: 8px;">
              <span style="color: #92400E; font-size: 14px; font-weight: bold;">⭐ ${venue.rating.toFixed(1)}</span>
              ${venue.userRatingsTotal ? `<span style="font-size: 12px; color: #6B7280; margin-left: 4px;">(${venue.userRatingsTotal})</span>` : ''}
            </div>
          ` : ''}
        </div>
        
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 12px 0;">📍 ${venue.address}</p>
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${venue.priceLevel ? `
              <span style="padding: 4px 8px; background: #DBEAFE; color: #1E40AF; border-radius: 20px; font-size: 12px;">
                ${'€'.repeat(venue.priceLevel)}
              </span>
            ` : ''}
            ${openStatus}
          </div>
        </div>
        
        ${venue.description ? `
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 16px 0; font-style: italic;">${venue.description}</p>
        ` : ''}
        
        <div style="display: flex; gap: 8px;">
          <button 
            onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(venue.name + ' ' + venue.address)}', '_blank')"
            style="flex: 1; background: #3B82F6; color: white; padding: 8px 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            📍 Google Maps
          </button>
          <button 
            onclick="window.handleVenueSelect && window.handleVenueSelect('${venue.id}')"
            style="flex: 1; background: linear-gradient(45deg, #F97316, #DC2626); color: white; padding: 8px 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;"
          >
            ☕ Seleziona
          </button>
        </div>
      </div>
    `;
  };

  // Global handler for popup buttons
  useEffect(() => {
    window.handleVenueSelect = (venueId) => {
      const venue = venues.find(v => v.id === venueId);
      if (venue) {
        setSelectedVenue(venue);
        onVenueClick(venue);
      }
    };

    return () => {
      delete window.handleVenueSelect;
    };
  }, [venues, onVenueClick]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`relative ${className} rounded-2xl overflow-hidden shadow-2xl`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🔍 Cercando i migliori caffè...</h3>
            <p className="text-gray-600">Caricamento caffè di Napoli</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && venues.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-orange-200 max-w-xs">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            🍕 Caffè di Napoli ({venues.length})
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs">⭐</div>
              <span>Rating ≥ 4.5 (Eccellente)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>
              <span>Rating ≥ 4.0 (Ottimo)</span>
            </div>
            <div className="text-xs text-gray-500 mt-3 border-t pt-2">
              🟢 Aperto ora • 🔴 Chiuso<br/>
              Clicca sui marker per dettagli
            </div>
          </div>
        </div>
      )}

      {/* Selected Venue Info */}
      {selectedVenue && (
        <div className="absolute top-4 left-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200 max-w-sm">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-gray-800">{selectedVenue.name}</h4>
            <button 
              onClick={() => setSelectedVenue(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {selectedVenue.rating && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                ⭐ {selectedVenue.rating.toFixed(1)}
              </span>
            )}
            {selectedVenue.priceLevel && (
              <span className="text-green-600">{'€'.repeat(selectedVenue.priceLevel)}</span>
            )}
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .venue-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 350px;
        }
        .venue-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
  );
};

export default MapboxMap;