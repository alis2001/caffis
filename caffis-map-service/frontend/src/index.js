import SimpleMapWidget from './components/SimpleMapWidget';

// Main export object
const CaffisMapWidget = {
  DraggableMapWidget: SimpleMapWidget,
  SimpleMapWidget: SimpleMapWidget
};

// Export for ES modules
export default CaffisMapWidget;
export { SimpleMapWidget as DraggableMapWidget };

// Ensure global availability
if (typeof window !== 'undefined') {
  window.CaffisMapWidget = CaffisMapWidget;
  
  // Also expose individual components
  window.CaffisMapWidget.DraggableMapWidget = SimpleMapWidget;
  window.CaffisMapWidget.SimpleMapWidget = SimpleMapWidget;
  
  // Debug logging
  console.log('✅ CaffisMapWidget exposed globally:', window.CaffisMapWidget);
}

// Return the main object for UMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaffisMapWidget;
}
