import { win } from "../../main"
import { ipcMain, app } from "electron";

import { client } from '../indexing/indexing';

ipcMain.on('search', (event, arg: { text }) => {
  const { sender } = event

  search(arg.text).then((results) => {
    console.log(results)
    sender.send('ipcLog', { message: { results } })
    sender.send('searchResults', { results })
  }).catch((err) => { throw err })
  win.webContents.send('ipcLog', { message: 'OnSearch emit' })
})

async function search(text) {
  const { body } = await client.search({
    index: 'docx',
    body: {
      "query": {
        "match" : { "full_text" : text }
        // "match" : {
        //   "full_text" : {
        //     "query" : text,
        //     "operator" : "and"
        //   }
        // }
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
  //   // console.log(hit);
  // })
}
