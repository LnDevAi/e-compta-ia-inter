import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetComparatif, LigneComparatif, SensBudget } from '../../core/models/budget.model';

interface AddForm {
  compteNumero: string;
  montant: string;
  sens: SensBudget;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Budget et prévisions</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comparatif budget prévisionnel vs réalisé par compte comptable</p>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Exercice</label>
      <select [(ngModel)]="selectedExercice" (ngModelChange)="onExerciceChange($event)"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of exercices(); track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
    </div>
  </div>

  <!-- Summary cards -->
  @if (data()) {
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Budget total</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()!.totalBudget | number:'1.2-2' }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Réalisé</p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="data()!.totalRealise > data()!.totalBudget ? 'text-red-600' : 'text-blue-700'">
        {{ data()!.totalRealise | number:'1.2-2' }}
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Écart (budget - réalisé)</p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="data()!.totalEcart >= 0 ? 'text-green-600' : 'text-red-600'">
        {{ data()!.totalEcart | number:'1.2-2' }}
      </p>
    </div>
  </div>

  <!-- Global progress bar -->
  @if (data()!.totalBudget > 0) {
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">Consommation globale</span>
      <span class="text-sm font-bold"
            [ngClass]="globalPct() > 100 ? 'text-red-600' : globalPct() > 80 ? 'text-orange-500' : 'text-green-600'">
        {{ globalPct() | number:'1.1-1' }} %
      </span>
    </div>
    <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div class="h-3 rounded-full transition-all duration-500"
           [ngClass]="globalPct() > 100 ? 'bg-red-500' : globalPct() > 80 ? 'bg-orange-400' : 'bg-green-500'"
           [style.width.%]="globalPct() > 100 ? 100 : globalPct()">
      </div>
    </div>
  </div>
  }
  }

  <!-- Add budget line form -->
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <h2 class="text-sm font-semibold text-gray-700 mb-3">Ajouter / modifier une ligne budgétaire</h2>
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Compte <span class="text-red-500">*</span></label>
        <input [(ngModel)]="addForm.compteNumero" maxlength="20" placeholder="601000"
               class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Sens</label>
        <select [(ngModel)]="addForm.sens"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="DEBIT">Débit</option>
          <option value="CREDIT">Crédit</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Montant <span class="text-red-500">*</span></label>
        <input [(ngModel)]="addForm.montant" type="number" min="0" step="0.01" placeholder="0.00"
               class="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="saveLine()" [disabled]="saving()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
      @if (addError()) {
        <p class="text-xs text-red-600">{{ addError() }}</p>
      }
      @if (addSuccess()) {
        <p class="text-xs text-green-600">Ligne enregistrée.</p>
      }
    </div>
    <p class="text-xs text-gray-400 mt-2">
      Si une ligne pour ce compte/sens/exercice existe déjà, elle sera mise à jour.
    </p>
  </div>

  <!-- Lines table -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading()) {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
    } @else if (error()) {
      <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
    } @else if (!data() || data()!.lignes.length === 0) {
      <div class="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
        <span class="text-3xl">📊</span>
        <span>Aucune ligne budgétaire pour {{ selectedExercice }}. Ajoutez votre premier budget.</span>
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Compte</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Intitulé</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sens</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Réalisé</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Écart</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-48">Avancement</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (l of data()!.lignes; track l.budgetId) {
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-gray-700 font-medium">{{ l.compteNumero }}</td>
            <td class="px-4 py-3 text-gray-700 max-w-xs truncate">{{ l.intitule }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="l.sens === 'DEBIT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                {{ l.sens === 'DEBIT' ? 'Débit' : 'Crédit' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono text-gray-700">{{ l.budget | number:'1.2-2' }}</td>
            <td class="px-4 py-3 text-right font-mono"
                [ngClass]="l.realise > l.budget ? 'text-red-600 font-semibold' : 'text-gray-700'">
              {{ l.realise | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3 text-right font-mono font-semibold"
                [ngClass]="l.ecart >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ l.ecart | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 rounded-full"
                       [ngClass]="barColor(l.pctConsomme)"
                       [style.width.%]="l.pctConsomme > 100 ? 100 : l.pctConsomme">
                  </div>
                </div>
                <span class="text-xs font-medium w-12 text-right"
                      [ngClass]="l.pctConsomme > 100 ? 'text-red-600' : l.pctConsomme > 80 ? 'text-orange-500' : 'text-gray-500'">
                  {{ l.pctConsomme | number:'1.0-1' }}%
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <button (click)="prefillEdit(l)"
                      class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 mr-1">
                Modifier
              </button>
              <button (click)="deleteLine(l)"
                      class="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">
                Suppr.
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    }
  </div>

</div>
  `,
})
export class BudgetComponent implements OnInit {

  private svc = inject(BudgetService);

  exercices    = signal<number[]>([]);
  selectedExercice = new Date().getFullYear();

  data    = signal<BudgetComparatif | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  addForm: AddForm = { compteNumero: '', montant: '', sens: 'DEBIT' };
  saving     = signal(false);
  addError   = signal<string | null>(null);
  addSuccess = signal(false);

  ngOnInit() {
    this.svc.exercices().subscribe({ next: list => {
      this.exercices.set(list);
      if (list.length > 0 && !list.includes(this.selectedExercice)) {
        this.selectedExercice = list[0];
      }
      this.loadData();
    }});
  }

  onExerciceChange(y: number) {
    this.selectedExercice = +y;
    this.loadData();
  }

  loadData() {
    this.loading.set(true); this.error.set(null);
    this.svc.getComparatif(this.selectedExercice).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  saveLine() {
    const { compteNumero, montant, sens } = this.addForm;
    if (!compteNumero.trim() || !montant) {
      this.addError.set('Le compte et le montant sont obligatoires.'); return;
    }
    this.saving.set(true); this.addError.set(null); this.addSuccess.set(false);
    this.svc.upsert(this.selectedExercice, {
      compteNumero: compteNumero.trim(),
      montant: parseFloat(montant),
      sens,
    }).subscribe({
      next: () => {
        this.saving.set(false); this.addSuccess.set(true);
        this.addForm = { compteNumero: '', montant: '', sens: 'DEBIT' };
        setTimeout(() => this.addSuccess.set(false), 3000);
        this.loadData();
      },
      error: e => { this.saving.set(false); this.addError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  prefillEdit(l: LigneComparatif) {
    this.addForm = { compteNumero: l.compteNumero, montant: String(l.budget), sens: l.sens };
    this.addError.set(null); this.addSuccess.set(false);
  }

  deleteLine(l: LigneComparatif) {
    if (!confirm(`Supprimer la ligne budget pour ${l.compteNumero} ?`)) return;
    this.svc.delete(l.budgetId).subscribe({ next: () => this.loadData() });
  }

  globalPct(): number {
    const d = this.data();
    if (!d || d.totalBudget === 0) return 0;
    return (d.totalRealise / d.totalBudget) * 100;
  }

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-orange-400';
    return 'bg-green-500';
  }
}
