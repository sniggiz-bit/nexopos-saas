import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled React Error:', error, errorInfo);
    }

    private handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
                    <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border text-center shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
                            ⚠️
                        </div>
                        <h2 className="text-xl font-bold">Ocurrió un error inesperado</h2>
                        <p className="text-sm text-muted-foreground">
                            {this.state.error?.message || 'La aplicación experimentó un problema temporal.'}
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="px-5 py-2.5 rounded-xl bg-[#0099CC] hover:bg-[#00BCE0] text-black font-bold text-sm transition-all shadow-md"
                        >
                            Reintentar / Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
