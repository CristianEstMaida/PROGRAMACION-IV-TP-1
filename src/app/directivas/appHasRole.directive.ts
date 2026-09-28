import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Auth } from '../services/auth';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(Auth);

  @Input() set appHasRole(expectedRole: string) {
    this.evaluarRol(expectedRole);
  }

  private async evaluarRol(expectedRole: string) {
    this.vcr.clear();
    const user = await this.auth.getCurrentUser();
    if (!user) return;

    const actualRole = await this.auth.getUserRole(user.id);
    if (actualRole === expectedRole) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}