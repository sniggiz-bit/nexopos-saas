
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast'; // Import react-hot-toast

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface NexoPosAccessButtonProps {
    userId: string;
    tenantId: string;
    className?: string; // Optional className prop for styling
}

export function NexoPosAccessButton({ userId, tenantId, className }: NexoPosAccessButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleAccess = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/sso/token`, {
                userId,
                tenantId,
            });

            const { access_token } = response.data;
            if (access_token) {
                // Redirect to the SSO login page with the token
                window.location.href = `/auth/sso?token=${access_token}`;
            } else {
                toast.error('No se recibió el token de acceso'); // Use toast for error
            }
        } catch (error) {
            console.error('Error requesting SSO token:', error);
            toast.error('Error al conectar con NexoPOS'); // Use toast for error
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleAccess}
            disabled={loading}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 ${className || ''}`}
        >
            {loading ? (
                <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Conectando...
                </>
            ) : (
                <>
                    <span>💻</span> Entrar a mi Sistema
                </>
            )}
        </button>
    );
}
