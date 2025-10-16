import { Component } from '@angular/core';
import { TabMenuComponent } from '../tab-menu/tab-menu.component';

@Component({
  selector: 'app-main-layout',
  imports: [TabMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent { }
