import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
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
      this.remote = window.require('electron').remote;

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
    console.log('OnInitService');
    this.ipcRenderer.on('ipcLog', (event, args: { message }) => {
      console.log(args.message);
    });
  }

  async chooseFiles(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      this.ipcRenderer.once('selectedFiles', (event, arg) => {
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

  async reindex(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      this.ipcRenderer.once('reindexResponse', (event, arg) => {
        resolve(arg);
      });
      this.ipcRenderer.send('reindex');
    });
  }

  async search(text): Promise<{}> {
    return new Promise<[]>((resolve) => {
      this.ipcRenderer.once('searchResults', (event, arg) => {
        console.log({arg});
        resolve(arg);
      });
      this.ipcRenderer.send('search', { text });
    });
  }

  destroy() {
    console.log('OnDestroyService');
    this.ipcRenderer.removeAllListeners('ipcLog')
  }
}
