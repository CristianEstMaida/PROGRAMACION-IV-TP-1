import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  // Imagen por defecto en caso de fallo (usamos un placeholder seguro online o local)
  @Input() fallbackUrl: string = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';

  private yaIntentoFallback = false;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError() {
    if (!this.yaIntentoFallback) {
      this.yaIntentoFallback = true;
      this.el.nativeElement.src = this.fallbackUrl;
    }
  }
}