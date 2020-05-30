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
    public electronService: ElectronService,
    private translate: TranslateService,
    private menuService: NbMenuService,
    private sidebarService: NbSidebarService,
    iconsLibrary: NbIconLibraries
  ) {
    translate.setDefaultLang('uk')

    // if (electronService.isElectron) {
    //   console.log(process.env)
    //   console.log('Mode electron')
    //   console.log('Electron ipcRenderer', electronService.ipcRenderer)
    //   console.log('NodeJS childProcess', electronService.childProcess)
    // } else {
    //   console.log('Mode web')
    // }


    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
    iconsLibrary.registerFontPack('far', { packClass: 'far', iconClassPrefix: 'fa' });
  }

  sidebarToggle = () => this.sidebarService.toggle(true, 'menu-sidebar')


  ngOnInit(): void {
    this.electronService.init()
    this.getSelectedItem()
    this.isMax = this.electronService.win.isMaximized()
  }

  ngOnDestroy(): void {
    this.electronService.destroy()
    this.destroy$.next()
    this.destroy$.complete()
  }

  getSelectedItem(): void {
    this.menuService.onItemSelect().subscribe((menuBag) => {
      this.selectedItem = menuBag.item
    })
  }

  appMaximize = (): void => {
    const { win } = this.electronService
    this.isMax ? win.unmaximize() : win.maximize()
    this.isMax = win.isMaximized()
  }

  appMinimize = (): void => this.electronService.win.minimize()

  appQuit = (): void => this.electronService.win.destroy()
}
