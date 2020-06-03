import { ipcMain, dialog, app } from "electron"
import {
  get as getStorage,
  set as setStorage,
} from 'electron-json-storage'

import { win } from '../../main';

ipcMain.on('mode', (event, arg: { text: string }) => {

})
