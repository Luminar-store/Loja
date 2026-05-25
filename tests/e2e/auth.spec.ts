import { test, expect } from '@playwright/test';

test.describe('Segurança de Rotas Administrativas e Middleware', () => {
  
  test('1. Acesso a página admin deslogado deve redirecionar para /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('2. Requisição direta a API admin deslogado deve retornar 401', async ({ request }) => {
    const response = await request.post('/api/admin/products', {
      data: { name: 'Teste' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Não autenticado');
  });

  test('3. Tentativa de bypass de RLS ou acesso via API de rotas restritas deve falhar de forma segura', async ({ request }) => {
    // Tentar acessar diretamente rotas de produtos id com método DELETE deslogado
    const response = await request.delete('/api/admin/products/invalid-id');
    expect(response.status()).toBe(401);
  });

});
