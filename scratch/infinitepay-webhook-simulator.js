/**
 * Simulador de Webhook InfinitePay - Luminar Joias
 * 
 * Este script executa testes locais automatizados de segurança, HMAC e idempotência
 * contra o endpoint de webhook /api/webhooks/infinitepay.
 * 
 * Execução:
 * node scratch/infinitepay-webhook-simulator.js
 */

const crypto = require('crypto');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/infinitepay';
const TEST_SECRET = process.env.INFINITEPAY_WEBHOOK_SECRET || 'test-secret-key-123456';

// Função auxiliar para gerar assinaturas HMAC
function generateSignature(payload, timestamp, secret) {
  const data = `${timestamp}.${payload}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Função para disparar requisição simulada
async function sendWebhook({ payload, timestamp, signature, label }) {
  console.log(`\n--------------------------------------------------`);
  console.log(`[TESTE] Executando: ${label}`);
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (timestamp) {
    headers['x-infinitepay-timestamp'] = timestamp.toString();
  }
  if (signature) {
    headers['x-infinitepay-signature'] = signature;
  }

  const startTime = Date.now();
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload,
    });

    const duration = Date.now() - startTime;
    const status = response.status;
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    console.log(`[Resultado] Status HTTP: ${status} (${duration}ms)`);
    console.log(`[Resposta]`, data);
    
    // Análise do resultado esperado
    return { status, data };
  } catch (err) {
    console.error(`[FALHA] Conectividade recusada. Certifique-se de que a aplicação Next.js está rodando localmente na porta 3000.`);
    return { error: err.message };
  }
}

// Cenários de teste automatizados
async function runSuite() {
  console.log('=== INICIANDO SUÍTE DE SIMULAÇÃO DE WEBHOOK INFINITEPAY ===');
  console.log(`Secret de Teste: ${TEST_SECRET}`);
  console.log(`URL do Webhook: ${WEBHOOK_URL}`);

  const validPayload = JSON.stringify({
    order_nsu: 'LUM-TEST12345',
    capture_method: 'credit_card',
    transaction_nsu: '987654321',
    invoice_slug: 'inv-test-slug',
    receipt_url: 'https://infinitepay.io/receipt/test',
    status: 'approved'
  });

  const now = Math.floor(Date.now() / 1000);

  // Cenário 1: HMAC Válido com Timestamp Correto
  const sig1 = generateSignature(validPayload, now, TEST_SECRET);
  await sendWebhook({
    payload: validPayload,
    timestamp: now,
    signature: sig1,
    label: 'Cenário 1: HMAC e Timestamp Válidos (Sucesso / Caso padrão)'
  });

  // Cenário 2: HMAC Inválido (Payload adulterado por atacante)
  const sig2 = generateSignature(validPayload, now, 'wrong-secret-key');
  await sendWebhook({
    payload: validPayload,
    timestamp: now,
    signature: sig2,
    label: 'Cenário 2: Assinatura HMAC Adulterada/Inválida (Deve ser rejeitada)'
  });

  // Cenário 3: Replay Attack (Timestamp expirado de 1 hora atrás)
  const oneHourAgo = now - 3600;
  const sig3 = generateSignature(validPayload, oneHourAgo, TEST_SECRET);
  await sendWebhook({
    payload: validPayload,
    timestamp: oneHourAgo,
    signature: sig3,
    label: 'Cenário 3: Replay Attack - Timestamp Expirado (Deve retornar 401)'
  });

  // Cenário 4: Assinatura Ausente em Produção
  // Nota: o comportamento depende se NODE_ENV é production. Simula sem cabeçalhos
  await sendWebhook({
    payload: validPayload,
    label: 'Cenário 4: Assinatura HMAC Ausente (Deve alertar / rejeitar se em produção)'
  });

  // Cenário 5: Payload JSON corrompido
  const brokenPayload = '{ "order_nsu": "LUM-TEST12345", "capture_method": ';
  const sig5 = generateSignature(brokenPayload, now, TEST_SECRET);
  await sendWebhook({
    payload: brokenPayload,
    timestamp: now,
    signature: sig5,
    label: 'Cenário 5: Payload JSON Malformado (Deve retornar 400)'
  });

  // Cenário 6: Idempotência de Pedido Já Pago
  // Executado duas vezes com o mesmo NSU
  const sig6 = generateSignature(validPayload, now, TEST_SECRET);
  console.log('\n--- Testando Idempotência ---');
  await sendWebhook({
    payload: validPayload,
    timestamp: now,
    signature: sig6,
    label: 'Cenário 6A: Primeiro processamento do NSU'
  });
  await sendWebhook({
    payload: validPayload,
    timestamp: now,
    signature: sig6,
    label: 'Cenário 6B: Segundo processamento redundante do mesmo NSU (Idempotência ativa)'
  });

  console.log('\n=== SUÍTE DE SIMULAÇÃO CONCLUÍDA ===');
}

runSuite();
