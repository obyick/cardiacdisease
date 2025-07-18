import { Routes } from '@angular/router';
import { DashboardComponent } from '../app/feature/dashboard.component';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
	{
		path: 'dashboard',
		component: DashboardComponent,
	},
];
