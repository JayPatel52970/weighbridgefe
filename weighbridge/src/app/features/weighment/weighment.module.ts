import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { FirstWeighmentComponent } from './first/first-weighment.component';
import { SecondListComponent } from './second-list/second-list.component';
import { SecondCompleteComponent } from './second-complete/second-complete.component';

const routes: Routes = [
  { path: 'first', component: FirstWeighmentComponent },
  { path: 'second', component: SecondListComponent },
  { path: 'second/:id', component: SecondCompleteComponent }
];

@NgModule({
  declarations: [FirstWeighmentComponent, SecondListComponent, SecondCompleteComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class WeighmentModule {}
