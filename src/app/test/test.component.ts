import { Component, OnInit } from '@angular/core';
import { Subscription, Subject} from "rxjs";
import { ElectronService } from '../core/services';

interface SearchResult {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: { name: string, full_text: string }
  highlight: { full_text: string[]}
}

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  sub: Subscription
  stream: Subject<void> = new Subject<void>()
  requestArea: string
  searchResults: SearchResult[]
  isSearching = false

  constructor(private electronService: ElectronService) {
    this.sub = this.stream.subscribe((value => {
      console.log('Subscribe', value)
    }))
  }

  stop() {
    this.sub.unsubscribe()
  }

  ngOnInit(): void {
  }

  testSearchRequest(request) {
    if (!request.trim()) return;

    try {
      request = JSON.parse(request)
    } catch (e) {
      this.isSearching = false
      throw e;
    }

    this.isSearching = true
    this.electronService.testSearchRequest(request).then((response: { results: SearchResult[] }) => {
      this.searchResults = response.results
      this.isSearching = false
    });
  }
}
