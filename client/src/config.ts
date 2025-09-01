// Configuration for different environments
export const config = {
  // API base URL - changes based on environment
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://YOUR_ACTUAL_RENDER_URL.onrender.com'),
  
  // App settings
  appName: 'Climate Dashboard',
  version: '1.0.0',
  
  // Chart settings
  chartColors: {
    baseline: '#6b7280',
    speculative: '#7c3aed',
    temperature: '#dc2626',
    emissions: '#6b7280',
    seaLevel: '#0891b2',
    forest: '#059669',
    biodiversity: '#7c2d12'
  },
  
  // Climate constraints
  climateConstraints: {
    committedWarming: 1.5, // Minimum warming already locked in
    minEmissionsPercent: 15, // Minimum emissions from agriculture/natural processes
    committedSeaLevelRise: 0.3 // Committed rise from thermal expansion
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}${endpoint}`;
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
