/**
 * Tooltips Component
 * Initializes and configures Bootstrap tooltips
 */

/**
 * Initializes tooltips throughout the application
 */
window.initializeTooltips = function () {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = [...tooltipTriggerList].map(tooltipTriggerEl => {
        // Apply configuration from APP_CONFIG
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            container: APP_CONFIG.tooltips.container || 'body',
            placement: tooltipTriggerEl.dataset.bsPlacement || APP_CONFIG.tooltips.placement || 'top',
            boundary: document.body,
            customClass: tooltipTriggerEl.dataset.bsCustomClass || APP_CONFIG.tooltips.customClass
        });
    });

    // Ensure tooltips are positioned correctly when scrolling
    document.addEventListener('scroll', () => {
        tooltips.forEach(tooltip => {
            if (tooltip._isShown()) {
                tooltip.update();
            }
        });
    }, { passive: true });

    console.log('Tooltips initialized:', tooltips.length);
}