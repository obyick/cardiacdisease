import { Routes } from '@angular/router';
// --- CAMINHO DE IMPORTAÇÃO CORRIGIDO ---
import { DashboardComponent } from '../app/components/dashboard.component/dashboard.component';

export const routes: Routes = [
	{
		path: '', // Rota padrão
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
	{
		path: 'dashboard',
		component: DashboardComponent,
	},
];
