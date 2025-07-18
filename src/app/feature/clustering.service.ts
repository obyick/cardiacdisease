import { Injectable } from '@angular/core';
import { HeartData } from './dashboard.component';
import { mean, subtract, multiply, transpose, eigs } from 'mathjs';

// Interfaces (sem alterações)
export interface HeartDataWithCluster extends HeartData {
	cluster: number;
	pca: { x: number; y: number };
}

interface KMeansResult {
	clusters: number[];
	centroids: number[][];
}

@Injectable({
	providedIn: 'root',
})
export class ClusteringService {
	private readonly ML_FEATURES: (keyof HeartData)[] = [
		'age',
		'trestbps',
		'chol',
		'thalach',
		'oldpeak',
		'sex',
		'cp',
		'exang',
		'slope',
		'ca',
	];

	constructor() {}

	public runAnalysis(
		data: HeartData[],
		numClusters: number
	): HeartDataWithCluster[] {
		if (!data || data.length === 0) return [];

		const featureMatrix = this.getFeatureMatrix(data);
		const scaledMatrix = this.scaleData(featureMatrix);

		// ** USA NOSSA PRÓPRIA IMPLEMENTAÇÃO DE PCA E K-MEANS **
		const pcaCoordinates = this.pca(scaledMatrix, 2);
		const kmeansResult = this.kmeans(featureMatrix, numClusters);

		return data.map((point, index) => ({
			...point,
			cluster: kmeansResult.clusters[index],
			pca: {
				x: pcaCoordinates[index][0],
				y: pcaCoordinates[index][1],
			},
		}));
	}

	private getFeatureMatrix(data: HeartData[]): number[][] {
		return data.map((row) =>
			this.ML_FEATURES.map((feature) => row[feature])
		);
	}

	private scaleData(matrix: number[][]): number[][] {
		const numCols = matrix[0].length;
		const scaledMatrix = matrix.map((row) => [...row]);

		for (let j = 0; j < numCols; j++) {
			const col = matrix.map((row) => row[j]);
			const meanVal = mean(col);
			const stdDev = Math.sqrt(
				mean(col.map((val) => (val - meanVal) ** 2))
			);

			for (let i = 0; i < matrix.length; i++) {
				scaledMatrix[i][j] =
					stdDev === 0 ? 0 : (scaledMatrix[i][j] - meanVal) / stdDev;
			}
		}
		return scaledMatrix;
	}

	// --- IMPLEMENTAÇÃO DO PCA USANDO MATH.JS ---
	private pca(data: number[][], nComponents: number): number[][] {
		// 1. Centralizar os dados (subtrair a média de cada coluna)
		const centeredData = data.map((row) => {
			const rowMean = mean(row);
			return row.map((val) => val - rowMean);
		});

		// 2. Calcular a matriz de covariância
		const n = centeredData.length;
		const covarianceMatrix = multiply(
			transpose(centeredData),
			centeredData
		).map((row) => row.map((val) => val / (n - 1)));

		// 3. Calcular autovetores e autovalores
		const { values, eigenvectors } = eigs(covarianceMatrix);

		// 4. Mapear autovalores aos seus autovetores e ordenar
		const eigenPairs = eigenvectors.map((ev, i) => ({
			value: Number(ev.value),
			vector: Array.isArray(ev.vector) ? ev.vector : (ev.vector as any).toArray(),
		}));
		eigenPairs.sort((a, b) => b.value - a.value);

		// 5. Selecionar os 'n' componentes principais (autovetores)
		const principalComponents = eigenPairs
			.slice(0, nComponents)
			.map((pair) => pair.vector);
		const projectionMatrix = transpose(principalComponents);

		// 6. Projetar os dados originais nos componentes principais
		return multiply(centeredData, projectionMatrix);
	}

	// --- IMPLEMENTAÇÃO DO K-MEANS ---
	private kmeans(
		data: number[][],
		k: number,
		maxIterations = 100
	): KMeansResult {
		let centroids = data
			.slice()
			.sort(() => 0.5 - Math.random())
			.slice(0, k);
		let assignments: number[] = [];

		for (let iter = 0; iter < maxIterations; iter++) {
			// Etapa de atribuição
			const newAssignments = data.map((point) => {
				let minDistance = Infinity;
				let closestCentroidIndex = 0;
				centroids.forEach((centroid, index) => {
					const distance = this.euclideanDistance(point, centroid);
					if (distance < minDistance) {
						minDistance = distance;
						closestCentroidIndex = index;
					}
				});
				return closestCentroidIndex;
			});

			// Verificação de convergência
			if (
				JSON.stringify(assignments) === JSON.stringify(newAssignments)
			) {
				break;
			}
			assignments = newAssignments;

			// Etapa de atualização
			const newCentroids: number[][] = [];
			for (let i = 0; i < k; i++) {
				const clusterPoints = data.filter(
					(_, pointIndex) => assignments[pointIndex] === i
				);
				if (clusterPoints.length > 0) {
					newCentroids.push(
						clusterPoints[0].map((_, colIdx) =>
							mean(clusterPoints.map(row => row[colIdx]))
						)
					);
				} else {
					newCentroids.push(
						data[Math.floor(Math.random() * data.length)]
					);
				}
			}
			centroids = newCentroids;
		}
		return { clusters: assignments, centroids };
	}

	private euclideanDistance(a: number[], b: number[]): number {
		return Math.sqrt(
			subtract(a, b)
				.map((val) => val ** 2)
				.reduce((sum, val) => sum + val, 0)
		);
	}
}
