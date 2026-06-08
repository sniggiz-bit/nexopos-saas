const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const replacements = [
  {
    find: /  transbankTransactions   PaymentTransaction\[\]\s*\}/g,
    replace: `  transbankTransactions   PaymentTransaction[]\n\n  @@index([tenantId])\n}`
  },
  {
    find: /  quotes    Quote\[\]\s*\}/g,
    replace: `  quotes    Quote[]\n\n  @@index([tenantId])\n  @@index([branchId])\n}`
  },
  {
    find: /  @@unique\(\[name, tenantId\]\)\s*\}/g,
    replace: `  @@unique([name, tenantId])\n  @@index([tenantId])\n}`
  },
  {
    find: /  @@unique\(\[barcode, tenantId\]\)\s*\}/g,
    replace: `  @@unique([barcode, tenantId])\n  @@index([tenantId])\n  @@index([categoryId])\n  @@index([brandId])\n}`
  },
  {
    find: /  @@map\("InventoryLevel"\)\s*\}/g,
    replace: `  @@index([branchId])\n  @@index([productId])\n  @@map("InventoryLevel")\n}`
  },
  {
    find: /  payments           Payment\[\]\s*\}/g,
    replace: `  payments           Payment[]\n\n  @@index([tenantId])\n  @@index([branchId])\n  @@index([createdAt])\n}`
  },
  {
    find: /  updatedAt      DateTime        @updatedAt\s*\}/g,
    replace: `  updatedAt      DateTime        @updatedAt\n\n  @@index([branchId])\n}`
  },
  {
    find: /  @@unique\(\[rut, tenantId\]\)\s*\}/g,
    replace: `  @@unique([rut, tenantId])\n  @@index([tenantId])\n}`
  },
  {
    find: /  sales      Sale\[\]\s*\}/g,
    replace: `  sales      Sale[]\n\n  @@index([tenantId])\n}`
  },
  {
    find: /  payments    CreditPayment\[\]\s*\}/g,
    replace: `  payments    CreditPayment[]\n\n  @@index([tenantId])\n  @@index([customerId])\n}`
  },
  {
    find: /  user      User\?        @relation\(fields: \[userId\], references: \[id\]\)\s*\}/g,
    replace: `  user      User?        @relation(fields: [userId], references: [id])\n\n  @@index([branchId])\n  @@index([productId])\n  @@index([createdAt])\n}`
  },
  {
    find: /  createdAt DateTime @default\(now\(\)\)\s*\}/g,
    replace: `  createdAt DateTime @default(now())\n\n  @@index([tenantId])\n}`
  },
  {
    find: /  purchases Purchase\[\]\s*\}/g,
    replace: `  purchases Purchase[]\n\n  @@index([tenantId])\n}`
  },
  {
    find: /  items       PurchaseItem\[\]\s*\}/g,
    replace: `  items       PurchaseItem[]\n\n  @@index([tenantId])\n  @@index([branchId])\n}`
  }
];

let replacedCount = 0;
replacements.forEach(({find, replace}) => {
  if (find.test(schema)) {
    schema = schema.replace(find, replace);
    replacedCount++;
  } else {
    console.log("Could not match regex: ", find);
  }
});

console.log("Replaced", replacedCount, "blocks.");
fs.writeFileSync(schemaPath, schema);
