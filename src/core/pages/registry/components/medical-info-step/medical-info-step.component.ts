import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RegistryService, type RegistrationFormData } from '../../registry.service';

@Component({
  selector: 'app-medical-info-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './medical-info-step.component.html',
  styleUrls: ['./medical-info-step.component.scss']
})
export class MedicalInfoStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly registryService = inject(RegistryService);

  protected medicalInfoForm!: FormGroup;
  protected readonly isSubmitting = signal(false);

  ngOnInit(): void {
    // Initialize form with saved data if available
    const savedData = this.getSavedData();

    this.medicalInfoForm = this.fb.group({
      allergies: [savedData?.allergies || ''],
      medications: [savedData?.medications || ''],
      medicalConditions: [savedData?.medicalConditions || ''],
      dietaryRestrictions: [savedData?.dietaryRestrictions || ''],
      emergencyContactName: [savedData?.emergencyContactName || '', Validators.required],
      emergencyContactPhone: [savedData?.emergencyContactPhone || '', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]+$/)]],
      emergencyContactRelationship: [savedData?.emergencyContactRelationship || '', Validators.required],
      insuranceProvider: [savedData?.insuranceProvider || ''],
      insurancePolicyNumber: [savedData?.insurancePolicyNumber || ''],
    });
  }

  protected onBack(): void {
    // Save current form data before going back
    this.saveData(this.medicalInfoForm.value);
    this.router.navigate(['/registry/personal-data']);
  }

  protected async onSubmit(): Promise<void> {
    if (this.medicalInfoForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.medicalInfoForm.controls).forEach(key => {
        this.medicalInfoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Save medical info data
      this.saveData(this.medicalInfoForm.value);

      // Get all registration data
      const personalDataStr = sessionStorage.getItem('registrationPersonalData');
      if (!personalDataStr) {
        throw new Error('Personal data not found. Please complete step 1 first.');
      }

      const personalData = JSON.parse(personalDataStr);
      const medicalInfo = this.medicalInfoForm.value;

      const registrationFormData: RegistrationFormData = {
        personalData,
        medicalInfo,
      };

      console.log('Submitting registration:', registrationFormData);

      // Submit using RegistryService (handles online/offline automatically)
      this.registryService.submitRegistration(registrationFormData).subscribe({
        next: (response) => {
          console.log('Registration submitted successfully:', response);

          // Clear session storage
          sessionStorage.removeItem('registrationPersonalData');
          sessionStorage.removeItem('registrationMedicalInfo');

          // Update cached registration data in sessionStorage for immediate form reload
          sessionStorage.setItem('registrationPersonalData', JSON.stringify(personalData));
          sessionStorage.setItem('registrationMedicalInfo', JSON.stringify(medicalInfo));

          alert('Registration submitted successfully!');
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          alert('Failed to submit registration. Data has been saved locally and will sync when online.');
          // Still navigate away on error since data is cached
          this.router.navigate(['/home']);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to submit registration. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  private getSavedData(): any {
    const data = sessionStorage.getItem('registrationMedicalInfo');
    return data ? JSON.parse(data) : null;
  }

  private saveData(data: any): void {
    sessionStorage.setItem('registrationMedicalInfo', JSON.stringify(data));
  }
}
