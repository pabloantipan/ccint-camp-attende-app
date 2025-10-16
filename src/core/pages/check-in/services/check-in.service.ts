import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CacheService } from '@shared/services/cache/cache.service';
import type {
  ApiResponse,
} from '@shared/services/api/api.interfaces';

export interface CheckInFormData {
  registrationId: string;
  paymentVerification: {
    paymentMethod: string;
    transactionId: string;
    amount: number;
    verified: boolean;
    verifiedAt?: string;
  };
  parentAuthorization: {
    parentName: string;
    relationshipToAttendee: string;
    signatureData?: string;
    photoIdUrl?: string;
    authorizedAt?: string;
  };
  arrivalConfirmation: {
    arrivedAt: string;
    receivedBy: string;
    notes?: string;
  };
  materialsDelivery: {
    itemsDelivered: Array<{
      itemName: string;
      quantity: number;
      condition: string;
    }>;
    deliveredAt: string;
    receivedByStaff: string;
  };
}

export interface CheckInRequest {
  id: string;
  registrationId: string;
  paymentVerification: CheckInFormData['paymentVerification'];
  parentAuthorization: CheckInFormData['parentAuthorization'];
  arrivalConfirmation: CheckInFormData['arrivalConfirmation'];
  materialsDelivery: CheckInFormData['materialsDelivery'];
  checkedInAt: string;
}

export interface CheckInResponse {
  id: string;
  registrationId: string;
  createdAt: string;
}

export interface RegistrationLookupResponse {
  id: string;
  personalData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
  };
  status: 'active' | 'checked-in' | 'deleted';
}

/**
 * Check-In Service
 * Handles check-in workflow with offline-first approach
 */
@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly apiUrl = `${environment.apiUrl}/api/check-ins`;
  private readonly registrationsUrl = `${environment.apiUrl}/api/registrations`;

  /**
   * Lookup registration by ID
   * Used to verify registration exists before check-in
   */
  lookupRegistration(registrationId: string): Observable<RegistrationLookupResponse> {
    if (this.cacheService.isOnline()) {
      return this.http
        .get<ApiResponse<RegistrationLookupResponse>>(
          `${this.registrationsUrl}/${registrationId}`
        )
        .pipe(
          switchMap((response) => {
            if (response.success && response.data) {
              return of(response.data);
            }
            throw new Error(response.error || 'Registration not found');
          }),
          catchError((error) => {
            console.error('Failed to lookup registration from server:', error);
            // Fallback to cache
            return from(this.lookupFromCache(registrationId));
          })
        );
    } else {
      // Offline: use cache
      console.log('Offline: looking up registration from cache');
      return from(this.lookupFromCache(registrationId));
    }
  }

  /**
   * Submit check-in
   * Saves to cache first, then syncs to server when online
   */
  submitCheckIn(data: CheckInFormData): Observable<CheckInResponse> {
    const checkInId = this.generateCheckInId();
    const checkInRequest: CheckInRequest = {
      id: checkInId,
      registrationId: data.registrationId,
      paymentVerification: data.paymentVerification,
      parentAuthorization: data.parentAuthorization,
      arrivalConfirmation: data.arrivalConfirmation,
      materialsDelivery: data.materialsDelivery,
      checkedInAt: new Date().toISOString(),
    };

    // Check if online
    if (this.cacheService.isOnline()) {
      // Try to save to server first
      return this.http
        .post<ApiResponse<CheckInResponse>>(this.apiUrl, checkInRequest)
        .pipe(
          tap((response) => {
            if (response.success && response.data) {
              console.log('Check-in saved to server:', response.data);
            }
          }),
          switchMap((response) => {
            if (response.success && response.data) {
              return of(response.data);
            }
            throw new Error(response.error || 'Failed to create check-in');
          }),
          catchError((error) => {
            console.error('Failed to save to server, saving to cache:', error);
            // Fallback to cache
            return from(this.saveToCache(checkInId, checkInRequest));
          })
        );
    } else {
      // Offline: save to cache only
      console.log('Offline: saving check-in to cache');
      return from(this.saveToCache(checkInId, checkInRequest));
    }
  }

  /**
   * Save check-in to cache
   */
  private async saveToCache(
    id: string,
    data: CheckInRequest
  ): Promise<CheckInResponse> {
    // Store in pending sync queue
    // Note: CacheService needs to be extended to support check-ins
    // For now, we'll use a generic storage approach
    const cacheKey = `checkin_${id}`;
    await this.cacheService.saveRegistration(cacheKey, data as any);

    return {
      id,
      registrationId: data.registrationId,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Lookup registration from cache
   */
  private async lookupFromCache(
    registrationId: string
  ): Promise<RegistrationLookupResponse> {
    const registration = await this.cacheService.getRegistration(registrationId);

    if (!registration) {
      throw new Error('Registration not found in cache');
    }

    return {
      id: registration.id,
      personalData: registration.personalData,
      status: registration.status || 'active',
    };
  }

  /**
   * Generate unique check-in ID
   * Format: CHK-YYYYMMDD-XXXXX (CHK-20250116-A1B2C)
   */
  private generateCheckInId(): string {
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

    return `CHK-${year}${month}${day}-${suffix}`;
  }

  /**
   * Get all check-ins for current user
   */
  getAllCheckIns(): Observable<any[]> {
    if (this.cacheService.isOnline()) {
      return this.http
        .get<ApiResponse<any[]>>(this.apiUrl)
        .pipe(
          switchMap((response) => {
            if (response.success && response.data) {
              return of(response.data);
            }
            throw new Error(response.error || 'Failed to fetch check-ins');
          }),
          catchError((error) => {
            console.error('Failed to fetch from server, using cache:', error);
            return from(this.getAllFromCache());
          })
        );
    } else {
      // Offline: use cache
      return from(this.getAllFromCache());
    }
  }

  /**
   * Get all check-ins from cache
   */
  private async getAllFromCache(): Promise<any[]> {
    // This would need CacheService to be extended for check-ins
    // For now, return empty array
    return [];
  }

  /**
   * Update registration status to checked-in
   */
  updateRegistrationStatus(
    registrationId: string,
    status: 'checked-in'
  ): Observable<void> {
    if (this.cacheService.isOnline()) {
      return this.http
        .patch<ApiResponse<void>>(
          `${this.registrationsUrl}/${registrationId}/status`,
          { status }
        )
        .pipe(
          switchMap((response) => {
            if (response.success) {
              return of(undefined);
            }
            throw new Error(response.error || 'Failed to update status');
          }),
          catchError((error) => {
            console.error('Failed to update status on server:', error);
            return of(undefined);
          })
        );
    } else {
      // Offline: status update will sync later
      return of(undefined);
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
  syncPendingCheckIns(): Observable<void> {
    return from(this.cacheService.syncPendingData());
  }
}
