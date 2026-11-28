import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { ContactoPage, SoportePage, TerminosPage, PrivacidadPage } from './pages/public/LegalPages';
import { NotFoundPage } from './pages/public/NotFoundPage';

export function renderPublicPage(pathname: string): string {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    // Prices are loaded from the live API in the browser, never invented at build time.
    client.setQueryData(['public-plans'], []);
    const pages: Record<string, React.ReactNode> = { '/': <LandingPage />, '/contacto': <ContactoPage />, '/soporte': <SoportePage />, '/terminos': <TerminosPage />, '/privacidad': <PrivacidadPage /> };
    const html = renderToStaticMarkup(<QueryClientProvider client={client}><StaticRouter location={pathname}>{pages[pathname] || <NotFoundPage />}</StaticRouter></QueryClientProvider>);
    client.clear();
    return html;
}
