import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import {NbButtonModule, NbIconModule, NbLayoutModule, NbMenuModule, NbSidebarModule} from '@nebular/theme';
import { EmToStrongPipe, SafePipe } from './pipes';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, SafePipe, EmToStrongPipe],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NbLayoutModule,
    NbSidebarModule,
    NbButtonModule,
    NbMenuModule,
    NbIconModule
  ],
  exports: [TranslateModule, WebviewDirective, FormsModule, EmToStrongPipe]
})
export class SharedModule {}
