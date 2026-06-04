const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Proteção da Home: Se NÃO tiver sessão, manda pro login de verdade
async function checkUserSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

    if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Se passou na segurança, carrega a tralha toda da Home
    carregarHistoricoCompras();
    carregarNotasEscaneadas();
}

// 1. Busca e Renderiza as Listas Reais no Carrossel da Home
async function carregarHistoricoCompras() {
    const container = document.getElementById('historico-container');
    if (!container) return;

    try {
        const { data: listas, error } = await _supabase
            .from('listas_compras')
            .select(`
                id,
                nome_lista,
                created_at,
                itens_lista (
                    quantidade,
                    valor_unitario
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!listas || listas.length === 0) {
            container.innerHTML = `
                <div class="empty-state-message" style="padding: 15px; font-size: 0.9rem; text-align: center; width: 100%;">
                    Você ainda não tem histórico de compras, vamos <a href="listas.html" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">criar sua primeira lista</a>?
                </div>
            `;
            return;
        }

        container.innerHTML = listas.map(lista => {
            const totalItens = lista.itens_lista ? lista.itens_lista.length : 0;
            
            let valorTotalLista = 0;
            if (lista.itens_lista) {
                lista.itens_lista.forEach(item => {
                    const qtd = parseFloat(item.quantidade) || 1;
                    const valor = item.valor_unitario || 0;
                    valorTotalLista += (qtd * valor);
                });
            }

            const valorFormatado = valorTotalLista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const dataCriacao = new Date(lista.created_at);
            const dataFormatada = `${String(dataCriacao.getDate()).padStart(2, '0')}/${String(dataCriacao.getMonth() + 1).padStart(2, '0')}`;

            return `
                <div class="history-card" onclick="window.location.href='detalhes_lista.html?id=${lista.id}'" style="min-width: 150px; background-color: #121b2a; border: 1px solid #1c2d47; padding: 16px; border-radius: 12px; margin-right: 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; height: 115px; flex-shrink: 0;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 0.75rem; color: #475569;">${dataFormatada}</span>
                            <i class="fas fa-shopping-bag" style="color: var(--primary-blue); font-size: 0.85rem;"></i>
                        </div>
                        <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${lista.nome_lista}</h3>
                    </div>
                    <div>
                        <p style="font-size: 0.75rem; color: #475569; margin: 0 0 2px 0;">${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</p>
                        <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-white);">${valorFormatado}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Erro ao carregar histórico baseado em listas:', err.message);
        container.innerHTML = `<div class="empty-state-message">Erro ao carregar dados.</div>`;
    }
}

// 2. Busca e Renderiza as Notas Escaneadas na Home
async function carregarNotasEscaneadas() {
    const container = document.getElementById('notas-container');
    if (!container) return;

    try {
        const { data: notas, error } = await _supabase
            .from('notas_escaneadas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!notas || notas.length === 0) {
            container.innerHTML = `
                <div class="empty-state-message">
                    Nenhuma nota encontrada por aqui. Que tal <a href="escanear.html">escanear sua primeira nota</a>?
                </div>
            `;
            return;
        }

        container.innerHTML = notas.map(nota => `
            <div class="receipt-card">
                <div class="receipt-image" style="background-image: url('${nota.foto_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300'}');"></div>
                <div class="receipt-info">
                    <h3>${nota.estabelecimento}</h3>
                    <p class="time-ago">${nota.tempo_atras}</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Erro ao carregar notas:', err.message);
        container.innerHTML = `<div class="empty-state-message">Erro ao carregar notas.</div>`;
    }
}

// Inicializa a checagem ao carregar a Home
document.addEventListener('DOMContentLoaded', checkUserSession);