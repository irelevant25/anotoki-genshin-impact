(() => {
    'use strict';
    
    function showNotification(message, type = 'info', duration = 3000, dismissible = true) {
        // Create the alert element
        const notificationElement = document.createElement('div');

        // Add Bootstrap classes
        notificationElement.classList.add(
            'alert',
            `alert-${type}`,
            'notification-toast',
            'd-flex',
            'align-items-center'
        );

        // Add appropriate role for accessibility
        notificationElement.setAttribute('role', 'alert');

        // Make it dismissible if requested
        if (dismissible) {
            notificationElement.classList.add('alert-dismissible', 'fade', 'show');

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.classList.add('btn-close');
            closeButton.setAttribute('data-bs-dismiss', 'alert');
            closeButton.setAttribute('aria-label', 'Close');

            closeButton.addEventListener('click', () => {
                fadeOutAndRemove(notificationElement);
            });

            notificationElement.appendChild(closeButton);
        }

        // Add an appropriate icon based on the alert type
        const icon = document.createElement('span');
        icon.classList.add('me-2');

        switch (type) {
            case 'success':
                icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                break;
            case 'danger':
                icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
                break;
            case 'warning':
                icon.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>';
                break;
            case 'info':
                icon.innerHTML = '<i class="bi bi-info-circle-fill"></i>';
                break;
            default:
                icon.innerHTML = '<i class="bi bi-bell-fill"></i>';
        }

        // Add message
        const textSpan = document.createElement('span');
        textSpan.textContent = message;

        notificationElement.appendChild(icon);
        notificationElement.appendChild(textSpan);

        // Apply custom styles using JavaScript
        Object.assign(notificationElement.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            maxWidth: '350px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
        });

        // Add to document body
        document.body.appendChild(notificationElement);

        // Animate in
        setTimeout(() => {
            notificationElement.style.opacity = '1';
            notificationElement.style.transform = 'translateY(0)';
        }, 10);

        // Set up automatic removal if duration > 0
        if (duration > 0) {
            setTimeout(() => {
                fadeOutAndRemove(notificationElement);
            }, duration);
        }
    }

    function fadeOutAndRemove(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';

        // Wait for animation to complete before removing
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    // Create notification container for stacking multiple notifications
    function createNotificationContainer() {
        let container = document.getElementById('notification-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '9999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            });
            document.body.appendChild(container);
        }

        return container;
    }

    // Add CSS for handling stacked notifications
    function addNotificationStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .notification-toast {
                margin-bottom: 10px;
                width: 100%;
            }
            
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-toast.show {
                animation: slide-in 0.3s forwards;
            }
            
            .notification-toast.hide {
                animation: slide-out 0.3s forwards;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Initialize notifications system
    function init() {
        addNotificationStyles();
        createNotificationContainer();
    }

    // Initialize when the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Examples of how to use the notification system:
    // Basic usage
    // showNotification('This is a basic notification');

    // Different types
    // showNotification('Operation successful!', 'success');
    // showNotification('Something went wrong!', 'danger');
    // showNotification('Warning: Low storage space', 'warning');
    // showNotification('New updates available', 'info');

    // Custom duration
    // showNotification('This will stay for 5 seconds', 'info', 5000);

    // Non-dismissible
    // showNotification('This cannot be dismissed manually', 'info', 3000, false);

    // Export to window to make it globally available
    window.showNotification = showNotification;
})();