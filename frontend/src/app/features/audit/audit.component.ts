import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import {
  AuditEvent, AuditStats, PageResponse,
  ACTION_GROUPS, ACTION_LABELS, ACTION_COLORS, ENTITY_TYPES, ENTITY_LABELS
} from '../../core/models/audit.model';

@Component({
  selector: 'app-audit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Journal d'audit & traçabilité</h1>
      <p class="text-sm text-gray-500 mt-0.5">Historique complet de toutes les actions sur la plateforme</p>
    </div>
    <button (click)="charger(0)"
            class="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
      ↺ Actualiser
    </button>
  </div>

  <!-- Stats cards -->
  @if (stats()) {
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Total événements</p>
      <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats()!.totalEvents | number }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-400 uppercase tracking-wide">7 derniers jours</p>
      <p class="text-2xl font-bold text-blue-600 mt-1">{{ stats()!.eventsLast7Days | number }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-400 uppercase tracking-wide">30 derniers jours</p>
      <p class="text-2xl font-bold text-indigo-600 mt-1">{{ stats()!.eventsLast30Days | number }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Utilisateur le + actif</p>
      @if (stats()!.topUsers.length > 0) {
        <p class="text-sm font-semibold text-gray-800 mt-1 truncate" [title]="stats()!.topUsers[0].userEmail">
          {{ stats()!.topUsers[0].userEmail }}
        </p>
        <p class="text-xs text-gray-400">{{ stats()!.topUsers[0].count }} actions (30j)</p>
      } @else {
        <p class="text-sm text-gray-400 mt-1">—</p>
      }
    </div>
  </div>

  <!-- Top actions + top users -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Actions les plus fréquentes (30j)</h2>
      @if (stats()!.topActions.length === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
      } @else {
        @for (a of stats()!.topActions; track a.action) {
          <div class="flex items-center gap-2 mb-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-48 truncate"
                  [ngClass]="actionColor(a.action)">{{ actionLabel(a.action) }}</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-2 bg-blue-400 rounded-full"
                   [style.width.%]="barWidth(a.count, stats()!.topActions[0].count)"></div>
            </div>
            <span class="text-xs font-mono text-gray-500 w-8 text-right">{{ a.count }}</span>
          </div>
        }
      }
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Utilisateurs actifs (30j)</h2>
      @if (stats()!.topUsers.length === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
      } @else {
        @for (u of stats()!.topUsers; track u.userEmail) {
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs text-gray-600 w-44 truncate" [title]="u.userEmail">{{ u.userEmail }}</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-2 bg-emerald-400 rounded-full"
                   [style.width.%]="barWidth(u.count, stats()!.topUsers[0].count)"></div>
            </div>
            <span class="text-xs font-mono text-gray-500 w-8 text-right">{{ u.count }}</span>
          </div>
        }
      }
    </div>

  </div>
  }

  <!-- Filtres -->
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Action</label>
        <select [(ngModel)]="filtres.action" name="action"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
          <option value="">Toutes les actions</option>
          @for (g of actionGroups; track g.label) {
            <optgroup [label]="g.label">
              @for (a of g.actions; track a) {
                <option [value]="a">{{ actionLabel(a) }}</option>
              }
            </optgroup>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Type d'entité</label>
        <select [(ngModel)]="filtres.entityType" name="entityType"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]">
          <option value="">Tous les types</option>
          @for (t of entityTypes; track t) {
            <option [value]="t">{{ entityLabel(t) }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Utilisateur</label>
        <input [(ngModel)]="filtres.userEmail" name="user" type="email"
               placeholder="email@..."
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Du</label>
        <input [(ngModel)]="filtres.from" name="from" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Au</label>
        <input [(ngModel)]="filtres.to" name="to" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="charger(0)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        Filtrer
      </button>
      <button (click)="resetFiltres()"
              class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg">
        Réinitialiser
      </button>
    </div>
  </div>

  <!-- Tableau -->
  @if (page()) {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span class="text-sm text-gray-500">
          <span class="font-semibold text-gray-700">{{ page()!.totalElements | number }}</span> événement(s)
        </span>
        <span class="text-xs text-gray-400">
          Page {{ page()!.number + 1 }} / {{ page()!.totalPages || 1 }}
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left w-36">Date / Heure</th>
              <th class="px-4 py-3 text-left w-44">Utilisateur</th>
              <th class="px-4 py-3 text-left w-48">Action</th>
              <th class="px-4 py-3 text-left w-28">Type</th>
              <th class="px-4 py-3 text-left">Référence</th>
              <th class="px-4 py-3 text-left">Détails</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (ev of page()!.content; track ev.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {{ ev.createdAt | date:'dd/MM/yy HH:mm' }}
                </td>
                <td class="px-4 py-3 text-xs">
                  <span class="text-gray-700 truncate block max-w-[160px]" [title]="ev.userEmail">
                    {{ ev.userEmail }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="actionColor(ev.action)">
                    {{ actionLabel(ev.action) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {{ entityLabel(ev.entityType) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-gray-700 max-w-[160px] truncate"
                    [title]="ev.entityRef ?? ''">
                  {{ ev.entityRef ?? '—' }}
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate"
                    [title]="ev.details ?? ''">
                  {{ ev.details ?? '' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">
                  Aucun événement pour les filtres sélectionnés
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (page()!.totalPages > 1) {
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <button (click)="charger(page()!.number - 1)"
                  [disabled]="page()!.number === 0"
                  class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            ← Précédent
          </button>
          <div class="flex gap-1">
            @for (p of pageNumbers(); track p) {
              <button (click)="charger(p)"
                      class="px-2.5 py-1 text-xs rounded"
                      [ngClass]="p === page()!.number
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'">
                {{ p + 1 }}
              </button>
            }
          </div>
          <button (click)="charger(page()!.number + 1)"
                  [disabled]="page()!.number >= page()!.totalPages - 1"
                  class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            Suivant →
          </button>
        </div>
      }
    </div>
  } @else {
    <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
  }

</div>
  `
})
export class AuditComponent implements OnInit {

  private svc = inject(AuditService);

  page    = signal<PageResponse<AuditEvent> | null>(null);
  stats   = signal<AuditStats | null>(null);

  actionGroups = ACTION_GROUPS;
  entityTypes  = ENTITY_TYPES;

  filtres = { action: '', entityType: '', userEmail: '', from: '', to: '' };

  ngOnInit() {
    this.charger(0);
    this.loadStats();
  }

  charger(pageNum: number) {
    this.page.set(null);
    this.svc.lister({
      action:     this.filtres.action     || undefined,
      entityType: this.filtres.entityType || undefined,
      userEmail:  this.filtres.userEmail  || undefined,
      from:       this.filtres.from       || undefined,
      to:         this.filtres.to         || undefined,
      page: pageNum,
    }).subscribe({ next: p => this.page.set(p) });
  }

  loadStats() {
    this.svc.stats().subscribe({ next: s => this.stats.set(s) });
  }

  resetFiltres() {
    this.filtres = { action: '', entityType: '', userEmail: '', from: '', to: '' };
    this.charger(0);
  }

  pageNumbers(): number[] {
    const p = this.page();
    if (!p) return [];
    const total = p.totalPages;
    const cur   = p.number;
    const start = Math.max(0, cur - 2);
    const end   = Math.min(total - 1, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  barWidth(val: number, max: number): number {
    return max === 0 ? 0 : Math.min(100, (val / max) * 100);
  }

  actionLabel(action: string): string { return ACTION_LABELS[action] ?? action; }
  actionColor(action: string):  string { return ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600'; }
  entityLabel(type: string):    string { return ENTITY_LABELS[type] ?? type; }
}
