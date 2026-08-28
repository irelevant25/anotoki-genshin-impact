import { computed, Directive, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AbstractInputComponent } from '../../../shared/local-lib/abstract-input.class';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { TabsComponent } from '../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../shared/local-lib/components/tabs/tab/tab.component';

/**
 * Shared behaviour for the admin "full resource" forms: route id handling,
 * load / save lifecycle, and validation that can point at the offending field
 * even when it sits on a tab that is not showing.
 */
@Directive()
export abstract class AdminFormComponent<TFull> {
  @ViewChild(TabsComponent) private _tabs?: TabsComponent;
  @ViewChildren(TabComponent) private _tabList?: QueryList<TabComponent>;
  @ViewChildren(TabComponent, { read: ElementRef }) private _tabElements?: QueryList<ElementRef<HTMLElement>>;

  /** Singular, lower case - used in page titles and notifications. */
  abstract readonly entityLabel: string;

  isEdit = signal(false);
  entityId = signal<number | null>(null);
  loadingLookups = signal(true);
  loadingEntity = signal(false);
  saving = signal(false);

  loading = computed(() => this.loadingLookups() || this.loadingEntity());
  pageTitle = computed(() => `${this.isEdit() ? 'Edit' : 'Create'} ${this.entityLabel}`);
  backLink = computed(() => (this.isEdit() ? '../..' : '..'));

  protected readonly notify = inject(NotificationService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);

  /** Where the list lives, e.g. `/admin/enemies`. Used after a create. */
  protected abstract readonly listRoute: string;

  protected abstract fetch(id: number): Observable<TFull>;
  protected abstract create(payload: FormData): Observable<{ id: number }>;
  protected abstract update(id: number, payload: FormData): Observable<unknown>;
  /** Copies the loaded resource into the form signals. */
  protected abstract applyLoaded(data: TFull): void;
  protected abstract buildFormData(): FormData;

  /** Extra checks the inputs cannot express; return a message to block saving. */
  protected extraValidation(): string | undefined {
    return undefined;
  }

  /** Called before a reload replaces the form state - revoke object URLs here. */
  protected beforeReload(): void {
    // Override when the form holds object URLs.
  }

  protected initFromRoute(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.isEdit.set(true);
    this.entityId.set(Number(id));
    this.load(Number(id));
  }

  load(id: number): void {
    this.beforeReload();
    this.loadingEntity.set(true);
    this.fetch(id).subscribe({
      next: (data) => {
        this.applyLoaded(data);
        this.loadingEntity.set(false);
      },
      error: () => {
        this.loadingEntity.set(false);
        this.notify.showError(`Failed to load ${this.entityLabel.toLowerCase()}`);
      },
    });
  }

  save(): void {
    if (!this.validate()) {
      return;
    }

    this.saving.set(true);
    const payload = this.buildFormData();
    const id = this.entityId();
    const request = this.isEdit() && id !== null ? this.update(id, payload) : this.create(payload);

    request.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.notify.showSuccess(`${this.entityLabel} ${this.isEdit() ? 'updated' : 'created'}`);
        if (this.isEdit()) {
          this.load(this.entityId()!);
        } else {
          this.router.navigate([this.listRoute, (result as { id: number }).id, 'edit']);
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.notify.showError(error?.error?.error ?? error?.error?.message ?? `Failed to save ${this.entityLabel.toLowerCase()}`);
      },
    });
  }

  /** Touches every input in the form so errors become visible, then reports validity. */
  protected validate(): boolean {
    const root = this._elementRef.nativeElement as HTMLElement;
    const inputs = Array.from(AbstractInputComponent.registry).filter((input) => root.contains(input.elementRef.nativeElement));
    inputs.forEach((input) => input.markAsTouched());

    const invalid = inputs.filter((input) => !input.isValid());
    if (invalid.length > 0) {
      this.notify.showError(`Please fix ${invalid.length} invalid field${invalid.length === 1 ? '' : 's'} before saving.`);
      this.revealInput(invalid[0].elementRef.nativeElement);
      return false;
    }

    const extra = this.extraValidation();
    if (extra) {
      this.notify.showError(extra);
      return false;
    }
    return true;
  }

  /** Opens the tab holding the given element - tabs stay in the DOM, so it may be hidden. */
  protected revealInput(element: HTMLElement): void {
    const tabIndex = this._tabElements?.toArray().findIndex((tab) => tab.nativeElement.contains(element)) ?? -1;
    const tab = tabIndex >= 0 ? this._tabList?.get(tabIndex) : undefined;
    if (tab && this._tabs) {
      this._tabs.setActiveTab(tab);
    }
    setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
}
