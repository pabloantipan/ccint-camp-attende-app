import { inject, Injectable, signal } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { CacheDB } from './cache.interface';
import { RegistrationApiService } from '../api/registration-api.service';



@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly registrationApi = inject(RegistrationApiService);
  private db: IDBPDatabase<CacheDB> | null = null;
  private readonly DB_NAME = 'camp-registry-cache';
  private readonly DB_VERSION = 1;

  // Observable state for online/offline status
  public readonly isOnline = signal<boolean>(navigator.onLine);

  // Observable state for pending sync count
  public readonly pendingSyncCount = signal<number>(0);

  constructor() {
    this.initDB();
    this.setupOnlineListener();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<CacheDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create registrations store
          if (!db.objectStoreNames.contains('registrations')) {
            db.createObjectStore('registrations', { keyPath: 'id' });
          }

          // Create pending sync store
          if (!db.objectStoreNames.contains('pendingSync')) {
            db.createObjectStore('pendingSync', { keyPath: 'id' });
          }
        },
      });

      // Update pending sync count
      await this.updatePendingSyncCount();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Setup listener for online/offline events
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      console.log('Application is now online');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      console.log('Application is now offline');
    });
  }

  /**
   * Update the pending sync count
   */
  private async updatePendingSyncCount(): Promise<void> {
    if (!this.db) return;

    try {
      const count = await this.db.count('pendingSync');
      this.pendingSyncCount.set(count);
    } catch (error) {
      console.error('Failed to update pending sync count:', error);
    }
  }

  /**
   * Save registration data to cache
   */
  async saveRegistration(id: string, data: any): Promise<void> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) throw new Error('Database not initialized');
    }

    try {
      await this.db.put('registrations', {
        id,
        data,
        timestamp: Date.now(),
        synced: false,
      });

      // Add to pending sync queue
      await this.addToPendingSync(id, 'create', data);
    } catch (error) {
      console.error('Failed to save registration to cache:', error);
      throw error;
    }
  }

  /**
   * Get registration data from cache
   */
  async getRegistration(id: string): Promise<any> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) return null;
    }

    try {
      const result = await this.db.get('registrations', id);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to get registration from cache:', error);
      return null;
    }
  }

  /**
   * Get all cached registrations
   */
  async getAllRegistrations(): Promise<any[]> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) return [];
    }

    try {
      const results = await this.db.getAll('registrations');
      return results.map(r => r.data);
    } catch (error) {
      console.error('Failed to get all registrations from cache:', error);
      return [];
    }
  }

  /**
   * Delete registration from cache
   */
  async deleteRegistration(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) throw new Error('Database not initialized');
    }

    try {
      await this.db.delete('registrations', id);
      await this.addToPendingSync(id, 'delete', null);
    } catch (error) {
      console.error('Failed to delete registration from cache:', error);
      throw error;
    }
  }

  /**
   * Add item to pending sync queue
   */
  private async addToPendingSync(
    id: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('pendingSync', {
        id,
        action,
        data,
        timestamp: Date.now(),
      });

      await this.updatePendingSyncCount();
    } catch (error) {
      console.error('Failed to add to pending sync:', error);
    }
  }

  /**
   * Get all pending sync items
   */
  async getPendingSyncItems(): Promise<any[]> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) return [];
    }

    try {
      return await this.db.getAll('pendingSync');
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      return [];
    }
  }

  /**
   * Mark registration as synced
   */
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) return;

    try {
      const registration = await this.db.get('registrations', id);
      if (registration) {
        registration.synced = true;
        await this.db.put('registrations', registration);
      }

      // Remove from pending sync
      await this.db.delete('pendingSync', id);
      await this.updatePendingSyncCount();
    } catch (error) {
      console.error('Failed to mark registration as synced:', error);
    }
  }

  /**
   * Sync all pending data to server
   */
  async syncPendingData(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Cannot sync: application is offline');
      return;
    }

    const pendingItems = await this.getPendingSyncItems();

    if (pendingItems.length === 0) {
      console.log('No pending items to sync');
      return;
    }

    console.log(`Syncing ${pendingItems.length} pending items...`);

    for (const item of pendingItems) {
      try {
        console.log(`Syncing item ${item.id} (${item.action})`);

        // Call the appropriate API method based on action
        switch (item.action) {
          case 'create':
            await this.registrationApi.createRegistration({
              id: item.id,
              personalData: item.data.personalData,
              medicalInfo: item.data.medicalInfo,
              registeredAt: item.data.registeredAt,
            });
            break;

          case 'update':
            await this.registrationApi.updateRegistration(item.id, item.data);
            break;

          case 'delete':
            await this.registrationApi.deleteRegistration(item.id);
            break;

          default:
            console.warn(`Unknown action: ${item.action}`);
            continue;
        }

        console.log(`Successfully synced item ${item.id}`);

        // Mark as synced after successful sync
        await this.markAsSynced(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        // Don't mark as synced if the API call failed
      }
    }

    console.log('Sync complete');
  }

  /**
   * Clear all cached data (use with caution)
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.clear('registrations');
      await this.db.clear('pendingSync');
      await this.updatePendingSyncCount();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalRegistrations: number;
    syncedRegistrations: number;
    unsyncedRegistrations: number;
    pendingSync: number;
  }> {
    if (!this.db) {
      await this.initDB();
      if (!this.db) {
        return {
          totalRegistrations: 0,
          syncedRegistrations: 0,
          unsyncedRegistrations: 0,
          pendingSync: 0,
        };
      }
    }

    try {
      const allRegistrations = await this.db.getAll('registrations');
      const synced = allRegistrations.filter(r => r.synced).length;
      const unsynced = allRegistrations.filter(r => !r.synced).length;
      const pending = await this.db.count('pendingSync');

      return {
        totalRegistrations: allRegistrations.length,
        syncedRegistrations: synced,
        unsyncedRegistrations: unsynced,
        pendingSync: pending,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalRegistrations: 0,
        syncedRegistrations: 0,
        unsyncedRegistrations: 0,
        pendingSync: 0,
      };
    }
  }
}
