import { Observable, Subject, Subscription } from "rxjs"
import { concatMap } from "rxjs/operators"
import { win } from "../../main"

import { ipcMain, app } from "electron";
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const { extractText } = require('doxtract')
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
// const { Subscription, Subject } = require('rxjs')
// const { concatMap } = require('rxjs/operators')

let sub: Subscription;

class HttpGetQueue {
  results: Observable<any>
  queue$ = new Subject()
  constructor() {
    this.results = this.queue$.pipe(concatMap((dataset) => sendRequest(dataset)))
  }

  addToQueue(data) {
    this.queue$.next(data)
  }
}

// ipcMain.on('open-file-dialog', (event) => {
//   dialog.showOpenDialog({
//     properties: ['openFile', 'openDirectory']
//   }, (files) => {
//     if (files) {
//       event.sender.send('selected-directory', files)
//     }
//   })
// })

ipcMain.on('reindex', (event, arg) => {
  const { sender } = event
  // note const documents_dir = path.join(__dirname, '/../../../../documents') /*for build*/
  const documents_dir = path.join(__dirname, '/../../documents') /*for dev*/
  if (!fs.existsSync(documents_dir)) {
    fs.mkdir(documents_dir, (err) => {if (err) throw err})
  }
  const files = glob.sync(path.join(documents_dir, '*.docx'))

  deleteAll(sender)
  indexAll(files, sender).then(() => {
    console.log('All documents EXTRACTED!')
    sender.send('ipcLog', { message: 'All documents EXTRACTED' })
  }).catch(console.error)
  // win.webContents.send('reindexResponse', files)
})

async function indexAll(files, sender) {
  await client.indices.create({
    index: 'tweets',
    body: {
      mappings: {
        properties: {
          "name":  { "type": "keyword" },
          "full_text":  { "type": "text" }
        }
      }
    }
  }, { ignore: [400] })

  let length = files.length - 1
  const instance = new HttpGetQueue()
  sub = instance.results.subscribe((res) => {
    console.log(res)
    sender.send('ipcLog', {message: res})
    if (res.count >= files.length) {
      console.log('files.length', files.length, 'res.count', res.count);
      sub.unsubscribe()
      sender.send('reindexResponse', {files})
      sender.send('ipcLog', {message: 'files.length: ' + files.length + ' res.count: ' + res.count})
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
    const name = path.parse(files[i]).name.replace(/ /g, "_")
    await extractText(files[i]).then((text) => {
      // console.log(name, 'extracted!')
      dataset.push({
        name,
        "full_text": text
      })
    }).catch(console.log)
  }
  return dataset
}

async function sendRequest (dataset) {
  const body = dataset.flatMap((doc) => [{index: {_index: 'docx'}}, doc])
  let bulkResponse = { errors: null, items: [] }
  await client.bulk({ refresh: true, body }).then((data) => {
    bulkResponse = data.body
  }).catch((error) => {
    console.error(error)
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
    console.log(erroredDocuments)
    throw erroredDocuments
  }

  const { body: count } = await client.count({index: 'docx'})
  return count
}

function deleteAll(sender) {
  client.indices.delete({
    index: '_all'
  }, function(err, res) {
    if (err) {
      console.error(err.message)
    } else {
      console.log('All indexes have been deleted!')
      sender.send('ipcLog', { message: 'All indexes have been deleted!' })
    }
  })
}
