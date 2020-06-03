import { Component, OnInit, OnDestroy } from '@angular/core'
import { ElectronService } from './core/services'
import { TranslateService } from '@ngx-translate/core'
import { AppConfig } from '../environments/environment'
import { NbIconLibraries, NbMenuService, NbSidebarService } from '@nebular/theme'
import { Subject } from 'rxjs'
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service'

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
      title: 'Для тестування',
      icon: 'info-outline',
      link: '/test',
    }
  ]
  private destroy$ = new Subject<void>()
  selectedItem: NbMenuItem
  isMax: boolean
  constructor(
    public eS: ElectronService,
    private translate: TranslateService,
    private menuService: NbMenuService,
    private sidebarService: NbSidebarService,
    iconsLibrary: NbIconLibraries
  ) {
    translate.setDefaultLang('uk')

    // if (eS.isElectron) {
    //   console.log(process.env)
    //   console.log('Mode electron')
    //   console.log('Electron ipcRenderer', eS.ipcRenderer)
    //   console.log('NodeJS childProcess', eS.childProcess)
    // } else {
    //   console.log('Mode web')
    // }


    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
    iconsLibrary.registerFontPack('far', { packClass: 'far', iconClassPrefix: 'fa' });
  }

  sidebarToggle = () => this.sidebarService.toggle(true, 'menu-sidebar')


  ngOnInit(): void {
    this.eS.init()
    this.getSelectedItem()
    this.isMax = this.eS.win.isMaximized()
    this.eS.win.addListener('maximize', () => {
      this.isMax = true;
    })
    this.eS.win.addListener('unmaximize', () => {
      this.isMax = false;
    })
  }

  ngOnDestroy(): void {
    this.eS.destroy()
    this.destroy$.next()
    this.destroy$.complete()
  }

  getSelectedItem(): void {
    this.menuService.onItemSelect().subscribe((menuBag) => {
      this.selectedItem = menuBag.item
    })
  }

  appMaximize = (): void => {
    const { win } = this.eS
    this.isMax ? win.unmaximize() : win.maximize()
  }

  appMinimize = (): void => this.eS.win.minimize()

  appQuit = (): void => this.eS.win.destroy()
}
