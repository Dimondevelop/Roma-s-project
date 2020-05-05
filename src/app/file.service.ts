import { Injectable } from '@angular/core'
import { IpcRenderer } from 'electron'

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private ipc: IpcRenderer;

  constructor() {
    if ((<any>window).require) {
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer
      } catch (error) {
        throw error
      }
    } else {
      console.warn('Could not load electron ipc')
    }
  }


  init() {
    console.log('OnInitService');
    this.ipc.on('ipcLog', (event, args: { message }) => {
      console.log(args.message);
    });
  }

  async reindex(): Promise<{}> {
    return new Promise<string[]>((resolve) => {
      this.ipc.once('reindexResponse', (event, arg) => {
        resolve(arg);
      });
      this.ipc.send('reindex');
    });
  }

  destroy() {
    console.log('OnDestroyService');
    this.ipc.removeAllListeners('ipcLog')
  }
}
