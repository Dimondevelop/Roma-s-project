import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../../core/services';

@Component({
  selector: 'app-check-elastic',
  templateUrl: './check-elastic.component.html',
  styleUrls: ['./check-elastic.component.scss']
})
export class CheckElasticComponent implements OnInit {

  constructor(public eS: ElectronService) { }

  ngOnInit(): void {
    this.eS.elasticPing()
    this.eS.getIndexedFiles()
  }

  rePing() {
    this.eS.elasticConnected = null
    this.eS.elasticPing()
  }
}
