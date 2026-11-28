import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import './public-site.css';

export function PublicHeader({ dark = false }: { dark?: boolean }) {
    return (
        <header className={`public-header ${dark ? 'public-header-dark' : ''}`}>
            <div className="public-container public-header-inner">
                <Link to="/landing" aria-label="NexoPOS, volver al inicio" className="public-brand">
                    <Logo variant="full" mode={dark ? 'dark' : 'light'} className="h-10 w-auto" />
                </Link>
                <nav aria-label="Navegación pública" className="public-header-links">
                    <Link to="/landing">Inicio</Link>
                    <Link to="/login">Iniciar sesión</Link>
                </nav>
            </div>
        </header>
    );
}
