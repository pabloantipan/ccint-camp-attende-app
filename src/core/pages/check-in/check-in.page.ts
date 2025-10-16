import { CommonModule } from '@angular/common';
import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { ArrivalConfirmationStepComponent } from './components/arrival-confirmation-step/arrival-confirmation-step.component';
import { MaterialsDeliveryStepComponent } from './components/materials-delivery-step/materials-delivery-step.component';
import { ParentAuthorizationStepComponent } from './components/parent-authorization-step/parent-authorization-step.component';
import { PaymentVerificationStepComponent } from './components/payment-verification-step/payment-verification-step.component';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    PaymentVerificationStepComponent,
    ParentAuthorizationStepComponent,
    ArrivalConfirmationStepComponent,
    MaterialsDeliveryStepComponent,
  ],
  templateUrl: './check-in.page.html',
  styleUrl: './check-in.page.scss'
})
export class CheckInPage {
  paymentCompleted = signal(false);
  authorizationCompleted = signal(false);
  arrivalCompleted = signal(false);
  materialsCompleted = signal(false);

  constructor(private router: Router) {}

  getCurrentStep(): number {
    let step = 1;
    if (this.paymentCompleted()) step++;
    if (this.authorizationCompleted()) step++;
    if (this.arrivalCompleted()) step++;
    if (this.materialsCompleted()) step++;
    return step;
  }

  onPaymentCompleted() {
    console.log('Payment step completed');
    this.paymentCompleted.set(true);
  }

  onAuthorizationCompleted() {
    console.log('Authorization step completed');
    this.authorizationCompleted.set(true);
  }

  onArrivalCompleted() {
    console.log('Arrival step completed');
    this.arrivalCompleted.set(true);
  }

  onMaterialsCompleted() {
    console.log('Materials step completed');
    this.materialsCompleted.set(true);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
