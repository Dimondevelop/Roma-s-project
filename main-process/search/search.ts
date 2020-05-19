import { win } from "../../main"
import { ipcMain, app } from "electron"

import { client } from '../indexing/indexing'

ipcMain.on('search', (event, arg: { text: string }) => {
  const { sender } = event

  search(separate(arg.text)).then((results) => {
    console.log(results)
    sender.send('ipcLog', { message: { results } })
    sender.send('searchResults', { results })
  }).catch((err) => { throw err })
  win.webContents.send('ipcLog', { message: 'OnSearch emit' })
})

function separate(text: string): RegExpMatchArray {
  const removeRN = /[\r\n]/gm
  const regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm

  return text.replace(removeRN, ' ').match(regexp)
}

async function search(text: RegExpMatchArray) {
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

  return body.hits.hits

  // hits.forEach((hit) => {
  //   console.log({document: hit._source.name, score: hit._score, highlight: hit.highlight})
  //   // console.log(hit)
  // })
}

