import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LookupTableComponent, LookupTableConfig } from '../lookup-table/lookup-table.component';

/**
 * One lookup table's admin page. The route says which - its `data.lookup`, from
 * LOOKUP_PAGES in pages.ts - and the shared LookupTableComponent does the rest.
 *
 * Read once, from the snapshot: every lookup table is a route config of its
 * own, so going from one to another builds a new page rather than handing this
 * one a different table.
 */
@Component({
  selector: 'app-lookup-page',
  templateUrl: './lookup-page.component.html',
  styleUrl: './lookup-page.component.scss',
  imports: [LookupTableComponent],
})
export class LookupPageComponent {
  readonly config = inject(ActivatedRoute).snapshot.data['lookup'] as LookupTableConfig;
}
