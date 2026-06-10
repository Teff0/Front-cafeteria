import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  carrito = inject(CarritoService);

  imgUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:8080${url}` : url;
  }
}
