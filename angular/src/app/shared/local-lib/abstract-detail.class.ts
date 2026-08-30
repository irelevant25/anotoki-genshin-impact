import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractModalComponent } from './abstract-modal.class';

@Component({ template: '' })
export abstract class AbstractDetailComponent<T extends Record<string, any>> extends AbstractModalComponent {
  routeIdName: string = 'id';
  detailData?: Partial<T> = {};
  get id(): number | string | undefined {
    const id = this.route.snapshot.paramMap.get(this.routeIdName) ?? '';
    if (id === null) {
      console.error(`No id with name ${this.routeIdName} was found in route params`);
      return undefined;
    }
    return id;
  }

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override ngOnDestroy(): void {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.loadData$().subscribe({
      next: (result) => {
        this.detailData = this.mapData(result);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.detailData = undefined;
        this.loading.set(false);
        this.notificationService.showError(`Nastala chyba pri načítaní dat: ${e?.error?.message}`);
      },
    });
  }

  protected mapData(data: T): T | undefined {
    return data;
  }

  protected abstract loadData$(): Observable<T>;

  refresh(): void {
    this.loadData();
  }

  protected override onModalSuccess(): void {
    this.refresh();
  }
}
