import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';
import { TestComponent } from "./test/test.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { ArchiveComponent } from "./pages/archive/archive.component";

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'test', component: TestComponent },
  { path: 'archive', component: ArchiveComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
