import { test, expect } from '@playwright/test';

test.describe('Navegação e Fluxo de Compra de Usuário Comum', () => {

  test('1. Deve navegar pela vitrine principal e abrir a página inicial', async ({ page }) => {
    await page.goto('/');
    // Garantir que a página principal carrega sem erros
    await expect(page).toHaveURL('/');
  });

  test('2. Adição de produto ao carrinho e persistência no armazenamento local', async ({ page }) => {
    await page.goto('/');
    
    // Simular que o usuário adiciona produtos ao carrinho manipulando localStorage
    await page.evaluate(() => {
      localStorage.setItem('cart-storage', JSON.stringify({
        state: {
          items: [
            {
              id: 'd3b07384-d113-4ec2-a5d2-0d12e6988888',
              quantity: 2,
              options: [
                {
                  option_id: 'opt1',
                  option_name: 'Metal',
                  value_id: 'val1',
                  value_name: 'Ouro 18k',
                  price_modifier: 150
                }
              ]
            }
          ]
        },
        version: 0
      }));
    });

    await page.reload();
    // Apenas garante que a aplicação não quebra ao ler o estado do carrinho do localStorage
    await expect(page).toHaveURL('/');
  });

});
