import { Component, OnInit, OnDestroy } from '@angular/core';
import { FileService } from '../file.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  filesList: any;
  isReindexing = false;
  constructor(private fileService: FileService) { }

  ngOnInit(): void {
    this.fileService.init();
  }

  ngOnDestroy(): void {
    this.fileService.destroy();
  }

  reindex() {
    this.isReindexing = true;
    console.log({isReindexing: this.isReindexing});
    this.fileService.reindex().then((response) => {
      this.filesList = response;
      this.isReindexing = false;
      console.log('then', {isReindexing: this.isReindexing});
    });
  }

}
