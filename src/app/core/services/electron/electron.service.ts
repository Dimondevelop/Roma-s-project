import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  childProcess: typeof childProcess;
  fs: typeof fs;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
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
      console.log(args.message);
    });
  }

  async chooseFiles(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      // this.ipcRenderer.once('selectedFiles', (event, arg) => {
      //   resolve(arg);
      // });
      this.ipcRenderer.once('searchResults', (event, arg) => {
        resolve(arg);
      });
      this.ipcRenderer.send('chooseSearchDocuments');
    });
  }

  async changeIndexingDirectory(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      this.ipcRenderer.once('selectedDirectory', (event, arg) => {
        resolve(arg);
      });
      this.ipcRenderer.send('changeIndexingDirectory');
    });
  }

  async reindex(): Promise<{ files: string[] }> {
    return new Promise<{ files: string[] }>((resolve) => {
      this.ipcRenderer.once('reindexResponse', (event, arg) => {
        resolve(arg);
      });
      this.ipcRenderer.send('reindex');
    });
  }

  async search(text): Promise<{}> {
    return new Promise<[]>((resolve) => {
      this.ipcRenderer.once('searchResults', (event, arg) => {
        resolve(arg);
      });
      this.ipcRenderer.send('search', { text });
    });
  }

  destroy() {
    this.ipcRenderer.removeAllListeners('ipcLog')
  }

  appMaximize() {
    return new Promise<boolean>((resolve) => {
      this.ipcRenderer.once('is-maximized',  (event, isMax: boolean) => {
        resolve(isMax);
      });
      this.ipcRenderer.send('app-maximize');
    });
  }

  appMinimize() {
    this.ipcRenderer.send('app-minimize');
  }

  appQuit() {
    this.ipcRenderer.send('app-quit');
  }
}
