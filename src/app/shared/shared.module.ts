import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { TranslateModule } from '@ngx-translate/core'

import { PageNotFoundComponent, CheckElasticComponent, SwitcherComponent, DefaultModalComponent } from './components/'
import { WebviewDirective, StyleVarsDirective } from './directives/'
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
import { EmToStrongPipe, SafePipe, TrimPipe } from './pipes';

const exportDeclaredComponents = [
  SafePipe,
  EmToStrongPipe,
  TrimPipe,
  CheckElasticComponent,
  WebviewDirective,
  StyleVarsDirective,
  SwitcherComponent,
]

const exportImportedComponents = [
  NbSpinnerModule,
  NbCardModule,
  NbLayoutModule,
  NbIconModule,
  NbButtonModule,
  NbAlertModule,
]

@NgModule({
  declarations: [
    PageNotFoundComponent,
    DefaultModalComponent,
    ...exportDeclaredComponents,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NbSidebarModule,
    NbMenuModule,
    ...exportImportedComponents,
  ],
  exports: [
    TranslateModule,
    FormsModule,
    ...exportImportedComponents,
    ...exportDeclaredComponents
  ]
})
export class SharedModule {
}
