import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CacheService } from '@shared/services/cache/cache.service';
import type {
  CreateRegistrationRequest,
  CreateRegistrationResponse,
  ApiResponse,
} from '@shared/services/api/api.interfaces';

export interface RegistrationFormData {
  personalData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalInfo: {
    allergies?: string;
    medications?: string;
    medicalConditions?: string;
    dietaryRestrictions?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
  };
}

/**
 * Registry Service
 * Handles registration workflow with offline-first approach
 */
@Injectable({
  providedIn: 'root',
})
export class RegistryService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly apiUrl = `${environment.apiUrl}/api/registrations`;

  /**
   * Submit registration
   * Saves to cache first, then syncs to server when online
   */
  submitRegistration(data: RegistrationFormData): Observable<CreateRegistrationResponse> {
    const registrationId = this.generateRegistrationId();
    const registrationRequest: CreateRegistrationRequest = {
      id: registrationId,
      personalData: data.personalData,
      medicalInfo: data.medicalInfo,
      registeredAt: new Date().toISOString(),
    };

    // Check if online
    if (this.cacheService.isOnline()) {
      // Try to save to server first
      return this.http
        .post<ApiResponse<CreateRegistrationResponse>>(this.apiUrl, registrationRequest)
        .pipe(
          tap((response) => {
            if (response.success && response.data) {
              console.log('Registration saved to server:', response.data);
            }
          }),
          switchMap((response) => {
            if (response.success && response.data) {
              return of(response.data);
            }
            throw new Error(response.error || 'Failed to create registration');
          }),
          catchError((error) => {
            console.error('Failed to save to server, saving to cache:', error);
            // Fallback to cache
            return from(this.saveToCache(registrationId, registrationRequest));
          })
        );
    } else {
      // Offline: save to cache only
      console.log('Offline: saving registration to cache');
      return from(this.saveToCache(registrationId, registrationRequest));
    }
  }

  /**
   * Save registration to cache
   */
  private async saveToCache(
    id: string,
    data: CreateRegistrationRequest
  ): Promise<CreateRegistrationResponse> {
    await this.cacheService.saveRegistration(id, data);
    return {
      id,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate unique registration ID
   * Format: REG-YYYYMMDD-XXXXX (REG-20250116-A1B2C)
   */
  private generateRegistrationId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Generate random 5-character alphanumeric suffix
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `REG-${year}${month}${day}-${suffix}`;
  }

  /**
   * Get all registrations for current user
   */
  getAllRegistrations(): Observable<any[]> {
    if (this.cacheService.isOnline()) {
      return this.http
        .get<ApiResponse<any[]>>(this.apiUrl)
        .pipe(
          switchMap((response) => {
            if (response.success && response.data) {
              return of(response.data);
            }
            throw new Error(response.error || 'Failed to fetch registrations');
          }),
          catchError((error) => {
            console.error('Failed to fetch from server, using cache:', error);
            return from(this.cacheService.getAllRegistrations());
          })
        );
    } else {
      // Offline: use cache
      return from(this.cacheService.getAllRegistrations());
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Observable<any> {
    return from(this.cacheService.getCacheStats());
  }

  /**
   * Manually trigger sync
   */
  syncPendingRegistrations(): Observable<void> {
    return from(this.cacheService.syncPendingData());
  }
}
