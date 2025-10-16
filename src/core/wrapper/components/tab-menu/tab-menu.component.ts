import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

interface TabMenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-tab-menu',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
  ],
  templateUrl: './tab-menu.component.html',
  styleUrls: ['./tab-menu.component.scss']
})
export class TabMenuComponent {
  protected readonly menuItems: TabMenuItem[] = [
    {
      label: 'Home',
      icon: 'home',
      route: '/home',
    },
    {
      label: 'Registro',
      icon: 'how_to_reg',
      route: '/registry',
    },
    {
      label: 'Check-in',
      icon: 'fact_check',
      route: '/checkin',
    },
    {
      label: 'Llave',
      icon: 'key_vertical',
      route: '/passcode',
    },
    {
      label: 'Perfil',
      icon: 'account_circle',
      route: '/profile',
    },
  ];

  constructor(public router: Router) { }

  protected isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  protected navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
