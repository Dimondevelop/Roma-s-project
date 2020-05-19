import { Subscription } from "rxjs"
import { ipcMain, dialog, app } from "electron"
import { existsSync, mkdir } from "fs"
import { join, parse } from "path"
import { sync } from "glob"
import { extractText } from "doxtract"
import { Client } from "@elastic/elasticsearch"
import { HttpGetQueue } from './HttpGetQueue'
import { win } from '../../main';

export const client = new Client({ node: 'http://localhost:9200' })
let sub: Subscription
// const { webContents } = win

ipcMain.on('changeIndexingDirectory', (event) => {
  dialog.showOpenDialog(win, {
    defaultPath: join(__dirname, '/../../documents'), /*join(__dirname, '/../../../../documents')*/ /*for build*/
    properties: ['openDirectory']
  }).then((files) => {
    win.webContents.send('ipcLog', {message: {files, message: 'OpenDialogReturnValue'}})
    if (files) {
      event.sender.send('selectedDirectory', files)
      win.webContents.send('ipcLog', {message: {files, message: 'if'}})
    }
  })
})

ipcMain.on('reindex', (event, arg) => {
  const { sender } = event
  // note const documents_dir = join(__dirname, '/../../../../documents') /*for build*/
  const documents_dir = join(__dirname, '/../../documents') /*for dev*/
  if (!existsSync(documents_dir)) {
    mkdir(documents_dir, (err) => {if (err) throw err})
  }
  const files: string[] = sync(join(documents_dir, '*.docx'))

  deleteAll()
  createIndex().then(() => {
    indexAll(files).then(() => {
      sender.send('ipcLog', { message: 'All documents EXTRACTED' })
    }).catch((err) => { throw err })
  })
})

async function createIndex() {
  await client.indices.create({
    index: 'docx',
    body: {
      "mappings": {
        properties: {
          "name":  { "type": "keyword" },
          "full_text":  { "type": "text" }
        }
      }
    }
  }, { ignore: [400] })
}

async function indexAll(files: string[]) {
  let length = files.length - 1
  const instance = new HttpGetQueue(client)
  sub = instance.results.subscribe((res) => {
    win.webContents.send('ipcLog', {message: res})
    if (res.count >= files.length) {
      sub.unsubscribe()
      win.webContents.send('reindexResponse', {files})
      win.webContents.send('ipcLog', {message: 'files.length: ' + files.length + ' res.count: ' + res.count})
    }
  })
  while (length > 0) {
    let i = length
    length -= 200
    await separatedExtract(i, length, files).then((dataset) => {
      instance.addToQueue(dataset)
    })
  }
}

async function separatedExtract(i: number, length: number, files: string[]) {
  const dataset = []
  for (; i > length && i >= 0; i--) {
    const name = parse(files[i]).name
    await extractText(files[i]).then((text) => {
      // console.log(name, 'extracted!')
      dataset.push({
        name,
        "full_text": text
      })
    }).catch((err) => { throw err })
  }
  return dataset
}



function deleteAll() {
  client.indices.delete({
    index: '_all'
  }, function(err, res) {
    if (err) {
      throw err.message
    } else {
      win.webContents.send('ipcLog', { message: 'All indexes have been deleted!' })
    }
  })
}
