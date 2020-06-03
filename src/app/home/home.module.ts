import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { HomeRoutingModule } from './home-routing.module'
import {
  NbTooltipModule,
  NbInputModule,
  NbTabsetModule,
  NbProgressBarModule,
  NbAccordionModule,
  NbListModule,
} from '@nebular/theme'

import { HomeComponent } from './home.component'
import { SharedModule } from '../shared/shared.module'
import { SettingsComponent } from '../pages/settings/settings.component'
import { ReactiveFormsModule } from '@angular/forms'

@NgModule({
  declarations: [
    HomeComponent,
    SettingsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    NbTooltipModule,
    NbInputModule,
    NbTabsetModule,
    NbProgressBarModule,
    NbAccordionModule,
    NbListModule,
    ReactiveFormsModule
  ]
})
export class HomeModule {
}
