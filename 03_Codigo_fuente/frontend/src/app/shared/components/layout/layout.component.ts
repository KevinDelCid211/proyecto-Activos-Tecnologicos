import { Component, computed } from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule }    from '@angular/material/toolbar';
import { MatSidenavModule }    from '@angular/material/sidenav';
import { MatListModule }       from '@angular/material/list';
import { MatIconModule }       from '@angular/material/icon';
import { MatButtonModule }     from '@angular/material/button';
import { MatMenuModule }       from '@angular/material/menu';
import { MatDividerModule }    from '@angular/material/divider';
import { AuthService }         from '../../../core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <div class="app-container">
      <!-- Toolbar superior -->
      <mat-toolbar color="primary" class="toolbar">
        <button mat-icon-button (click)="sidenavOpened = !sidenavOpened" aria-label="Mostrar u ocultar el menú">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">
          <mat-icon>computer</mat-icon>
          Gestión de Activos TI
        </span>
        <span class="spacer"></span>
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ user()?.nombre }}
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #userMenu>
          <div class="user-info-menu">
            <small>{{ user()?.email }}</small>
            <small>Rol: {{ user()?.rol }}</small>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Cerrar sesión
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="content-area">
        <!-- Sidebar -->
        <mat-sidenav-container class="sidenav-container">
          <mat-sidenav mode="side" [opened]="sidenavOpened" class="sidenav">
            <mat-nav-list>
              @for (item of navItems; track item.route) {
                <a mat-list-item
                   [routerLink]="item.route"
                   routerLinkActive="active-link"
                   [routerLinkActiveOptions]="{ exact: item.route === '/' }">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              }
            </mat-nav-list>
          </mat-sidenav>

          <mat-sidenav-content class="main-content">
            <router-outlet />
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    .toolbar    { position: sticky; top: 0; z-index: 100; }
    .app-title  { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .spacer     { flex: 1; }
    .content-area { height: calc(100vh - 64px); display: flex; }
    .sidenav-container { flex: 1; }
    .main-content { padding: 24px; background: #f5f5f5; overflow-y: auto; }
    .user-info-menu { padding: 8px 16px; display: flex; flex-direction: column; }
    .sidenav { background: #fafbfe; border-right: 1px solid #e6e8f0; padding-top: 8px; }
    mat-nav-list a { color: #4b5268 !important; }
    mat-nav-list a.active-link {
      background: #eef1fd !important;
      color: #3f51b5 !important;
      font-weight: 600;
      border-left: 3px solid #3f51b5;
      mat-icon { color: #3f51b5; }
    }
    mat-icon[matListItemIcon] { color: #8891a8; }
  `]
})
export class LayoutComponent {
  user = computed(() => this.auth.currentUser());
  sidenavOpened = true;

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',       route: '/dashboard'     },
    { label: 'Activos TI',    icon: 'dns',             route: '/activos'       },
    { label: 'Responsables',  icon: 'people',          route: '/responsables'  },
    { label: 'Historial',     icon: 'history',         route: '/historial'     },
    { label: 'Reportes',      icon: 'bar_chart',       route: '/reportes'      },
  ];

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }
}
