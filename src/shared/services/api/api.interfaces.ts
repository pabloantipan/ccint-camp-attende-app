/**
 * API Response Interfaces
 */

/**
 * Generic API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Registration Data Interface (matches server)
 */
export interface RegistrationData {
  id: string;
  personalData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    countryCode: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    region?: string; // Chilean region (optional, only for Chile)
    city: string;
    state: string; // Chilean commune (state)
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
  registeredAt: string;
  createdBy: string;
  status: 'active' | 'checked-in' | 'deleted';
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Registration creation request
 */
export interface CreateRegistrationRequest {
  id: string;
  personalData: RegistrationData['personalData'];
  medicalInfo: RegistrationData['medicalInfo'];
  registeredAt: string;
}

/**
 * Registration creation response
 */
export interface CreateRegistrationResponse {
  id: string;
  createdAt: string;
}

/**
 * Batch sync request
 */
export interface BatchSyncRequest {
  registrations: CreateRegistrationRequest[];
}

/**
 * Batch sync response
 */
export interface BatchSyncResponse {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Registration statistics
 */
export interface RegistrationStats {
  total: number;
  active: number;
  checkedIn: number;
  deleted: number;
}

/**
 * API Error
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Retry options
 */
export interface RetryOptions {
  attempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}
