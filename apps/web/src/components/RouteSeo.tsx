import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { routeSeo } from '../lib/seo';
import { applyPageSeo } from '../lib/seo-dom';

export function RouteSeo() {
    const { pathname } = useLocation();
    useEffect(() => { applyPageSeo(routeSeo(pathname)); }, [pathname]);
    return null;
}
