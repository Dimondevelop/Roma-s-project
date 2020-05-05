import { Component, OnInit } from '@angular/core';
import { Subscription, Subject} from "rxjs";

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  sub: Subscription
  stream: Subject<void> = new Subject<void>()
  constructor() {
    this.sub = this.stream.subscribe((value => {
      console.log('Subscribe', value);
    }))
  }

  stop() {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
  }
}
