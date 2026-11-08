import { LIM } from './config.js';
import { $, esc, brl, dt, hm, S, isPrestador, noMes, used, lim } from './state.js';

const LOGO = `<span class="mark"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

function login() {
  const reg = S.mode === 'register';
  return `<div class="login"><div class="lp"><div class="brand" style="padding:0">${LOGO}Simplifica MEI</div><h1>Tudo do seu MEI, num só lugar.</h1><p>Notas, boletos, serviços e conversa com a gente, sem depender de planilha.</p></div>
<div class="rp"><div class="card"><h2 style="font-size:22px">${reg ? 'Criar conta' : 'Entrar'}</h2>
${reg ? `<label>Seu Nome<input id="nm" placeholder="Ex.: Maria Souza"></label><label>Nome da Empresa (MEI)<input id="emp" placeholder="Ex.: Doces da Maria"></label>` : ''}
<label>E-mail<input id="em" type="email" placeholder="seu@email.com" autocomplete="email"></label>
<label>Senha<input id="pw" type="password" placeholder="••••••"></label>
${S.msg ? `<p class="proto" style="margin:0">${esc(S.msg)}</p>` : ''}
<button class="btn" data-a="${reg ? 'do-reg' : 'do-login'}">${reg ? 'Cadastrar' : 'Entrar'}</button>
<button class="btn ol" data-a="toggle-mode">${reg ? 'Já tenho uma conta' : 'Criar nova conta'}</button>
</div></div></div>`;
}

function vInicio() {
  const u = used(), l = lim(), p = S.profile?.plano || 'Essencial', n = Math.max(u, l);
  const pips = Array.from({ length: n }, (_, i) => `<i class="${i < u ? (i >= l ? 'x' : 'on') : ''}"></i>`).join('');
  const b = S.boletos.find(x => !x.pago), tot = S.services.reduce((a, s) => a + Number(s.valor), 0), pr = p === 'Premium';
  return `<div class="card hero"><h1>${u} de ${l} notas usadas</h1><div class="pips" aria-hidden="true">${pips}</div><p class="mu">${u < l ? `Ainda dá para emitir ${l - u}.` : 'Limite do plano atingido. Cada nota extra custa R$ 20.'}</p><div style="margin-top:14px"><button class="btn" data-a="go-notas">Emitir nota</button></div></div>
<div class="grid"><div class="card"><h3>Próximo boleto</h3>${b ? `<div class="big">${brl(b.valor)}</div><p class="mu">${esc(b.descricao)}<br>vence em ${dt(b.vencimento)}</p><button class="btn ol sm" style="margin-top:10px" data-a="go-boletos">Ver boletos</button>` : '<p class="mu">Nenhum boleto em aberto.</p>'}</div>
<div class="card"><h3>Serviços registrados</h3><div class="big">${brl(tot)}</div><p class="mu">${S.services.length} serviços registrados</p><button class="btn ol sm" style="margin-top:10px" data-a="go-servicos">Registrar serviço</button></div>
<div class="card ${pr ? '' : 'lock'}"><h3>Contratação de funcionário</h3><p class="mu">${pr ? 'Admissão, registro e folha mensal pela nossa equipe.' : 'Disponível no plano Premium. Fale com a equipe para mudar de plano.'}</p><button class="btn ol sm" style="margin-top:10px" data-a="go-chat">${pr ? 'Solicitar admissão' : 'Pedir upgrade'}</button></div></div>`;
}

function vServ() {
  const rows = S.services.map(s => `<tr><td>${esc(s.descricao)}</td><td>${dt(s.data)}</td><td>${brl(s.valor)}</td></tr>`).join('');
  return `<div class="card"><div class="row"><label style="flex:2">Descrição do serviço<input id="sd" placeholder="Ex.: Entrega de 20 marmitas"></label><label>Valor (R$)<input id="sv" inputmode="decimal" placeholder="0,00"></label><button class="btn" data-a="add-serv">Registrar serviço</button></div><p class="mu">${esc(S.msg)}</p></div>
<div class="card tw" style="margin-top:16px"><table><thead><tr><th>Serviço</th><th>Data</th><th>Valor</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="mu">Nenhum serviço registrado ainda.</td></tr>'}</tbody></table></div>`;
}

function vNotas() {
  const u = used(), l = lim(), ex = u >= l;
  const rows = [...S.notas].reverse().map((n, idx) => `<tr><td>#${S.notas.length - idx}</td><td>${esc(n.tomador)}</td><td>${esc(n.descricao)}</td><td>${brl(n.valor)}</td><td><span class="st ${n.excedente ? 'a' : ''}">${n.excedente ? 'Excedente R$ 20' : 'Emitida'}</span></td></tr>`).join('');
  return `<div class="card">${ex ? `<p class="proto" style="margin-bottom:12px">Você usou as ${l} notas do plano ${esc(S.profile?.plano)}. A próxima será marcada como excedente (R$ 20).</p>` : ''}<div class="row"><label>Tomador<input id="nt" placeholder="Nome ou CNPJ do cliente"></label><label style="flex:2">Serviço prestado<input id="nd" placeholder="Descrição na nota"></label><label>Valor (R$)<input id="nv" inputmode="decimal" placeholder="0,00"></label><button class="btn" data-a="add-nota">${ex ? 'Emitir nota (R$ 20)' : 'Emitir nota'}</button></div><p class="mu">${esc(S.msg)}</p></div>
<div class="card tw" style="margin-top:16px"><table><thead><tr><th>Nota</th><th>Tomador</th><th>Serviço</th><th>Valor</th><th>Situação</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="mu">Nenhuma nota solicitada ainda.</td></tr>'}</tbody></table></div>`;
}

function vBol() {
  if (isPrestador()) {
    const opts = S.clients.map(c => `<option value="${c.id}" ${c.id === S.activeClientId ? 'selected' : ''}>${esc(c.nome || c.id)} (${esc(c.empresa || 'Sem empresa')})</option>`).join('');
    const rows = S.boletos.map(b => {
      const cli = S.clients.find(c => c.id === b.cliente_id);
      return `<tr><td><b>${esc(cli?.nome || 'Cliente')}</b><br><small class="mu">${esc(b.descricao)}</small></td><td>${dt(b.vencimento)}</td><td>${brl(b.valor)}</td><td><span class="st ${b.pago ? '' : 'a'}">${b.pago ? 'Pago' : 'Em aberto'}</span></td><td>${b.pago ? '' : `<button class="btn sm" data-a="pay" data-i="${b.id}">Marcar pago</button>`} <button class="btn ol sm" data-a="del-bol" data-i="${b.id}">Excluir</button></td></tr>`;
    }).join('');
    return `<div class="card"><div class="row"><label>Cliente<select id="bc">${opts}</select></label><label style="flex:2">Descrição<input id="bd" placeholder="Ex.: DAS MEI — Novembro"></label><label>Valor (R$)<input id="bv" inputmode="decimal" placeholder="86,05"></label><label>Vencimento<input id="bdt" type="date"></label></div><div class="row"><label style="flex:3">Linha digitável (opcional)<input id="bl" placeholder="Código de barras / Pix copia e cola"></label><button class="btn" data-a="add-bol">Lançar boleto</button></div><p class="mu">${esc(S.msg)}</p></div>
<div class="card tw" style="margin-top:16px"><table><thead><tr><th>Cliente / Cobrança</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="mu">Nenhum boleto cadastrado.</td></tr>'}</tbody></table></div>`;
  }
  const rows = S.boletos.map(b => `<tr><td>${esc(b.descricao)}</td><td>${dt(b.vencimento)}</td><td>${brl(b.valor)}</td><td><span class="st ${b.pago ? '' : 'a'}">${b.pago ? 'Pago' : 'Em aberto'}</span></td><td>${!b.pago && b.linha ? `<button class="btn ol sm" data-a="copy" data-i="${b.id}">Copiar código</button>` : ''}</td></tr>`).join('');
  return `<div class="card tw"><table><thead><tr><th>Cobrança</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="mu">Nenhum boleto disponível.</td></tr>'}</tbody></table></div><p class="mu" style="margin-top:10px">${esc(S.msg)}</p>`;
}

function vChat() {
  const p = isPrestador();
  const targetId = p ? S.activeClientId : S.user.id;
  const filtered = S.msgs.filter(m => m.cliente_id === targetId);
  const mySender = p ? 'prestador' : 'cliente';
  const cli = S.clients.find(c => c.id === targetId);
  const list = filtered.map(m => `<div class="m ${m.de === mySender ? 'me' : ''}">${esc(m.texto)}<small>${m.de === 'prestador' ? 'Equipe' : esc(cli?.nome || S.profile?.nome || 'Cliente')} · ${hm(m.criado_em)}</small></div>`).join('');
  const selCli = p ? `<div style="margin-bottom:12px"><label>Conversando com:<select id="chat-cli">${S.clients.map(c => `<option value="${c.id}" ${c.id === targetId ? 'selected' : ''}>${esc(c.nome || 'Sem nome')} — ${esc(c.empresa || '')}</option>`).join('')}</select></label></div>` : '';
  return `<div class="card chat">${selCli}<h3>${p ? esc(cli?.nome || 'Selecione um cliente') : 'Equipe Simplifica MEI'}</h3><div class="msgs" id="ms">${list || '<p class="mu">Nenhuma mensagem ainda. Envie um oi!</p>'}</div><div class="row" style="margin:0"><label style="min-width:0"><input id="ci" placeholder="Escreva uma mensagem" autocomplete="off"></label><button class="btn" data-a="send">Enviar</button></div></div>`;
}

function vCli() {
  const rows = S.clients.map(c => {
    const u = S.notas.filter(n => n.cliente_id === c.id && noMes(n)).length, l = LIM[c.plano] || 5;
    return `<tr><td><b>${esc(c.nome || 'Sem nome')}</b><br><span class="mu">${esc(c.empresa || '')}</span></td><td><select data-plan="${c.id}" aria-label="Plano de ${esc(c.nome)}">${Object.keys(LIM).map(p => `<option ${p === c.plano ? 'selected' : ''}>${p}</option>`).join('')}</select></td><td>${u} de ${l}</td><td><span class="st ${u >= l ? 'a' : ''}">${u >= l ? 'No limite' : 'Dentro do plano'}</span></td></tr>`;
  }).join('');
  return `<div class="card tw"><table><thead><tr><th>Cliente</th><th>Plano</th><th>Notas no mês</th><th>Situação</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="mu">Nenhum cliente cadastrado ainda.</td></tr>'}</tbody></table></div><p class="mu" style="margin-top:10px">${esc(S.msg)}</p>`;
}

const TITLES = { inicio: 'Início', servicos: 'Serviços', notas: 'Notas fiscais', boletos: 'Boletos', chat: 'Chat', clientes: 'Clientes' };

export function render() {
  const a = $('#app');
  if (!S.user || !S.profile) { a.innerHTML = login(); return; }
  const c = !isPrestador(), nav = c ? ['inicio', 'servicos', 'notas', 'boletos', 'chat'] : ['clientes', 'boletos', 'chat'];
  if (!nav.includes(S.view)) S.view = nav[0];
  const V = { inicio: vInicio, servicos: vServ, notas: vNotas, boletos: vBol, chat: vChat, clientes: vCli }[S.view]();
  a.innerHTML = `<div class="shell"><aside><div class="brand">${LOGO}Simplifica MEI</div>${nav.map(k => `<button class="nv" data-a="go-${k}" ${k === S.view ? 'aria-current="page"' : ''}>${TITLES[k]}</button>`).join('')}<div class="who"><b>${esc(S.profile.nome || S.user.email)}</b>${c ? esc(S.profile.empresa || 'Cliente MEI') : 'Prestador'}<br><button data-a="out">Sair</button></div></aside>
<main class="main"><div class="top"><h2>${TITLES[S.view]}</h2>${c ? `<span class="badge">Plano ${esc(S.profile.plano)} · ${lim()} notas/mês</span>` : '<span class="badge">Visão do prestador</span>'}</div>${V}</main></div>`;
  const m = $('#ms'); if (m) m.scrollTop = m.scrollHeight;
}
