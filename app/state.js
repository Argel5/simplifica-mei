import { LIM } from './config.js';

// ---------- Auxiliares ----------
export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dt = d => d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') : '';
export const hm = d => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
export const num = v => parseFloat(String(v).replace(/\./g, '').replace(',', '.'));

// ---------- Estado ----------
export const S = {
  user: null, profile: null, mode: 'login', view: 'inicio', msg: '',
  activeClientId: null,
  clients: [], services: [], notas: [], boletos: [], msgs: []
};

// Permite que api.js peça um redesenho sem importar views.js (evita import circular)
export const ui = { render() {} };

// ---------- Regras derivadas do estado ----------
export const isPrestador = () => S.profile?.role === 'prestador';
// Conta só as notas do mês atual (o limite do plano é mensal)
export const noMes = n => {
  const d = new Date(n.criado_em), h = new Date();
  return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
};
export const used = () => S.notas.filter(noMes).length;
export const lim = () => LIM[S.profile?.plano || 'Essencial'] || 5;
