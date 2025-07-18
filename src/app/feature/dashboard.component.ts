import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as Papa from 'papaparse';
import { ClusteringService, HeartDataWithCluster } from './clustering.service';

import {
	Chart,
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	PieController,
	RadarController,
	ScatterController,
	CategoryScale,
	LinearScale,
	RadialLinearScale,
	Tooltip,
	Legend,
} from 'chart.js';

export interface HeartData {
	age: number;
	sex: number;
	cp: number;
	trestbps: number;
	chol: number;
	fbs: number;
	restecg: number;
	thalach: number;
	exang: number;
	oldpeak: number;
	slope: number;
	ca: number;
	thal: number;
	target: number;
}

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule, BaseChartDirective],
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
	public isLoading = true;
	public error: string | null = null;
	public readonly NUM_CLUSTERS = 3; // Definindo 3 clusters como ideal
	public readonly CLUSTER_COLORS = ['#3498db', '#e74c3c', '#2ecc71'];

	// Gráficos baseados em ML
	public clusterPcaData: ChartData<'scatter'> | undefined;
	public clusterPcaOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(
			true,
			'Componente Principal 1 (PCA)',
			'Componente Principal 2 (PCA)'
		);
	public clusterProfileData: ChartData<'radar'> | undefined;
	public clusterProfileOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(true);

	// Gráficos adaptados
	public proportionData: ChartData<'pie'> | undefined;
	public proportionOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(true);

	public sexIncidenceData: ChartData<'bar'> | undefined;
	public sexIncidenceOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(true, 'Sexo', 'Número de Pacientes');

	public cpIncidenceData: ChartData<'bar'> | undefined;
	public cpIncidenceOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(
			true,
			'Tipo de Dor no Peito',
			'Número de Pacientes'
		);

	public ageHistogramData: ChartData<'bar'> | undefined;
	public ageHistogramOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(true, 'Faixa Etária', 'Número de Pacientes');

	constructor(
		private cdr: ChangeDetectorRef,
		private clusteringService: ClusteringService
	) {
		Chart.register(
			ArcElement,
			LineElement,
			BarElement,
			PointElement,
			BarController,
			PieController,
			ScatterController,
			RadarController,
			CategoryScale,
			LinearScale,
			RadialLinearScale,
			Tooltip,
			Legend
		);
	}

	async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			this.error = null;
			const rawData = await this.loadCsvData();
			if (!rawData || rawData.length === 0) {
				throw new Error('Os dados do CSV estão vazios.');
			}
			const clusteredData = await this.clusteringService.runAnalysis(
				rawData,
				this.NUM_CLUSTERS
			);

			this.createClusterPcaChart(clusteredData);
			this.createClusterProfileChart(clusteredData);
			this.createProportionChart(clusteredData);
			this.createAgeHistogram(clusteredData);
			this.createSexIncidenceChart(clusteredData);
			this.createCpIncidenceChart(clusteredData);
		} catch (err: any) {
			console.error('Erro no ngOnInit:', err);
			this.error = err.message || 'Ocorreu um erro inesperado.';
		} finally {
			this.isLoading = false;
			this.cdr.detectChanges();
		}
	}

	private async loadCsvData(): Promise<HeartData[]> {
		const response = await fetch('assets/heart.csv');
		if (!response.ok)
			throw new Error(
				`Arquivo não encontrado (Erro: ${response.statusText})`
			);
		const csvText = await response.text();
		return new Promise((resolve, reject) => {
			Papa.parse(csvText, {
				header: true,
				dynamicTyping: true,
				skipEmptyLines: true,
				complete: (result) => {
					const cleanData = (result.data as HeartData[]).filter(
						(row) =>
							row &&
							row.target !== null &&
							row.target !== undefined
					);
					resolve(
						Array.from(
							new Set(cleanData.map((p) => JSON.stringify(p)))
						).map((s) => JSON.parse(s))
					);
				},
				error: (error: any) => reject(error),
			});
		});
	}

	// --- GRÁFICOS DE MACHINE LEARNING ---

	createClusterPcaChart(data: HeartDataWithCluster[]): void {
		this.clusterPcaData = {
			datasets: Array.from({ length: this.NUM_CLUSTERS }, (_, i) => {
				const clusterSubset = data.filter((p) => p.cluster === i);
				const clusterPoints = clusterSubset.map((p) => ({
					x: p.pca.x,
					y: p.pca.y,
					originalData: p, // Anexa os dados originais a cada ponto
				}));
				return {
					data: clusterPoints,
					label: `Cluster ${i}`,
					backgroundColor: this.CLUSTER_COLORS[i],
				};
			}),
		};

		// Configura o tooltip (hover) para mostrar os dados originais
		this.clusterPcaOptions!.plugins!.tooltip!.callbacks = {
			label: (context: any) => {
				const originalData = context.raw.originalData;
				if (!originalData) {
					return context.dataset.label || '';
				}
				const lines = [
					`Cluster: ${originalData.cluster}`,
					`Idade: ${originalData.age}`,
					`Sexo: ${originalData.sex === 1 ? 'Homem' : 'Mulher'}`,
					`Colesterol: ${originalData.chol}`,
				];
				return lines;
			},
		};
	}

	createClusterProfileChart(data: HeartDataWithCluster[]): void {
		const profileFeatures: (keyof HeartData)[] = [
			'age',
			'trestbps',
			'chol',
			'thalach',
			'oldpeak',
		];
		const datasets = [];

		for (let i = 0; i < this.NUM_CLUSTERS; i++) {
			const clusterData = data.filter((p) => p.cluster === i);
			if (clusterData.length === 0) continue;

			const avgValues = profileFeatures.map((feature) => {
				const total = clusterData.reduce(
					(sum, p) => sum + p[feature],
					0
				);
				return total / clusterData.length;
			});

			datasets.push({
				label: `Cluster ${i}`,
				data: avgValues,
				borderColor: this.CLUSTER_COLORS[i],
				pointBackgroundColor: this.CLUSTER_COLORS[i],
				borderWidth: 2, // Apenas a linha, sem preenchimento
			});
		}

		this.clusterProfileData = { labels: profileFeatures, datasets };

		// Configurações de estilo para o eixo do gráfico de radar
		this.clusterProfileOptions!.scales = {
			r: {
				grid: { color: 'rgba(255, 255, 255, 0.15)' },
				angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
				pointLabels: {
					color: '#ffffff',
					font: { size: 13 },
				},
				ticks: {
					color: 'rgba(255, 255, 255, 0.85)',
					backdropColor: 'transparent',
				},
			},
		};

		this.clusterProfileOptions!.plugins!.tooltip!.callbacks = {
			label: (context) =>
				`${context.dataset.label}: ${Number(context.raw).toFixed(2)}`,
		};
	}

	// --- GRÁFICOS ADAPTADOS PARA CLUSTERS ---

	createProportionChart(data: HeartDataWithCluster[]): void {
		const clusterCounts = Array(this.NUM_CLUSTERS).fill(0);
		data.forEach((p) => clusterCounts[p.cluster]++);

		this.proportionData = {
			labels: clusterCounts.map((_, i) => `Cluster ${i}`),
			datasets: [
				{
					data: clusterCounts,
					backgroundColor: this.CLUSTER_COLORS,
					hoverOffset: 8,
				},
			],
		};
	}

	createAgeHistogram(data: HeartDataWithCluster[]): void {
		const ageGroups = ['30-39', '40-49', '50-59', '60-69', '70+'];
		const datasets = Array.from({ length: this.NUM_CLUSTERS }, (_, i) => ({
			label: `Cluster ${i}`,
			data: Array(ageGroups.length).fill(0),
			backgroundColor: this.CLUSTER_COLORS[i],
		}));

		data.forEach((p) => {
			let groupIndex = -1;
			if (p.age < 40) groupIndex = 0;
			else if (p.age < 50) groupIndex = 1;
			else if (p.age < 60) groupIndex = 2;
			else if (p.age < 70) groupIndex = 3;
			else groupIndex = 4;
			datasets[p.cluster].data[groupIndex]++;
		});

		this.ageHistogramData = { labels: ageGroups, datasets };
		const specificOptions = this.getCommonChartOptions(
			true,
			'Faixa Etária',
			'Número de Pacientes'
		);
		specificOptions!.scales = {
			...specificOptions!.scales,
			x: { ...specificOptions!.scales?.['x'], stacked: true },
			y: { ...specificOptions!.scales?.['y'], stacked: true },
		};
		this.ageHistogramOptions = specificOptions;
	}

	createSexIncidenceChart(data: HeartDataWithCluster[]): void {
		const labels = ['Homens', 'Mulheres'];
		const datasets = Array.from({ length: this.NUM_CLUSTERS }, (_, i) => ({
			label: `Cluster ${i}`,
			data: [0, 0],
			backgroundColor: this.CLUSTER_COLORS[i],
		}));

		data.forEach((p) => {
			const sexIndex = p.sex === 1 ? 0 : 1;
			datasets[p.cluster].data[sexIndex]++;
		});

		this.sexIncidenceData = { labels, datasets };
		const specificOptions = this.getCommonChartOptions(
			true,
			'Sexo',
			'Número de Pacientes'
		);
		specificOptions!.scales = {
			...specificOptions!.scales,
			x: { ...specificOptions!.scales?.['x'], stacked: true },
			y: { ...specificOptions!.scales?.['y'], stacked: true },
		};
		this.sexIncidenceOptions = specificOptions;
	}

	createCpIncidenceChart(data: HeartDataWithCluster[]): void {
		const labels = [
			'Angina Típica',
			'Angina Atípica',
			'Dor Não Anginosa',
			'Assintomático',
		];
		const datasets = Array.from({ length: this.NUM_CLUSTERS }, (_, i) => ({
			label: `Cluster ${i}`,
			data: Array(labels.length).fill(0),
			backgroundColor: this.CLUSTER_COLORS[i],
		}));

		data.forEach((p) => datasets[p.cluster].data[p.cp]++);

		this.cpIncidenceData = { labels, datasets };
		const specificOptions = this.getCommonChartOptions(
			true,
			'Tipo de Dor no Peito',
			'Número de Pacientes'
		);
		specificOptions!.scales = {
			...specificOptions!.scales,
			x: { ...specificOptions!.scales?.['x'], stacked: true },
			y: { ...specificOptions!.scales?.['y'], stacked: true },
		};
		this.cpIncidenceOptions = specificOptions;
	}

	// --- FUNÇÃO DE OPÇÕES COMUNS ---
	private getCommonChartOptions(
		legend: boolean,
		xLabel?: string,
		yLabel?: string
	): ChartConfiguration['options'] {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: legend,
					position: 'top',
					labels: { color: '#ffffff', font: { size: 14 } },
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleFont: { size: 14, weight: 'bold' },
					bodyFont: { size: 13 },
					padding: 12,
					boxPadding: 4,
					cornerRadius: 4,
				},
			},
			scales: {
				y: {
					grid: { color: 'rgba(255, 255, 255, 0.15)' },
					ticks: { color: 'rgba(255, 255, 255, 0.85)', padding: 5 },
					title: {
						display: !!yLabel,
						text: yLabel,
						color: '#ffffff',
						font: { size: 14 },
					},
				},
				x: {
					grid: { color: 'rgba(255, 255, 255, 0.15)' },
					ticks: { color: 'rgba(255, 255, 255, 0.85)' },
					title: {
						display: !!xLabel,
						text: xLabel,
						color: '#ffffff',
						font: { size: 14 },
					},
				},
			},
		};
	}
}
