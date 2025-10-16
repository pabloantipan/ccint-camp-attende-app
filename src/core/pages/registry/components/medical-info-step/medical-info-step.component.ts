import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CacheService } from '@shared/services/cache/cache.service';

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
  protected medicalInfoForm!: FormGroup;
  protected readonly isSubmitting = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly cacheService: CacheService
  ) { }

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
      const personalData = JSON.parse(sessionStorage.getItem('registrationPersonalData') || '{}');
      const medicalInfo = this.medicalInfoForm.value;

      const registrationData = {
        id: this.generateRegistrationId(),
        personalData,
        medicalInfo,
        registeredAt: new Date().toISOString(),
        synced: false,
      };

      console.log('Registration data:', registrationData);

      // Save to cache (IndexedDB) for offline support
      await this.cacheService.saveRegistration(registrationData.id, registrationData);

      // If online, attempt to sync immediately
      if (this.cacheService.isOnline()) {
        console.log('Online: attempting to sync...');
        await this.cacheService.syncPendingData();
      } else {
        console.log('Offline: data saved to cache, will sync when online');
      }

      // Clear session storage
      sessionStorage.removeItem('registrationPersonalData');
      sessionStorage.removeItem('registrationMedicalInfo');

      const statusMessage = this.cacheService.isOnline()
        ? 'Registration submitted successfully!'
        : 'Registration saved offline. Will sync when online.';

      alert(statusMessage);

      // Navigate back to registry root or home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Generate unique registration ID
   */
  private generateRegistrationId(): string {
    return `reg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private getSavedData(): any {
    const data = sessionStorage.getItem('registrationMedicalInfo');
    return data ? JSON.parse(data) : null;
  }

  private saveData(data: any): void {
    sessionStorage.setItem('registrationMedicalInfo', JSON.stringify(data));
  }
}
