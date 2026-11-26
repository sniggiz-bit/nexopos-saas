export type DuplicateProductIdentifierType = 'SKU' | 'BARCODE';

export interface DuplicateProductInventoryDto {
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface DuplicateProductCandidateDto {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice: number;
  categoryName?: string;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
  stock: number;
  inventory: DuplicateProductInventoryDto[];
}

export interface DuplicateProductGroupDto {
  groupId: string;
  identifierType: DuplicateProductIdentifierType;
  identifierValue: string;
  products: DuplicateProductCandidateDto[];
}

export interface DeactivateDuplicateProductsResultDto {
  deactivated: number;
}
