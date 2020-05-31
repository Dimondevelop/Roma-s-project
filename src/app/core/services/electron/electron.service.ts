import { Injectable, NgZone } from '@angular/core'
import { Client } from '@elastic/elasticsearch'

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote, BrowserWindow } from 'electron'
import * as childProcess from 'child_process'
import * as fs from 'fs'
import { DataOptions } from 'electron-json-storage'

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer
  webFrame: typeof webFrame
  remote: typeof remote
  childProcess: typeof childProcess
  fs: typeof fs
  win: BrowserWindow
  storage: ElectronStorage
  elastic: any
  elasticClient: Client

  filesList: any[] = []
  isReindexing = false
  elasticConnected: boolean = null
  exValue: number = 0
  indexed: { current?: number, perc?: number, max?: number } = { current: 0, perc: 0, max: 100 }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type)
  }

  constructor(readonly nz: NgZone) {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer
      this.webFrame = window.require('electron').webFrame
      this.remote = window.require('electron').remote

      this.childProcess = window.require('child_process')
      this.fs = window.require('fs')
    }

    if ((<any>window).require) {
      try {
        this.ipcRenderer = (<any>window).require('electron').ipcRenderer
      } catch (error) {
        throw error
      }
    } else {
      console.warn('Could not load electron ipc')
    }
  }

  init() {
    this.ipcRenderer.on('ipcLog', (event, args: { message }) => {
      console.log(args.message)
    })

    this.win = remote.getCurrentWindow()
    this.storage = remote.require('electron-json-storage')
    this.elastic = remote.require('@elastic/elasticsearch')
    this.elasticClient = new this.elastic.Client({ node: 'http://localhost:9200' })
  }

  async elasticPing() {
    console.log('ping')
    await this.elasticClient.ping().then(() => {
      this.elasticConnected = true
    }).catch(() => {
      this.elasticConnected = false
    })
  }

  async chooseFiles(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      // this.ipcRenderer.once('selectedFiles', (event, arg) => {
      //   resolve(arg);
      // });
      this.ipcRenderer.once('searchResults', (event, arg) => {
        resolve(arg)
      })
      this.ipcRenderer.send('chooseSearchDocuments')
    })
  }

  async changeIndexingDirectory(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      this.ipcRenderer.once('selectedDirectory', (event, arg) => {
        resolve(arg)
      })
      this.ipcRenderer.send('changeIndexingDirectory')
    })
  }

  async reindex(): Promise<{ files?: string[], empty?: boolean }> {
    return new Promise<{ files?: string[], empty?: boolean }>((resolve) => {
      this.ipcRenderer.once('reindexResponse', (event, arg) => {
        resolve(arg)
      })
      this.ipcRenderer.send('reindex')
    })
  }

  async search(text): Promise<{}> {
    return new Promise<[]>((resolve) => {
      this.ipcRenderer.once('searchResults', (event, arg) => {
        resolve(arg)
      })
      this.ipcRenderer.send('search', { text })
    })
  }

  getIndexedFiles() {
    this.storage.get('indexed', (error, data: { files: string[] }) => {
      if (error) throw error

      setTimeout(() => {
        this.nz.run(() => {
          this.filesList = data?.files || null
          if (this.filesList?.length) {
            this.exValue = 100
            this.indexed.current = this.filesList.length
            this.indexed.perc = 100
          }
        })
      })
    })
  }

  destroy() {
    this.ipcRenderer.removeAllListeners('ipcLog')
  }
}

interface ElectronStorage {
  getDefaultDataPath(): string;
  setDataPath(directory?: string): void;
  getDataPath(): string;
  get(key: string, callback: (error: any, data: object) => void): void;
  get(key: string, options: DataOptions, callback: (error: any, data: object) => void): void;
  getMany(keys: ReadonlyArray<string>, callback: (error: any, data: object) => void): void;
  getMany(keys: ReadonlyArray<string>, options: DataOptions, callback: (error: any, data: object) => void): void;
  getAll(callback: (error: any, data: object) => void): void;
  getAll(options: DataOptions, callback: (error: any, data: object) => void): void;
  set(key: string, json: object, callback: (error: any) => void): void;
  set(key: string, json: object, options: DataOptions, callback: (error: any) => void): void;
  has(key: string, callback: (error: any, hasKey: boolean) => void): void;
  has(key: string, options: DataOptions, callback: (error: any, hasKey: boolean) => void): void;
  keys(callback: (error: any, keys: string[]) => void): void;
  keys(options: DataOptions, callback: (error: any, keys: string[]) => void): void;
  remove(key: string, callback: (error: any) => void): void;
  remove(key: string, options: DataOptions, callback: (error: any) => void): void;
  clear(callback: (error: any) => void): void;
  clear(options: DataOptions, callback: (error: any) => void): void;
}
