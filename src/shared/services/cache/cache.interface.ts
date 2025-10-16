import { DBSchema } from "idb";

export interface CacheDB extends DBSchema {
  registrations: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
}
