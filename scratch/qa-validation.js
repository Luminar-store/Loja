const { createHmac } = require('crypto');

// Configurações locais
const BASE_URL = 'http://localhost:3000';
// Segredo de webhook usado para simulação (deve bater com o configurado localmente)
const WEBHOOK_SECRET = process.env.INFINITEPAY_WEBHOOK_SECRET || 'test_secret_key_12345';

async function runTests() {
  console.log('\n=== INICIANDO VALIDAÇÃO DE SEGURANÇA E RUNTIME — LUMINAR JOIAS ===\n');

  // =========================================================================
  // TESTE 1: Validação de Zod no Checkout (Payload Inválido)
  // =========================================================================
  try {
    console.log('Teste 1: Enviando payload de checkout inválido para /api/checkout...');
    const response = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: [], customer: {} }) // Faltando dados obrigatórios
    });

    const data = await response.json();
    console.log(`-> Resposta recebida (Status ${response.status}):`, data);
    if (response.status === 400 && data.error) {
      console.log('✅ SUCESSO: Zod barrou o payload malformado com 400 Bad Request.\n');
    } else {
      console.log('❌ FALHA: Deveria ter retornado 400 Bad Request com erro de validação.\n');
    }
  } catch (err) {
    console.log(`❌ ERRO no Teste 1 (Certifique-se que o servidor Next.js está rodando em ${BASE_URL}):`, err.message, '\n');
  }

  // =========================================================================
  // TESTE 2: Webhook com Assinatura HMAC Inválida
  // =========================================================================
  try {
    console.log('Teste 2: Enviando webhook com assinatura HMAC inválida...');
    const payload = JSON.stringify({
      order_nsu: 'LUM-TEST-123',
      transaction_nsu: 'TX-TEST-456',
      invoice_slug: 'inv_test_123',
      capture_method: 'credit_card',
      receipt_url: 'https://infinitepay.io/receipt'
    });

    const response = await fetch(`${BASE_URL}/api/webhooks/infinitepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-infinitepay-signature': 'sha256=invalid_signature_hash_here',
        'x-infinitepay-timestamp': Math.floor(Date.now() / 1000).toString()
      },
      body: payload
    });

    const data = await response.json();
    console.log(`-> Resposta recebida (Status ${response.status}):`, data);
    if (response.status === 401) {
      console.log('✅ SUCESSO: Assinatura inválida foi corretamente bloqueada com 401 Unauthorized.\n');
    } else {
      console.log('❌ FALHA: Deveria ter retornado 401 Unauthorized para assinatura forjada.\n');
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 2:', err.message, '\n');
  }

  // =========================================================================
  // TESTE 3: Webhook com Timestamp Expirado (Proteção contra Replay Attack)
  // =========================================================================
  try {
    console.log('Teste 3: Enviando webhook com assinatura válida mas timestamp expirado (Replay Attack)...');
    const payload = JSON.stringify({
      order_nsu: 'LUM-TEST-123',
      transaction_nsu: 'TX-TEST-456'
    });

    // Timestamp de 10 minutos atrás (tolerância é 5 minutos = 300s)
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');

    const response = await fetch(`${BASE_URL}/api/webhooks/infinitepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-infinitepay-signature': `sha256=${signature}`,
        'x-infinitepay-timestamp': oldTimestamp
      },
      body: payload
    });

    const data = await response.json();
    console.log(`-> Resposta recebida (Status ${response.status}):`, data);
    if (response.status === 401) {
      console.log('✅ SUCESSO: Replay attack detectado e bloqueado com 401 Unauthorized.\n');
    } else {
      console.log('❌ FALHA: Deveria ter retornado 401 Unauthorized devido ao timestamp antigo.\n');
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 3:', err.message, '\n');
  }

  // =========================================================================
  // TESTE 4: Webhook com Payload JSON Malformado
  // =========================================================================
  try {
    console.log('Teste 4: Enviando webhook com JSON malformado...');
    const invalidJson = '{ "order_nsu": "LUM-123", "status": '; // JSON quebrado

    const response = await fetch(`${BASE_URL}/api/webhooks/infinitepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-infinitepay-signature': 'sha256=some_sig',
        'x-infinitepay-timestamp': Math.floor(Date.now() / 1000).toString()
      },
      body: invalidJson
    });

    const data = await response.json();
    console.log(`-> Resposta recebida (Status ${response.status}):`, data);
    if (response.status === 400 && data.error === 'Payload inválido') {
      console.log('✅ SUCESSO: Payload JSON corrompido foi rejeitado com 400 Bad Request.\n');
    } else {
      console.log('❌ FALHA: Deveria ter retornado 400 com erro de payload inválido.\n');
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 4:', err.message, '\n');
  }

  // =========================================================================
  // TESTE 5: Webhook com Assinatura Correta mas order_nsu Inexistente no Banco
  // =========================================================================
  try {
    console.log('Teste 5: Enviando webhook válido mas com order_nsu inexistente no banco de dados...');
    const payload = JSON.stringify({
      order_nsu: 'LUM-INEXISTENTE-999999',
      transaction_nsu: 'TX-999',
      capture_method: 'pix',
      receipt_url: 'https://infinitepay.io/receipt'
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');

    const response = await fetch(`${BASE_URL}/api/webhooks/infinitepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-infinitepay-signature': `sha256=${signature}`,
        'x-infinitepay-timestamp': timestamp
      },
      body: payload
    });

    const data = await response.json();
    console.log(`-> Resposta recebida (Status ${response.status}):`, data);
    if (response.status === 400 && data.error === 'Order not found') {
      console.log('✅ SUCESSO: Webhook rejeitou o processamento de pedido inexistente com 400 Order not found.\n');
    } else {
      console.log('❌ FALHA: Deveria ter retornado 400 Order not found para NSU não registrado.\n');
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 5:', err.message, '\n');
  }

  console.log('=== VALIDAÇÃO DE SEGURANÇA E RUNTIME FINALIZADA ===\n');
}

// Configurar o segredo de ambiente temporário caso não exista para o teste rodar
if (!process.env.INFINITEPAY_WEBHOOK_SECRET) {
  process.env.INFINITEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
}

runTests();
