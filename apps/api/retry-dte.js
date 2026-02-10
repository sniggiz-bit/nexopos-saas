const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function retryDte(saleId) {
    try {
        console.log(`--- Retrying DTE for Sale: ${saleId} ---`);
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: {
                items: { include: { product: true } },
                tenant: { include: { dteConfig: true } },
            },
        });

        if (!sale) throw new Error('Sale not found');

        const token = sale.tenant?.dteConfig?.liorenToken;
        const detalles = sale.items.map((item) => ({
            nombre: item.product.name,
            cantidad: item.product.unitType === 'WEIGHT' ? Number(item.quantity) : Math.floor(Number(item.quantity)),
            precio: Math.round(item.price),
        }));

        const payload = {
            token,
            dte: {
                tipodoc: 39,
                detalles,
            },
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));

        try {
            let responseData;
            if (token && token.startsWith('TEST_TOKEN')) {
                console.log('MOCK MODE ACTIVE');
                responseData = {
                    folio: Math.floor(Math.random() * 10000) + 1,
                    url_pdf: 'https://lioren.cl/ver/boleta/ejemplo-mock',
                };
            } else {
                const response = await axios.post('https://lioren.cl/api/dte', payload);
                responseData = response.data;
            }

            console.log('Response data:', JSON.stringify(responseData, null, 2));
        } catch (apiError) {
            console.error('API Error Response:', apiError.response ? JSON.stringify(apiError.response.data, null, 2) : apiError.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

// Use the last sale ID from previous check
const lastSaleId = '7b7c1137-aa25-4688-9070-d59b30992523';
retryDte(lastSaleId);
