import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ImageUploadWidgetComponent } from '../image-upload-widget/image-upload-widget.component';

@Component({
  selector: 'app-materials-delivery-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatCheckboxModule,
    ImageUploadWidgetComponent
  ],
  templateUrl: './materials-delivery-step.component.html',
  styleUrl: './materials-delivery-step.component.scss'
})
export class MaterialsDeliveryStepComponent {
  completed = output<void>();

  tshirtDelivered = signal<boolean>(false);
  credentialDelivered = signal<boolean>(false);
  kitDelivered = signal<boolean>(false);
  bagDelivered = signal<boolean>(false);
  materialsPhoto = signal<string>('');

  allMaterialsDelivered(): boolean {
    return this.tshirtDelivered() &&
           this.credentialDelivered() &&
           this.kitDelivered() &&
           this.bagDelivered();
  }

  remainingMaterials(): number {
    let count = 0;
    if (!this.tshirtDelivered()) count++;
    if (!this.credentialDelivered()) count++;
    if (!this.kitDelivered()) count++;
    if (!this.bagDelivered()) count++;
    return count;
  }

  onComplete() {
    if (this.allMaterialsDelivered()) {
      this.completed.emit();
    }
  }
}
