import { ipcMain, dialog, app } from "electron"
import { win, client, serve } from '../../main'
import { Subscription } from "rxjs"
import { existsSync, mkdir } from "fs"
import { join, parse } from "path"
import { sync } from "glob"
import { extractText } from "doxtract"
import { HttpGetQueue } from './HttpGetQueue'
let sub: Subscription
let documents_dir: string;
if (serve) {
  documents_dir = join(__dirname, '/../../documents') /*for dev*/
} else {
  documents_dir = join(__dirname, '/../../../../documents') /*for build*/
}
// const { webContents } = win

ipcMain.on('changeIndexingDirectory', (event) => {
  dialog.showOpenDialog(win, {
    defaultPath: documents_dir,
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

async function sendRequest (client, dataset) {
  win.webContents.send('ipcLog', {message: {client, dataset}})
  const body = dataset.flatMap((doc) => [{index: {_index: 'docx'}}, doc])
  let bulkResponse = { errors: null, items: [] }
  await client.bulk({ refresh: 'true', body }).then((data) => {
    bulkResponse = data.body
  }).catch((error) => {
    console.error('sendRequest', error)
  })

  if (bulkResponse.errors) {
    const erroredDocuments = []
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        })
      }
    })
    console.log('bulkResponse.errors ', erroredDocuments)
    throw erroredDocuments
  }

  const { body: count } = await client.count({index: 'docx'})
  return count
}

async function indexAll(files: string[]): Promise<void> {
  let length = files.length - 1
  const instance = new HttpGetQueue(sendRequest, client)
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

async function separatedExtract(i, length, files: string[]): Promise<{ name: string, "full_text": string }[]> {
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
