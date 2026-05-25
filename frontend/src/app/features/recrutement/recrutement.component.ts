import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecrutementService } from '../../core/services/recrutement.service';
import { AuthService } from '../../core/services/auth.service';
import {
  PosteResponse, CandidatureResponse,
  PosteSaveRequest, CandidatureSaveRequest, StatutPoste, StatutCandidature
} from '../../core/models/recrutement.model';

const STATUT_POSTE: Record<StatutPoste, { label: string; color: string }> = {
  OUVERT:  { label: 'Ouvert',  color: 'bg-green-100 text-green-700' },
  FERME:   { label: 'Fermé',   color: 'bg-gray-100 text-gray-600' },
  POURVUE: { label: 'Pourvu',  color: 'bg-blue-100 text-blue-700' },
};

const STATUT_CAND: Record<StatutCandidature, { label: string; color: string; next: string | null }> = {
  RECU:         { label: 'Reçu',         color: 'bg-gray-100 text-gray-600',   next: 'Convoquer' },
  EN_ENTRETIEN: { label: 'En entretien', color: 'bg-orange-100 text-orange-700', next: 'Retenir' },
  RETENU:       { label: 'Retenu',       color: 'bg-green-100 text-green-700',  next: null },
  REJETE:       { label: 'Rejeté',       color: 'bg-red-100 text-red-700',      next: null },
};

@Component({
  selector: 'app-recrutement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Recrutement</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gestion des postes ouverts et suivi des candidatures</p>
    </div>
    @if (isAdmin) {
      <button (click)="openPosteForm(null)"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
        + Nouveau poste
      </button>
    }
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'postes'" [class]="tabClass('postes')">
        Postes
        <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              [ngClass]="tab === 'postes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
          {{ postes.length }}
        </span>
      </button>
      @if (isAdmin) {
        <button (click)="tab = 'candidatures'; chargerToutesCandidatures()" [class]="tabClass('candidatures')">
          Toutes les candidatures
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                [ngClass]="tab === 'candidatures' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
            {{ toutesCandidat.length }}
          </span>
        </button>
      }
    </nav>
  </div>

  <!-- Tab: Postes -->
  @if (tab === 'postes') {
    @if (loading) {
      <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
    } @else if (postes.length === 0) {
      <div class="p-8 text-center text-gray-400 text-sm">Aucun poste enregistré</div>
    } @else {
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (p of postes; track p.id) {
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <!-- Poste header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 truncate">{{ p.titre }}</h3>
                @if (p.departement) {
                  <p class="text-xs text-gray-500 mt-0.5">{{ p.departement }}</p>
                }
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                    [ngClass]="statutPosteColor(p.statut)">
                {{ statutPosteLabel(p.statut) }}
              </span>
            </div>

            @if (p.description) {
              <p class="text-sm text-gray-600 line-clamp-2">{{ p.description }}</p>
            }

            <!-- Stats -->
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span>Ouvert le {{ p.dateOuverture | date:'dd/MM/yyyy' }}</span>
              <span class="font-medium text-gray-700">{{ p.nbCandidatures }} candidature(s)</span>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              <button (click)="voirCandidatures(p)"
                      class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium">
                Candidatures
              </button>
              <button (click)="ouvrirNouvelleCandidat(p)"
                      class="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium">
                + Candidature
              </button>
              @if (isAdmin) {
                <button (click)="openPosteForm(p)"
                        class="px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded text-xs font-medium">
                  Modifier
                </button>
                @if (p.statut === 'OUVERT') {
                  <button (click)="fermer(p)"
                          class="px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-xs font-medium">
                    Fermer
                  </button>
                  <button (click)="pourvoir(p)"
                          class="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-medium">
                    Pourvoir
                  </button>
                }
                @if (p.statut === 'FERME') {
                  <button (click)="rouvrir(p)"
                          class="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium">
                    Rouvrir
                  </button>
                }
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Candidatures du poste sélectionné -->
    @if (posteSelectionne) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800">
            Candidatures — {{ posteSelectionne.titre }}
          </h3>
          <button (click)="posteSelectionne = null; candidaturesPoste = []"
                  class="text-xs text-gray-400 hover:text-gray-600">✕ Fermer</button>
        </div>
        @if (loadingCandidatures) {
          <div class="p-6 text-center text-gray-400 text-sm">Chargement…</div>
        } @else if (candidaturesPoste.length === 0) {
          <div class="p-6 text-center text-gray-400 text-sm">Aucune candidature pour ce poste</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-3 text-left">Candidat</th>
                <th class="px-4 py-3 text-left">Contact</th>
                <th class="px-4 py-3 text-center">Statut</th>
                <th class="px-4 py-3 text-left">Note</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (c of candidaturesPoste; track c.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ c.nomCandidat }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">
                    @if (c.email) { <div>{{ c.email }}</div> }
                    @if (c.lienCv) {
                      <a [href]="c.lienCv" target="_blank" class="text-blue-600 underline">CV</a>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                          [ngClass]="statutCandColor(c.statut)">
                      {{ statutCandLabel(c.statut) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ c.note || '—' }}</td>
                  <td class="px-4 py-3 text-right space-x-1">
                    @if (isAdmin) {
                      @if (statutCandNext(c.statut)) {
                        <button (click)="avancer(c)"
                                class="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium">
                          {{ statutCandNext(c.statut) }}
                        </button>
                      }
                      @if (c.statut !== 'RETENU' && c.statut !== 'REJETE') {
                        <button (click)="rejeter(c)"
                                class="px-2 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium">
                          Rejeter
                        </button>
                      }
                      <button (click)="supprimerCandidature(c)"
                              class="px-2 py-0.5 text-gray-400 hover:text-red-600 rounded text-xs">
                        ✕
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
  }

  <!-- Tab: Toutes les candidatures (ADMIN) -->
  @if (tab === 'candidatures') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loadingToutesCandidatures) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (toutesCandidat.length === 0) {
        <div class="p-8 text-center text-gray-400 text-sm">Aucune candidature enregistrée</div>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">Candidat</th>
              <th class="px-4 py-3 text-left">Poste</th>
              <th class="px-4 py-3 text-left">Contact</th>
              <th class="px-4 py-3 text-center">Statut</th>
              <th class="px-4 py-3 text-left">Note</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (c of toutesCandidat; track c.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-800">{{ c.nomCandidat }}</td>
                <td class="px-4 py-3 text-gray-600">{{ c.posteTitre }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">
                  @if (c.email) { <div>{{ c.email }}</div> }
                  @if (c.lienCv) {
                    <a [href]="c.lienCv" target="_blank" class="text-blue-600 underline">CV</a>
                  }
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                        [ngClass]="statutCandColor(c.statut)">
                    {{ statutCandLabel(c.statut) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ c.note || '—' }}</td>
                <td class="px-4 py-3 text-right space-x-1">
                  @if (statutCandNext(c.statut)) {
                    <button (click)="avancerGlobal(c)"
                            class="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium">
                      {{ statutCandNext(c.statut) }}
                    </button>
                  }
                  @if (c.statut !== 'RETENU' && c.statut !== 'REJETE') {
                    <button (click)="rejeterGlobal(c)"
                            class="px-2 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium">
                      Rejeter
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

</div>

<!-- Modal: Créer / Modifier poste -->
@if (showPosteForm) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ editPosteId ? 'Modifier le poste' : 'Nouveau poste' }}
      </h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Intitulé du poste <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="posteForm.titre"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="Ex: Développeur Full-Stack">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Département</label>
          <input type="text" [(ngModel)]="posteForm.departement"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="Ex: Informatique, Finance…">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea [(ngModel)]="posteForm.description" rows="4"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Missions, profil recherché…"></textarea>
        </div>
      </div>
      @if (posteErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ posteErr }}</p>
      }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closePosteForm()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarderPoste()"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          {{ savingPoste ? 'Enregistrement…' : (editPosteId ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </div>
  </div>
}

<!-- Modal: Nouvelle candidature -->
@if (showCandForm) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Nouvelle candidature</h2>
      @if (candPoste) {
        <p class="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          Poste : <span class="font-medium">{{ candPoste.titre }}</span>
        </p>
      }
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Nom du candidat <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="candForm.nomCandidat"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="Prénom NOM">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input type="email" [(ngModel)]="candForm.email"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="candidat@email.com">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Lien CV</label>
          <input type="url" [(ngModel)]="candForm.lienCv"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="https://…">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Note</label>
          <textarea [(ngModel)]="candForm.note" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Observations…"></textarea>
        </div>
      </div>
      @if (candErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ candErr }}</p>
      }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeCandForm()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarderCandidat()"
                class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          {{ savingCand ? 'Enregistrement…' : 'Soumettre' }}
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class RecrutementComponent implements OnInit {
  private svc  = inject(RecrutementService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  tab: 'postes' | 'candidatures' = 'postes';

  postes:     PosteResponse[]       = [];
  toutesCandidat: CandidatureResponse[] = [];
  candidaturesPoste: CandidatureResponse[] = [];
  posteSelectionne: PosteResponse | null = null;

  loading                  = false;
  loadingCandidatures      = false;
  loadingToutesCandidatures = false;

  // Poste form
  showPosteForm = false;
  editPosteId: string | null = null;
  posteForm: { titre: string; departement: string | null; description: string | null } =
    { titre: '', departement: null, description: null };
  posteErr   = '';
  savingPoste = false;

  // Candidature form
  showCandForm = false;
  candPoste: PosteResponse | null = null;
  candForm: { nomCandidat: string; email: string | null; lienCv: string | null; note: string | null } =
    { nomCandidat: '', email: null, lienCv: null, note: null };
  candErr   = '';
  savingCand = false;

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }

  ngOnInit(): void { this.chargerPostes(); }

  chargerPostes(): void {
    this.loading = true;
    this.svc.allPostes().subscribe({
      next: d => { this.postes = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  chargerToutesCandidatures(): void {
    this.loadingToutesCandidatures = true;
    this.svc.allCandidatures().subscribe({
      next: d => { this.toutesCandidat = d; this.loadingToutesCandidatures = false; this.cdr.markForCheck(); },
      error: () => { this.loadingToutesCandidatures = false; this.cdr.markForCheck(); }
    });
  }

  voirCandidatures(p: PosteResponse): void {
    this.posteSelectionne     = p;
    this.loadingCandidatures  = true;
    this.candidaturesPoste    = [];
    this.svc.candidaturesPoste(p.id).subscribe({
      next: d => { this.candidaturesPoste = d; this.loadingCandidatures = false; this.cdr.markForCheck(); },
      error: () => { this.loadingCandidatures = false; this.cdr.markForCheck(); }
    });
  }

  tabClass(t: string): string {
    return this.tab === t
      ? 'px-4 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600'
      : 'px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent';
  }

  statutPosteColor(s: StatutPoste): string  { return STATUT_POSTE[s]?.color ?? ''; }
  statutPosteLabel(s: StatutPoste): string  { return STATUT_POSTE[s]?.label ?? s; }
  statutCandColor(s: StatutCandidature): string { return STATUT_CAND[s]?.color ?? ''; }
  statutCandLabel(s: StatutCandidature): string { return STATUT_CAND[s]?.label ?? s; }
  statutCandNext(s: StatutCandidature): string | null { return STATUT_CAND[s]?.next ?? null; }

  // ── Poste form ─────────────────────────────────────────────────────────────

  openPosteForm(p: PosteResponse | null): void {
    this.editPosteId = p?.id ?? null;
    this.posteForm   = { titre: p?.titre ?? '', departement: p?.departement ?? null, description: p?.description ?? null };
    this.posteErr    = '';
    this.showPosteForm = true;
  }

  closePosteForm(): void { this.showPosteForm = false; }

  sauvegarderPoste(): void {
    if (!this.posteForm.titre.trim()) { this.posteErr = 'L\'intitulé du poste est obligatoire.'; return; }
    this.savingPoste = true;
    this.posteErr    = '';
    const req = { titre: this.posteForm.titre, departement: this.posteForm.departement, description: this.posteForm.description };
    const obs = this.editPosteId
      ? this.svc.updatePoste(this.editPosteId, req)
      : this.svc.createPoste(req);
    obs.subscribe({
      next: () => { this.savingPoste = false; this.showPosteForm = false; this.chargerPostes(); },
      error: (e: any) => { this.savingPoste = false; this.posteErr = e?.error?.message ?? 'Erreur.'; this.cdr.markForCheck(); }
    });
  }

  fermer(p: PosteResponse): void {
    this.svc.fermerPoste(p.id).subscribe({ next: () => this.chargerPostes() });
  }

  rouvrir(p: PosteResponse): void {
    this.svc.rouvrirPoste(p.id).subscribe({ next: () => this.chargerPostes() });
  }

  pourvoir(p: PosteResponse): void {
    if (!confirm(`Marquer le poste "${p.titre}" comme pourvu ?`)) return;
    this.svc.pourvoirPoste(p.id).subscribe({ next: () => this.chargerPostes() });
  }

  // ── Candidature form ───────────────────────────────────────────────────────

  ouvrirNouvelleCandidat(p: PosteResponse): void {
    this.candPoste = p;
    this.candForm  = { nomCandidat: '', email: null, lienCv: null, note: null };
    this.candErr   = '';
    this.showCandForm = true;
  }

  closeCandForm(): void { this.showCandForm = false; this.candPoste = null; }

  sauvegarderCandidat(): void {
    if (!this.candForm.nomCandidat.trim()) { this.candErr = 'Le nom du candidat est obligatoire.'; return; }
    this.savingCand = true;
    this.candErr    = '';
    const req = {
      posteId:     this.candPoste!.id,
      nomCandidat: this.candForm.nomCandidat,
      email:       this.candForm.email || null,
      lienCv:      this.candForm.lienCv || null,
      note:        this.candForm.note || null,
    };
    this.svc.createCandidature(req).subscribe({
      next: () => {
        this.savingCand = false;
        this.showCandForm = false;
        this.chargerPostes();
        if (this.posteSelectionne?.id === this.candPoste?.id) this.voirCandidatures(this.posteSelectionne!);
      },
      error: (e: any) => { this.savingCand = false; this.candErr = e?.error?.message ?? 'Erreur.'; this.cdr.markForCheck(); }
    });
  }

  avancer(c: CandidatureResponse): void {
    this.svc.avancer(c.id, { note: null }).subscribe({
      next: () => { if (this.posteSelectionne) this.voirCandidatures(this.posteSelectionne); }
    });
  }

  rejeter(c: CandidatureResponse): void {
    this.svc.rejeter(c.id, { note: null }).subscribe({
      next: () => { if (this.posteSelectionne) this.voirCandidatures(this.posteSelectionne); }
    });
  }

  avancerGlobal(c: CandidatureResponse): void {
    this.svc.avancer(c.id, { note: null }).subscribe({ next: () => this.chargerToutesCandidatures() });
  }

  rejeterGlobal(c: CandidatureResponse): void {
    this.svc.rejeter(c.id, { note: null }).subscribe({ next: () => this.chargerToutesCandidatures() });
  }

  supprimerCandidature(c: CandidatureResponse): void {
    if (!confirm(`Supprimer la candidature de ${c.nomCandidat} ?`)) return;
    this.svc.deleteCandidature(c.id).subscribe({
      next: () => { if (this.posteSelectionne) this.voirCandidatures(this.posteSelectionne); }
    });
  }
}
