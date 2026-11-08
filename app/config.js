// === CONFIGURAÇÃO DO SUPABASE ===
// Só a URL e a chave PUBLISHABLE ficam aqui. NUNCA coloque a chave secret/service_role.
const SUPABASE_URL = 'https://wpnzxcabdgywyktbvdrg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5wTL2X5LlbKE41QLWSZCFw_UuiiEmSv';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Limite de notas por mês de cada plano
export const LIM = { Essencial: 5, Premium: 10 };
