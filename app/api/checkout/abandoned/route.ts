import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, email, phone, name, items } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId é obrigatório.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Verifica se já existe um registro pendente ou convertido para esta sessão
    const { data: existingRecovery, error: checkError } = await supabase
      .from('cart_recovery')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (existingRecovery && existingRecovery.status === 'recovered') {
      // Se a sessão já foi convertida em venda, não sobrescrevemos nem fazemos nada
      return NextResponse.json({ success: true, message: 'Carrinho já convertido anteriormente.' });
    }

    // 2. Monta as informações a serem salvas de forma incremental (upsert)
    const recoveryPayload = {
      session_id: sessionId,
      customer_email: email || existingRecovery?.customer_email || null,
      customer_phone: phone || existingRecovery?.customer_phone || null,
      customer_name: name || existingRecovery?.customer_name || null,
      cart_items: items || existingRecovery?.cart_items || [],
      status: 'pending',
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('cart_recovery')
      .upsert(recoveryPayload, { onConflict: 'session_id' });

    if (upsertError) {
      console.error('[CartRecovery] Erro ao registrar lead parcial:', upsertError.message);
      return NextResponse.json({ error: 'Erro ao registrar carrinho abandonado.' }, { status: 500 });
    }

    console.info(`[CartRecovery] Lead parcial capturado para sessão ${sessionId} (${email || 'sem e-mail'})`);
    return NextResponse.json({ success: true, message: 'Lead de abandono capturado com sucesso.' });
  } catch (error: any) {
    console.error('[CartRecovery Route] Exceção crítica:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
