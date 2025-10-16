import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState, signOut, User } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
  ],
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss']
})
export class UserProfilePage implements OnInit {
  protected readonly user = signal<User | null>(null);
  protected readonly isLoading = signal(false);

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state changes
    authState(this.auth).subscribe(user => {
      this.user.set(user);
    });
  }

  protected async logout(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);

    try {
      // Sign out from Firebase Auth
      await signOut(this.auth);

      // Clear session cookie
      await fetch('/api/session/logout', {
        method: 'POST',
      });

      // Redirect to login
      await this.router.navigate(['/login/sign-in']);
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      await this.router.navigate(['/login/sign-in']);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getInitials(name: string | null | undefined): string {
    if (!name) return 'U';

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  protected formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';

    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }
}
