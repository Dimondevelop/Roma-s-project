import { win, HttpGetQueue } from "../../main"
import { ipcMain, dialog, app } from "electron"
import { extractText } from "doxtract"
import { parse } from "path"
import {
  get as getStorage,
} from 'electron-json-storage'
import { client } from '../../main'
import { Subscription } from 'rxjs'

let sub: Subscription

ipcMain.on('search', (event, arg: { text: string }) => {
  const { sender } = event
  getSeparatingSize().then((size) => {
    const separatedText = separate(arg.text, size)
    search(client, { document: separatedText, name: 'textArea' }).then((results) => {
      sender.send('ipcLog', { message: { results } })
      sender.send('searchResults', { results: results.results })
    }).catch((err) => {
      throw err
    })
    win.webContents.send('ipcLog', { message: 'OnSearch emit' })
  }).catch((err) => { throw err })
})

function getSeparatingSize(): Promise<number> {
  return new Promise((resolve) => {
    getStorage('search-settings', (error, arg: { separatedSize?: number }) => {
      if (error) throw error

      resolve(arg?.separatedSize || 500)
    })
  })

}

function separate(text: string, size: number): RegExpMatchArray {
  const removeRN = /[\r\n]/gm
  // const regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm
  const regexp = new RegExp(`(.{${size}}|.+$)([\u0400-\u04FF\\S]|\\w)*`, 'gm')

  const separatedText = text.replace(removeRN, ' ').match(regexp)
  console.log(separatedText)
  return separatedText
}

async function search(client, { document: text, name }): Promise<{ results: SearchResult[], name: string }> {
  const queries = []
  for (let str of text) {
    queries.push({ "match": { "query": str } })
  }

  const { body } = await client.search({
    index: 'docx',
    body: {
      "_source": "name",
      "query": {
        "intervals": {
          "full_text": {
            "any_of": {
              "intervals": queries
            }
          }
        }
        // "match" : { "full_text" : text }
/*        "match" : {
          "full_text" : { "query" : text, "operator" : "and" }
        }*/
      },
      "highlight": {
        "fields": {
          "full_text": {}
        }
      }
    }
  })

  return { results: body.hits.hits, name }

  // hits.forEach((hit) => {
  //   console.log({document: hit._source.name, score: hit._score, highlight: hit.highlight})
  //   // console.log(hit)
  // })
}

ipcMain.on('chooseSearchDocuments', (event) => {
  dialog.showOpenDialog(win, {
    title: 'Оберіть файли для пошуку',
    buttonLabel: 'Шукати',
    properties: ['openFile', 'multiSelections']
  }).then(({ canceled, filePaths }) => {
    if (canceled) {
      event.sender.send('searchResults', false)
      return
    }
    if (filePaths.length) {
      extractDocuments(filePaths).then((extractedDocuments: ExtractedDocument[]) => {
        getMultipleResults(extractedDocuments).then((results: { document: SearchResult[], name: string }[]) => {
          win.webContents.send('searchResults', { results })
          sub.unsubscribe()
        }).catch((error) => { throw error })
      }).catch((error) => { throw error })
      // event.sender.send('selectedFiles', files)
    }
  }).catch((error) => { throw error })
})

async function getMultipleResults(extractedDocuments: ExtractedDocument[]) {
  const searchResults: { document: SearchResult[], name: string }[] = []
  const instance = new HttpGetQueue(search, client)
  let i = 0
  return await new Promise((resolve) => {
    sub = instance.results.subscribe(({ results, name }) => {
      i++
      win.webContents.send('ipcLog', { message: { res: { results, name }, log: 'ipc' } })
      searchResults.push({ document: results, name })
      if (i === extractedDocuments.length) {
        resolve(searchResults)
      }
    })

    for (const exDoc of extractedDocuments) {
      instance.addToQueue(exDoc)
    }
  })
}

async function extractDocuments(documents: string[]): Promise<ExtractedDocument[]> {
  const extractedDocuments: { document: RegExpMatchArray, name: string }[] = []
  for (let doc of documents) {
    await extractText(doc).then((text) => {
      extractedDocuments.push({ document: separate(text, 500), name: parse(doc).name })
    }).catch((err) => { throw err })
  }
  return extractedDocuments
}

interface SearchResult {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: { name: string, full_text: string }
  highlight: { full_text: string[] }
}

interface ExtractedDocument { document: RegExpMatchArray, name: string }
