
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  phone: 'phone',
  rut: 'rut',
  giro: 'giro',
  address: 'address',
  logoUrl: 'logoUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  planId: 'planId',
  status: 'status',
  nextPayment: 'nextPayment',
  storeSlug: 'storeSlug',
  storeSettings: 'storeSettings',
  billingStatus: 'billingStatus'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  amount: 'amount',
  status: 'status',
  dueDate: 'dueDate',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  isMain: 'isMain',
  isActive: 'isActive',
  tenantId: 'tenantId',
  transbankSettings: 'transbankSettings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  tenantId: 'tenantId',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BrandScalarFieldEnum = {
  id: 'id',
  name: 'name',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  sku: 'sku',
  price: 'price',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  barcode: 'barcode',
  brandId: 'brandId',
  categoryId: 'categoryId',
  costPrice: 'costPrice',
  image: 'image',
  galleryImages: 'galleryImages',
  description: 'description',
  isPublic: 'isPublic',
  isActive: 'isActive',
  minStock: 'minStock',
  stock: 'stock',
  unitType: 'unitType',
  supplierId: 'supplierId'
};

exports.Prisma.ProductPriceTierScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  minQuantity: 'minQuantity',
  unitPrice: 'unitPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  branchId: 'branchId',
  quantity: 'quantity',
  minStock: 'minStock',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransferScalarFieldEnum = {
  id: 'id',
  originBranchId: 'originBranchId',
  destBranchId: 'destBranchId',
  status: 'status',
  requestedById: 'requestedById',
  processedById: 'processedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  note: 'note'
};

exports.Prisma.TransferItemScalarFieldEnum = {
  id: 'id',
  transferId: 'transferId',
  productId: 'productId',
  quantity: 'quantity'
};

exports.Prisma.SaleScalarFieldEnum = {
  id: 'id',
  total: 'total',
  discountAmount: 'discountAmount',
  tenantId: 'tenantId',
  branchId: 'branchId',
  userId: 'userId',
  cashShiftId: 'cashShiftId',
  customerId: 'customerId',
  quoteId: 'quoteId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  dteFolio: 'dteFolio',
  dteStatus: 'dteStatus',
  dteType: 'dteType',
  dtePdfUrl: 'dtePdfUrl',
  originalSaleId: 'originalSaleId',
  internalReceiptUrl: 'internalReceiptUrl'
};

exports.Prisma.SaleItemScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  productId: 'productId',
  quantity: 'quantity',
  price: 'price',
  discountAmount: 'discountAmount'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentTransactionScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  branchId: 'branchId',
  saleId: 'saleId',
  orderId: 'orderId',
  amount: 'amount',
  status: 'status',
  provider: 'provider',
  responseCode: 'responseCode',
  authorizationCode: 'authorizationCode',
  responseMessage: 'responseMessage',
  cardType: 'cardType',
  lastFourDigits: 'lastFourDigits',
  transactionDate: 'transactionDate',
  installments: 'installments',
  rawResponse: 'rawResponse',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DteConfigScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  liorenToken: 'liorenToken',
  liorenLogo: 'liorenLogo',
  dteResolution: 'dteResolution',
  resolutionDate: 'resolutionDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CashShiftScalarFieldEnum = {
  id: 'id',
  branchId: 'branchId',
  openedById: 'openedById',
  closedById: 'closedById',
  startTime: 'startTime',
  endTime: 'endTime',
  initialAmount: 'initialAmount',
  finalAmount: 'finalAmount',
  expectedAmount: 'expectedAmount',
  difference: 'difference',
  status: 'status',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  rut: 'rut',
  giro: 'giro',
  address: 'address',
  comuna: 'comuna',
  email: 'email',
  phone: 'phone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuoteScalarFieldEnum = {
  id: 'id',
  number: 'number',
  tenantId: 'tenantId',
  customerId: 'customerId',
  userId: 'userId',
  subtotal: 'subtotal',
  tax: 'tax',
  total: 'total',
  includeIva: 'includeIva',
  status: 'status',
  issueDate: 'issueDate',
  validUntil: 'validUntil',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuoteItemScalarFieldEnum = {
  id: 'id',
  quoteId: 'quoteId',
  productId: 'productId',
  productName: 'productName',
  quantity: 'quantity',
  price: 'price',
  discount: 'discount',
  total: 'total'
};

exports.Prisma.CreditScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  customerId: 'customerId',
  saleId: 'saleId',
  totalAmount: 'totalAmount',
  balance: 'balance',
  status: 'status',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CreditPaymentScalarFieldEnum = {
  id: 'id',
  creditId: 'creditId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  cashShiftId: 'cashShiftId',
  createdAt: 'createdAt'
};

exports.Prisma.StockMovementScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  branchId: 'branchId',
  quantity: 'quantity',
  type: 'type',
  reference: 'reference',
  balance: 'balance',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  features: 'features',
  maxUsers: 'maxUsers',
  maxProducts: 'maxProducts',
  maxStorage: 'maxStorage',
  isRecommended: 'isRecommended',
  isVisible: 'isVisible',
  enabledFeatures: 'enabledFeatures',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemLogScalarFieldEnum = {
  id: 'id',
  level: 'level',
  message: 'message',
  context: 'context',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.AnnouncementScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  type: 'type',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierScalarFieldEnum = {
  id: 'id',
  name: 'name',
  rut: 'rut',
  email: 'email',
  phone: 'phone',
  address: 'address',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseScalarFieldEnum = {
  id: 'id',
  date: 'date',
  totalAmount: 'totalAmount',
  status: 'status',
  supplierId: 'supplierId',
  branchId: 'branchId',
  tenantId: 'tenantId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseItemScalarFieldEnum = {
  id: 'id',
  purchaseId: 'purchaseId',
  productId: 'productId',
  quantity: 'quantity',
  costPrice: 'costPrice'
};

exports.Prisma.EcommerceConnectionScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  platform: 'platform',
  name: 'name',
  shopDomain: 'shopDomain',
  accessToken: 'accessToken',
  locationId: 'locationId',
  webhookSecret: 'webhookSecret',
  siteUrl: 'siteUrl',
  consumerKey: 'consumerKey',
  consumerSecret: 'consumerSecret',
  syncProducts: 'syncProducts',
  syncInventory: 'syncInventory',
  syncOrders: 'syncOrders',
  syncCustomers: 'syncCustomers',
  autoCreateSale: 'autoCreateSale',
  isActive: 'isActive',
  lastSyncAt: 'lastSyncAt',
  syncStatus: 'syncStatus',
  lastError: 'lastError',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductMappingScalarFieldEnum = {
  id: 'id',
  connectionId: 'connectionId',
  nexoposProductId: 'nexoposProductId',
  externalId: 'externalId',
  externalVariantId: 'externalVariantId',
  lastPushedAt: 'lastPushedAt',
  lastPulledAt: 'lastPulledAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RegisteredWebhookScalarFieldEnum = {
  id: 'id',
  connectionId: 'connectionId',
  topic: 'topic',
  externalId: 'externalId',
  callbackUrl: 'callbackUrl',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.EcommerceOrderScalarFieldEnum = {
  id: 'id',
  connectionId: 'connectionId',
  tenantId: 'tenantId',
  externalId: 'externalId',
  externalNumber: 'externalNumber',
  platform: 'platform',
  status: 'status',
  rawData: 'rawData',
  processedAt: 'processedAt',
  saleId: 'saleId',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SyncLogScalarFieldEnum = {
  id: 'id',
  connectionId: 'connectionId',
  tenantId: 'tenantId',
  entityType: 'entityType',
  direction: 'direction',
  status: 'status',
  total: 'total',
  synced: 'synced',
  failed: 'failed',
  errors: 'errors',
  durationMs: 'durationMs',
  startedAt: 'startedAt',
  completedAt: 'completedAt'
};

exports.Prisma.TenantSettingsScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  enableBoletaDte: 'enableBoletaDte',
  enableFacturaDte: 'enableFacturaDte',
  enableGuiaDespachoDte: 'enableGuiaDespachoDte',
  enableNotaCreditoDte: 'enableNotaCreditoDte',
  maxBranches: 'maxBranches',
  maxRegisters: 'maxRegisters',
  maxUsers: 'maxUsers',
  canHardDelete: 'canHardDelete',
  enableEcommerce: 'enableEcommerce',
  enableTransbank: 'enableTransbank',
  enableIntegrations: 'enableIntegrations',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LandingConfigScalarFieldEnum = {
  id: 'id',
  data: 'data',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModuleScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  price: 'price'
};

exports.Prisma.PlanModuleScalarFieldEnum = {
  id: 'id',
  planId: 'planId',
  moduleId: 'moduleId'
};

exports.Prisma.TenantModuleAddonScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  moduleId: 'moduleId'
};

exports.Prisma.SystemNotificationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.ChatSessionScalarFieldEnum = {
  id: 'id',
  visitorId: 'visitorId',
  visitorName: 'visitorName',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  chatSessionId: 'chatSessionId',
  sender: 'sender',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.BillingStatus = exports.$Enums.BillingStatus = {
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED'
};

exports.UserRole = exports.$Enums.UserRole = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

exports.UnitType = exports.$Enums.UnitType = {
  UNIT: 'UNIT',
  WEIGHT: 'WEIGHT'
};

exports.TransferStatus = exports.$Enums.TransferStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  EFECTIVO: 'EFECTIVO',
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
  TRANSFERENCIA: 'TRANSFERENCIA'
};

exports.TransbankStatus = exports.$Enums.TransbankStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ERROR: 'ERROR',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT'
};

exports.QuoteStatus = exports.$Enums.QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

exports.MovementType = exports.$Enums.MovementType = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  INITIAL: 'INITIAL'
};

exports.PurchaseStatus = exports.$Enums.PurchaseStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.EcommercePlatform = exports.$Enums.EcommercePlatform = {
  SHOPIFY: 'SHOPIFY',
  WOOCOMMERCE: 'WOOCOMMERCE'
};

exports.SyncStatus = exports.$Enums.SyncStatus = {
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  PARTIAL: 'PARTIAL'
};

exports.EcommerceOrderStatus = exports.$Enums.EcommerceOrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  IGNORED: 'IGNORED'
};

exports.SyncEntityType = exports.$Enums.SyncEntityType = {
  PRODUCT: 'PRODUCT',
  INVENTORY: 'INVENTORY',
  ORDER: 'ORDER',
  CUSTOMER: 'CUSTOMER',
  FULL: 'FULL'
};

exports.SyncDirection = exports.$Enums.SyncDirection = {
  PUSH: 'PUSH',
  PULL: 'PULL'
};

exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  Invoice: 'Invoice',
  Branch: 'Branch',
  User: 'User',
  Category: 'Category',
  Brand: 'Brand',
  Product: 'Product',
  ProductPriceTier: 'ProductPriceTier',
  Inventory: 'Inventory',
  Transfer: 'Transfer',
  TransferItem: 'TransferItem',
  Sale: 'Sale',
  SaleItem: 'SaleItem',
  Payment: 'Payment',
  PaymentTransaction: 'PaymentTransaction',
  DteConfig: 'DteConfig',
  CashShift: 'CashShift',
  Customer: 'Customer',
  Quote: 'Quote',
  QuoteItem: 'QuoteItem',
  Credit: 'Credit',
  CreditPayment: 'CreditPayment',
  StockMovement: 'StockMovement',
  Plan: 'Plan',
  SystemLog: 'SystemLog',
  Announcement: 'Announcement',
  Supplier: 'Supplier',
  Purchase: 'Purchase',
  PurchaseItem: 'PurchaseItem',
  EcommerceConnection: 'EcommerceConnection',
  ProductMapping: 'ProductMapping',
  RegisteredWebhook: 'RegisteredWebhook',
  EcommerceOrder: 'EcommerceOrder',
  SyncLog: 'SyncLog',
  TenantSettings: 'TenantSettings',
  LandingConfig: 'LandingConfig',
  Module: 'Module',
  PlanModule: 'PlanModule',
  TenantModuleAddon: 'TenantModuleAddon',
  SystemNotification: 'SystemNotification',
  ChatSession: 'ChatSession',
  ChatMessage: 'ChatMessage'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
