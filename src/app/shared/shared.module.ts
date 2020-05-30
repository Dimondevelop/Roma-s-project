import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { TranslateModule } from '@ngx-translate/core'

import { PageNotFoundComponent, CheckElasticComponent, SwitcherComponent, DefaultModalComponent } from './components/'
import { WebviewDirective } from './directives/'
import { FormsModule } from '@angular/forms'
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbLayoutModule,
  NbMenuModule,
  NbSidebarModule,
  NbSpinnerModule
} from '@nebular/theme'
import { EmToStrongPipe, SafePipe, TrimPipe } from './pipes'

const exportComponents = [
  SafePipe,
  EmToStrongPipe,
  TrimPipe,
  CheckElasticComponent,
  WebviewDirective,
  SwitcherComponent,
  DefaultModalComponent
]

@NgModule({
  declarations: [
    PageNotFoundComponent,
    ...exportComponents
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NbLayoutModule,
    NbSidebarModule,
    NbButtonModule,
    NbMenuModule,
    NbIconModule,
    NbAlertModule,
    NbSpinnerModule,
    NbCardModule,
  ],
  exports: [
    TranslateModule,
    FormsModule,
    ...exportComponents
  ]
})
export class SharedModule {
}
