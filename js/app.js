/**
 * Main Application Entry Point
 * Initializes all components and sets up the application
 */

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initializing with config:', APP_CONFIG);

    // Initialize storage manager
    const storageManager = new StorageManager();
    window.storageManager = storageManager;
    console.log('Storage loaded with data:', storageManager.init());

    // Initialize data from storage
    document.body.style.backgroundImage = `url("${storageManager.getBackground() ?? 'assets/wallpaper/Fontaine.png'}")`;
    if (!storageManager.getLastVersion()) {
        renderVersionNotification();
        storageManager.saveLastVersion(CHANGELOG[0].version);
    }

    // Initialize UI components
    initializeMenu();
    initializeTooltips();
    initializeChangelog();

    // Initialize quizzes
    initializeBannersQuiz();
    initializePixelateQuiz();
    initializeMismatchQuiz();

    // Initialize background manager
    new BackgroundManager('background-image').init();

    // Set version display
    document.querySelector('.version').textContent = `v${CHANGELOG[0].version}`;

    console.log('Application initialization complete');
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.message, event.error);
});