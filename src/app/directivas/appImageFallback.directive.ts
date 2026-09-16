import { Directive, HostBinding, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input() fallbackUrl = '/assets/img/butacas-cine.jpg';
  @HostBinding('src') @Input() src!: string;

  @HostListener('error')
  onError() {
    this.src = this.fallbackUrl;
  }
}