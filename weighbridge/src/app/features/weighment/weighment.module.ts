import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FirstWeighmentComponent } from './first/first-weighment.component';
import { SecondListComponent } from './second-list/second-list.component';
import { SecondCompleteComponent } from './second-complete/second-complete.component';
import { SecondDirectComponent } from './second-direct/second-direct.component';
import { OneGoComponent } from './one-go/one-go.component';
import { PrintDuplicateComponent } from './print-duplicate/print-duplicate.component';

const routes: Routes = [
  { path: 'first', component: FirstWeighmentComponent },
  { path: 'second-direct', component: SecondDirectComponent },
  { path: 'one-go', component: OneGoComponent },
  { path: 'print-duplicate', component: PrintDuplicateComponent },
  { path: 'second', component: SecondListComponent },
  { path: 'second/:id', component: SecondCompleteComponent }
];

@NgModule({
  declarations: [FirstWeighmentComponent, SecondListComponent, SecondCompleteComponent, SecondDirectComponent, OneGoComponent, PrintDuplicateComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes), TranslateModule]
})
export class WeighmentModule {}
