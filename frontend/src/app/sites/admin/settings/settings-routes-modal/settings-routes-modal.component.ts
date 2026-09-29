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

  /** The page being added, and whether the row for it is open. */
  readonly adding = signal(false);
  readonly newPath = signal('');
  readonly newVisibility = signal('ADMIN');

  /** Which page the "remove this row" button is waiting for confirmation on. */
  readonly removeConfirm = signal<number | null>(null);

  /**
   * Whether anything has actually been written.
   *
   * Adding and removing a page write immediately, so closing with Cancel after
   * one of those still has to tell the page behind to re-read - otherwise its
   * card would sit there counting a table that has changed underneath it.
   */
  private _wrote = false;

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

  /** Closes, telling the page behind whether it has anything to re-read. */
  dismiss(): void {
    this.closeModal(this._wrote);
  }

  save(): void {
    const changes: SiteRouteChange[] = this.changed().map((route) => ({
      id: route.id,
      visibility: this.of(route).visibility,
      blocked: this.of(route).blocked,
      endpoints: this.of(route).endpoints,
    }));

    if (!changes.length) {
      this.dismiss();
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

  // ── Adding and removing a page ─────────────────────────────────────────────
  //
  // Both write straight away rather than joining the draft the rest of the
  // form holds. Changing a page and adding one are different acts: Save is for
  // "these four rows now read like this", and folding a creation into it would
  // mean Discard could take a page away that had been sitting in the table for
  // a minute looking exactly like the others.

  startAdding(): void {
    this.newPath.set('');
    this.newVisibility.set('ADMIN');
    this.adding.set(true);
  }

  cancelAdding(): void {
    this.adding.set(false);
  }

  add(): void {
    const path = this.newPath().trim();

    if (!path || this.saving()) {
      return;
    }

    this.saving.set(true);

    this._api.addRoute({ path, visibility: this.newVisibility(), blocked: false }).subscribe({
      next: (list) => {
        this._wrote = true;
        this._adopt(list);
        this.saving.set(false);
        this.adding.set(false);
        this.notificationService.showSuccess('Page added.');
      },
      error: (error) => {
        this.saving.set(false);
        // The API refuses a path that is not one the router could declare, one
        // that is already here, and the three that are how somebody gets into
        // their account. Each says which and why, so that sentence is shown.
        this.notificationService.showError(error?.error?.error ?? 'That could not be added.');
      },
    });
  }

  askToRemove(id: number): void {
    this.removeConfirm.set(id);
  }

  cancelRemove(): void {
    this.removeConfirm.set(null);
  }

  /**
   * Stops governing a page rather than removing it from the site.
   *
   * A page with no row is public and always drawn, which is what everything
   * was before this table existed - so this is the undo for the button above,
   * and the way to let a seeded page go back to being nobody's business.
   */
  remove(route: AdminSiteRoute): void {
    this.saving.set(true);
    this.removeConfirm.set(null);

    this._api.deleteRoute(route.id).subscribe({
      next: (list) => {
        this._wrote = true;
        this._adopt(list);
        this.saving.set(false);
        this.notificationService.showSuccess('That page is no longer governed.');
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.showError(error?.error?.error ?? 'That could not be removed.');
      },
    });
  }

  /**
   * Takes the table the API just answered with.
   *
   * Unsaved edits to the other rows are kept: adding a page is not a reason to
   * throw away the two dropdowns somebody had already changed. Only rows that
   * are new to the draft get their saved values.
   */
  private _adopt(list: { routes: AdminSiteRoute[] }): void {
    const kept = this.draft();

    this.routes.set(list.routes);
    this.draft.set(
      Object.fromEntries(
        list.routes.map((route) => [
          route.id,
          kept[route.id] ?? { visibility: route.visibility, blocked: route.blocked, endpoints: [...route.endpoints] },
        ]),
      ),
    );
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
