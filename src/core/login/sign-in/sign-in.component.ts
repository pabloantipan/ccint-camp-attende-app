import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { RegistrationLoaderService } from '@shared/services/registration-loader.service';

@Component({
  selector: 'app-sign-in',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly registrationLoader = inject(RegistrationLoaderService);

  protected readonly signInForm: FormGroup;
  protected readonly hidePassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.signInForm.value;

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log('User signed in:', userCredential.user);

      // Get ID token and create session cookie
      const idToken = await userCredential.user.getIdToken();

      try {
        await fetch('/api/session/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // Continue anyway - client-side auth still works
      }

      // Load and cache registration data
      await this.registrationLoader.loadAndCacheRegistration();

      // Navigate to home after successful login
      await this.router.navigate(['/home']);
    } catch (error: any) {
      // Handle Firebase Auth errors
      let errorMsg = 'Ocurrió un error al iniciar sesión. Por favor intenta nuevamente.';

      if (error.code === 'auth/invalid-credential') {
        errorMsg = 'Correo electrónico o contraseña inválidos. Por favor intenta nuevamente.';
      } else if (error.code === 'auth/user-disabled') {
        errorMsg = 'Esta cuenta ha sido deshabilitada.';
      } else if (error.code === 'auth/user-not-found') {
        errorMsg = 'No se encontró una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Contraseña inválida.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Demasiados intentos fallidos de inicio de sesión. Por favor intenta más tarde.';
      }

      this.errorMessage.set(errorMsg);
      console.error('Sign in error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getEmailErrorMessage(): string {
    const emailControl = this.signInForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    if (emailControl?.hasError('email')) {
      return 'Por favor ingresa un correo electrónico válido';
    }
    return '';
  }

  protected getPasswordErrorMessage(): string {
    const passwordControl = this.signInForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}
