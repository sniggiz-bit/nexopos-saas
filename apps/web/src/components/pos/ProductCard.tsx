import { Product } from '@/api/products';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/formatters';
import { Package } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const isLowStock = product.stock < 10;
    const isOutOfStock = product.stock === 0;

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            onClick={() => !isOutOfStock && onAddToCart(product)}
        >
            <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        {isOutOfStock ? (
                            <Badge variant="destructive">Sin stock</Badge>
                        ) : isLowStock ? (
                            <Badge variant="secondary">Bajo stock</Badge>
                        ) : null}
                    </div>

                    {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {product.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Stock: {product.stock}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
