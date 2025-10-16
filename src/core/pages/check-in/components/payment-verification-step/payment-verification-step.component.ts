import { CommonModule } from '@angular/common';
import { Component, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ImageUploadWidgetComponent } from '../image-upload-widget/image-upload-widget.component';

@Component({
  selector: 'app-payment-verification-step',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ImageUploadWidgetComponent
  ],
  templateUrl: './payment-verification-step.component.html',
  styleUrl: './payment-verification-step.component.scss'
})
export class PaymentVerificationStepComponent {
  constructor(
    private readonly router: Router
  ) { }
  completed = output<void>();

  transferTicketImage = signal<string>('');
  isVerified = signal<boolean>(false);

  onComplete() {
    this.completed.emit();
  }
}
