import { Subscription } from "rxjs"
import { ipcMain, app } from "electron";
import { existsSync, mkdir } from "fs"
import { join, parse } from "path"
import { sync } from "glob"
import { extractText } from "doxtract"
import { Client } from "@elastic/elasticsearch"
import { HttpGetQueue } from './HttpGetQueue';

export const client = new Client({ node: 'http://localhost:9200' })
let sub: Subscription;

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
  // note const documents_dir = join(__dirname, '/../../../../documents') /*for build*/
  const documents_dir = join(__dirname, '/../../documents') /*for dev*/
  if (!existsSync(documents_dir)) {
    mkdir(documents_dir, (err) => {if (err) throw err})
  }
  const files = sync(join(documents_dir, '*.docx'))

  deleteAll(sender)
  createIndex().then(() => {
    indexAll(files, sender).then(() => {
      console.log('All documents EXTRACTED!')
      sender.send('ipcLog', { message: 'All documents EXTRACTED' })
    }).catch((err) => { throw err })
  })
  // win.webContents.send('reindexResponse', files)
})

async function createIndex() {
  const stopwords = ["якщо","саме","які","авжеж","адже","б","без","був","була","були","було","бути","більш","вам","вас","весь","вздовж","ви","вниз","внизу","вона","вони","воно","все","всередині","всіх","від","він","да","давай","давати","де","дещо","для","до","з","завжди","замість","й","коли","ледве","майже","ми","навколо","навіть","нам","от","отже","отож","поза","про","під","так","такий","також","те","ти","тобто","тощо","хоча","це","цей","чого","який","якої","є","із","інших","їх","її","на","по","би","ніби","наче","зате","проте","тому","щоб","аби","бо","ще","або","та","в","що","і","у","яка","за","ж","а","не","то","того","чи","як","при","яких","тут","свої","має","кожен","його","слід","будь-якого","така","всі","між","цієї"];
  await client.indices.create({
    index: 'docx',
    body: {
      "settings": {
        "analysis": {
          "analyzer": {
            "my_analyzer": {
              "type": "standard",
              "stopwords": stopwords
            }
          }
        }
      },
      "mappings": {
        properties: {
          "name":  { "type": "keyword" },
          "full_text":  { "type": "text", "analyzer": "my_analyzer" }
        }
      }
    }
  }, /*{ ignore: [400] }*/)
}

async function indexAll(files, sender) {
  let length = files.length - 1
  const instance = new HttpGetQueue(client)
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



function deleteAll(sender) {
  client.indices.delete({
    index: '_all'
  }, function(err, res) {
    if (err) {
      throw err.message
    } else {
      console.log('All indexes have been deleted!')
      sender.send('ipcLog', { message: 'All indexes have been deleted!' })
    }
  })
}
