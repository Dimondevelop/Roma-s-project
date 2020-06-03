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
  getSearchSetting().then((settings: SearchSettings) => {
    const document = separate(arg.text, settings?.separatedSize || 500)
    duplicateSearch(client, { document, name: 'textArea' }).then((results) => {
      sender.send('ipcLog', { message: { results } })
      sender.send('searchResults', { results: results.results })
    }).catch(throwErr)
    win.webContents.send('ipcLog', { message: 'OnSearch emit' })
  }).catch(throwErr)
})

ipcMain.on('chooseSearchDocuments', (event) => {
  dialog.showOpenDialog(win, {
    title: 'Оберіть файли для пошуку',
    buttonLabel: 'Шукати',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['docx'] },
    ],
  }).then(({ canceled, filePaths }) => {
    if (canceled) {
      event.sender.send('searchResults', false)
      return
    }
    if (filePaths?.length) {
      extractDocuments(filePaths).then((extractedDocuments: ExtractedDocument[]) => {
        getMultipleResults(extractedDocuments).then((results: { document: SearchResult[], name: string }[]) => {
          win.webContents.send('searchResults', { results })
          sub.unsubscribe()
        }).catch(throwErr)
      }).catch(throwErr)
    }
  }).catch(throwErr)
})

async function getSearchSetting(): Promise<SearchSettings> {
  return await new Promise((resolve) => {
    getStorage('search-settings', (error, settings: SearchSettings) => {
      if (error) throw error

      resolve(settings)
    })
  })
}

function separate(text: string, size: number): RegExpMatchArray {
  const removeRN = /[\r\n]/gm
  const regexp = new RegExp(`(.{${size}}|.+$)([\u0400-\u04FF\\S]|\\w)*`, 'gm')

  return text.replace(removeRN, ' ').match(regexp)
}

async function antiPlagiarismSearch(client, { document: text, name }: ExtractedDocument): Promise<{ results: SearchResult[], name: string }> {

  const { body } = await client.search({
    index: 'docx',
    body: {
      "_source": "name",
      "query": {
        "match" : { "full_text" : text }
      },
      "score_mode": "avg",
      "highlight": {
        "fields": {
          "full_text": {}
        }
      }
    }
  })

  return { results: body.hits.hits, name }
}

async function duplicateSearch(client, { document: text, name }: ExtractedDocument): Promise<{ results: SearchResult[], name: string }> {
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

async function getMultipleResults(extractedDocuments: ExtractedDocument[]) {
  const isAntiPlagiarismMode: boolean = typeof extractedDocuments[0].document === 'string'
  const searchResults: { document: SearchResult[], name: string }[] = []
  const instance = new HttpGetQueue(isAntiPlagiarismMode ? antiPlagiarismSearch : duplicateSearch, client)
  let i = 0
  return await new Promise((resolve) => {
    sub = instance.results.subscribe(({ results, name }) => {
      i++
      win.webContents.send('ipcLog', { message: { res: { results, name }, log: 'ipc' } })
      searchResults.push({ document: results, name })
      if (i === extractedDocuments?.length) {
        resolve(searchResults)
      }
    })

    for (const exDoc of extractedDocuments) {
      instance.addToQueue(exDoc)
    }
  })
}

async function extractDocuments(documents: string[]): Promise<ExtractedDocument[]> {
  const extractedDocuments: { document: RegExpMatchArray | string, name: string }[] = []
  await getSearchSetting().then(async (settings: SearchSettings) => {
    for (let doc of documents) {
      await extractText(doc).then((text: string) => {
        const document = settings?.mode ? text : separate(text, settings?.separatedSize || 500)
        extractedDocuments.push({ document, name: parse(doc).name })
      }).catch(throwErr)
    }
  }).catch(throwErr)
  return extractedDocuments
}

function throwErr(err) {
  throw err
}

interface SearchResult {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: { name: string, full_text: string }
  highlight: { full_text: string[] }
}

interface ExtractedDocument { document: RegExpMatchArray | string, name: string }
interface SearchSettings { separatedSize?: number, mode?: boolean }
