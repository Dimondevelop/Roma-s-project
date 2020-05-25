import { win } from "../../main"
import { ipcMain, dialog, app } from "electron"
import { extractText } from "doxtract"
import { parse } from "path"

import { client } from '../../main'
import { Subscription } from 'rxjs';
import {HttpGetQueue} from '../indexing/HttpGetQueue';

let sub: Subscription

ipcMain.on('search', (event, arg: { text: string }) => {
  const { sender } = event

  const separatedText = separate(arg.text, 500);
  search(client, {document: separatedText, name: 'textArea'}).then((results) => {
    sender.send('ipcLog', { message: { results } })
    sender.send('searchResults', { results: results.results })
  }).catch((err) => { throw err })
  win.webContents.send('ipcLog', { message: 'OnSearch emit' })
})

function separate(text: string, count: number): RegExpMatchArray {
  const removeRN = /[\r\n]/gm
  // const regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm
  const regexp = new RegExp(`(.{${count}}|.+$)([\u0400-\u04FF\\S]|\\w)*`, 'gm')

  const separatedText = text.replace(removeRN, ' ').match(regexp)
  console.log(separatedText)
  return separatedText
}

async function search(client, { document: text, name }): Promise<{results: SearchResult[], name: string}> {
  const queries = []
  for (let str of text) {
    queries.push({"match": {"query": str}})
  }

  const { body } = await client.search({
    index: 'docx',
    body: {
      "_source": "name",
      "query": {
        "intervals" : {
          "full_text" : {
            "any_of" : {
              "intervals" : queries
            }
          }
        }
        // "match" : { "full_text" : text }
/*        "match" : {
          "full_text" : { "query" : text, "operator" : "and" }
        }*/
      },
      "highlight" : {
        "fields" : {
          "full_text" : {}
        }
      }
    }
  })

  return {results: body.hits.hits, name}

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
  }).then(({ canceled, filePaths}) => {
    if (canceled) {
      event.sender.send('searchResults', false)
      return
    }
    if (filePaths.length) {
      extractDocuments(filePaths).then((extractedDocuments: ExtractedDocument[] ) => {
        getMultipleResults(extractedDocuments).then((results: { document: SearchResult[], name: string }[]) => {
          win.webContents.send('searchResults', { results })
          sub.unsubscribe()
        })

      })

      // event.sender.send('selectedFiles', files)
    }
  })
})

async function getMultipleResults(extractedDocuments: ExtractedDocument[]) {
  const searchResults: { document: SearchResult[], name: string }[] = [];
  const instance = new HttpGetQueue(search, client)
  let i = 0
  return await new Promise((resolve) => {
    sub = instance.results.subscribe(({results, name}) => {
      i++
      win.webContents.send('ipcLog', {message: {res: {results, name}, log: 'ipc'}})
      searchResults.push({document: results, name});
      if (i === extractedDocuments.length) {
        resolve(searchResults)
      }
    })

    for (const exDoc of extractedDocuments) {
      instance.addToQueue(exDoc)
    }
  })
}

async function extractDocuments(documents: string[]):Promise<ExtractedDocument[]> {
  const extractedDocuments: { document: RegExpMatchArray, name: string }[] = []
  for (let doc of documents) {
    await extractText(doc).then((text) => {
      extractedDocuments.push({document: separate(text, 500), name: parse(doc).name});
    }).catch((err) => { throw err })
  }
  return extractedDocuments;
}

interface SearchResult {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: { name: string, full_text: string }
  highlight: { full_text: string[]}
}

interface ExtractedDocument { document: RegExpMatchArray, name: string }
