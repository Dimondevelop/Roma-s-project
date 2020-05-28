import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import { Location } from '@angular/common';
import {ElectronService} from '../../core/services';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  constructor(private _location: Location, private electronService: ElectronService, readonly nz: NgZone) {}
  filesList: any
  isReindexing = false
  exValue: number = 0
  indexed: { current?: number, perc?: number, max?: number } = { current: 0, perc: 0, max: 100 }

  get exStatus() {
    return getStatus(this.exValue)
  }

  get indexStatus() {
    return getStatus(this.indexed.perc)
  }

  ngOnInit(): void {
    this.electronService.init()
    this.electronService.ipcRenderer.on('progress', (event, { extracted, indexed }) => {
      console.log({extracted, count: indexed?.count, length: indexed?.length});
      this.nz.run(() => {
        extracted && (this.exValue = extracted)
        if (indexed?.count) {
          this.indexed.current = indexed.count
          this.indexed.max && (this.indexed.perc = Math.round( indexed.count / this.indexed.max * 100))
        }
        indexed?.length && (this.indexed.max = indexed.length)
      });
    })
  }

  ngOnDestroy(): void {
    this.electronService.destroy()
  }

  reindex() {
    this.isReindexing = true
    this.exValue = 0
    this.indexed = { current: 0, perc: 0, max: 100 }
    this.electronService.reindex().then(({ files}) => {
      this.filesList = files
      console.log({response: this.filesList});
      this.isReindexing = false
    })
  }

  changeIndexingDirectory() {
    this.exValue = 0
    this.electronService.changeIndexingDirectory().then((data) => {
      console.log({data})
    })
  }

  goBack() {
    this._location.back()
  }
}

const getStatus = (value) => {
  if (value <= 33) {
    return 'danger';
  } else if (value <= 66) {
    return 'warning';
  } else if (value <= 99) {
    return 'info';
  } else {
    return 'success';
  }
}
