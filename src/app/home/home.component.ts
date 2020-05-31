import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { ElectronService } from '../core/services'

interface SearchResult {
  _index: string
  _type: string
  _id: string
  _score: number
  _source: { name: string, full_text: string }
  highlight: { full_text: string[]}
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  searchResults: { document: SearchResult[], name: string }[]
  isSearching = false
  textArea: string

  constructor(public eS: ElectronService) { }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  search(): void {
    if (!this.textArea.trim()) return
    this.isSearching = true
    this.eS.search(this.textArea).then((response: { results: SearchResult[] }) => {
      this.searchResults[0].document = response.results
      this.isSearching = false
    })
  }

  chooseFiles() {
    this.isSearching = true
    this.eS.chooseFiles().then((response: { results: { document: SearchResult[], name: string }[] } ) => {
      response && (this.searchResults = response.results)
      this.isSearching = false
    }).catch(() => {
      this.isSearching = false
    })
  }
}
