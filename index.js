/**
 * Main Application Entry Point
 * Initializes all components and sets up the application
 */

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initializing with config:', APP_CONFIG);
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.message, event.error);
});