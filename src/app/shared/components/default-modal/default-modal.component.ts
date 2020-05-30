import { Component, Input, TemplateRef } from '@angular/core'
import { NbDialogRef } from '@nebular/theme'

@Component({
  selector: 'app-default-modal',
  templateUrl: 'default-modal.component.html',
  styleUrls: ['default-modal.component.scss'],
})
export class DefaultModalComponent {

  @Input() title: string = 'Сюди потрібно передати заголовок'
  @Input() text?: string
  @Input() template?: TemplateRef<any>
  @Input() buttonText?: string = 'ОК'

  constructor(protected ref: NbDialogRef<DefaultModalComponent>) {
  }

  dismiss() {
    this.ref.close()
  }
}
