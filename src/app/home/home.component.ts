import { Component, OnInit, OnDestroy } from '@angular/core';
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
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  filesList: any;
  searchResults: SearchResult[];
  isReindexing = false;
  isSearching = false;
  textArea: string;
  constructor(private electronService: ElectronService) { }

  ngOnInit(): void {
    this.electronService.init();
  }

  ngOnDestroy(): void {
    this.electronService.destroy();
  }

  reindex() {
    this.isReindexing = true;
    console.log({isReindexing: this.isReindexing});
    this.electronService.reindex().then((response) => {
      this.filesList = response;
      this.isReindexing = false;
      console.log('then', {isReindexing: this.isReindexing});
    });
  }

  search(text) {
    if (!text.trim()) return;

    console.log({text});

    this.isSearching = true;
    this.electronService.search(text).then((response: { results: SearchResult[] }) => {
      this.searchResults = response.results;
      console.log({searchResults: this.searchResults});
      this.isSearching = false;
    });
  }
}
