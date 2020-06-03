import { Directive, HostBinding, Input } from '@angular/core'

@Directive({
  selector: '[appStyleVars]'
})
export class StyleVarsDirective {

  @Input() @HostBinding(`style.--on-text-var`) onText: string = `'ON'`
  @Input() @HostBinding(`style.--off-text-var`) offText: string = `'OFF'`
}
