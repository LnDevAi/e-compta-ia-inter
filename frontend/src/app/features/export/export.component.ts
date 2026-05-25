import {
  ChangeDetectionStrategy, Component, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../core/services/export.service';

interface ExportCard {
  id: string;
  titre: string;
  description: string;
  format: string;
  couleur: string;
  needsCompte?: boolean;
  needsExercice?: boolean;
}

@Component({
  selector: 'app-export',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-4xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Export comptable</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Téléchargez vos données en CSV (compatible Excel) ou au format FEC OHADA
    </p>
  </div>

  <!-- Paramètres communs -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <h2 class="text-sm font-semibold text-gray-700">Paramètres de la période</h2>
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Début</label>
        <input [(ngModel)]="debut" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Fin</label>
        <input [(ngModel)]="fin" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      @for (q of quickPeriods; track q.label) {
        <button (click)="debut = q.debut; fin = q.fin"
                class="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
          {{ q.label }}
        </button>
      }
    </div>
  </div>

  <!-- Grille d'exports -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <!-- Balance -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-gray-800 text-sm">Balance comptable</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Totaux débit/crédit/solde par compte sur la période
          </p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-mono">CSV</span>
      </div>
      <button (click)="exportBalance()" [disabled]="!debut || !fin"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        Télécharger la balance
      </button>
    </div>

    <!-- Écritures -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-gray-800 text-sm">Journal des écritures</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Toutes les écritures validées avec leurs lignes
          </p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-mono">CSV</span>
      </div>
      <button (click)="exportEcritures()" [disabled]="!debut || !fin"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        Télécharger les écritures
      </button>
    </div>

    <!-- Grand livre -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-gray-800 text-sm">Grand livre d'un compte</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Détail chronologique des mouvements sur un compte
          </p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-mono">CSV</span>
      </div>
      <div class="flex gap-2">
        <input [(ngModel)]="compte" type="text" placeholder="ex: 411000"
               class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button (click)="exportGrandLivre()" [disabled]="!debut || !fin || !compte.trim()"
                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
          Export
        </button>
      </div>
    </div>

    <!-- FEC -->
    <div class="bg-white rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-indigo-800 text-sm">FEC — Format OHADA</h3>
          <p class="text-xs text-indigo-600 mt-0.5">
            Fichier des Écritures Comptables, compatible avec les autorités fiscales
          </p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono">TXT</span>
      </div>
      <div class="flex gap-2 items-center">
        <div>
          <label class="block text-xs text-indigo-600 mb-1">Exercice</label>
          <input [(ngModel)]="exercice" type="number" [min]="2020" [max]="2030"
                 class="w-24 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <button (click)="exportFec()" [disabled]="!exercice"
                class="mt-4 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
          Exporter FEC
        </button>
      </div>
      <p class="text-xs text-indigo-400">
        Champs : JournalCode, EcritureDate, CompteNum, Debit, Credit, EcritureLet…
      </p>
    </div>

  </div>

  <!-- Info -->
  <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
    <p class="font-medium text-gray-600">Notes</p>
    <p>• Les exports CSV incluent un BOM UTF-8 pour une ouverture correcte dans Microsoft Excel.</p>
    <p>• Seules les écritures au statut <strong>Validée</strong> sont incluses dans les exports.</p>
    <p>• Le FEC suit le format DGFiP / OHADA (colonnes séparées par tabulations).</p>
  </div>

</div>
  `,
})
export class ExportComponent {

  private svc = inject(ExportService);

  debut    = '';
  fin      = '';
  compte   = '';
  exercice = new Date().getFullYear();

  quickPeriods = buildQuickPeriods();

  exportBalance()    { this.svc.balance(this.debut, this.fin); }
  exportEcritures()  { this.svc.ecritures(this.debut, this.fin); }
  exportGrandLivre() { this.svc.grandLivre(this.debut, this.fin, this.compte.trim()); }
  exportFec()        { this.svc.fec(this.exercice); }
}

function buildQuickPeriods() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const pad   = (n: number) => String(n).padStart(2, '0');
  const prev  = month === 0 ? { y: year - 1, m: 12 } : { y: year, m: month };
  return [
    { label: 'Mois en cours',   debut: `${year}-${pad(month + 1)}-01`,  fin: new Date(year, month + 1, 0).toISOString().slice(0, 10) },
    { label: 'Mois précédent',  debut: `${prev.y}-${pad(prev.m)}-01`,   fin: new Date(prev.y, prev.m, 0).toISOString().slice(0, 10) },
    { label: 'Année en cours',  debut: `${year}-01-01`,                  fin: `${year}-12-31` },
    { label: 'Année précédente',debut: `${year - 1}-01-01`,              fin: `${year - 1}-12-31` },
  ];
}
