import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { RoleService } from './services/role.service';
import { Roles } from './services/options-helper.service';
import { AlfRoutingNode } from '../routing.map';
import { ROUTE_MAP } from '../routing-definition';

function buildPathToRolesMap(node: AlfRoutingNode, parentPath: string = ''): Map<string, Roles[]> {
  const map = new Map<string, Roles[]>();

  Object.keys(node).forEach((key) => {
    // Skip non-route properties
    const nonRouteKeys = ['title', 'subtitle', 'path', 'roles', 'notInMenu', 'hasChildren', 'fullPath', 'subTitle', 'menuTitle', 'auth', 'breadcrumb', 'breadcrumbStatic', 'icon', 'clickable'];
    if (nonRouteKeys.includes(key)) {
      return;
    }

    const childNode = node[key];

    // Build the current path
    const currentPath = parentPath ? `${parentPath}/${childNode.path}` : childNode.path;

    // Store roles for this path if they exist
    if (childNode.roles && childNode.roles.length > 0) {
      map.set(`/${currentPath}`, childNode.roles);
    }

    // Recursively process children
    const childMap = buildPathToRolesMap(childNode, currentPath);
    childMap.forEach((roles, path) => map.set(path, roles));
  });

  return map;
}

// Build the map once when the module loads
const PATH_TO_ROLES_MAP = buildPathToRolesMap(ROUTE_MAP.map);

function matchesPattern(patternPath: string, actualPath: string): boolean {
  const patternParts = patternPath.split('/').filter((p) => p);
  const actualParts = actualPath.split('/').filter((p) => p);

  // Must have same number of segments
  if (patternParts.length !== actualParts.length) {
    return false;
  }

  // Check each segment
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const actualPart = actualParts[i];

    // If pattern part is a parameter (:id, :slug, etc.), it matches anything
    if (patternPart.startsWith(':')) {
      continue;
    }

    // Otherwise, must match exactly
    if (patternPart !== actualPart) {
      return false;
    }
  }

  return true;
}

export function getRolesForPath(path: string): Roles[] | undefined {
  // Remove query params and fragments
  const cleanPath = path.split('?')[0].split('#')[0];

  // Remove trailing slash
  const normalizedPath = cleanPath.endsWith('/') && cleanPath.length > 1 ? cleanPath.slice(0, -1) : cleanPath;

  // Try exact match first
  let roles = PATH_TO_ROLES_MAP.get(normalizedPath);
  if (roles) {
    return roles;
  }

  // Try with/without leading slash
  const altPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : `/${normalizedPath}`;
  roles = PATH_TO_ROLES_MAP.get(altPath);
  if (roles) {
    return roles;
  }

  // Try pattern matching for dynamic routes (e.g., :id)
  for (const [storedPath, storedRoles] of PATH_TO_ROLES_MAP.entries()) {
    // Only check paths that contain dynamic segments
    if (storedPath.includes(':')) {
      if (matchesPattern(storedPath, normalizedPath)) {
        return storedRoles;
      }
    }
  }

  // If no pattern match, try matching parent paths
  const pathParts = normalizedPath.split('/').filter((p) => p);

  // Start from the longest path and work backwards
  for (let i = pathParts.length - 1; i > 0; i--) {
    const partialPath = pathParts.slice(0, i).join('/');

    // Try without leading slash
    roles = PATH_TO_ROLES_MAP.get(partialPath);
    if (roles) {
      return roles;
    }

    // Try with leading slash
    roles = PATH_TO_ROLES_MAP.get(`/${partialPath}`);
    if (roles) {
      return roles;
    }
  }

  return undefined;
}

function getFullPath(route: ActivatedRouteSnapshot): string {
  const pathParts: string[] = [];

  // Traverse from root to current route
  let currentRoute: ActivatedRouteSnapshot | null = route;
  while (currentRoute) {
    if (currentRoute.url.length > 0) {
      // Add all URL segments for this route
      currentRoute.url.forEach((segment) => {
        pathParts.push(segment.path);
      });
    }
    currentRoute = currentRoute.parent;
  }

  // Reverse because we traversed from child to parent
  pathParts.reverse();

  // Build the full path
  const fullPath = `/${pathParts.join('/')}`;
  return fullPath;
}

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  // Build the full path from the route snapshot
  const fullPath = getFullPath(route);

  // Get roles from the route map based on the path
  const requiredRoles = getRolesForPath(fullPath);

  // If no roles are required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles using the service method
  const hasPermission = roleService.hasRole(...requiredRoles);

  if (!hasPermission) {
    console.warn('❌ Access denied: Insufficient permissions');
    console.warn('Route path:', fullPath);
    console.warn('Required roles:', requiredRoles);
    console.warn('User roles:', roleService.getRoles());
    router.navigate(['/unauthorized']); // or navigate to '/unauthorized'
    return false;
  }

  return true;
};
