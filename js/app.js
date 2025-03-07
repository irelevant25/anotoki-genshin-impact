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
    const lastVisitedVersion = storageManager.getLastVersion();
    const currentVersion = CHANGELOG[0].version;
    if (!lastVisitedVersion || lastVisitedVersion !== currentVersion) {
        loadChangelog([CHANGELOG[0]], 'whatsNewContent');
        const whatsNewModal = new bootstrap.Modal(document.getElementById('whatsNewModal'));
        whatsNewModal.show();
        storageManager.saveLastVersion(currentVersion);
    }

    // Initialize UI components
    initializeMenu();
    initializeTooltips();

    // Initialize quizzes
    initializeBannersQuiz();
    initializePixelateQuiz();
    initializeMismatchQuiz();
    initializeTournamentQuiz();

    // Set version display
    document.querySelector('#version').textContent = `v${CHANGELOG[0].version}`;

    console.log('Application initialization complete');
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.message, event.error);
});