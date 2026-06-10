import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  auth    = inject(AuthService);
  router  = inject(Router);

  email    = signal('');
  password = signal('');
  showPass = signal(false);
  loading  = signal(false);
  error    = signal('');

  cuentas = [
    { label: 'Admin',     email: 'admin@utp.edu.pe',   pass: 'admin123'   },
    { label: 'Caja',      email: 'caja@utp.edu.pe',    pass: 'caja123'    },
    { label: 'Estudiante',email: 'cliente@utp.edu.pe', pass: 'cliente123' },
  ];

  usarCuenta(e: string, p: string) { this.email.set(e); this.password.set(p); }

  onSubmit() {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      next: res => {
        if      (res.rol === 'ADMIN') this.router.navigate(['/admin']);
        else if (res.rol === 'CAJA')  this.router.navigate(['/caja']);
        else                          this.router.navigate(['/menu']);
      },
      error: err => {
        if      (err?.name === 'TimeoutError') this.error.set('El servidor tardó demasiado. Verifica que el backend esté activo.');
        else if (err?.status === 401)          this.error.set('Correo o contraseña incorrectos.');
        else if (err?.status === 0)            this.error.set('No se puede conectar con el servidor (puerto 8080).');
        else                                   this.error.set('Error al iniciar sesión. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }
}
