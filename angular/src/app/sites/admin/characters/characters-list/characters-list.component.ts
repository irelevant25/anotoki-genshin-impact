import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';

@Component({
  selector: 'app-characters-list',
  templateUrl: './characters-list.component.html',
  styleUrls: ['./characters-list.component.scss'],
  imports: [CommonModule, RouterLink, ButtonComponent, LoaderComponent],
})
export class CharactersListComponent implements OnInit {
  characters = signal<any[]>([]);
  loading = signal(false);
  deleteConfirm = signal<number | null>(null);

  charactersOrderByVersion = computed(() => this.characters().sort((a, b) => b.version.localeCompare(a.version)));

  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);
  private readonly _router = inject(Router);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._api.getCharacters().subscribe({
      next: (data) => { this.characters.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this._notify.showError('Failed to load characters'); },
    });
  }

  edit(id: number): void {
    this._router.navigate(['/characters', id, 'edit']);
  }

  confirmDelete(id: number): void {
    this.deleteConfirm.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(id: number): void {
    this._api.deleteCharacter(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.load();
        this._notify.showSuccess('Character deleted');
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this._notify.showError(e?.error?.message ?? 'Failed to delete');
      },
    });
  }

  getRarityStars(rarity: number): string {
    return '★'.repeat(rarity);
  }
}
