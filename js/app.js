/**
 * Main Application Entry Point
 * Initializes all components and sets up the application
 */

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initializing with config:', APP_CONFIG);

    // Initialize UI components
    initializeMenu();
    initializeTooltips();

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