import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprobationService } from '../../core/services/approbation.service';
import { AuthService } from '../../core/services/auth.service';
import {
  EcritureEnAttenteResume,
  ApprobationResponse,
  DecisionRequest
} from '../../core/models/approbation.model';

@Component({
  selector: 'app-approbations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Workflow d'approbation</h1>
    <p class="text-sm text-gray-500 mt-0.5">Écritures en attente de validation (ADMIN)</p>
  </div>

  <!-- Liste EN_ATTENTE -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
      <span class="text-sm font-semibold text-gray-800">Écritures en attente</span>
      @if (enAttente.length > 0) {
        <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
          {{ enAttente.length }}
        </span>
      }
    </div>

    @if (loading) {
      <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
    } @else if (enAttente.length === 0) {
      <p class="text-sm text-gray-400 text-center py-10">Aucune écriture en attente de validation.</p>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2 text-left">Pièce</th>
            <th class="px-4 py-2 text-left">Date</th>
            <th class="px-4 py-2 text-left">Libellé</th>
            <th class="px-4 py-2 text-center">Journal</th>
            <th class="px-4 py-2 text-left">Soumis par</th>
            <th class="px-4 py-2 text-left">Soumis le</th>
            <th class="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (e of enAttente; track e.id) {
            <tr class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-2 font-mono text-xs font-semibold text-gray-800">{{ e.numeroPiece }}</td>
              <td class="px-4 py-2 text-gray-600">{{ e.dateEcriture | date:'dd/MM/yyyy' }}</td>
              <td class="px-4 py-2 text-gray-700 max-w-xs truncate">{{ e.libelle }}</td>
              <td class="px-4 py-2 text-center">
                <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                  {{ e.journal }}
                </span>
              </td>
              <td class="px-4 py-2 text-gray-600">{{ e.auteurNom }}</td>
              <td class="px-4 py-2 text-gray-400 text-xs">{{ e.soumisAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="px-4 py-2 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button (click)="ouvrirDecision(e, 'APPROUVEE')"
                          class="px-2 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50 font-medium">
                    ✓ Approuver
                  </button>
                  <button (click)="ouvrirDecision(e, 'REJETEE')"
                          class="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 font-medium">
                    ✗ Rejeter
                  </button>
                  <button (click)="voirHistorique(e.id)"
                          class="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                    Historique
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>

  <!-- Historique panel -->
  @if (selectedId) {
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-800">
          Historique des décisions — {{ selectedPiece }}
        </h2>
        <button (click)="selectedId = null"
                class="text-xs text-gray-400 hover:text-gray-600">Fermer</button>
      </div>
      @if (historique.length === 0) {
        <p class="text-sm text-gray-400">Aucune décision enregistrée.</p>
      } @else {
        <div class="divide-y divide-gray-100">
          @for (h of historique; track h.id) {
            <div class="py-2.5 flex items-start gap-3">
              <span class="mt-0.5 w-2 h-2 rounded-full shrink-0 mt-1.5"
                    [ngClass]="h.decision === 'APPROUVEE' ? 'bg-green-500' : 'bg-red-500'"></span>
              <div>
                <p class="text-sm font-medium"
                   [ngClass]="h.decision === 'APPROUVEE' ? 'text-green-700' : 'text-red-700'">
                  {{ h.decision }} par {{ h.approbateurNom }}
                </p>
                @if (h.commentaire) {
                  <p class="text-xs text-gray-500 mt-0.5">{{ h.commentaire }}</p>
                }
                <p class="text-xs text-gray-400 mt-0.5">{{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- Toast -->
  @if (toast) {
    <div class="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
         [ngClass]="toastError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'">
      {{ toast }}
    </div>
  }

  <!-- Modal décision -->
  @if (showDecision) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="closeDecision()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
           (click)="$event.stopPropagation()">
        <h2 class="text-lg font-semibold"
            [ngClass]="decisionForm.decision === 'APPROUVEE' ? 'text-green-700' : 'text-red-700'">
          {{ decisionForm.decision === 'APPROUVEE' ? '✓ Approuver' : '✗ Rejeter' }}
          l'écriture {{ selectedPiece }}
        </h2>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Commentaire {{ decisionForm.decision === 'REJETEE' ? '(obligatoire)' : '(optionnel)' }}
          </label>
          <textarea [(ngModel)]="decisionForm.commentaire" rows="3"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Motif, remarques…"></textarea>
        </div>

        @if (formError) {
          <p class="text-sm text-red-600">{{ formError }}</p>
        }

        <div class="flex justify-end gap-2">
          <button (click)="closeDecision()"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button (click)="confirmerDecision()" [disabled]="saving"
                  class="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                  [ngClass]="decisionForm.decision === 'APPROUVEE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'">
            {{ saving ? 'Enregistrement…' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class ApprobationsComponent implements OnInit {

  private svc  = inject(ApprobationService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  enAttente: EcritureEnAttenteResume[] = [];
  historique: ApprobationResponse[] = [];
  loading = false;

  selectedId:    string | null = null;
  selectedPiece: string = '';

  showDecision = false;
  decisionForm: DecisionRequest = { decision: 'APPROUVEE', commentaire: null };
  formError = '';
  saving = false;

  toast = '';
  toastError = false;

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.svc.enAttente().subscribe({
      next: d => { this.enAttente = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  voirHistorique(id: string) {
    const e = this.enAttente.find(x => x.id === id);
    this.selectedId    = id;
    this.selectedPiece = e?.numeroPiece ?? '';
    this.svc.historique(id).subscribe(h => {
      this.historique = h;
      this.cdr.detectChanges();
    });
  }

  ouvrirDecision(e: EcritureEnAttenteResume, decision: 'APPROUVEE' | 'REJETEE') {
    this.selectedId    = e.id;
    this.selectedPiece = e.numeroPiece;
    this.decisionForm  = { decision, commentaire: null };
    this.formError     = '';
    this.showDecision  = true;
  }

  closeDecision() { this.showDecision = false; }

  confirmerDecision() {
    if (this.decisionForm.decision === 'REJETEE' && !this.decisionForm.commentaire?.trim()) {
      this.formError = 'Un commentaire est requis pour un rejet.';
      return;
    }
    this.saving = true;
    this.svc.decider(this.selectedId!, this.decisionForm).subscribe({
      next: () => {
        this.saving = false;
        this.showDecision = false;
        this.enAttente = this.enAttente.filter(e => e.id !== this.selectedId);
        if (this.selectedId) this.voirHistorique(this.selectedId);
        const msg = this.decisionForm.decision === 'APPROUVEE'
          ? 'Écriture approuvée' : 'Écriture rejetée';
        this.showToast(msg);
        this.selectedId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.formError = 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }

  private showToast(msg: string, error = false) {
    this.toast = msg;
    this.toastError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
