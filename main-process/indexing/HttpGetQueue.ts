import { Observable, Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export class HttpGetQueue {
  results: Observable<any>
  queue$ = new Subject()
  constructor(client) {
    this.results = this.queue$.pipe(concatMap((dataset) => sendRequest(client, dataset)))
  }

  addToQueue(data) {
    this.queue$.next(data)
  }
}

async function sendRequest (client, dataset) {
  const body = dataset.flatMap((doc) => [{index: {_index: 'docx'}}, doc])
  let bulkResponse = { errors: null, items: [] }
  await client.bulk({ refresh: 'true', body }).then((data) => {
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
