import { win } from "../../main"
import { ipcMain, dialog, app } from "electron"

ipcMain.on('chooseSearchDocuments', (event) => {
  dialog.showOpenDialog(win, {
    title: 'Оберіть файли для пошуку',
    properties: ['openFile', 'multiSelections']
  }).then((files) => {
    win.webContents.send('ipcLog', {message: {files, message: 'chooseSearchDocuments'}})
    if (files) {
      event.sender.send('selectedFiles', files)
      win.webContents.send('ipcLog', {message: {files, message: 'if'}})
    }
  })
})
