import { Injectable } from '@angular/core';
import { API_CONFIG, API_ENDPOINTS } from './api-config';

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

export interface LocationConstants {
  countryCodes: CountryCode[];
  countries: string[];
  chileanCommunes: string[];
  chileanRegions: string[];
  communesByRegion: { [key: string]: string[] };
  citiesByCountry: { [key: string]: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class ConstantsApiService {
  private locationConstantsCache: LocationConstants | null = null;
  private readonly CACHE_KEY = 'location_constants';
  private readonly CACHE_VERSION = '1.0';
  private readonly CACHE_VERSION_KEY = 'location_constants_version';

  /**
   * Get location constants (countries, cities, communes, etc.)
   * Uses localStorage cache to avoid repeated API calls
   */
  async getLocationConstants(): Promise<LocationConstants> {
    // Check memory cache first
    if (this.locationConstantsCache) {
      return this.locationConstantsCache;
    }

    // Check localStorage cache
    const cachedData = this.getFromCache();
    if (cachedData) {
      this.locationConstantsCache = cachedData;
      return cachedData;
    }

    // Fetch from server
    const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.constantsLocations}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch location constants: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Invalid response format from server');
    }

    const data: LocationConstants = result.data;

    // Cache the data
    this.saveToCache(data);
    this.locationConstantsCache = data;

    return data;
  }

  /**
   * Clear the cache (useful for debugging or when data needs to be refreshed)
   */
  clearCache(): void {
    this.locationConstantsCache = null;
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_VERSION_KEY);
  }

  /**
   * Get data from localStorage cache
   */
  private getFromCache(): LocationConstants | null {
    try {
      const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);

      // Check if cache version matches
      if (cachedVersion !== this.CACHE_VERSION) {
        this.clearCache();
        return null;
      }

      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as LocationConstants;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage cache
   */
  private saveToCache(data: LocationConstants): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_VERSION_KEY, this.CACHE_VERSION);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }
}
