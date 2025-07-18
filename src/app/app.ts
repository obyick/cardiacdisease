import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
	templateUrl: './app.html',
	styleUrls: ['./app.scss'],
})
export class AppComponent {
	title = 'work_dashboard';
}
