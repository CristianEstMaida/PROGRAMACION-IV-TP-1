import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../services/auth';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private auth: Auth
  ) {}

  @Input() set appHasRole(role: string) {
    // Comparar con el rol actual del usuario logueado
    const userRole = 'admin'; // Reemplazar con this.auth.currentUserRole()
    if (userRole === role) {
      this.vcr.createEmbeddedView(this.templateRef);
    } else {
      this.vcr.clear();
    }
  }
}