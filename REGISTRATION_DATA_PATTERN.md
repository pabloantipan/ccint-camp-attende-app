# Registration Data Loading Pattern

This document describes the pattern used for loading and caching registration data in the application.

## Overview

The application follows a **load-on-login, cache-first** pattern for registration data:

1. **On Login**: Fetch registration data from Datastore API and cache it
2. **On Form Load**: Use cached data as defaults
3. **On Logout**: Clear all cached data

## Architecture

### Services

#### RegistrationLoaderService (`src/shared/services/registration-loader.service.ts`)

Central service for managing registration data lifecycle:

```typescript
// Load and cache on login
await registrationLoader.loadAndCacheRegistration();

// Clear cache on logout
await registrationLoader.clearCachedRegistration();

// Get cached data (if needed)
const data = await registrationLoader.getCachedRegistration();
```

### Data Storage Layers

1. **IndexedDB Cache** (`CacheService`)
   - Persistent offline storage
   - Stores full registration object with Firebase UID as key

2. **SessionStorage**
   - Temporary storage for current session
   - Stores `registrationPersonalData` and `registrationMedicalInfo`
   - Used by form components for initialization

## Implementation Flow

### 1. Login Flow (sign-in.component.ts)

```typescript
async onSubmit() {
  // ... authentication logic ...

  // Load and cache registration data
  await this.registrationLoader.loadAndCacheRegistration();

  // Navigate to home
  await this.router.navigate(['/home']);
}
```

**What happens:**
- User signs in with Firebase Auth
- `loadAndCacheRegistration()` calls `GET /api/registrations/me`
- If registration exists:
  - Saves to IndexedDB cache (using Firebase UID as key)
  - Saves to sessionStorage for quick access
- If no registration (404): Does nothing (new user)

### 2. Form Initialization (personal-data-step.component.ts)

```typescript
ngOnInit() {
  // Initialize form with cached data
  this.initForm();
}

private initForm() {
  const savedData = this.getSavedData(); // Reads from sessionStorage

  this.personalDataForm = this.fb.group({
    firstName: [savedData?.firstName || '', Validators.required],
    lastName: [savedData?.lastName || '', Validators.required],
    // ... other fields ...
    email: [{ value: userEmail, disabled: true }, [Validators.required]],
  });
}

private getSavedData() {
  const data = sessionStorage.getItem('registrationPersonalData');
  return data ? JSON.parse(data) : null;
}
```

**What happens:**
- Form checks sessionStorage for cached data
- If found: Pre-populates all form fields
- If not found: Shows empty form (new registration)
- Email is always from Firebase Auth and disabled

### 3. Logout Flow (user-profile.page.ts)

```typescript
async logout() {
  // Clear cached registration data
  await this.registrationLoader.clearCachedRegistration();

  // Sign out from Firebase
  await signOut(this.auth);

  // Clear session cookie
  await fetch('/api/session/logout', { method: 'POST' });

  // Redirect to login
  await this.router.navigate(['/login/sign-in']);
}
```

**What happens:**
- Clears sessionStorage
- Clears IndexedDB cache
- Signs out from Firebase
- Redirects to login page

## Benefits

1. **Performance**: Data loaded once on login, forms initialize instantly
2. **Offline Support**: Data available in IndexedDB even when offline
3. **Consistency**: Single source of truth (Datastore) loaded at login
4. **Security**: Cache cleared on logout, preventing data leakage
5. **UX**: Seamless form pre-population for returning users

## Usage in Other Features (e.g., Check-in)

To implement the same pattern in check-in or other features:

```typescript
// In your component's ngOnInit:
ngOnInit() {
  this.initForm();
}

// In your initForm method:
private initForm() {
  const savedData = this.getSavedPersonalData();
  const savedMedicalInfo = this.getSavedMedicalInfo();

  // Use savedData to pre-populate your form
  this.checkInForm = this.fb.group({
    firstName: [savedData?.firstName || '', Validators.required],
    // ... etc
  });
}

private getSavedPersonalData() {
  const data = sessionStorage.getItem('registrationPersonalData');
  return data ? JSON.parse(data) : null;
}

private getSavedMedicalInfo() {
  const data = sessionStorage.getItem('registrationMedicalInfo');
  return data ? JSON.parse(data) : null;
}
```

**No need to call API** - the data is already loaded and cached at login!

## Data Structure

### SessionStorage Keys

- `registrationPersonalData`: Personal information object
- `registrationMedicalInfo`: Medical information object

### IndexedDB Structure

```typescript
{
  id: string,              // Firebase Auth UID
  data: {
    id: string,
    personalData: { ... },
    medicalInfo: { ... },
    registeredAt: string
  },
  timestamp: number,
  synced: boolean
}
```

## Important Notes

1. **Email is Read-Only**: Email field is always populated from Firebase Auth and disabled
2. **Registration ID = Firebase UID**: All registrations use Firebase Auth UID as ID
3. **One Registration Per User**: Users can only have one registration, updates instead of duplicates
4. **Cache Cleared on Logout**: Always clear sensitive data when user logs out
5. **Session vs Persistent**: SessionStorage for current session, IndexedDB for offline persistence

## Testing Checklist

- [ ] Login loads and caches registration data
- [ ] Forms pre-populate with cached data
- [ ] New users see empty forms
- [ ] Email field is disabled and shows Firebase email
- [ ] Logout clears all cached data
- [ ] Re-login fetches fresh data from API
- [ ] Offline mode uses cached data
- [ ] Cache survives page refresh (IndexedDB)
