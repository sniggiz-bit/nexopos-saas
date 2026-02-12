
const { chromium } = require('playwright');

(async () => {
    console.log('Starting verification of Clients Module...');
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();

        console.log('Navigating to dashboard...');
        await page.goto('http://localhost:5173/dashboard/clients');

        // Check if we need login (simple check)
        if (page.url().includes('login') || page.url().includes('sso')) {
            console.log('Redirected to login. Verification requires authenticated session.');
            // For now, fail if not authenticated, or implement mock login if simple
            // Assuming dev environment might have no auth or simple auth
        }

        console.log('Clicking "Nuevo Cliente"...');
        await page.getByText('Nuevo Cliente').click();

        console.log('Filling form...');
        await page.locator('input[name="name"]').fill('Test Client Automated');
        await page.locator('input[name="rut"]').fill('99.999.999-K');

        console.log('Saving...');
        await page.getByText('Guardar').click();

        console.log('Waiting for network idle...');
        await page.waitForTimeout(2000); // Wait for optimistic update or refetch

        console.log('Verifying client in list...');
        const clientFound = await page.getByText('Test Client Automated').isVisible();

        if (clientFound) {
            console.log('SUCCESS: Client created and visible in list.');
        } else {
            console.error('FAILURE: Client not found in list.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Verification failed with error:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
