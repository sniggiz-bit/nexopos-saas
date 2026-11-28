import { Button } from '../ui/button';

export const CATALOG_PAGE_SIZE = 50;

export function CatalogPagination({ page, total, onPageChange }: {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    const last = Math.ceil(total / CATALOG_PAGE_SIZE);
    if (last < 2) return null;

    return (
        <nav aria-label="Paginación del catálogo" className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                Anterior
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">Página {page} de {last}</span>
            <Button size="sm" variant="outline" disabled={page === last} onClick={() => onPageChange(page + 1)}>
                Siguiente
            </Button>
        </nav>
    );
}
