import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  inject, OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { DashboardGlobalService } from '../../core/services/dashboard-global.service';
import {
  DashboardGlobal, Alerte, MOIS_COURTS
} from '../../core/models/dashboard-global.model';

Chart.register(...registerables);

const PALETTE = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6'
];

@Component({
  selector: 'app-pilotage-global',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord dirigeant</h1>
      <p class="text-sm text-gray-500 mt-0.5">Vue consolidée — financier · budgets · analytique · alertes</p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="exercice" (ngModelChange)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
      </select>
      <button (click)="charger()" [disabled]="loading()"
              class="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40">
        ↺ Actualiser
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-64 text-gray-400">Chargement…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-64 text-red-500">{{ error() }}</div>
  } @else if (d()) {

  <!-- ═══ ALERTES ══════════════════════════════════════════════════════════ -->
  @if (d()!.alertes.length > 0) {
  <div class="flex flex-wrap gap-2">
    @for (a of d()!.alertes; track a.type) {
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border"
           [ngClass]="alerteClass(a)">
        <span>{{ alerteIcon(a) }}</span>
        <span>{{ a.message }}</span>
      </div>
    }
  </div>
  }

  <!-- ═══ KPI FINANCIERS ════════════════════════════════════════════════════ -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Chiffre d'affaires</p>
      <p class="text-2xl font-bold text-blue-700 mt-1 font-mono">{{ fmt(d()!.financier.ca) }}</p>
      <p class="text-xs mt-1" [ngClass]="deltaClass(d()!.financier.ca, d()!.financierN1.ca)">
        {{ deltaFmt(d()!.financier.ca, d()!.financierN1.ca) }} vs N-1
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Charges</p>
      <p class="text-2xl font-bold text-orange-600 mt-1 font-mono">{{ fmt(d()!.financier.charges) }}</p>
      <p class="text-xs mt-1" [ngClass]="deltaClassInverse(d()!.financier.charges, d()!.financierN1.charges)">
        {{ deltaFmt(d()!.financier.charges, d()!.financierN1.charges) }} vs N-1
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Résultat net</p>
      <p class="text-2xl font-bold mt-1 font-mono"
         [ngClass]="d()!.financier.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'">
        {{ fmt(d()!.financier.resultatNet) }}
      </p>
      <p class="text-xs mt-1 text-gray-400">
        Marge : {{ d()!.financier.margeNette | number:'1.1-1' }}%
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Trésorerie nette</p>
      <p class="text-2xl font-bold mt-1 font-mono"
         [ngClass]="d()!.financier.tresorerie >= 0 ? 'text-emerald-600' : 'text-red-600'">
        {{ fmt(d()!.financier.tresorerie) }}
      </p>
      <p class="text-xs mt-1" [ngClass]="deltaClass(d()!.financier.tresorerie, d()!.financierN1.tresorerie)">
        {{ deltaFmt(d()!.financier.tresorerie, d()!.financierN1.tresorerie) }} vs N-1
      </p>
    </div>
  </div>

  <!-- ═══ BUDGETS ═══════════════════════════════════════════════════════════ -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

    <!-- Budget comptable -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-700">Budget comptable</h2>
          <p class="text-xs text-gray-400">{{ d()!.budgetComptable.nbLignes }} lignes budgétaires</p>
        </div>
        @if (d()!.budgetComptable.nbDepassees > 0) {
          <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            {{ d()!.budgetComptable.nbDepassees }} dépassé(s)
          </span>
        }
      </div>
      @if (d()!.budgetComptable.nbLignes === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucun budget défini</p>
      } @else {
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Réalisé : <strong class="text-gray-800">{{ fmt(d()!.budgetComptable.realise) }}</strong></span>
            <span>Budget : <strong class="text-gray-800">{{ fmt(d()!.budgetComptable.previsionnel) }}</strong></span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-3 rounded-full transition-all duration-700"
                 [ngClass]="barColor(d()!.budgetComptable.pct)"
                 [style.width.%]="d()!.budgetComptable.pct > 100 ? 100 : d()!.budgetComptable.pct"></div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="font-bold text-lg" [ngClass]="barTextColor(d()!.budgetComptable.pct)">
              {{ d()!.budgetComptable.pct | number:'1.1-1' }}%
            </span>
            <span [ngClass]="d()!.budgetComptable.ecart >= 0 ? 'text-green-600' : 'text-red-600'"
                  class="text-xs font-medium">
              {{ d()!.budgetComptable.ecart >= 0 ? 'Marge : ' : 'Dépassement : ' }}
              {{ d()!.budgetComptable.ecart < 0
                  ? ((-d()!.budgetComptable.ecart) | number:'1.0-0')
                  : (d()!.budgetComptable.ecart | number:'1.0-0') }}
            </span>
          </div>
        </div>
      }
    </div>

    <!-- Budget RH -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-700">Budget RH</h2>
          <p class="text-xs text-gray-400">{{ d()!.budgetRh.nbLignes }} catégories budgétisées</p>
        </div>
        @if (d()!.budgetRh.nbDepassees > 0) {
          <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            {{ d()!.budgetRh.nbDepassees }} dépassé(s)
          </span>
        }
      </div>
      @if (d()!.budgetRh.nbLignes === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucun budget RH défini</p>
      } @else {
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Réalisé : <strong class="text-gray-800">{{ fmt(d()!.budgetRh.realise) }}</strong></span>
            <span>Budget : <strong class="text-gray-800">{{ fmt(d()!.budgetRh.previsionnel) }}</strong></span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-3 rounded-full transition-all duration-700"
                 [ngClass]="barColor(d()!.budgetRh.pct)"
                 [style.width.%]="d()!.budgetRh.pct > 100 ? 100 : d()!.budgetRh.pct"></div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="font-bold text-lg" [ngClass]="barTextColor(d()!.budgetRh.pct)">
              {{ d()!.budgetRh.pct | number:'1.1-1' }}%
            </span>
            <span [ngClass]="d()!.budgetRh.ecart >= 0 ? 'text-green-600' : 'text-red-600'"
                  class="text-xs font-medium">
              {{ d()!.budgetRh.ecart >= 0 ? 'Marge : ' : 'Dépassement : ' }}
              {{ d()!.budgetRh.ecart < 0
                  ? ((-d()!.budgetRh.ecart) | number:'1.0-0')
                  : (d()!.budgetRh.ecart | number:'1.0-0') }}
            </span>
          </div>
        </div>
      }
    </div>
  </div>

  <!-- ═══ CHART 1 — Évolution CA N vs N-1 ══════════════════════════════════ -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h2 class="text-sm font-semibold text-gray-700 mb-4">
      Évolution du CA — {{ d()!.exercice }} vs {{ d()!.exercice - 1 }}
    </h2>
    <div class="h-56">
      <canvas #caEvol></canvas>
    </div>
  </div>

  <!-- ═══ CHART 2 + 3 — CA/Charges mensuel + Répartition charges ══════════ -->
  <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">

    <div class="xl:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Produits vs Charges par mois</h2>
      <div class="h-56">
        <canvas #caCharges></canvas>
      </div>
    </div>

    <div class="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Répartition des charges</h2>
      @if (d()!.repartitionCharges.length === 0) {
        <div class="flex items-center justify-center h-56 text-gray-400 text-sm">Aucune donnée</div>
      } @else {
        <div class="h-56">
          <canvas #doughnutCharges></canvas>
        </div>
      }
    </div>
  </div>

  <!-- ═══ CHART 4 + 5 — Top axes + Trésorerie ══════════════════════════════ -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Top axes analytiques — dépenses</h2>
      @if (d()!.topAxes.length === 0) {
        <div class="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-1">
          <span class="text-2xl">📊</span><span>Aucune ventilation</span>
        </div>
      } @else {
        <div class="h-48">
          <canvas #topAxesChart></canvas>
        </div>
      }
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Évolution trésorerie mensuelle</h2>
      @if (d()!.tresorerieEvol.length === 0) {
        <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée</div>
      } @else {
        <div class="h-48">
          <canvas #tresoChart></canvas>
        </div>
      }
    </div>
  </div>

  }
</div>
  `,
})
export class PilotageGlobalComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('caEvol')          caEvolRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('caCharges')       caChargesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCharges') doughnutRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('topAxesChart')    topAxesRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('tresoChart')      tresoRef!:     ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private viewReady = false;

  private svc = inject(DashboardGlobalService);

  exercice = new Date().getFullYear();
  years    = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  d       = signal<DashboardGlobal | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  ngOnInit()         { this.charger(); }
  ngAfterViewInit()  { this.viewReady = true; }
  ngOnDestroy()      { this.destroyCharts(); }

  charger() {
    this.loading.set(true); this.error.set(null);
    this.svc.get(this.exercice).subscribe({
      next: r => {
        this.d.set(r);
        this.loading.set(false);
        setTimeout(() => this.buildCharts(), 0);
      },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  // ─── Charts ──────────────────────────────────────────────────────────────

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private buildCharts() {
    this.destroyCharts();
    const data = this.d();
    if (!data) return;
    this.buildCaEvol(data);
    this.buildCaCharges(data);
    if (data.repartitionCharges.length > 0) this.buildDoughnut(data);
    if (data.topAxes.length > 0) this.buildTopAxes(data);
    if (data.tresorerieEvol.length > 0) this.buildTreso(data);
  }

  private buildCaEvol(data: DashboardGlobal) {
    const el = this.caEvolRef?.nativeElement;
    if (!el) return;
    const labels  = MOIS_COURTS.slice(1);
    const caN     = this.toMonthArray(data.tendance.map(t => ({ mois: t.mois, val: t.ca })));
    const caN1    = this.toMonthArray(data.tendanceN1.map(t => ({ mois: t.mois, val: t.ca })));

    this.charts.push(new Chart(el, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `CA ${data.exercice}`,
            data: caN,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: `CA ${data.exercice - 1}`,
            data: caN1,
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { ticks: { callback: (v) => this.fmtK(Number(v)), font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } },
        },
      },
    }));
  }

  private buildCaCharges(data: DashboardGlobal) {
    const el = this.caChargesRef?.nativeElement;
    if (!el) return;
    const labels  = MOIS_COURTS.slice(1);
    const caArr   = this.toMonthArray(data.tendance.map(t => ({ mois: t.mois, val: t.ca })));
    const chgArr  = this.toMonthArray(data.tendance.map(t => ({ mois: t.mois, val: t.charges })));

    this.charts.push(new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Produits', data: caArr,  backgroundColor: 'rgba(59,130,246,0.7)' },
          { label: 'Charges',  data: chgArr, backgroundColor: 'rgba(249,115,22,0.7)' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { ticks: { callback: (v) => this.fmtK(Number(v)), font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } },
        },
      },
    }));
  }

  private buildDoughnut(data: DashboardGlobal) {
    const el = this.doughnutRef?.nativeElement;
    if (!el) return;
    const reps = data.repartitionCharges;

    this.charts.push(new Chart(el, {
      type: 'doughnut',
      data: {
        labels:   reps.map(r => r.libelle),
        datasets: [{
          data:            reps.map(r => r.montant),
          backgroundColor: reps.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 10 }, boxWidth: 12, padding: 8 },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${this.fmtK(Number(ctx.raw))}`,
            },
          },
        },
      },
    }));
  }

  private buildTopAxes(data: DashboardGlobal) {
    const el = this.topAxesRef?.nativeElement;
    if (!el) return;
    const axes = data.topAxes;

    this.charts.push(new Chart(el, {
      type: 'bar',
      data: {
        labels: axes.map(a => a.code),
        datasets: [
          {
            label: 'Dépenses',
            data: axes.map(a => a.depenses),
            backgroundColor: axes.map(a =>
              a.tauxExecution == null ? '#3b82f6'
              : a.tauxExecution > 100 ? '#ef4444'
              : a.tauxExecution > 80  ? '#f59e0b'
              : '#10b981'
            ),
          },
          {
            label: 'Budget',
            data: axes.map(a => a.montantBudget ?? 0),
            backgroundColor: 'rgba(148,163,184,0.3)',
            borderColor: '#94a3b8',
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
        scales: {
          x: { ticks: { callback: (v) => this.fmtK(Number(v)), font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } },
        },
      },
    }));
  }

  private buildTreso(data: DashboardGlobal) {
    const el = this.tresoRef?.nativeElement;
    if (!el) return;
    const evol   = data.tresorerieEvol;
    const labels = evol.map(t => MOIS_COURTS[t.mois] ?? '');
    const vals   = evol.map(t => t.solde);

    this.charts.push(new Chart(el, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Solde trésorerie',
          data: vals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: vals.map(v => v < 0 ? '#ef4444' : '#10b981'),
          pointBorderColor:     vals.map(v => v < 0 ? '#ef4444' : '#10b981'),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { callback: (v) => this.fmtK(Number(v)), font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { ticks: { font: { size: 10 } } },
        },
      },
    }));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private toMonthArray(rows: { mois: number; val: number }[]): number[] {
    const map = new Map(rows.map(r => [r.mois, r.val]));
    return Array.from({ length: 12 }, (_, i) => map.get(i + 1) ?? 0);
  }

  // ─── Formatage ───────────────────────────────────────────────────────────

  fmt(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + ' K';
    return n.toFixed(0);
  }

  fmtK(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  moisCourt(m: number): string { return MOIS_COURTS[m] ?? ''; }

  deltaFmt(n: number, prev: number): string {
    if (prev === 0) return '—';
    const pct = ((n - prev) / Math.abs(prev)) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  }

  deltaClass(n: number, prev: number): string {
    if (prev === 0) return 'text-gray-400';
    return n >= prev ? 'text-green-500' : 'text-red-500';
  }

  deltaClassInverse(n: number, prev: number): string {
    if (prev === 0) return 'text-gray-400';
    return n <= prev ? 'text-green-500' : 'text-red-500';
  }

  // ─── Couleurs ────────────────────────────────────────────────────────────

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-amber-400';
    return 'bg-blue-500';
  }

  barTextColor(pct: number): string {
    if (pct > 100) return 'text-red-600';
    if (pct > 80)  return 'text-amber-500';
    return 'text-blue-600';
  }

  alerteClass(a: Alerte): string {
    if (a.niveau === 'DANGER')  return 'bg-red-50 border-red-200 text-red-700';
    if (a.niveau === 'WARNING') return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-blue-50 border-blue-200 text-blue-700';
  }

  alerteIcon(a: Alerte): string {
    if (a.niveau === 'DANGER')  return '⛔';
    if (a.niveau === 'WARNING') return '⚠';
    return 'ℹ';
  }

  typeAxeColor(type: string): string {
    switch (type) {
      case 'PROJET':      return 'bg-blue-100 text-blue-700';
      case 'BAILLEUR':    return 'bg-green-100 text-green-700';
      case 'ACTIVITE':    return 'bg-purple-100 text-purple-700';
      case 'CENTRE_COUT': return 'bg-orange-100 text-orange-700';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }
}
