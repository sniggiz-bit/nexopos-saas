import { Link } from 'react-router-dom';
import { PublicInfoPage } from '../../components/PublicInfoPage';

export function NotFoundPage() {
    return <PublicInfoPage title="Página no encontrada">
        <p>La dirección que abriste no existe o ya no está disponible.</p>
        <Link to="/" className="inline-flex mt-6 text-cyan-400 underline">Volver a NexoPOS</Link>
    </PublicInfoPage>;
}
