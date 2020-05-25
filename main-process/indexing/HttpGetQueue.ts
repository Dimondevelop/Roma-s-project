import { Observable, Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export class HttpGetQueue {
  results: Observable<any>
  queue$ = new Subject()
  constructor(foo: (...args) => Promise<any>, client) {
    this.results = this.queue$.pipe(concatMap((...data) => callback(foo, client, ...data)))
  }

  addToQueue(...data) {
    this.queue$.next(...data)
  }
}

async function callback(foo: (...args) => Promise<any>, client, ...data): Promise<any> {
  if (typeof foo === 'function') {
    return foo(client, ...data)
  } else {
    throw `${foo} is not function!`
  }
}
