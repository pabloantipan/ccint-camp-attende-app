import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ImageUploadWidgetComponent } from '../image-upload-widget/image-upload-widget.component';

@Component({
  selector: 'app-parent-authorization-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ImageUploadWidgetComponent
  ],
  templateUrl: './parent-authorization-step.component.html',
  styleUrl: './parent-authorization-step.component.scss'
})
export class ParentAuthorizationStepComponent {
  completed = output<void>();

  documentFrontImage = signal<string>('');
  documentBackImage = signal<string>('');
  authorizationLetterImage = signal<string>('');
  isAuthorized = signal<boolean>(false);

  onComplete() {
    this.completed.emit();
  }
}
