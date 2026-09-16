import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appConfirmDelete]',
  standalone: true
})
export class ConfirmDeleteDirective {
  @Input('appConfirmDelete') confirmMessage: string = '¿Seguro que deseas eliminar este elemento?';
  @Output() confirmed = new EventEmitter<void>();

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (window.confirm(this.confirmMessage)) {
      this.confirmed.emit();
    }
  }
}