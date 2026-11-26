import { UnitType } from './create-product.dto';

export interface ImportProductRowDto {
  rowNumber: number;
  name?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  minStock?: number;
  unitType?: UnitType;
  warnings?: string[];
}

export interface ImportProductRowResultDto {
  rowNumber: number;
  name?: string;
  sku?: string;
  outcome: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
  warnings: string[];
}

export interface ImportProductsResultDto {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: ImportProductRowResultDto[];
}
