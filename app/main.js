import { sb } from './config.js';
import { $, num, S, ui, isPrestador, used, lim } from './state.js';
import { loadData, subscribeChat } from './api.js';
import { render } from './views.js';

ui.render = render;
subscribeChat();

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a;

  if (a === 'toggle-mode') {
    S.mode = S.mode === 'login' ? 'register' : 'login'; S.msg = ''; render();
  }
  else if (a === 'do-login') {
    const email = $('#em').value.trim(), password = $('#pw').value;
    S.msg = 'Entrando...'; render();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { S.msg = 'Erro ao entrar: ' + error.message; render(); return; }
    S.user = data.user; S.msg = ''; await loadData();
  }
  else if (a === 'do-reg') {
    const nome = $('#nm').value.trim(), empresa = $('#emp').value.trim(), email = $('#em').value.trim(), password = $('#pw').value;
    if (!nome || !email || !password) { S.msg = 'Preencha nome, e-mail e senha.'; render(); return; }
    S.msg = 'Criando conta...'; render();
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { nome, empresa } } });
    if (error) { S.msg = 'Erro: ' + error.message; render(); return; }
    if (!data.session) { S.mode = 'login'; S.msg = 'Conta criada! Confirme o e-mail que enviamos e depois entre.'; render(); return; }
    S.user = data.user; S.msg = ''; await loadData();
  }
  else if (a === 'out') {
    await sb.auth.signOut();
    S.user = null; S.profile = null; S.activeClientId = null;
    S.clients = []; S.services = []; S.notas = []; S.boletos = []; S.msgs = [];
    S.view = 'inicio'; S.msg = '';
    render();
  }
  else if (a.startsWith('go-')) {
    S.view = a.slice(3); S.msg = ''; render();
  }
  else if (a === 'add-serv' || a === 'add-serv-nota') {
    const comNota = a === 'add-serv-nota';
    const descricao = $('#sd').value.trim(), valor = num($('#sv').value), tomador = $('#sto').value.trim();
    if (!descricao || !(valor > 0)) { S.msg = 'Preencha a descrição e um valor maior que zero.'; render(); return; }
    if (comNota && !tomador) { S.msg = 'Para gerar a nota, informe o tomador (nome ou CNPJ do cliente).'; render(); return; }
    const { data: serv, error } = await sb.from('servicos').insert({ cliente_id: S.user.id, descricao, valor, tomador: tomador || null }).select().single();
    if (error) { S.msg = 'Erro: ' + error.message; render(); return; }
    if (comNota) {
      const excedente = used() >= lim();
      const { error: e2 } = await sb.from('notas').insert({ cliente_id: S.user.id, servico_id: serv.id, tomador, descricao, valor, excedente });
      S.msg = e2 ? 'Serviço registrado, mas a nota não foi gerada: ' + e2.message : `Serviço registrado e nota solicitada${excedente ? ' (excedente)' : ''}!`;
    } else {
      S.msg = 'Serviço registrado.';
    }
    await loadData();
  }
  else if (a === 'gen-nota') {
    const id = Number(b.dataset.i);
    const sv = S.services.find(x => x.id === id);
    if (!sv || S.notas.some(n => n.servico_id === id)) return;
    const tomador = sv.tomador || (window.prompt('Nome ou CNPJ do cliente que vai receber a nota:') || '').trim();
    if (!tomador) { S.msg = 'Informe o tomador para gerar a nota.'; render(); return; }
    const excedente = used() >= lim();
    const { error } = await sb.from('notas').insert({ cliente_id: S.user.id, servico_id: id, tomador, descricao: sv.descricao, valor: sv.valor, excedente });
    S.msg = error ? 'Erro: ' + error.message : `Nota solicitada${excedente ? ' (excedente)' : ''}!`;
    await loadData();
  }
  else if (a === 'add-bol') {
    const cliente_id = $('#bc').value, descricao = $('#bd').value.trim(), valor = num($('#bv').value), vencimento = $('#bdt').value, linha = $('#bl').value.trim();
    if (!cliente_id || !descricao || !(valor > 0) || !vencimento) { S.msg = 'Preencha cliente, descrição, valor e vencimento.'; render(); return; }
    const { error } = await sb.from('boletos').insert({ cliente_id, descricao, valor, vencimento, linha });
    S.msg = error ? 'Erro: ' + error.message : 'Boleto lançado para o cliente!';
    await loadData();
  }
  else if (a === 'pay') {
    await sb.from('boletos').update({ pago: true }).eq('id', b.dataset.i);
    S.msg = 'Pagamento registrado.'; await loadData();
  }
  else if (a === 'del-bol') {
    await sb.from('boletos').delete().eq('id', b.dataset.i);
    S.msg = 'Boleto removido.'; await loadData();
  }
  else if (a === 'copy') {
    const l = S.boletos.find(x => x.id == b.dataset.i)?.linha || '';
    try { navigator.clipboard.writeText(l); } catch (_) {}
    S.msg = 'Código copiado: ' + l; render();
  }
  else if (a === 'send') {
    const i = $('#ci'), texto = i.value.trim(); if (!texto) return;
    const cliente_id = isPrestador() ? S.activeClientId : S.user.id;
    const de = isPrestador() ? 'prestador' : 'cliente';
    i.value = '';
    await sb.from('mensagens').insert({ cliente_id, de, texto });
    await loadData();
    const x = $('#ci'); if (x) x.focus();
  }
});

document.addEventListener('change', async e => {
  const s = e.target.closest('[data-plan]');
  if (s) {
    await sb.from('profiles').update({ plano: s.value }).eq('id', s.dataset.plan);
    S.msg = 'Plano do cliente atualizado!';
    await loadData();
  }
  if (e.target.id === 'chat-cli') {
    S.activeClientId = e.target.value;
    render();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'ci') document.querySelector('[data-a="send"]').click();
});

// Verifica se já existe sessão ativa ao abrir a página
sb.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) { S.user = session.user; loadData(); }
  else render();
});
