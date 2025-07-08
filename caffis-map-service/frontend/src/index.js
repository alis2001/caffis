// src/index.js
import React from 'react';
import DraggableMapWidget from './components/DraggableMapWidget';

// Main export object
const CaffisMapWidget = {
  DraggableMapWidget,
  // Add other components if needed
};

// Export for ES modules
export default CaffisMapWidget;
export { DraggableMapWidget };

// Ensure global availability for UMD
if (typeof window !== 'undefined') {
  window.CaffisMapWidget = CaffisMapWidget;
  console.log('✅ CaffisMapWidget exposed globally');
}

// Return the main object for UMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaffisMapWidget;
}