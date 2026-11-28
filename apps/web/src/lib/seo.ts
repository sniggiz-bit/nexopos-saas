export const SITE_URL = 'https://nexopos.cl';
export const SITE_IMAGE = `${SITE_URL}/Portada%20nexopos.png`;
export const HOME_TITLE = 'NexoPOS | Sistema POS en Chile · Prueba gratis 15 días';
export const HOME_DESCRIPTION = 'Sistema POS para almacenes, botillerías, minimarkets y tiendas de ropa en Chile. Controla ventas, inventario y caja. Conócelo con 15 días de prueba gratis.';

export interface PageSeo {
    title: string;
    description: string;
    canonical?: string;
    index: boolean;
    image?: string;
    keywords?: string;
    structuredData?: Record<string, unknown>[];
}

export const PUBLIC_PAGES: Record<string, { title: string; description: string; label: string }> = {
    '/': { title: HOME_TITLE, description: HOME_DESCRIPTION, label: 'Inicio' },
    '/contacto': { title: 'Contacto y ventas | NexoPOS Chile', description: 'Conversa con el equipo comercial de NexoPOS sobre el sistema POS, sus planes y la prueba gratuita de 15 días para tu negocio.', label: 'Contacto' },
    '/soporte': { title: 'Soporte para tu sistema POS | NexoPOS', description: 'Encuentra los canales de soporte de NexoPOS y recibe ayuda con el punto de venta, inventario y la operación de tu negocio.', label: 'Soporte' },
    '/terminos': { title: 'Términos de servicio | NexoPOS', description: 'Consulta los términos de uso del sistema POS NexoPOS, las condiciones del servicio y las suscripciones.', label: 'Términos de servicio' },
    '/privacidad': { title: 'Política de privacidad | NexoPOS', description: 'Conoce cómo NexoPOS trata y protege la información de tu negocio y los datos de quienes utilizan la plataforma.', label: 'Privacidad' },
};

export function canonicalUrl(pathname: string): string {
    const path = '/' + pathname.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    return SITE_URL + (path === '/landing' || path === '/index.html' || path === '/index.php' ? '/' : path);
}

export function structuredData(pathname: string, title: string, description: string): Record<string, unknown>[] {
    const canonical = canonicalUrl(pathname);
    const organization = { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'NexoPOS', url: `${SITE_URL}/`, logo: `${SITE_URL}/logo.png`, email: 'contacto@nexopos.cl' };
    const graph: Record<string, unknown>[] = [organization,
        { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: 'es-CL', isPartOf: { '@id': `${SITE_URL}/#website` } },
    ];
    if (canonical === SITE_URL + '/') {
        graph.push({ '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: canonical, name: 'NexoPOS', description, inLanguage: 'es-CL', publisher: { '@id': organization['@id'] } });
    } else {
        graph.push({ '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: PUBLIC_PAGES[pathname]?.label || title, item: canonical },
        ] });
    }
    return [{ '@context': 'https://schema.org', '@graph': graph }];
}

export function routeSeo(pathname: string): PageSeo {
    const path = pathname === '/landing' || pathname === '/index.html' || pathname === '/index.php' ? '/' : (pathname.replace(/\/+$/, '') || '/');
    const page = PUBLIC_PAGES[path];
    if (page) return { ...page, index: true, canonical: canonicalUrl(path), image: SITE_IMAGE, structuredData: structuredData(path, page.title, page.description) };
    if (path === '/login') return { title: 'Iniciar sesión | NexoPOS', description: 'Accede a tu cuenta de NexoPOS.', canonical: canonicalUrl(path), index: false };
    if (path === '/register') return { title: 'Crea tu cuenta y prueba NexoPOS 15 días gratis', description: 'Registra tu negocio y comienza tu prueba gratuita de NexoPOS por 15 días.', canonical: canonicalUrl(path), index: false };
    if (/^\/store\/[^/]+$/.test(path)) return { title: 'Tienda online | NexoPOS', description: 'Consulta el catálogo de esta tienda online.', canonical: canonicalUrl(path), index: true };
    if (/^\/(?:dashboard|admin|pos|auth|reset-password)(?:\/|$)/.test(path)) return { title: 'NexoPOS', description: 'Accede al sistema NexoPOS.', index: false };
    return { title: 'Página no encontrada | NexoPOS', description: 'La página que buscas no está disponible.', index: false };
}

export function jsonForHtml(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
