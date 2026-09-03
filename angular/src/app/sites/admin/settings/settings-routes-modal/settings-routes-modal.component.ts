import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSiteRoute, RouteApiService, SiteRouteChange } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { VISIBILITY_LABELS } from '../settings-words';

/** A page as the form is holding it, before anything is saved. */
interface RouteDraft {
  visibility: string;
  blocked: boolean;
  endpoints: string[];
}

/**
 * Which pages exist, and who they exist for.
 *
 * Two separate decisions per page, which is why they are two controls rather
 * than one dropdown with "off" in it: "members only" and "off this week" are
 * different things, and a page can be either, both, or neither.
 *
 * The endpoints are the third, and they are folded away because they are the
 * one somebody almost never wants. A page switched off leaves the menu and
 * stops matching in the router, and its API carries on answering - which is
 * right for "that page is not finished", and wrong for "nobody may have this".
 * Naming an endpoint is the deliberate act that turns the sign into a lock, so
 * it takes a deliberate click to reach.
 */
@Component({
  selector: 'app-settings-routes-modal',
  templateUrl: './settings-routes-modal.component.html',
  styleUrls: ['./settings-routes-modal.component.scss'],
  imports: [FormsModule, ModalComponent, ButtonComponent],
})
export class SettingsRoutesModalComponent extends AbstractModalComponent {
  private readonly _api = inject(RouteApiService);

  readonly routes = signal<AdminSiteRoute[]>([]);
  readonly levels = signal<string[]>([]);
  readonly saving = signal(false);

  readonly draft = signal<Record<number, RouteDraft>>({});

  /** Which page's endpoint list is open. One at a time; the table is long. */
  readonly expanded = signal<number | null>(null);

  /** What is being typed into the open page's "add an endpoint" box. */
  readonly newEndpoint = signal('');

  /** Who a page is drawn for, in words. A level with no wording shows as itself. */
  label(level: string): string {
    return VISIBILITY_LABELS[level] ?? level;
  }

  readonly changed = computed(() => this.routes().filter((route) => this._differs(route)));

  /** Called by the page once it has handed the rows over. */
  start(): void {
    this.draft.set(
      Object.fromEntries(
        this.routes().map((route) => [route.id, { visibility: route.visibility, blocked: route.blocked, endpoints: [...route.endpoints] }]),
      ),
    );
  }

  of(route: AdminSiteRoute): RouteDraft {
    return this.draft()[route.id] ?? { visibility: route.visibility, blocked: route.blocked, endpoints: [] };
  }

  isChanged(route: AdminSiteRoute): boolean {
    return this._differs(route);
  }

  setVisibility(route: AdminSiteRoute, visibility: string): void {
    this._write(route, { visibility });
  }

  setBlocked(route: AdminSiteRoute, blocked: boolean): void {
    this._write(route, { blocked });
  }

  toggleEndpoints(route: AdminSiteRoute): void {
    this.newEndpoint.set('');
    this.expanded.set(this.expanded() === route.id ? null : route.id);
  }

  addEndpoint(route: AdminSiteRoute): void {
    const prefix = this.newEndpoint().trim().replace(/\/+$/, '');

    if (!prefix || this.of(route).endpoints.includes(prefix)) {
      return;
    }

    this._write(route, { endpoints: [...this.of(route).endpoints, prefix].sort() });
    this.newEndpoint.set('');
  }

  removeEndpoint(route: AdminSiteRoute, prefix: string): void {
    this._write(route, { endpoints: this.of(route).endpoints.filter((entry) => entry !== prefix) });
  }

  save(): void {
    const changes: SiteRouteChange[] = this.changed().map((route) => ({
      id: route.id,
      visibility: this.of(route).visibility,
      blocked: this.of(route).blocked,
      endpoints: this.of(route).endpoints,
    }));

    if (!changes.length) {
      this.closeModal();
      return;
    }

    this.saving.set(true);

    this._api.saveRoutes({ routes: changes }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess('Saved.');
        this.closeModal(true);
      },
      error: (error) => {
        this.saving.set(false);
        // The API refuses a prefix that would cover the way back in, and says
        // which one and why. That sentence is the whole answer, so it is shown
        // rather than replaced with "could not be saved".
        this.notificationService.showError(error?.error?.error ?? 'Those could not be saved.');
      },
    });
  }

  reset(): void {
    this.start();
    this.expanded.set(null);
  }

  private _write(route: AdminSiteRoute, patch: Partial<RouteDraft>): void {
    this.draft.update((draft) => ({ ...draft, [route.id]: { ...this.of(route), ...patch } }));
  }

  private _differs(route: AdminSiteRoute): boolean {
    const draft = this.of(route);

    return (
      draft.visibility !== route.visibility ||
      draft.blocked !== route.blocked ||
      draft.endpoints.join('\n') !== [...route.endpoints].sort().join('\n')
    );
  }
}
