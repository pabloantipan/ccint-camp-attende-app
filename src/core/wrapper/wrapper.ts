import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from "./components/main-layout/main-layout.component";

@Component({
  selector: 'app-wrapper',
  imports: [
    RouterModule,
    MainLayoutComponent,
  ],
  templateUrl: './wrapper.html',
  styleUrls: ['./wrapper.scss']
})
export class Wrapper { }
