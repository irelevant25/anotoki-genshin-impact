import { Roles } from './local-lib/services/options-helper.service';

export interface AlfRoutingNode extends Record<string, AlfRoutingNode | any> {
  // required options
  title: string;
  path: string;

  // optional options
  subTitle?: string;
  menuTitle?: string;
  notInMenu?: boolean;
  icon?: string;
  breadcrumb?: string;
  breadcrumbStatic?: boolean;
  roles?: Roles[];
  auth?: {
    entita?: string[];
  };
  clickable?: boolean;

  // post-processing options
  hasChildren?: boolean;
  fullPath?: string;
}

export interface MenuItem {
  id: number;
  isActive: boolean;
  isOpen: boolean;
  title: string;
  route?: string;
  roles: Roles[];
  children: MenuItem[];
  icon?: string;
}

export class AlfRoutingMap {
  map: AlfRoutingNode;
  menu: MenuItem[] = [];
  securityEntyties: string[] = [];

  private _idMenu: number = 0;

  constructor(d: AlfRoutingNode) {
    this.map = d;
    // make full paths
    this.buildMenuAndPaths(this.map, ''); // make paths
  }

  buildMenuAndPaths(routingNode: AlfRoutingNode, p: string, child?: boolean, parrentItem?: MenuItem): void {
    const sep = p === '/' ? '' : '/';
    routingNode.fullPath = p + sep + routingNode.path;
    // routingNode.hasChildren = this.hasChildren(routingNode);
    routingNode.menuTitle = routingNode.menuTitle ?? routingNode.title;

    const menuItem: MenuItem = {
      id: this._idMenu++,
      title: routingNode.menuTitle,
      route: routingNode.fullPath,
      children: [],
      roles: [],
      isActive: false,
      isOpen: false,
      icon: routingNode.icon,
    };

    // Pridanie auth entity do zoznamu
    routingNode.auth?.entita?.forEach((ent: string) => {
      if (!this.securityEntyties.includes(ent)) {
        this.securityEntyties.push(ent);
      }
    });

    if (this.hasRole(routingNode)) {
      menuItem.roles = routingNode.roles ?? [];
    }

    Object.entries(routingNode).forEach(([key, value], index) => {
      if (this.isAnAlfRoutingNode(value)) {
        if (routingNode.title === 'root') {
          this.buildMenuAndPaths(value, routingNode.fullPath ?? '', false, menuItem);
        } else {
          this.buildMenuAndPaths(value, routingNode.fullPath ?? '', true, menuItem);
        }
      }
    });

    if (!routingNode.notInMenu && routingNode.title !== 'root') {
      if (child) {
        parrentItem?.children?.push(menuItem);
        if (parrentItem && menuItem.roles && menuItem.roles.length > 0) {
          menuItem.roles.forEach((role) => {
            if (!parrentItem.roles?.includes(role)) {
              parrentItem.roles?.push(role);
            }
          });
        }
      } else {
        this.menu.push(menuItem);
      }
    }
  }

  getNodesItems(paths: string[]): AlfRoutingNode[] {
    const result: AlfRoutingNode[] = [];
    let currentLayer: AlfRoutingNode[] = Object.values(this.map);
    for (const path of paths) {
      const item = currentLayer.filter((item) => typeof item === 'object').find((i) => i.path === path);
      if (item) {
        result.push(item);
        currentLayer = Object.values(item);
      }
    }
    return result;
  }

  private isAnAlfRoutingNode(obj: unknown): obj is AlfRoutingNode {
    return Object.prototype.hasOwnProperty.call(obj, 'title') && Object.prototype.hasOwnProperty.call(obj, 'path');
  }

  private hasRole(obj: unknown): boolean {
    return Object.prototype.hasOwnProperty.call(obj, 'roles');
  }
}
