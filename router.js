class Router {
    constructor(routes) {
        this.routes = routes;
        this.init();
    }

    init() {
        // Handle initial hash or default to home
        if (!window.location.hash) {
            window.location.hash = "#/";
        } else {
            this.loadRoute(window.location.hash);
        }

        // Set up event listeners for navigation
        this.setupLinkInterception();

        // Listen for hashchange event (browser back/forward button or hash changes)
        window.addEventListener("hashchange", () => {
            this.loadRoute(window.location.hash);
        });
    }

    setupLinkInterception() {
        // Intercept all clicks on links with the data-link attribute
        document.addEventListener("click", (e) => {
            const link = e.target.closest("[data-link]");
            if (link) {
                e.preventDefault();
                const hash = link.getAttribute("href");
                window.location.hash = hash;
            }
        });
    }

    loadRoute(hash) {
        // Default to home if hash doesn't exist in routes
        const route = this.routes[hash] || this.routes["#/"];

        // Update page title
        document.title = route.title || "Simple SPA";

        // Get the template element
        const template = document.getElementById(route.templateId);

        if (template) {
            // Clone the template content
            const content = template.content.cloneNode(true);

            // Update content
            const appElement = document.getElementById("app");
            appElement.innerHTML = "";
            appElement.appendChild(content);
        }

        // Update active link in navigation
        this.updateActiveLink(hash);

        // Setup any route-specific event handlers
        this.setupRouteHandlers(hash);
    }

    updateActiveLink(hash) {
        // Remove active class from all links
        document.querySelectorAll("#main-nav a").forEach((link) => {
            link.classList.remove("active");
        });

        // Add active class to current route link
        const activeLink = document.querySelector(`#main-nav a[href="${hash}"]`);
        if (activeLink) {
            activeLink.classList.add("active");
        }
    }

    setupRouteHandlers(hash) {
        // Example of setting up route-specific handlers
        if (hash === "#/contact") {
            const contactBtn = document.getElementById("contact-btn");
            if (contactBtn) {
                contactBtn.addEventListener("click", () => {
                    alert("Message sent!");
                });
            }
        }

        // You can add more route-specific handlers here
    }
}

// Initialize the router when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const router = new Router(ROUTES);
});