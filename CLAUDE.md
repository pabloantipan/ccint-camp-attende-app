# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CCINT Camp Attendee App** - An Angular 20 Progressive Web Application for managing camp registrations and check-ins with offline-first capabilities.

**Key Technologies:**
- Angular 20.3+ (standalone components architecture)
- Firebase Authentication
- Angular Material & Tailwind CSS
- IndexedDB (via idb) for offline storage
- TypeScript 5.9+ with strict mode

## Common Commands

### Development
```bash
npm start                  # Start dev server (http://localhost:4200)
npm run serve:dev          # Development configuration
npm run serve:prod         # Production configuration locally
```

### Build
```bash
npm run build              # Production build (outputs to dist/)
npm run build:dev          # Development build
npm run build:prod         # Production build with optimizations
npm run watch              # Development build with watch mode
```

### Testing
```bash
npm test                   # Run unit tests with Karma + Jasmine
```

### Code Generation
```bash
ng generate component <name>         # Generate component (SCSS by default)
ng generate service <name>           # Generate service
ng generate --help                   # See all available schematics
```

### Single Test Execution
To run a single test file, use Karma's file pattern filtering:
```bash
ng test --include='**/specific-file.spec.ts'
```

## High-Level Architecture

### Application Structure

```
src/
├── app/                      # Root application configuration
│   ├── app.config.ts         # Firebase & application providers
│   ├── app.routes.ts         # Root routing (wrapper vs login)
│   └── app.ts                # Root component
├── core/                     # Core feature modules
│   ├── guards/               # Route guards
│   │   └── auth.guard.ts     # Firebase auth protection
│   ├── login/                # Authentication flow (sign-in/sign-up/reset)
│   ├── pages/                # Main application pages
│   │   ├── home/
│   │   ├── registry/         # Multi-step registration workflow
│   │   ├── check-in/         # Multi-step check-in workflow
│   │   └── user-profile/
│   └── wrapper/              # Application shell & navigation
│       └── components/
│           ├── main-layout/  # Primary layout structure
│           ├── tab-menu/     # Bottom navigation tabs
│           └── back-button/
├── shared/                   # Shared services & utilities
│   └── services/
│       ├── api/              # Backend API communication layer
│       └── cache/            # Offline-first IndexedDB cache
└── environments/             # Environment-specific configs
```

### Routing Architecture

The app uses a **nested lazy-loading routing structure**:

1. **Root Level** (`app.routes.ts`):
   - `/` → Wrapper (authenticated area)
   - `/login/*` → Login flow (unauthenticated)
   - Wildcard redirects to `/home`

2. **Wrapper Level** (`wrapper.routes.ts`):
   - All routes protected by `authGuard`
   - `/home` → Home page
   - `/profile` → User profile
   - `/registry` → Registration workflow (lazy-loaded child routes)
   - `/checkin` → Check-in workflow

3. **Feature-Specific Routes**:
   - Registry and check-in have their own `.routes.ts` files for multi-step flows

### Authentication Flow

- **Firebase Authentication** via `@angular/fire/auth`
- **authGuard** (`core/guards/auth.guard.ts`): Functional guard using `CanActivateFn`
  - Checks Firebase `authState()` observable
  - Redirects unauthenticated users to `/login/sign-in`
  - All `/` routes (except `/login/*`) require authentication
- Firebase config initialized in `app.config.ts` with `provideFirebaseApp()` and `provideAuth()`

### Offline-First Architecture

The app implements a **cache-first, sync-later pattern** for resilient offline operation:

#### CacheService (`shared/services/cache/cache.service.ts`)
- **IndexedDB stores**: `registrations` and `pendingSync`
- **Reactive state management** using Angular signals:
  - `isOnline` - Tracks network connectivity
  - `pendingSyncCount` - Number of items awaiting sync
- **Auto-sync**: Listens to `online` event and syncs pending data automatically
- **Operations**: save, get, delete registrations; batch sync support

#### RegistrationApiService (`shared/services/api/registration-api.service.ts`)
- HTTP client wrapper for backend API
- **Automatic retry with exponential backoff**: 3 attempts, 1s→2s→4s delays
- **30-second timeout** per request
- **Error handling**:
  - 401 (Unauthorized) → Redirect to login
  - 429 (Rate limiting) → Retry with backoff
  - 5xx (Server errors) → Retry
  - Network errors → Retry
- Session-based auth using cookies (`credentials: 'same-origin'`)

#### ConstantsApiService (`shared/services/api/constants-api.service.ts`)
- Fetches static data (countries, regions, communes)
- **Two-tier caching**:
  1. Memory cache (service instance)
  2. localStorage cache (persists across sessions)
- Version-controlled cache invalidation

### Multi-Step Workflows

Both Registry and Check-In implement wizard-like multi-step forms using Angular Material Stepper.

#### Registry Workflow (`core/pages/registry/`)
**Steps:**
1. Personal Data (`personal-data-step/`)
2. Medical Information (`medical-info-step/`)

Each step is a standalone component with its own form validation.

#### Check-In Workflow (`core/pages/check-in/`)
**Steps:**
1. Payment Verification (`payment-verification-step/`)
2. Parent Authorization (`parent-authorization-step/`)
3. Arrival Confirmation (`arrival-confirmation-step/`)
4. Materials Delivery (`materials-delivery-step/`)

**State Management**: Uses Angular signals to track completion status:
```typescript
paymentCompleted = signal(false);
authorizationCompleted = signal(false);
// etc.
```

Shared widget: `image-upload-widget/` for document/photo uploads.

### TypeScript Path Aliases

Import shortcuts configured in `tsconfig.json`:

```typescript
import { ... } from '@app/*';           // src/app/*
import { ... } from '@environments/*';  // src/environments/*
import { ... } from '@shared/*';        // src/shared/*
import { ... } from '@wrapper/*';       // src/core/wrapper/*
```

**Always use these aliases** instead of relative paths for cleaner imports.

### Standalone Components Pattern

All components use **Angular standalone architecture** (no NgModules):

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatCardModule, /* etc */],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent { }
```

Import specific Angular Material modules and other dependencies directly in the component.

### Environment Configuration

Three environment files with **file replacement** in `angular.json`:

- `environment.ts` - Base/default (no backend)
- `environment.dev.ts` - Development (`apiUrl: 'http://localhost:8080'`)
- `environment.prod.ts` - Production (placeholder values)

**Key environment variables:**
- `mode`: 'development' | 'production' | 'none'
- `production`: boolean
- `apiUrl`: Backend API base URL
- `firebaseConfig`: Firebase project credentials

Build configurations automatically swap files during compilation.

### API Integration Pattern

All backend communication follows a consistent pattern:

1. **API Configuration** (`shared/services/api/api-config.ts`):
   - `API_CONFIG` - Base URL, timeout, retry settings, headers
   - `API_ENDPOINTS` - Centralized endpoint definitions
   - `HTTP_STATUS` - Status code constants

2. **Service Layer** (`*-api.service.ts`):
   - Services inject configuration
   - Methods return typed responses via interfaces
   - Built-in retry logic with `fetchWithRetry()`

3. **Response Format** (defined in `api.interfaces.ts`):
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
     errors?: Array<{ field: string; message: string }>;
   }
   ```

### Styling Approach

- **Primary**: SCSS (configured in `angular.json`)
- **Utility-first**: Tailwind CSS (`tailwind.config.js` scans `src/**/*.{html,ts}`)
- **Component library**: Angular Material (imported per-component)
- **Prettier config**: 100-char width, single quotes, Angular HTML parser

## Development Practices

### When Adding New Features

1. **Create services** in `src/shared/services/` for reusable business logic
2. **Create pages** in `src/core/pages/<feature>/`
3. **Add routes** in feature's `.routes.ts` file (lazy-load with `loadComponent` or `loadChildren`)
4. **Use authGuard** for protected routes: `canActivate: [authGuard]`
5. **Implement offline support**: Use `CacheService` for data persistence and sync

### Component Organization

- **Pages** (`*.page.ts`): Top-level routed components
- **Components** (`*.component.ts`): Reusable UI components
- Each feature has its own `components/` subdirectory for step components
- Shared components and widgets go in `src/shared/` (currently minimal)

### TypeScript Configuration

Strict mode enabled with:
- `strict: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `experimentalDecorators: true` (required for Angular)
- `ignoreDeprecations: "6.0"` (suppresses Angular 6.0 warnings)

### State Management

- **Signals**: Primary reactive primitive (Angular 16+)
  - Use `signal()` for mutable state
  - Use `computed()` for derived state
- **RxJS**: For async operations (HTTP, Firebase auth)
  - Prefer signals for local component state
  - Use observables for streams and subscriptions

## Important Patterns to Follow

### Firebase Authentication
```typescript
// In guards
const auth = inject(Auth);
return authState(auth).pipe(
  take(1),
  map(user => user ? true : router.createUrlTree(['/login/sign-in']))
);
```

### Offline Data Operations
```typescript
// Save to cache first, sync later when online
await cacheService.saveRegistration(id, data);
// CacheService automatically adds to pendingSync queue
```

### API Calls with Retry
```typescript
// Service methods automatically retry on failure
const data = await registrationApi.createRegistration(request);
```

### Multi-Step Form Progression
```typescript
// Use signals to track step completion
stepCompleted = signal(false);

onStepComplete() {
  this.stepCompleted.set(true);
}
```

## VSCode Configuration

The project includes `.vscode/` configurations:
- `launch.json`: Chrome debugger for `ng serve` and `ng test`
- `tasks.json`: Background tasks for start and test scripts
- `extensions.json`: Recommended extensions

## Firebase Setup

Project configured in `app.config.ts`:
- **Project ID**: `ccint-camp-registry-app-dev`
- **Auth**: Firebase Authentication enabled
- Environment-specific configs can override credentials in `environment.*.ts`

## Critical Files Reference

- **App bootstrap**: `src/main.ts`
- **Root config**: `src/app/app.config.ts`
- **Auth guard**: `src/core/guards/auth.guard.ts`
- **Cache service**: `src/shared/services/cache/cache.service.ts`
- **API config**: `src/shared/services/api/api-config.ts`
- **API interfaces**: `src/shared/services/api/api.interfaces.ts`
- **Main layout**: `src/core/wrapper/components/main-layout/`
- **Tab navigation**: `src/core/wrapper/components/tab-menu/`
