import { Component } from '@angular/core';

/**
 * What /admin shows: nothing.
 *
 * The dashboard used to be here, which meant opening the admin panel always
 * started by surveying the asset tree and counting audit entries whether or not
 * that was what anybody came for. It has a nav item of its own now, and this is
 * the landing page - the shell, and whatever the person came to open.
 */
@Component({
  selector: 'app-admin-home',
  template: '',
})
export class HomeComponent {}
