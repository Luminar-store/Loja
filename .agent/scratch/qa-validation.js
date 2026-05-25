const { createHmac } = require('crypto');
const fs = require('fs');
const path = require('path');

// Configurações locais
const BASE_URL = 'http://localhost:3000';
// Segredo de webhook usado para simulação (deve bater com o configurado localmente)
let WEBHOOK_SECRET = process.env.INFINITEPAY_WEBHOOK_SECRET || 'test_secret_key_12345';

// Tentar carregar variáveis de ambiente de um arquivo .env ou .env.local se existirem
function loadEnvFiles() {
  const envPaths = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            // Remover aspas simples/duplas se existirem
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
              value = value.substring(1, value.length - 1);
            }
            if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
              value = value.substring(1, value.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = value.trim();
            }
          }
        });
        console.log(`[QA Engine] Carregou variáveis de ambiente do arquivo: ${envPath}`);
        break;
      } catch (err) {
        console.warn(`[QA Engine] Erro ao ler arquivo .env em ${envPath}:`, err.message);
      }
    }
  }
}

loadEnvFiles();

// Atualizar segredo do webhook se carregado das envs
if (process.env.INFINITEPAY_WEBHOOK_SECRET) {
  WEBHOOK_SECRET = process.env.INFINITEPAY_WEBHOOK_SECRET;
}

// Inicializar cliente do Supabase se chaves estiverem presentes
let supabase = null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceRole) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[QA Engine] Conexão com o Supabase inicializada com sucesso.');
  } catch (err) {
    console.warn('[QA Engine] Falha ao importar @supabase/supabase-js:', err.message);
  }
} else {
  console.log('[QA Engine] Supabase desabilitado nos testes (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes).');
}

async function runTests() {
  console.log('\n=================================================================');
  console.log('🚀 INICIANDO VALIDAÇÃO DE SEGURANÇA E RUNTIME — LUMINAR JOIAS');
  console.log('=================================================================\n');

  let passedAll = true;

  // =========================================================================
  // TESTE 1: Validação de Zod no Checkout (Payload Inválido)
  // =========================================================================
  try {
    console.log('-----------------------------------------------------------------');
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
      passedAll = false;
    }
  } catch (err) {
    console.log(`❌ ERRO no Teste 1 (Certifique-se que o servidor Next.js está rodando em ${BASE_URL}):`, err.message, '\n');
    passedAll = false;
  }

  // =========================================================================
  // TESTE 2: Webhook com Assinatura HMAC Inválida
  // =========================================================================
  try {
    console.log('-----------------------------------------------------------------');
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
      passedAll = false;
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 2:', err.message, '\n');
    passedAll = false;
  }

  // =========================================================================
  // TESTE 3: Webhook com Timestamp Expirado (Proteção contra Replay Attack)
  // =========================================================================
  try {
    console.log('-----------------------------------------------------------------');
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
      passedAll = false;
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 3:', err.message, '\n');
    passedAll = false;
  }

  // =========================================================================
  // TESTE 4: Webhook com Payload JSON Malformado
  // =========================================================================
  try {
    console.log('-----------------------------------------------------------------');
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
      passedAll = false;
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 4:', err.message, '\n');
    passedAll = false;
  }

  // =========================================================================
  // TESTE 5: Webhook com Assinatura Correta mas order_nsu Inexistente no Banco
  // =========================================================================
  try {
    console.log('-----------------------------------------------------------------');
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
      passedAll = false;
    }
  } catch (err) {
    console.log('❌ ERRO no Teste 5:', err.message, '\n');
    passedAll = false;
  }

  // =========================================================================
  // TESTES INTEGRADOS DE BANCO DE DADOS (Exige Supabase Client inicializado)
  // =========================================================================
  if (supabase) {
    const testNSU = `LUM-QA-${Math.floor(Math.random() * 1000000)}`;
    let testOrderId = null;

    try {
      console.log('-----------------------------------------------------------------');
      console.log(`Preparando Testes Integrados: Criando pedido temporário com NSU: ${testNSU}...`);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_nsu: testNSU,
            customer_name: 'QA Test Bot',
            customer_email: 'qa@luminar.com.br',
            customer_phone: '11999999999',
            items: [{ id: '9f5a7e6b-4c3d-2e1a-0f9b-8a7c6b5d4e3f', quantity: 1, name: 'Produto de Teste QA' }],
            subtotal: 100,
            shipping_price: 15,
            total_price: 115,
            payment_status: 'pending',
            status: 'pending',
            shipping_address: {
              cep: '01001000',
              street: 'Praça da Sé',
              number: '123',
              complement: 'Ap 12',
              neighborhood: 'Sé',
              city: 'São Paulo',
              state: 'SP'
            }
          }
        ])
        .select('id')
        .single();

      if (orderError) throw orderError;
      testOrderId = orderData.id;
      console.log(`-> Pedido temporário criado com sucesso no Supabase (ID: ${testOrderId})`);

      // ───────────────────────────────────────────────────────────────────────
      // TESTE 6: Processamento de Webhook Bem-Sucedido (Pedido Pago)
      // ───────────────────────────────────────────────────────────────────────
      console.log('\nTeste 6: Enviando webhook com assinatura válida para confirmar pagamento do pedido...');
      const payload = JSON.stringify({
        order_nsu: testNSU,
        transaction_nsu: `TX-QA-${Math.floor(Math.random() * 1000000)}`,
        invoice_slug: 'inv_qa_test',
        capture_method: 'credit_card',
        receipt_url: 'https://infinitepay.io/receipt/qa'
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
      
      if (response.status === 200 && data.success === true) {
        // Verificar no banco de dados se o status foi atualizado para 'paid' e 'production'
        const { data: updatedOrder, error: checkError } = await supabase
          .from('orders')
          .select('payment_status, status')
          .eq('id', testOrderId)
          .single();

        if (checkError) throw checkError;
        
        console.log(`-> Status do pedido no banco de dados: payment_status='${updatedOrder.payment_status}', status='${updatedOrder.status}'`);
        if (updatedOrder.payment_status === 'paid' && updatedOrder.status === 'production') {
          console.log('✅ SUCESSO: Webhook processado e pedido atualizado para pago/produção no banco.\n');
        } else {
          console.log('❌ FALHA: Pedido foi processado mas os status no banco estão incorretos.\n');
          passedAll = false;
        }
      } else {
        console.log('❌ FALHA: Webhook deveria ter retornado 200 com success=true.\n');
        passedAll = false;
      }

      // ───────────────────────────────────────────────────────────────────────
      // TESTE 7: Idempotência do Webhook (Pedido Já Processado e Pago)
      // ───────────────────────────────────────────────────────────────────────
      console.log('Teste 7: Re-enviando o mesmo webhook de pagamento para validar Idempotência...');
      const responseIdemp = await fetch(`${BASE_URL}/api/webhooks/infinitepay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-infinitepay-signature': `sha256=${signature}`,
          'x-infinitepay-timestamp': timestamp
        },
        body: payload
      });

      const dataIdemp = await responseIdemp.json();
      console.log(`-> Resposta recebida (Status ${responseIdemp.status}):`, dataIdemp);

      if (responseIdemp.status === 200 && dataIdemp.success === true && dataIdemp.message === 'Already processed') {
        console.log('✅ SUCESSO: Idempotência ativada com sucesso (retornou Already processed).\n');
      } else {
        console.log('❌ FALHA: Deveria ter acionado a idempotência e retornado "Already processed".\n');
        passedAll = false;
      }

    } catch (err) {
      console.log('❌ ERRO nos Testes Integrados:', err.message, '\n');
      passedAll = false;
    } finally {
      // ───────────────────────────────────────────────────────────────────────
      // TESTE 8: Limpeza de Dados de Teste
      // ───────────────────────────────────────────────────────────────────────
      if (testOrderId) {
        try {
          console.log('Limpando Banco de Dados: Excluindo o pedido temporário criado para os testes...');
          const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .eq('id', testOrderId);

          if (deleteError) throw deleteError;
          console.log('✅ SUCESSO: Pedido temporário removido do banco com sucesso.\n');
        } catch (err) {
          console.log('⚠️ AVISO ao limpar pedido temporário:', err.message, '\n');
        }
      }
    }
  } else {
    console.log('⚠️ NOTA: Testes 6, 7 e 8 integrados ao Supabase foram PULADOS por falta de variáveis de ambiente.');
    console.log('   Para rodá-los, adicione as chaves NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env\n');
  }

  console.log('=================================================================');
  if (passedAll) {
    console.log('🎉 TODAS AS VALIDAÇÕES PASSARAM COM SUCESSO!');
    console.log('=================================================================\n');
    process.exit(0);
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.');
    console.log('=================================================================\n');
    process.exit(1);
  }
}

// Configurar o segredo de ambiente temporário caso não exista para o teste rodar
if (!process.env.INFINITEPAY_WEBHOOK_SECRET) {
  process.env.INFINITEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
}

runTests();
