import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent {
  @Input() adminName: string = 'Admin';

  private auth = inject(Auth);
   private router = inject(Router);

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  }
}
