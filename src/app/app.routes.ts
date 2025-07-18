import { Routes } from '@angular/router';

// Garanta que TODOS estes componentes existam e sejam importados corretamente
import { AboutComponent } from './pages/about.component';
import { DashboardComponent } from './feature/dashboard.component';
import { RelationComponent } from './pages/relation.component'; // Provavelmente precisa ser criado
import { RawdataComponent } from './pages/rawdata.component'; // Provavelmente precisa ser criado

export const routes: Routes = [
	// Rota para "Sobre o Projeto"
	{
		path: 'about', // Corresponde a routerLink="/about"
		component: AboutComponent,
	},
	// Rota para o Dashboard Principal
	{
		path: 'dashboard', // Corresponde a routerLink="/dashboard"
		component: DashboardComponent,
	},
	// Rota para o Dashboard Relacional
	{
		path: 'relation', // Corresponde a routerLink="/relation"
		component: RelationComponent,
	},
	// Rota para os Dados Brutos
	{
		path: 'data', // Corresponde a routerLink="/data"
		component: RawdataComponent,
	},
	// Rota padrão para redirecionar o usuário quando ele entra na raiz do site
	{
		path: '',
		redirectTo: '/about',
		pathMatch: 'full',
	},
];
