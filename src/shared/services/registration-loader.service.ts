import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { CacheService } from './cache/cache.service';
import { environment } from '@environments/environment';
import type { ApiResponse, RegistrationData } from './api/api.interfaces';

/**
 * Registration Loader Service
 * Handles loading registration data on login and clearing on logout
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationLoaderService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly cacheService = inject(CacheService);
  private readonly apiUrl = `${environment.apiUrl}/api/registrations`;

  /**
   * Load user's registration data from API and cache it
   * Should be called after successful login
   */
  async loadAndCacheRegistration(): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      console.warn('Cannot load registration: No user ID available');
      return;
    }

    try {
      console.log('Loading registration data from server...');
      const response = await this.http.get<ApiResponse<RegistrationData>>(`${this.apiUrl}/me`).toPromise();

      if (response?.success && response.data) {
        console.log('Registration data loaded, caching...');

        // Cache the registration data
        await this.cacheService.saveRegistration(userId, {
          id: userId,
          personalData: response.data.personalData,
          medicalInfo: response.data.medicalInfo,
          registeredAt: response.data.registeredAt,
        });

        // Also save to sessionStorage for form initialization
        sessionStorage.setItem('registrationPersonalData', JSON.stringify(response.data.personalData));
        sessionStorage.setItem('registrationMedicalInfo', JSON.stringify(response.data.medicalInfo));

        console.log('Registration data cached successfully');
      } else {
        console.log('No registration data found for user');
      }
    } catch (error: any) {
      // 404 is expected when user has no registration yet
      if (error.status === 404) {
        console.log('User has no registration yet');
      } else {
        console.error('Error loading registration data:', error);
      }
    }
  }

  /**
   * Clear cached registration data
   * Should be called on logout
   */
  async clearCachedRegistration(): Promise<void> {
    try {
      console.log('Clearing cached registration data...');

      // Clear sessionStorage
      sessionStorage.removeItem('registrationPersonalData');
      sessionStorage.removeItem('registrationMedicalInfo');

      // Clear cache
      await this.cacheService.clearCache();

      console.log('Cached registration data cleared');
    } catch (error) {
      console.error('Error clearing cached registration:', error);
    }
  }

  /**
   * Get cached registration data
   * Returns data from cache if available
   */
  async getCachedRegistration(): Promise<RegistrationData | null> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      return null;
    }

    try {
      const cachedData = await this.cacheService.getRegistration(userId);
      return cachedData || null;
    } catch (error) {
      console.error('Error getting cached registration:', error);
      return null;
    }
  }
}
