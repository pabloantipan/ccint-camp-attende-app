import { Component, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  protected readonly signUpForm: FormGroup;
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly auth: Auth,
  ) {
    this.signUpForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((value) => !value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const { displayName, email, password } = this.signUpForm.value;

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      console.log('User created successfully:', userCredential.user);

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

      // Navigate to home after successful sign up
      await this.router.navigate(['/home']);
    } catch (error: any) {
      // Handle Firebase Auth errors
      let errorMsg = 'Ocurrió un error al crear la cuenta. Por favor intenta nuevamente.';

      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Este correo electrónico ya está registrado. Por favor inicia sesión.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Correo electrónico inválido.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'Las cuentas de correo electrónico/contraseña no están habilitadas.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'La contraseña es muy débil. Por favor usa una contraseña más fuerte.';
      }

      this.errorMessage.set(errorMsg);
      console.error('Sign up error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getDisplayNameErrorMessage(): string {
    const control = this.signUpForm.get('displayName');
    if (control?.hasError('required')) {
      return 'El nombre es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return '';
  }

  protected getEmailErrorMessage(): string {
    const control = this.signUpForm.get('email');
    if (control?.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    if (control?.hasError('email')) {
      return 'Por favor ingresa un correo electrónico válido';
    }
    return '';
  }

  protected getPasswordErrorMessage(): string {
    const control = this.signUpForm.get('password');
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  protected getConfirmPasswordErrorMessage(): string {
    const control = this.signUpForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return 'Por favor confirma tu contraseña';
    }
    if (this.signUpForm.hasError('passwordMismatch') && control?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
}
