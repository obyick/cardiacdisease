import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Plotly from 'plotly.js-dist-min';

@Component({
	selector: 'app-relation',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './relation.component.html',
	styleUrls: ['./relation.component.scss'],
})
export class RelationComponent implements OnInit {
	private data: any[] = [];
	public headers: string[] = [];
	public selectedX: string = 'age';
	public selectedY: string = 'chol';

	constructor(private http: HttpClient) {}

	ngOnInit(): void {
		this.http.get('assets/heart.csv', { responseType: 'text' }).subscribe(
			(csvText) => {
				const { data, headers } = this.parseCSV(csvText);
				this.data = data;
				this.headers = headers;
				this.selectedX = headers[0];
				this.selectedY = headers[4];
				this.createOrUpdateChart();
			},
			(error) => {
				console.error('Erro ao carregar o arquivo CSV:', error);
			}
		);
	}

	private parseCSV(text: string): { data: any[]; headers: string[] } {
		const lines = text.split('\n').filter((line) => line.trim() !== '');
		const headers = lines[0].split(',').map((h) => h.trim());
		const data = lines.slice(1).map((line) => {
			const values = line.split(',');
			const entry: any = {};
			headers.forEach((header, index) => {
				const value = parseFloat(values[index]);
				entry[header] = isNaN(value) ? values[index] : value;
			});
			return entry;
		});
		return { data, headers };
	}

	public createOrUpdateChart(): void {
		if (!this.data.length || !this.selectedX || !this.selectedY) {
			return;
		}

		const jitterAmount = 0.4;
		const applyJitter = (value: number) =>
			value + (Math.random() - 0.5) * jitterAmount;

		// --- DADOS PARA OS GRÁFICOS ---
		const trace1Points = this.data.filter((p) => p.target === 0);
		const trace2Points = this.data.filter((p) => p.target === 1);

		const colors = ['#3498db', '#e74c3c'];

		const trace1: Partial<Plotly.ScatterData> = {
			x: trace1Points.map((p) => applyJitter(p[this.selectedX])),
			y: trace1Points.map((p) => applyJitter(p[this.selectedY])),
			mode: 'markers',
			type: 'scatter',
			name: 'Sem Doença',
			marker: { color: colors[0], size: 8, opacity: 0.8 },
			// Passa os dados originais para o hover
			customdata: trace1Points.map((p) => [
				p[this.selectedX],
				p[this.selectedY],
			]),
			// Mostra os dados originais (customdata) em vez da posição visual (x, y)
			hovertemplate: `<b>${this.selectedX}:</b> %{customdata[0]}<br><b>${this.selectedY}:</b> %{customdata[1]}<extra></extra>`,
		};

		const trace2: Partial<Plotly.ScatterData> = {
			x: trace2Points.map((p) => applyJitter(p[this.selectedX])),
			y: trace2Points.map((p) => applyJitter(p[this.selectedY])),
			mode: 'markers',
			type: 'scatter',
			name: 'Com Doença',
			marker: { color: colors[1], size: 8, opacity: 0.8 },
			// Passa os dados originais para o hover
			customdata: trace2Points.map((p) => [
				p[this.selectedX],
				p[this.selectedY],
			]),
			// Mostra os dados originais (customdata) em vez da posição visual (x, y)
			hovertemplate: `<b>${this.selectedX}:</b> %{customdata[0]}<br><b>${this.selectedY}:</b> %{customdata[1]}<extra></extra>`,
		};

		const layout: Partial<Plotly.Layout> = {
			plot_bgcolor: 'transparent',
			paper_bgcolor: 'transparent',
			font: {
				color: 'var(--color-primary-text, #ffffff)',
				family: 'Arial, sans-serif',
				size: 14,
			},
			legend: {
				orientation: 'h',
				yanchor: 'bottom',
				y: 1.01,
				xanchor: 'right',
				x: 1,
				font: { size: 14, color: 'var(--color-primary-text, #ffffff)' },
			},
			hoverlabel: {
				bgcolor: 'rgba(0, 0, 0, 0.8)',
				font: { size: 13, color: '#ffffff' },
				bordercolor: 'rgba(0, 0, 0, 0.8)',
			},
			xaxis: {
				title: {
					text: this.selectedX,
					font: {
						size: 14,
						color: 'var(--color-primary-text, #ffffff)',
					},
				},
				gridcolor: 'rgba(255, 255, 255, 0.15)',
				tickfont: { color: 'rgba(255, 255, 255, 0.85)' },
				linecolor: 'rgba(255, 255, 255, 0.15)',
				zerolinecolor: 'rgba(255, 255, 255, 0.15)',
			},
			yaxis: {
				title: {
					text: this.selectedY,
					font: {
						size: 14,
						color: 'var(--color-primary-text, #ffffff)',
					},
				},
				gridcolor: 'rgba(255, 255, 255, 0.15)',
				tickfont: { color: 'rgba(255, 255, 255, 0.85)' },
				linecolor: 'rgba(255, 255, 255, 0.15)',
				zerolinecolor: 'rgba(255, 255, 255, 0.15)',
			},
			margin: { l: 60, r: 20, b: 50, t: 20, pad: 4 },
		};

		const config = { responsive: true };

		Plotly.newPlot('relation-chart', [trace1, trace2], layout, config);
	}
}
