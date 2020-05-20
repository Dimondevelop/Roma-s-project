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
  searchResults: { document: SearchResult[], name: string }[];
  private isReindexing = false;
  private isSearching = false;
  private textArea: string;

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

  search(): void {
    if (!this.textArea.trim()) return;

    this.isSearching = true;
    this.electronService.search(this.textArea).then((response: { results: SearchResult[] }) => {
      this.searchResults[0].document = response.results;
      this.isSearching = false;
    });
  }

  changeIndexingDirectory() {
    this.electronService.changeIndexingDirectory().then((data) => {
      console.log({data});
    })
  }

  chooseFiles() {
    this.isSearching = true;
    this.electronService.chooseFiles().then((response: { results: { document: SearchResult[], name: string }[] } ) => {
      console.log(response);
      response && (this.searchResults = response.results);
      this.isSearching = false;
    }).catch(() => {
      this.isSearching = false;
    })
  }
}
