import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-arrival-confirmation-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './arrival-confirmation-step.component.html',
  styleUrl: './arrival-confirmation-step.component.scss'
})
export class ArrivalConfirmationStepComponent {
  completed = output<void>();

  identityVerified = signal<boolean>(false);
  documentsComplete = signal<boolean>(false);
  emergencyContactConfirmed = signal<boolean>(false);
  healthInfoReviewed = signal<boolean>(false);

  currentTime = signal<string>(new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  }));

  allChecked(): boolean {
    return this.identityVerified() &&
           this.documentsComplete() &&
           this.emergencyContactConfirmed() &&
           this.healthInfoReviewed();
  }

  onComplete() {
    if (this.allChecked()) {
      this.completed.emit();
    }
  }
}
