import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from './shell/shell.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopnavComponent } from './topnav/topnav.component';

@NgModule({
  declarations: [ShellComponent, SidebarComponent, TopnavComponent],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [ShellComponent]
})
export class LayoutModule {}
