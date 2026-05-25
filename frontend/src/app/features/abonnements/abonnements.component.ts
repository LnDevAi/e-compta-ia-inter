import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbonnementService } from '../../core/services/abonnement.service';
import { AbonnementResume, AbonnementResponse, AbonnementSaveRequest, Periodicite } from '../../core/models/abonnement.model';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Abonnements & facturation récurrente</h1>
      <p class="text-sm text-gray-500 mt-0.5">Contrats récurrents avec génération automatique de factures</p>
    </div>
    <button (click)="openForm()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
      + Nouvel abonnement
    </button>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading) {
      <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
    } @else if (abonnements.length === 0) {
      <p class="text-sm text-gray-400 text-center py-10">Aucun abonnement défini.</p>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2 text-left">Nom</th>
            <th class="px-4 py-2 text-left">Tiers</th>
            <th class="px-4 py-2 text-center">Périodicité</th>
            <th class="px-4 py-2 text-right">Montant TTC</th>
            <th class="px-4 py-2 text-center">Prochaine échéance</th>
            <th class="px-4 py-2 text-center">Statut</th>
            <th class="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (a of abonnements; track a.id) {
            <tr class="border-t border-gray-100 hover:bg-gray-50"
                [ngClass]="!a.actif ? 'opacity-50' : ''">
              <td class="px-4 py-2 font-medium text-gray-800">{{ a.nom }}</td>
              <td class="px-4 py-2 text-gray-500">{{ a.nomTiers ?? '—' }}</td>
              <td class="px-4 py-2 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="periodClass(a.periodicite)">
                  {{ a.periodicite }}
                </span>
              </td>
              <td class="px-4 py-2 text-right font-semibold text-gray-900">{{ fmt(a.montantTtc) }}</td>
              <td class="px-4 py-2 text-center"
                  [ngClass]="isOverdue(a.prochaineEcheance) ? 'text-red-600 font-semibold' : 'text-gray-600'">
                {{ a.prochaineEcheance | date:'dd/MM/yyyy' }}
                @if (isOverdue(a.prochaineEcheance) && a.actif) {
                  <span class="ml-1 text-xs">⚠</span>
                }
              </td>
              <td class="px-4 py-2 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="a.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ a.actif ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button (click)="editAbonnement(a.id)"
                          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50">
                    Modifier
                  </button>
                  @if (a.actif) {
                    <button (click)="generer(a.id)"
                            class="px-2 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50">
                      Générer
                    </button>
                  }
                  <button (click)="toggleActif(a)"
                          class="px-2 py-1 text-xs rounded border"
                          [ngClass]="a.actif ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'">
                    {{ a.actif ? 'Désactiver' : 'Activer' }}
                  </button>
                  <button (click)="supprimer(a.id)"
                          class="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>

  <!-- Toast -->
  @if (toast) {
    <div class="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
         [ngClass]="toastError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'">
      {{ toast }}
    </div>
  }

  <!-- Modal -->
  @if (showForm) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="closeForm()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
           (click)="$event.stopPropagation()">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ editId ? 'Modifier l\'abonnement' : 'Nouvel abonnement' }}
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <!-- Nom -->
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
            <input [(ngModel)]="form.nom" type="text" required
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Description -->
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input [(ngModel)]="form.description" type="text"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Périodicité -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Périodicité *</label>
            <select [(ngModel)]="form.periodicite"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="MENSUEL">Mensuel</option>
              <option value="TRIMESTRIEL">Trimestriel</option>
              <option value="ANNUEL">Annuel</option>
            </select>
          </div>

          <!-- Compte produit -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Compte produit</label>
            <input [(ngModel)]="form.compteProduit" type="text" placeholder="706"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Montant HT -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Montant HT *</label>
            <input [(ngModel)]="form.montantHt" type="number" min="0" step="0.01"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Taux TVA -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Taux TVA %</label>
            <input [(ngModel)]="form.tauxTva" type="number" min="0" step="0.01"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Date début -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date début *</label>
            <input [(ngModel)]="form.dateDebut" type="date"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Date fin -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
            <input [(ngModel)]="form.dateFin" type="date"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Prochaine échéance -->
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Prochaine échéance *</label>
            <input [(ngModel)]="form.prochaineEcheance" type="date"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>
        </div>

        @if (formError) {
          <p class="text-sm text-red-600">{{ formError }}</p>
        }

        <div class="flex justify-end gap-2 pt-2">
          <button (click)="closeForm()"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button (click)="save()" [disabled]="saving"
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class AbonnementsComponent implements OnInit {

  private svc = inject(AbonnementService);
  private cdr = inject(ChangeDetectorRef);

  abonnements: AbonnementResume[] = [];
  loading = false;
  showForm = false;
  editId: string | null = null;
  saving = false;
  formError = '';
  toast = '';
  toastError = false;

  form: AbonnementSaveRequest = this.emptyForm();

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.svc.list().subscribe({
      next: d => { this.abonnements = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openForm() {
    this.editId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.showForm = true;
  }

  editAbonnement(id: string) {
    this.svc.get(id).subscribe(a => {
      this.editId = id;
      this.form = {
        nom: a.nom,
        description: a.description,
        periodicite: a.periodicite,
        montantHt: a.montantHt,
        tauxTva: a.tauxTva,
        compteProduit: a.compteProduit,
        tiersId: a.tiersId,
        dateDebut: a.dateDebut,
        dateFin: a.dateFin,
        prochaineEcheance: a.prochaineEcheance
      };
      this.formError = '';
      this.showForm = true;
      this.cdr.detectChanges();
    });
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.nom || !this.form.montantHt || !this.form.dateDebut || !this.form.prochaineEcheance) {
      this.formError = 'Veuillez remplir les champs obligatoires.';
      return;
    }
    this.saving = true;
    const obs = this.editId
      ? this.svc.update(this.editId, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.charger();
        this.showToast('Abonnement enregistré');
      },
      error: () => {
        this.saving = false;
        this.formError = 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleActif(a: AbonnementResume) {
    this.svc.toggle(a.id).subscribe(() => {
      a.actif = !a.actif;
      this.showToast(a.actif ? 'Abonnement activé' : 'Abonnement désactivé');
      this.cdr.detectChanges();
    });
  }

  generer(id: string) {
    this.svc.generer(id).subscribe({
      next: f => this.showToast('Facture ' + f.numero + ' générée'),
      error: () => this.showToast('Erreur lors de la génération', true)
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cet abonnement ?')) return;
    this.svc.delete(id).subscribe(() => {
      this.abonnements = this.abonnements.filter(a => a.id !== id);
      this.showToast('Abonnement supprimé');
      this.cdr.detectChanges();
    });
  }

  isOverdue(date: string): boolean {
    return new Date(date) < new Date();
  }

  periodClass(p: string): string {
    if (p === 'MENSUEL')     return 'bg-blue-100 text-blue-700';
    if (p === 'TRIMESTRIEL') return 'bg-purple-100 text-purple-700';
    return 'bg-indigo-100 text-indigo-700';
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private emptyForm(): AbonnementSaveRequest {
    const today = new Date().toISOString().split('T')[0];
    return {
      nom: '', description: null, periodicite: 'MENSUEL',
      montantHt: 0, tauxTva: 18, compteProduit: null,
      tiersId: null, dateDebut: today, dateFin: null, prochaineEcheance: today
    };
  }

  private showToast(msg: string, error = false) {
    this.toast = msg;
    this.toastError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
