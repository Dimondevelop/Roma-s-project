import { ipcMain, dialog, app } from "electron"
import { win, client, serve, HttpGetQueue } from '../../main'
import { Subscription } from "rxjs"
import { existsSync, mkdir } from "fs"
import { join, parse } from "path"
import { sync } from "glob"
import { extractText } from "doxtract"
import {
  set as setStorage,
  remove as removeStorage
} from 'electron-json-storage'
import { ceil10 } from '../helpers/math-helper'

let sub: Subscription
let exProgress = { current: 0, prev: 0 }
const documents_dir = join(__dirname, serve ? '/../../documents' : '/../../../../documents')

ipcMain.on('changeIndexingDirectory', (event) => {
  const { sender } = event
  dialog.showOpenDialog(win, {
    defaultPath: documents_dir,
    properties: ['openDirectory']
  }).then((files) => {
    sender.send('ipcLog', { message: { files, message: 'OpenDialogReturnValue' } })
    if (files) {
      sender.send('selectedDirectory', files)
      sender.send('ipcLog', { message: { files, message: 'if' } })
    }
  }).catch((error) => {
    throw error
  })
})

ipcMain.on('reindex', (event, arg) => {
  const { sender } = event
  if (!existsSync(documents_dir)) {
    mkdir(documents_dir, (err) => {
      if (err) throw err
    })
  }
  const files: string[] = sync(join(documents_dir, '*.docx'))

  if (!files || files.length === 0) {
    sender.send('reindexResponse', { empty: true })
    return
  }

  deleteAll()
  createIndex().then(() => {
    indexAll(files).then(() => {
      sender.send('ipcLog', { message: 'All documents EXTRACTED' })
    }).catch((err) => {
      throw err
    })
  }).catch((error) => {
    sender.send('ipcLog', { message: { error, place: 'createIndex' } })
    throw error
  })
})

async function createIndex() {
  await client.indices.create({
    index: 'docx',
    body: {
      "mappings": {
        properties: {
          "name": { "type": "keyword" },
          "full_text": { "type": "text" }
        }
      }
    }
  }, { ignore: [400] })
}

async function sendRequest(client, dataset) {
  const body = dataset.flatMap((doc) => [{ index: { _index: 'docx' } }, doc])
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

  const { body: count } = await client.count({ index: 'docx' })
  return count
}

interface Results {
  count: number
  _shards: {
    failed: number
    skipped: number
    successful: number
    total: number
  }
}

async function indexAll(files: string[]): Promise<void> {
  let length = files.length - 1
  win.webContents.send('progress', { indexed: { length } })
  const sep = length > 1000 ? 200 : ceil10(length / 10)
  exProgress.current = 1
  const instance = new HttpGetQueue(sendRequest, client)
  sub = instance.results.subscribe(({ count, _shards }: Results) => {
    win.webContents.send('ipcLog', { message: { count, _shards } })
    win.webContents.send('progress', { indexed: { count } })
    if (count >= files.length) {
      sub.unsubscribe()
      const fileNames = files.map((file) => parse(file).base)

      setStorage('indexed', { files: fileNames }, (error) => {
        if (error) throw error
      })
      win.webContents.send('reindexResponse', { files: fileNames })
      win.webContents.send('ipcLog', { message: 'files.length: ' + files.length + ' res.count: ' + count })
    }
  })
  while (length > 0) {
    let i = length
    length -= sep
    await separatedExtract(i, length, files).then((dataset) => {
      instance.addToQueue(dataset)
    }).catch((error) => {
      throw error
    })
  }
}

async function separatedExtract(i, length, files: string[]): Promise<{ name: string, "full_text": string }[]> {
  const dataset = []
  for (; i > length && i >= 0; i--) {
    const name = parse(files[i]).name
    await extractText(files[i]).then((text) => {
      const extracted = Math.round(exProgress.current++ / files.length * 100)
      if (exProgress.prev != extracted) {
        win.webContents.send('progress', { extracted })
        exProgress.prev = extracted
      }
      dataset.push({
        name,
        "full_text": text
      })
    }).catch((err) => {
      throw err
    })
  }
  return dataset
}

function deleteAll() {
  client.indices.delete({
    index: '_all'
  }, function (err, res) {
    if (err) {
      throw err.message
    } else {
      win.webContents.send('ipcLog', { message: 'All indexes have been deleted!' })
      removeStorage('indexed', function (error) {
        if (error) throw error
      })
    }
  })
}
