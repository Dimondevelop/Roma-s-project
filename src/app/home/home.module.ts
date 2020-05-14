import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import {
  NbSidebarModule,
  NbLayoutModule,
  NbButtonModule,
  NbMenuModule,
  NbIconModule,
  NbTooltipModule, NbSpinnerModule, NbCardModule, NbInputModule
} from '@nebular/theme';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { SettingsComponent } from '../pages/settings/settings.component';

@NgModule({
  declarations: [
    HomeComponent,
    SettingsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    NbLayoutModule,
    NbSidebarModule, // NbSidebarModule.forRoot(), //if this is your app.module
    NbButtonModule,
    NbMenuModule,
    NbIconModule,
    NbTooltipModule,
    NbSpinnerModule,
    NbCardModule,
    NbInputModule
  ]
})
export class HomeModule {}
