// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Importe 'AppComponent' do caminho correto, não 'App'
import { AppComponent } from './app/app';

// Use 'AppComponent' aqui, não 'App'
bootstrapApplication(AppComponent, appConfig).catch((err) =>
	console.error(err)
);
