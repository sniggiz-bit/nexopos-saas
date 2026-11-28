import { SITE_IMAGE, jsonForHtml, type PageSeo } from "./seo";

export function applyPageSeo(seo: PageSeo): void {
    if (typeof document === 'undefined') return;
    document.title = seo.title;
    document.documentElement.lang = 'es-CL';
    const meta = (attribute: 'name' | 'property', key: string, content: string) => {
        const matches = Array.from(document.head.querySelectorAll<HTMLMetaElement>(`meta[${attribute}="${key}"]`));
        const element = matches.shift() || document.createElement('meta');
        matches.forEach(duplicate => duplicate.remove());
        element.setAttribute(attribute, key);
        element.content = content;
        if (!element.parentNode) document.head.appendChild(element);
    };
    meta('name', 'description', seo.description);
    meta('name', 'robots', seo.index ? 'index, follow, max-image-preview:large' : 'noindex, follow');
    meta('name', 'keywords', seo.keywords || '');
    const image = seo.image || SITE_IMAGE;
    for (const [key, value] of Object.entries({ 'og:type': 'website', 'og:site_name': 'NexoPOS', 'og:locale': 'es_CL', 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.canonical || '', 'og:image': image, 'og:image:alt': 'NexoPOS, sistema de punto de venta en Chile' })) meta('property', key, value);
    for (const key of ['card', 'title', 'description', 'image', 'url']) document.head.querySelector(`meta[property="twitter:${key}"]`)?.remove();
    for (const [key, value] of Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': image, 'twitter:url': seo.canonical || '' })) meta('name', key, value);
    document.head.querySelectorAll('link[rel="canonical"]').forEach(element => element.remove());
    if (seo.canonical) { const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = seo.canonical; document.head.appendChild(canonical); }
    document.getElementById('nexopos-structured-data')?.remove();
    if (seo.structuredData?.length) { const script = document.createElement('script'); script.id = 'nexopos-structured-data'; script.type = 'application/ld+json'; script.textContent = jsonForHtml(seo.structuredData[0]); document.head.appendChild(script); }
}
