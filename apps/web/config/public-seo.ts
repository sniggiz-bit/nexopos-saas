// Generate route-specific HTML before Workbox computes precache revisions.
import { createServer, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { PUBLIC_PAGES, SITE_IMAGE, jsonForHtml, routeSeo, type PageSeo } from '../src/lib/seo';

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function seoHead(seo: PageSeo): string {
    const image = seo.image || SITE_IMAGE;
    const lines = [
        `<title>${escape(seo.title)}</title>`,
        `<meta name="description" content="${escape(seo.description)}" />`,
        `<meta name="robots" content="${seo.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />`,
        '<meta property="og:type" content="website" />', '<meta property="og:site_name" content="NexoPOS" />', '<meta property="og:locale" content="es_CL" />',
        `<meta property="og:title" content="${escape(seo.title)}" />`, `<meta property="og:description" content="${escape(seo.description)}" />`,
        `<meta property="og:image" content="${escape(image)}" />`, '<meta property="og:image:alt" content="NexoPOS, sistema de punto de venta en Chile" />',
        '<meta name="twitter:card" content="summary_large_image" />', `<meta name="twitter:title" content="${escape(seo.title)}" />`,
        `<meta name="twitter:description" content="${escape(seo.description)}" />`, `<meta name="twitter:image" content="${escape(image)}" />`,
    ];
    if (seo.canonical) lines.push(`<link rel="canonical" href="${escape(seo.canonical)}" />`, `<meta property="og:url" content="${escape(seo.canonical)}" />`, `<meta name="twitter:url" content="${escape(seo.canonical)}" />`);
    if (seo.structuredData?.length) lines.push(`<script id="nexopos-structured-data" type="application/ld+json">${jsonForHtml(seo.structuredData[0])}</script>`);
    return lines.join('\n  ');
}

function documentHtml(template: string, seo: PageSeo, body = ''): string {
    return template.replace(/<!-- nexopos-seo:start -->[\s\S]*?<!-- nexopos-seo:end -->/, `<!-- nexopos-seo:start -->\n  ${seoHead(seo)}\n  <!-- nexopos-seo:end -->`)
        .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

export function publicSeoPlugin(root: string, aliases: Record<string, string>): Plugin {
    return {
        name: 'nexopos-public-seo', apply: 'build', enforce: 'post',
        async generateBundle(_options, bundle) {
            const index = bundle['index.html'];
            if (!index || index.type !== 'asset' || typeof index.source !== 'string') throw new Error('SEO template is unavailable');
            const template = index.source;
            if (!template.includes('<!-- nexopos-seo:start -->')) throw new Error('SEO template markers are missing');
            const server = await createServer({ configFile: false, root, mode: 'production', plugins: [react()], resolve: { alias: aliases }, optimizeDeps: { noDiscovery: true, include: [] }, css: { postcss: { plugins: [] } }, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
            try {
                const { renderPublicPage } = await server.ssrLoadModule('/src/entry-public.tsx') as { renderPublicPage: (pathname: string) => string };
                for (const pathname of Object.keys(PUBLIC_PAGES)) {
                    const html = documentHtml(template, routeSeo(pathname), renderPublicPage(pathname));
                    if (pathname === '/') index.source = html;
                    else this.emitFile({ type: 'asset', fileName: pathname.slice(1) + '/index.html', source: html });
                }
                for (const pathname of ['/login', '/register']) this.emitFile({ type: 'asset', fileName: pathname.slice(1) + '/index.html', source: documentHtml(template, routeSeo(pathname)) });
                this.emitFile({ type: 'asset', fileName: 'app-shell.html', source: documentHtml(template, routeSeo('/pos')) });
                this.emitFile({ type: 'asset', fileName: 'store-shell.html', source: documentHtml(template, { title: 'Tienda online | NexoPOS', description: 'Consulta el catálogo de esta tienda online.', index: true }) });
                this.emitFile({ type: 'asset', fileName: '404.html', source: documentHtml(template, { title: 'Página no encontrada | NexoPOS', description: 'La página que buscas no está disponible.', index: false }, renderPublicPage('/404')) });
            } finally { await server.close(); }
        },
    };
}
