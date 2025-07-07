import React from 'react';
import SimpleMapWidget from './components/SimpleMapWidget';

// Ensure the component is properly exported
console.log('📦 Loading SimpleMapWidget:', typeof SimpleMapWidget);

// Main export object
const CaffisMapWidget = {
  DraggableMapWidget: SimpleMapWidget,
  SimpleMapWidget: SimpleMapWidget
};

// Export for ES modules
export default CaffisMapWidget;
export { SimpleMapWidget as DraggableMapWidget };

// Ensure global availability for UMD
if (typeof window !== 'undefined') {
  window.CaffisMapWidget = CaffisMapWidget;
  
  // Also expose individual components directly
  window.CaffisMapWidget.DraggableMapWidget = SimpleMapWidget;
  window.CaffisMapWidget.SimpleMapWidget = SimpleMapWidget;
  
  // Direct access for debugging
  window.SimpleMapWidget = SimpleMapWidget;
  
  console.log('✅ CaffisMapWidget exposed globally:', {
    CaffisMapWidget: typeof window.CaffisMapWidget,
    SimpleMapWidget: typeof window.CaffisMapWidget?.SimpleMapWidget,
    DirectSimpleMapWidget: typeof window.SimpleMapWidget
  });
}

// Return the main object for UMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaffisMapWidget;
}