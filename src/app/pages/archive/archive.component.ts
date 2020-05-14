import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {
  constructor(private _location: Location) {}

  ngOnInit(): void {
  }

  goBack() {
    this._location.back()
  }

}
