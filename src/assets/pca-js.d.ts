// src/pca-js.d.ts

declare module 'pca-js' {
	// Declara um objeto PCA que será o default export
	const PCA: {
		getAdjustedData(
			data: number[][],
			nComponents: number
		): {
			adjustedData: number[][];
			eigenValues: number[];
		};
	};
	// Exporta o objeto PCA como o padrão do módulo
	export default PCA;
}
