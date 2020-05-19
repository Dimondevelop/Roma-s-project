import { Component, OnInit } from '@angular/core'
import { Subscription, Subject} from "rxjs"
import { ElectronService } from '../core/services'

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  sub: Subscription
  stream: Subject<void> = new Subject<void>()
  isProcess: boolean = false
  textArea: string
  separatedText: RegExpMatchArray

  constructor(private electronService: ElectronService) {
    this.sub = this.stream.subscribe((value => {
      console.log('Subscribe', value)
    }))
  }

  stop() {
    this.sub.unsubscribe()
  }

  ngOnInit(): void { }

  separate() {
    const removeRN = /[\r\n]/gm
    const regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm

    this.separatedText = this.textArea.replace(removeRN, ' ').match(regexp)
  }
}
