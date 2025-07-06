// caffis-map-service/frontend/src/index.js
// Main entry point for Caffis Map Widget

// Import main components
import DraggableMapWidget from './components/DraggableMapWidget';
import MapboxMap from './components/map/MapboxMap';
import UserMarker from './components/map/UserMarker';
import UserProfilePopup from './components/ui/UserProfilePopup';
import AvailabilityToggle from './components/ui/AvailabilityToggle';

// Import hooks
import useMapSocket from './hooks/useMapSocket';
import useGeolocation from './hooks/useGeolocation';
import useMapbox from './hooks/useMapbox';

// Import services
import MapAPI from './services/mapApi';
import SocketClient from './services/socketClient';

// Import styles
import './styles/map-widget.css';
import './styles/mapbox-custom.css';

// Export all components and utilities
export {
  // Main component
  DraggableMapWidget,
  
  // Map components
  MapboxMap,
  UserMarker,
  UserProfilePopup,
  AvailabilityToggle,
  
  // Hooks
  useMapSocket,
  useGeolocation,
  useMapbox,
  
  // Services
  MapAPI,
  SocketClient
};

// Default export is the main widget
export default DraggableMapWidget;