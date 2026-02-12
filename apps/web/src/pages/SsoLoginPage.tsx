
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function SsoLoginPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            toast.error('No se proporcionó token de acceso');
            setVerifying(false);
            return;
        }

        const validateToken = async () => {
            try {
                const response = await axios.post(`${API_URL}/auth/sso/validate`, { token });

                if (response.data.isValid) {
                    // In a real app, you might store the user info in a context or localStorage
                    // For now, we assume the session is established and redirect to POS
                    toast.success('Autenticación exitosa');
                    navigate('/pos');
                } else {
                    throw new Error('Token inválido');
                }
            } catch (error) {
                console.error('SSO Validation Error:', error);
                toast.error('Error al validar el acceso');
            } finally {
                setVerifying(false);
            }
        };

        validateToken();
    }, [searchParams, navigate]);

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Autenticando con NexoPOS...</h2>
                    <p className="text-gray-600">Por favor espere mientras verificamos sus credenciales.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
                <p className="text-gray-600 mb-6">
                    No se pudo validar su sesión. El enlace puede haber expirado o ser inválido.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
}
