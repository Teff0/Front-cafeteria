import { Component, inject, HostListener, signal, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  auth    = inject(AuthService);
  carrito = inject(CarritoService);
  elRef   = inject(ElementRef);

  scrolled   = signal(false);
  mobileOpen = signal(false);
  userOpen   = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.userOpen.set(false);
      this.mobileOpen.set(false);
    }
  }

  toggleMobile() { this.mobileOpen.update(v => !v); }
  toggleUser()   { this.userOpen.update(v => !v); }
  logout()       { this.auth.logout(); this.userOpen.set(false); }
}
