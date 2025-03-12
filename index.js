/**
 * Main Application Entry Point
 * Initializes all components and sets up the application
 */

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initializing with config:', APP_CONFIG);

    // Initialize data from storage
    document.body.style.backgroundImage = `url("${storageManager.getBackground() ?? 'assets/wallpaper/Fontaine.png'}")`;

    // Initialize UI components
    initializeTooltips();

    // Initialize quizzes
    initializeBanners();
    initializePixelate();
    initializeMismatch();
    initializeTournament();
    initializeMusic();

    // Set version display
    document.querySelector(`#${MENU_ITEMS_BOTTOM.versions.id}`).textContent = `v${CHANGELOG[0].version}`;

    console.log('Application initialization complete');
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.message, event.error);
});