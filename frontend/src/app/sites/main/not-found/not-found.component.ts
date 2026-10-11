import { Component } from '@angular/core';
import { TranslatePipe } from '@anotoki/lib/translations';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  imports: [TranslatePipe],
  providers: []
})
export class NotFoundComponent { }
