import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-image-upload-widget',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './image-upload-widget.component.html',
  styleUrl: './image-upload-widget.component.scss'
})
export class ImageUploadWidgetComponent {
  title = input<string>('Subir Imagen');
  description = input<string>('Tome una foto o suba un archivo desde su dispositivo');
  icon = input<string>('add_photo_alternate');
  helperText = input<string>('');
  imagePreview = input<string>(''); // Will be populated later with actual image

  imageSelected = output<File>();
  imageRemoved = output<void>();

  onRemove() {
    this.imageRemoved.emit();
  }
}
