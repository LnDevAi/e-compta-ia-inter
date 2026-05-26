import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CompteService } from '../../core/services/compte.service';
import { Compte, CLASSE_LABELS } from '../../core/models/compte.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

interface ClasseGroup { id: number; label: string; comptes: Compte[]; open: boolean; }

@Component({
  selector: 'app-plan-comptes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Plan de comptes</h2>
          <p class="text-xs text-gray-400 mt-0.5">
            Référentiel SYSCOHADA — {{ totalActifs() }} comptes actifs
            @if (totalInactifs() > 0) { · {{ totalInactifs() }} inactifs }
          </p>
        </div>
        <button (click)="showForm.set(!showForm())"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium rounded-lg transition">
          + Nouveau compte
        </button>
      </div>

      <!-- New account form -->
      @if (showForm()) {
        <div class="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Nouveau compte</h3>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="flex flex-wrap gap-3 items-end">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Numéro *</label>
              <input type="text" formControlName="numero" placeholder="ex: 521"
                     class="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="createForm.get('numero')!.invalid && createForm.get('numero')!.touched">
            </div>
            <div class="flex-1 min-w-52">
              <label class="block text-xs text-gray-500 mb-1">Intitulé *</label>
              <input type="text" formControlName="intitule" placeholder="Libellé du compte"
                     class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Classe *</label>
              <select formControlName="classe"
                      class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500">
                @for (g of groups(); track g.id) {
                  <option [value]="g.id">{{ g.id }} — {{ g.label }}</option>
                }
              </select>
            </div>
            <div class="flex gap-2">
              <button type="submit" [disabled]="createForm.invalid || saving()"
                      class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ saving() ? '...' : 'Créer' }}
              </button>
              <button type="button" (click)="showForm.set(false)"
                      class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </form>
          @if (createError()) {
            <p class="text-xs text-red-500 mt-2">{{ createError() }}</p>
          }
        </div>
      }

      <!-- Search + filter -->
      <div class="flex gap-3 items-center">
        <div class="relative flex-1 max-w-sm">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
                 placeholder="Rechercher par numéro ou intitulé..."
                 class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" [(ngModel)]="showInactifs" (ngModelChange)="reload()"
                 class="rounded">
          Afficher inactifs
        </label>
      </div>

      <!-- Grouped by classe -->
      @if (loading()) {
        <div class="flex justify-center py-12 text-gray-400 text-sm">Chargement...</div>
      } @else {
        <div class="space-y-3">
          @for (g of filteredGroups(); track g.id) {
            <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <!-- Classe header -->
              <button (click)="toggleGroupe(g)"
                      class="w-full flex items-center justify-between px-5 py-3
                             hover:bg-gray-50 transition text-left">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold
                               flex items-center justify-center">
                    {{ g.id }}
                  </span>
                  <span class="font-semibold text-gray-800 text-sm">Classe {{ g.id }} — {{ g.label }}</span>
                  <span class="text-xs text-gray-400">
                    {{ g.comptes.length }} compte{{ g.comptes.length > 1 ? 's' : '' }}
                  </span>
                </div>
                <span class="text-gray-400 text-xs">{{ g.open ? '▲' : '▼' }}</span>
              </button>

              @if (g.open) {
                <table class="w-full text-sm border-t border-gray-100">
                  <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th class="px-5 py-2 text-left w-28">Numéro</th>
                      <th class="px-5 py-2 text-left">Intitulé</th>
                      <th class="px-5 py-2 text-center w-20">Statut</th>
                      <th class="px-5 py-2 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    @for (c of g.comptes; track c.id) {
                      <tr class="hover:bg-gray-50" [class.opacity-40]="!c.actif">
                        <!-- Numero -->
                        <td class="px-5 py-2.5">
                          @if (editingId() === c.id) {
                            <input type="text" [(ngModel)]="editNumero"
                                   class="w-24 px-2 py-1 border border-blue-400 rounded text-xs
                                          focus:outline-none focus:ring-1 focus:ring-blue-500">
                          } @else {
                            <span class="font-mono font-semibold text-gray-900">{{ c.numero }}</span>
                          }
                        </td>
                        <!-- Intitulé -->
                        <td class="px-5 py-2.5">
                          @if (editingId() === c.id) {
                            <input type="text" [(ngModel)]="editIntitule"
                                   class="w-full px-2 py-1 border border-blue-400 rounded text-xs
                                          focus:outline-none focus:ring-1 focus:ring-blue-500">
                          } @else {
                            <span class="text-gray-700">{{ c.intitule }}</span>
                          }
                        </td>
                        <!-- Statut -->
                        <td class="px-5 py-2.5 text-center">
                          <span class="text-xs font-medium"
                                [class]="c.actif ? 'text-green-600' : 'text-gray-400'">
                            {{ c.actif ? 'Actif' : 'Inactif' }}
                          </span>
                        </td>
                        <!-- Actions -->
                        <td class="px-5 py-2.5 text-right">
                          @if (editingId() === c.id) {
                            <button (click)="saveEdit(c)"
                                    class="text-xs text-green-600 hover:text-green-800 mr-2">
                              ✓ Sauver
                            </button>
                            <button (click)="editingId.set(null)"
                                    class="text-xs text-gray-400 hover:text-gray-600">
                              ✕ Annuler
                            </button>
                          } @else {
                            <button (click)="startEdit(c)"
                                    class="text-xs text-blue-500 hover:text-blue-700 mr-3">
                              Modifier
                            </button>
                            <button (click)="toggle(c)"
                                    class="text-xs hover:underline"
                                    [class]="c.actif ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'">
                              {{ c.actif ? 'Désactiver' : 'Activer' }}
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          }

          @if (filteredGroups().length === 0) {
            <div class="text-center py-12 text-gray-400 text-sm">
              Aucun compte trouvé pour cette recherche
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PlanComptesComponent implements OnInit {

  private readonly service = inject(CompteService);
  private readonly fb      = inject(FormBuilder);
  private readonly search$ = new Subject<string>();

  loading     = signal(true);
  saving      = signal(false);
  showForm    = signal(false);
  createError = signal('');
  editingId   = signal<string | null>(null);
  editNumero  = '';
  editIntitule = '';
  searchQuery  = '';
  showInactifs = false;

  private allComptes = signal<Compte[]>([]);

  groups = computed<ClasseGroup[]>(() => {
    const comptes = this.allComptes();
    return Array.from({ length: 9 }, (_, i) => i + 1).map(id => ({
      id,
      label: CLASSE_LABELS[id],
      open: true,
      comptes: comptes.filter(c => c.classe === id && (this.showInactifs || c.actif))
    })).filter(g => g.comptes.length > 0);
  });

  filteredGroups = computed(() => this.groups());

  totalActifs   = computed(() => this.allComptes().filter(c => c.actif).length);
  totalInactifs = computed(() => this.allComptes().filter(c => !c.actif).length);

  createForm = this.fb.nonNullable.group({
    numero:   ['', Validators.required],
    intitule: ['', Validators.required],
    classe:   [1, [Validators.required, Validators.min(1), Validators.max(9)]]
  });

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.service.findAll(q || undefined))
    ).subscribe(list => {
      this.allComptes.set(list);
      this.loading.set(false);
    });
    this.reload();
  }

  onSearch(q: string) { this.search$.next(q); }

  reload() {
    this.loading.set(true);
    this.service.findAll(this.searchQuery || undefined).subscribe(list => {
      this.allComptes.set(list);
      this.loading.set(false);
    });
  }

  submitCreate() {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    this.createError.set('');
    this.service.create(this.createForm.getRawValue()).subscribe({
      next: (c) => {
        this.allComptes.update(list => [...list, c].sort((a, b) => a.numero.localeCompare(b.numero)));
        this.createForm.reset({ classe: 1 });
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (e) => {
        this.createError.set(e?.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      }
    });
  }

  startEdit(c: Compte) {
    this.editingId.set(c.id);
    this.editNumero   = c.numero;
    this.editIntitule = c.intitule;
  }

  saveEdit(c: Compte) {
    this.service.update(c.id, { numero: this.editNumero, intitule: this.editIntitule }).subscribe({
      next: (updated) => {
        this.allComptes.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editingId.set(null);
      },
      error: (e) => alert(e?.error?.detail ?? 'Erreur lors de la modification')
    });
  }

  toggle(c: Compte) {
    this.service.toggleActif(c.id).subscribe(updated => {
      this.allComptes.update(list => list.map(x => x.id === updated.id ? updated : x));
    });
  }

  toggleGroupe(g: ClasseGroup) { g.open = !g.open; }
}
