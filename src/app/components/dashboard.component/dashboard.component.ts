import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as Papa from 'papaparse';

import {
	Chart,
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	BarController,
	PieController,
	ScatterController,
	CategoryScale,
	LinearScale,
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

	public sexCpIncidenceData: ChartData<'bar'> | undefined;
	public sexCpIncidenceOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(true, 'Tipo de Dor no Peito', 'Número de Casos');
	public sexCpIncidenceConclusion = '';
	public proportionData: ChartData<'pie'> | undefined;
	public proportionOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(false);
	public proportionConclusion = '';
	public ageHistogramData: ChartData<'bar'> | undefined;
	public ageHistogramOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(false, 'Faixa Etária', 'Número de Pacientes');
	public ageHistogramConclusion = '';
	public sexIncidenceData: ChartData<'bar'> | undefined;
	public sexIncidenceOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(false, 'Sexo', 'Casos com Doença');
	public sexIncidenceConclusion = '';
	public cpIncidenceData: ChartData<'bar'> | undefined;
	public cpIncidenceOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(false, 'Tipo de Dor', 'Casos com Doença');
	public cpIncidenceConclusion = '';
	public scatterData: ChartData<'scatter'> | undefined;
	public scatterOptions: ChartConfiguration['options'] =
		this.getCommonChartOptions(false, 'Idade', 'Freq. Cardíaca Máx.');

	constructor(private cdr: ChangeDetectorRef) {
		Chart.register(
			ArcElement,
			LineElement,
			BarElement,
			PointElement,
			BarController,
			PieController,
			ScatterController,
			CategoryScale,
			LinearScale,
			Tooltip,
			Legend
		);
	}

	async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			this.error = null;
			const data = await this.loadCsvData();
			if (!data || data.length === 0) {
				throw new Error(
					'Os dados do CSV estão vazios ou não puderam ser processados.'
				);
			}
			this.createProportionChart(data);
			this.createAgeHistogram(data);
			this.createSexIncidenceChart(data);
			this.createCpIncidenceChart(data);
			this.createScatterChart(data);
			this.createSexVsCpChart(data);
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
		if (!response.ok) {
			throw new Error(
				`Arquivo não encontrado em 'assets/heart.csv' (Erro: ${response.statusText})`
			);
		}
		const csvText = await response.text();
		return new Promise((resolve, reject) => {
			Papa.parse(csvText, {
				header: true,
				dynamicTyping: true,
				skipEmptyLines: true,
				complete: (result) => {
					const allData = result.data as HeartData[];
					const uniqueDataStrings = new Set(
						allData.map((p) => JSON.stringify(p))
					);

					const uniqueData = Array.from(uniqueDataStrings).map((s) =>
						JSON.parse(s)
					);

					const cleanData = uniqueData.filter(
						(row: any) =>
							row &&
							row.target !== null &&
							row.target !== undefined
					);

					resolve(cleanData);
				},
				error: (error: any) => {
					reject(error);
				},
			});
		});
	}

	createProportionChart(data: HeartData[]): void {
		const withDisease = data.filter((p) => p.target === 1).length;
		const withoutDisease = data.length - withDisease;
		const percentage = ((withDisease / data.length) * 100).toFixed(1);
		this.proportionData = {
			labels: ['Com Doença Cardíaca', 'Sem Doença Cardíaca'],
			datasets: [
				{
					data: [withDisease, withoutDisease],
					backgroundColor: ['#e74c3c', '#2ecc71'],
					hoverOffset: 8,
				},
			],
		};
		this.proportionConclusion = `${percentage}% dos indivíduos no dataset possuem diagnóstico de doença cardíaca.`;
	}

	createAgeHistogram(data: HeartData[]): void {
		const ageGroups = {
			'30-39': 0,
			'40-49': 0,
			'50-59': 0,
			'60-69': 0,
			'70+': 0,
		};
		type AgeGroupKey = keyof typeof ageGroups;
		data.forEach((p) => {
			if (p.age < 40) ageGroups['30-39']++;
			else if (p.age < 50) ageGroups['40-49']++;
			else if (p.age < 60) ageGroups['50-59']++;
			else if (p.age < 70) ageGroups['60-69']++;
			else ageGroups['70+']++;
		});
		this.ageHistogramData = {
			labels: Object.keys(ageGroups),
			datasets: [
				{
					data: Object.values(ageGroups),
					label: 'Número de Pacientes',
					backgroundColor: '#3498db',
				},
			],
		};
		const predominantGroup = (
			Object.keys(ageGroups) as AgeGroupKey[]
		).reduce((a, b) => (ageGroups[a] > ageGroups[b] ? a : b));
		this.ageHistogramConclusion = `A faixa etária predominante de pacientes no dataset é de ${predominantGroup} anos.`;
	}

	createSexIncidenceChart(data: HeartData[]): void {
		const menDiseased = data.filter(
			(p) => p.sex === 1 && p.target === 1
		).length;
		const womenDiseased = data.filter(
			(p) => p.sex === 0 && p.target === 1
		).length;
		this.sexIncidenceData = {
			labels: ['Homens', 'Mulheres'],
			datasets: [
				{
					data: [menDiseased, womenDiseased],
					label: 'Casos com Doença Cardíaca',
					backgroundColor: ['#e67e22', '#f1c40f'],
				},
			],
		};
		this.sexIncidenceConclusion = `A incidência de doença cardíaca é marcadamente superior em homens (${menDiseased} casos) em comparação com mulheres (${womenDiseased} casos).`;
	}

	createCpIncidenceChart(data: HeartData[]): void {
		const cpLabels = [
			'Angina Típica',
			'Angina Atípica',
			'Dor Não Anginosa',
			'Assintomático',
		];
		const cpData = cpLabels.map(
			(_, i) => data.filter((p) => p.cp === i && p.target === 1).length
		);
		this.cpIncidenceData = {
			labels: cpLabels,
			datasets: [
				{
					data: cpData,
					label: 'Casos com Doença Cardíaca',
					backgroundColor: '#16a085',
				},
			],
		};
		const maxIndex = cpData.indexOf(Math.max(...cpData));
		this.cpIncidenceConclusion = `A ${cpLabels[maxIndex]} é o tipo de sintoma mais frequentemente associado à presença de doença cardíaca neste dataset.`;
	}

	createScatterChart(data: HeartData[]): void {
		const diseasedData = data
			.filter((p) => p.target === 1)
			.map((p) => ({
				x: p.age,
				y: p.thalach,
				chol: p.chol,
				trestbps: p.trestbps,
				target: p.target,
			}));

		const healthyData = data
			.filter((p) => p.target === 0)
			.map((p) => ({
				x: p.age,
				y: p.thalach,
				chol: p.chol,
				trestbps: p.trestbps,
				target: p.target,
			}));

		this.scatterData = {
			datasets: [
				{
					data: diseasedData,
					label: 'Com Doença',
					backgroundColor: '#e74c3c',
				},
				{
					data: healthyData,
					label: 'Sem Doença',
					backgroundColor: '#2ecc71',
				},
			],
		};

		const customOptions = this.getCommonChartOptions(
			true,
			'Idade',
			'Freq. Cardíaca Máx.'
		);

		if (customOptions?.plugins?.tooltip) {
			customOptions.plugins.tooltip.mode = 'nearest';
			customOptions.plugins.tooltip.intersect = true;

			customOptions.plugins.tooltip.callbacks = {
				title: () => '',
				label: (tooltipItem) => {
					const pointData = tooltipItem.raw as any;
					if (!pointData) return '';

					const lines = [
						`Diagnóstico: ${
							pointData.target === 1 ? 'Com Doença' : 'Sem Doença'
						}`,
						`Idade: ${pointData.x}`,
						`F.C. Máx: ${pointData.y}`,
						`Colesterol: ${pointData.chol} mg/dl`,
						`Pressão: ${pointData.trestbps} mmHg`,
					];
					return lines;
				},
			};
		}
		this.scatterOptions = customOptions;
	}

	createSexVsCpChart(data: HeartData[]): void {
		const cpLabels = [
			'Angina Típica',
			'Angina Atípica',
			'Dor Não Anginosa',
			'Assintomático',
		];

		// Filtra dados apenas de pacientes com doença cardíaca
		const diseasedData = data.filter((p) => p.target === 1);

		// Mapeia os casos por tipo de dor para homens
		const menData = cpLabels.map(
			(_, i) =>
				diseasedData.filter((p) => p.sex === 1 && p.cp === i).length
		);

		// Mapeia os casos por tipo de dor para mulheres
		const womenData = cpLabels.map(
			(_, i) =>
				diseasedData.filter((p) => p.sex === 0 && p.cp === i).length
		);

		this.sexCpIncidenceData = {
			labels: cpLabels,
			datasets: [
				{
					label: 'Homens',
					data: menData,
					backgroundColor: '#3498db', // Cor para homens
				},
				{
					label: 'Mulheres',
					data: womenData,
					backgroundColor: '#e91e63', // Cor para mulheres
				},
			],
		};

		// Gera uma conclusão simples
		this.sexCpIncidenceConclusion =
			'O gráfico demonstra a distribuição de casos por tipo de dor no peito, segmentado por sexo, permitindo uma comparação direta da sintomatologia entre os gêneros.';
	}

	private getCommonChartOptions(
		legend: boolean,
		xLabel?: string,
		yLabel?: string
	): ChartConfiguration['options'] {
		const yAxisOptions: any = {
			grid: { color: 'rgba(255, 255, 255, 0.15)' },
			ticks: { color: 'rgba(255, 255, 255, 0.85)', padding: 5 },
			title: {
				display: !!yLabel,
				text: yLabel,
				color: '#ffffff',
				font: { size: 14 },
			},
		};
		if (yLabel?.includes('Quantidade') || yLabel?.includes('Casos')) {
			yAxisOptions.beginAtZero = true;
		}
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
				y: yAxisOptions,
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
