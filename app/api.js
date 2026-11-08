import { sb } from './config.js';
import { S, isPrestador, ui } from './state.js';

export async function loadData() {
  if (!S.user) return;
  const { data: prof } = await sb.from('profiles').select('*').eq('id', S.user.id).single();
  S.profile = prof;
  if (!prof) return;

  if (isPrestador()) {
    const [{ data: cls }, { data: nts }, { data: bls }, { data: ms }] = await Promise.all([
      sb.from('profiles').select('*').eq('role', 'cliente').order('nome'),
      sb.from('notas').select('*').order('criado_em', { ascending: true }),
      sb.from('boletos').select('*').order('vencimento', { ascending: true }),
      sb.from('mensagens').select('*').order('criado_em', { ascending: true })
    ]);
    S.clients = cls || [];
    S.notas = nts || [];
    S.boletos = bls || [];
    S.msgs = ms || [];
    if (!S.activeClientId && S.clients.length) S.activeClientId = S.clients[0].id;
  } else {
    S.activeClientId = S.user.id;
    const [{ data: srvs }, { data: nts }, { data: bls }, { data: ms }] = await Promise.all([
      sb.from('servicos').select('*').eq('cliente_id', S.user.id).order('id', { ascending: false }),
      sb.from('notas').select('*').eq('cliente_id', S.user.id).order('id', { ascending: true }),
      sb.from('boletos').select('*').eq('cliente_id', S.user.id).order('vencimento', { ascending: true }),
      sb.from('mensagens').select('*').eq('cliente_id', S.user.id).order('criado_em', { ascending: true })
    ]);
    S.services = srvs || [];
    S.notas = nts || [];
    S.boletos = bls || [];
    S.msgs = ms || [];
  }
  ui.render();
}

// Tempo real para novas mensagens
export function subscribeChat() {
  sb.channel('chat-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, payload => {
      if (S.user) {
        // evita duplicar quando a mensagem já veio no recarregamento
        if (!S.msgs.some(m => m.id === payload.new.id)) S.msgs.push(payload.new);
        if (S.view === 'chat') ui.render();
      }
    }).subscribe();
}
