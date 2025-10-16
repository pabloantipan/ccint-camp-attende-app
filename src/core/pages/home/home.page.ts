import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

interface CampEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  icon: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  // User registration status
  registrationStatus = signal<'pending' | 'incomplete' | 'complete' | 'checked-in'>('incomplete');
  checkInProgress = signal<number>(0); // 0-100 percentage
  userName = signal<string>('Participante');

  // Camp information
  campStartDate = signal<string>('15 de Diciembre, 2024');
  daysUntilCamp = signal<number>(30);

  // Upcoming events
  upcomingEvents = signal<CampEvent[]>([
    {
      id: '1',
      title: 'Ceremonia de Apertura',
      date: '15 Dic',
      time: '10:00 AM',
      location: 'Auditorio Principal',
      icon: 'celebration'
    },
    {
      id: '2',
      title: 'Actividad al Aire Libre',
      date: '15 Dic',
      time: '2:00 PM',
      location: 'Zona de Camping',
      icon: 'forest'
    },
    {
      id: '3',
      title: 'Fogata y Convivencia',
      date: '15 Dic',
      time: '7:00 PM',
      location: 'Área de Fogata',
      icon: 'local_fire_department'
    }
  ]);

  // Quick actions for attendeees
  quickActions = signal<QuickAction[]>([
    {
      title: 'Completar Registro',
      description: 'Completa tu información para el campamento',
      icon: 'how_to_reg',
      route: '/registry',
      color: 'primary'
    },
    {
      title: 'Check-in',
      description: 'Realiza tu check-in cuando llegues',
      icon: 'check_circle',
      route: '/checkin',
      color: 'accent'
    },
    {
      title: 'Mi Perfil',
      description: 'Ver y actualizar información personal',
      icon: 'person',
      route: '/profile',
      color: 'secondary'
    }
  ]);

  // Important announcements
  announcements = signal<string[]>([
    'Recuerda traer tu documento de identidad',
    'El check-in inicia a las 8:00 AM',
    'Revisa la lista de materiales requeridos'
  ]);

  constructor(private router: Router) { }

  getStatusMessage(): string {
    switch (this.registrationStatus()) {
      case 'pending':
        return 'Aún no has iniciado tu registro';
      case 'incomplete':
        return 'Completa tu registro para el campamento';
      case 'complete':
        return 'Registro completo - Listo para check-in';
      case 'checked-in':
        return '¡Bienvenido al campamento!';
      default:
        return '';
    }
  }

  getStatusIcon(): string {
    switch (this.registrationStatus()) {
      case 'pending':
        return 'pending_actions';
      case 'incomplete':
        return 'schedule';
      case 'complete':
        return 'verified';
      case 'checked-in':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  getStatusColor(): string {
    switch (this.registrationStatus()) {
      case 'pending':
        return 'warn';
      case 'incomplete':
        return 'accent';
      case 'complete':
        return 'primary';
      case 'checked-in':
        return 'success';
      default:
        return 'primary';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
