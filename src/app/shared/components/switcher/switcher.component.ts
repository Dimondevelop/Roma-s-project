import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'app-switcher',
  templateUrl: './switcher.component.html',
  styleUrls: ['./switcher.component.scss']
})
export class SwitcherComponent {
  @Input() initialValue: boolean = false
  @Input() names: { on: string, off: string } = { on: `'ON'`, off: `'OFF'` }
  @Input() size: { width: string, height: string } = { width: '400px', height: '50px' }
  @Input() fullSize: boolean = false

  @Output() value: EventEmitter<boolean> = new EventEmitter<boolean>()

  valueEmit = () => this.value.emit(this.initialValue);
}
