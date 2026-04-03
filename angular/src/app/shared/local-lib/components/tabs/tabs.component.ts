import { Component, ContentChildren, model, QueryList } from '@angular/core';
import { TabComponent } from './tab/tab.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-tabs',
  imports: [FormsModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent extends AbstractRolesComponent {
  @ContentChildren(TabComponent, { descendants: true }) tabsList?: QueryList<TabComponent>;

  tabs = model<TabComponent[]>([]);
  fullWidth = model<boolean>(false);
  activeTab?: TabComponent;

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _location: Location,
  ) {
    super();
  }

  ngAfterContentInit(): void {
    this.tabs.set(this.tabsList?.toArray() ?? []);
    this.tabsList?.changes.subscribe(() => {
      this.tabs.set(this.tabsList?.toArray() ?? []);
    });
  }

  ngAfterViewInit(): void {
    const currentTabs = this.tabs();
    if (!currentTabs?.length) {
      return;
    }

    // Get fragment from ActivatedRoute (more reliable than window.location)
    const urlHash = this._route.snapshot.fragment;
    let activeTab: TabComponent | undefined;

    if (urlHash) {
      activeTab = currentTabs.find((tab) => tab.id === urlHash);
    }

    if (!activeTab) {
      activeTab = currentTabs.find((tab) => tab.active());
    }

    if (!activeTab) {
      activeTab = currentTabs[0];
    }

    // Only update active states, don't update URL on initial load
    // (the URL already has the correct hash if user navigated with one)
    this.setActiveTab(activeTab);
  }

  setActiveTab(selectedTab: TabComponent): void {
    this.tabs()?.forEach((tab) => {
      tab.active.set(tab === selectedTab);
    });
    this.updateUrlHash(selectedTab);
    this.activeTab = selectedTab;
  }

  private updateUrlHash(selectedTab: TabComponent): void {
    if (selectedTab.id) {
      const path = this._router.url.split('#')[0];
      this._location.replaceState(path, '', selectedTab.id);
    }
  }
}
