export interface LoginRequest { email: string; password: string; }
export interface AuthResponse { id?: string; token: string; type: string; email: string; rol: string; nombre: string; }
