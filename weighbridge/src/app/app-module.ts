import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    LayoutModule
  ],
  bootstrap: [App]
})
export class AppModule {}
