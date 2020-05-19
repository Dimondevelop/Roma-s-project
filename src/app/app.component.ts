import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { NbMenuService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {NbMenuItem} from '@nebular/theme/components/menu/menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  menuItems = [
    {
      title: 'Пошук Дублікатів',
      icon: 'search-outline',
      link: '/home',
      home: true,
    },
    {
      title: 'Архів',
      icon: 'archive-outline',
      link: '/archive',
    },
    {
      title: 'Налаштування',
      icon: 'settings-2-outline',
      link: '/settings',
    },
    {
      title: 'Тестування запитів',
      icon: 'info-outline',
      link: '/test',
    }
  ]
  private destroy$ = new Subject<void>();
  selectedItem: NbMenuItem;
  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    private menuService: NbMenuService
  ) {
    translate.setDefaultLang('uk')

    console.log('AppConfig', AppConfig);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }
  }


  ngOnInit(): void {
    this.getSelectedItem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSelectedItem() {
    this.menuService.onItemSelect().subscribe((menuBag) => {
      this.selectedItem = menuBag.item;
    })
  }
}
