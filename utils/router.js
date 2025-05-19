(() => {
    'use strict';

    const onPathChange = new Observable(null);
    window.onPathChange = onPathChange;

    let isValid = true;

    function init() {
        isRouterValid(ROUTER.routes);
        if (!isValid) {
            const route = getExceptionRoute('400');
            route.route.component.onShow(route.route, route.parameters);
            document.title = route.route.title;
            return;
        }

        // Handle initial hash or default to home
        if (!window.location.hash) {
            window.location.hash = '#/';
            onPathChange.value = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : window.location.hash;
        } else {
            loadRoute(window.location.hash);
            onPathChange.value = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : window.location.hash;
        }

        // Set up event listeners for navigation
        setupLinkInterceptionInterval();

        // Listen for hashchange event (browser back/forward button or hash changes)
        window.addEventListener('hashchange', () => {
            loadRoute(window.location.hash);
            onPathChange.value = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : window.location.hash;
        });
    }

    function isRouterValid(routes) {
        Object.values(routes).forEach((route) => {
            // check if route is valid
            if (route.path === null || route.path === undefined || !route.component || !route.title) {
                const missing_fields = [];
                if (route.path === null || route.path === undefined) missing_fields.push('path');
                if (!route.component) missing_fields.push('component');
                if (!route.title) missing_fields.push('title');
                console.error(`Missing: '${missing_fields.join(', ')}' ${missing_fields.length > 1 ? 'fields' : 'field'} for route: `, route);
                isValid = false;
                return;
            }
            // check if component is valid
            if (typeof route?.component?.onShow !== 'function' || typeof route?.component?.onHide !== 'function') {
                const missing_functions = [];
                if (typeof route?.component?.onShow !== 'function') missing_functions.push('onShow');
                if (typeof route?.component?.onHide !== 'function') missing_functions.push('onHide');
                console.error(`Missing: '${missing_functions.join(', ')}' ${missing_functions.length > 1 ? 'functions' : 'function'} in component for route: `, route);
                isValid = false;
                return;
            }
            route.component.onInit?.();
            if (route.children) {
                isRouterValid(route.children);
            }
        });
        return isValid;
    }

    function setupLinkInterceptionInterval() {
        let old_data_links = [];
        old_data_links = setupLinkInterception(old_data_links) ?? old_data_links;
        setInterval(() => {
            old_data_links = setupLinkInterception(old_data_links) ?? old_data_links;
        }, 1000);
    }

    function setupLinkInterception(old_data_links) {
        const data_links = document.querySelectorAll('[data-link]');
        if (old_data_links.length === data_links.length) return;
        console.log('Setting up data links');
        old_data_links.forEach((link) => {
            link.removeEventListener('click', dataLinkClick);
        });
        data_links.forEach((link) => {
            link.addEventListener('click', dataLinkClick);
        });
        return data_links;
    }

    function dataLinkClick(event) {
        const link = event.currentTarget;
        event.preventDefault();
        const hash = link.dataset.link.startsWith('/') ? `#${link.dataset.link}` : window.location.hash + `/${link.dataset.link}`;
        if (!window.location.hash.endsWith(link.dataset.link)) {
            window.location.hash = hash;
        } else {
            let newHash = hash.replace(link.dataset.link, '');
            newHash = newHash.endsWith('/') ? newHash.slice(0, -1) : newHash;
            newHash = newHash.endsWith('#') ? newHash + '/' : newHash;
            window.location.hash = newHash;
        }
    }

    function hideAll(routes) {
        (routes ?? [...ROUTER.routes, ...ROUTER.exception]).forEach((route) => {
            route.component.onHide();
            hideAll(route.children ?? []);
        });
    }

    function getExceptionRoute(code) {
        return { route: ROUTER.exception.find((item) => item.code === code), parameters: [] };
    }

    function getRoutes(paths, routes, result) {
        if (!result) result = [];
        if (!paths || paths.length === 0) return result;
        if (!routes && result.length === 0) routes = ROUTER.routes;
        const values = Object.values(routes ?? {});
        const parameters = [];
        const route = values.find((route) => {
            return route.path.split('/').every((path, i) => {
                if (path.startsWith(':')) parameters[path.slice(1)] = paths[i];
                else if (paths[i] !== path) return false;
                return true;
            });
        });
        if (route) {
            result.push({ route, parameters });
            getRoutes(paths.slice(route.path.split('/').length), route.children, result);
        } else {
            console.error(`Route not found: ${paths}`);
            result.length = 0;
            result.push(getExceptionRoute('404'));
        }
        return result;
    }

    function loadRoute(hash) {
        const tempHash = hash.startsWith('#/') ? hash.slice(2) : hash;
        const paths = tempHash.split('/');
        const routes = getRoutes(paths);

        hideAll();
        const route = routes.at(-1);
        route.route.component.onShow(route.route, route.parameters);

        document.title = routes.at(-1).route.title;
    }

    // Initialize router when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
})();
