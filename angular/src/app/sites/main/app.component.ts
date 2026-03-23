import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './common/header/header.component';
import { NotificationComponent } from '../../shared/local-lib/components/notification/notification.component';
import { FooterComponent } from './common/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, HeaderComponent, NotificationComponent, FooterComponent],
  providers: [],
})
export class AppComponent { }
