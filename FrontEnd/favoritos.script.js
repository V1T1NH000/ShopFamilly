const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de controle para o envio do favorito para a lista de compras
let itemFavoritoSelecionado = null;
let listasDisponiveis = [];

async function checkSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    carregarFavoritos();
    buscarListasDoUsuario(); // Deixa as listas engatilhadas no fundo
}

async function carregarFavoritos() {
    const container = document.getElementById('favoritos-container');
    if (!container) return;

    try {
        const { data: favs, error } = await _supabase
            .from('favoritos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!favs || favs.length === 0) {
            container.innerHTML = `
                <div class="empty-state-message" style="grid-column: span 2;">
                    Sua lista está vazia! Que tal <a href="mais_compras.html">explorar os mais comprados</a> para favoritar itens?
                </div>
            `;
            return;
        }

        // Renderiza os cards com o NOVO botão de enviar para lista (+)
        container.innerHTML = favs.map(item => {
            // Transforma o objeto do item em String segura para passar na função do clique
            const itemString = JSON.stringify(item).replace(/'/g, "\\'");

            return `
                <div class="product-card" style="width: 100%; min-width: unset; height: auto; padding-bottom: 10px;">
                    <div class="product-image" style="background-image: url('${item.foto_url || 'https://images.unsplash.com/photo-1598170845058-32b996a67376?q=80&w=150'}'); height: 85px;"></div>
                    <div class="product-info">
                        <h3>${item.nome}</h3>
                        <p class="store-name">(${item.loja || 'Geral'})</p>
                        <p class="weight">${item.peso || ''}</p>
                    </div>
                    <div class="price-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px; margin-top: auto;">
                        <span class="product-price" style="font-weight: bold; color: var(--text-white);">${item.preco || 'R$ 0,00'}</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="add-to-list-btn" onclick='abrirModalSelecao(${itemString})' title="Adicionar à uma lista" style="background: var(--primary-blue, #2563eb); border: none; color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="bookmark-btn" onclick="removerFavorito('${item.id}')" title="Remover dos Favoritos" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Erro ao buscar favoritos:', err.message);
        container.innerHTML = `<div class="empty-state-message" style="grid-column: span 2;">Erro ao carregar favoritos.</div>`;
    }
}

// Busca as listas da tabela listas_compras para preencher o select do modal
async function buscarListasDoUsuario() {
    try {
        const { data: listas, error } = await _supabase
            .from('listas_compras')
            .select('id, nome_lista')
            .order('created_at', { ascending: false });

        if (error) throw error;
        listasDisponiveis = listas || [];
    } catch (err) {
        console.error('Erro ao buscar listas para vínculo:', err.message);
    }
}

// Abre o Pop-up salvando as informações do item selecionado
function abrirModalSelecao(itemObj) {
    if (listasDisponiveis.length === 0) {
        alert("Você precisa criar pelo menos uma lista na aba 'Suas Listas' antes de adicionar itens!");
        return;
    }

    itemFavoritoSelecionado = itemObj;
    const select = document.getElementById('select-lista-destino');
    
    // Alimenta o select com as listas reais do banco
    select.innerHTML = listasDisponiveis.map(l => `<option value="${l.id}">${l.nome_lista}</option>`).join('');
    
    document.getElementById('lista-select-modal').classList.add('show');
}

function fecharModalSelecao() {
    document.getElementById('lista-select-modal').classList.remove('show');
    itemFavoritoSelecionado = null;
}

// Dispara o INSERT real na tabela 'itens_lista'
async function confirmarEnvioParaLista() {
    if (!itemFavoritoSelecionado) return;

    const listaIdDestino = document.getElementById('select-lista-destino').value;
    
    // Função inteligente para deduzir a categoria com base no nome do produto favorito
    const nomeMinusculo = itemFavoritoSelecionado.nome.toLowerCase();
    let categoriaDeduzida = "Outros";

    if (nomeMinusculo.includes("carne") || nomeMinusculo.includes("picanha") || nomeMinusculo.includes("alcatra") || nomeMinusculo.includes("bife")) {
        categoriaDeduzida = "Carnes";
    } else if (nomeMinusculo.includes("frango") || nomeMinusculo.includes("sobrecoxa") || nomeMinusculo.includes("peito")) {
        categoriaDeduzida = "Frangos";
    } else if (nomeMinusculo.includes("limpeza") || nomeMinusculo.includes("sabão") || nomeMinusculo.includes("detergente") || nomeMinusculo.includes("amaciante") || nomeMinusculo.includes("desinfetante")) {
        categoriaDeduzida = "Produtos de Limpeza";
    } else if (nomeMinusculo.includes("alface") || nomeMinusculo.includes("tomate") || nomeMinusculo.includes("batata") || nomeMinusculo.includes("vegetal")) {
        categoriaDeduzida = "Vegetais";
    } else if (nomeMinusculo.includes("maçã") || nomeMinusculo.includes("banana") || nomeMinusculo.includes("fruta") || nomeMinusculo.includes("morango")) {
        categoriaDeduzida = "Frutas";
    } else if (nomeMinusculo.includes("pão") || nomeMinusculo.includes("bisnaguinha")) {
        categoriaDeduzida = "Pão";
    }

    // Trata o preço string (ex: "R$ 15,90") para virar número limpo (15.90) se necessário
    let valorLimpo = 0;
    if (itemFavoritoSelecionado.preco) {
        valorLimpo = parseFloat(itemFavoritoSelecionado.preco.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
    }

    // Extrai uma quantidade básica do campo peso (ex: se for "2 unidades" vira 2, se não der vira 1)
    let qtdLimpa = "1";
    if (itemFavoritoSelecionado.peso) {
        const apenasNumeros = itemFavoritoSelecionado.peso.match(/\d+/);
        if (apenasNumeros) qtdLimpa = apenasNumeros[0];
    }

    try {
        // Envia para a tabela de itens reais!
        const { error } = await _supabase
            .from('itens_lista')
            .insert([{
                lista_id: listaIdDestino,
                nome_item: itemFavoritoSelecionado.nome,
                categoria: categoriaDeduzida,
                comprado: false,
                quantidade: qtdLimpa,
                valor_unitario: valorLimpo
            }]);

        if (error) throw error;

        alert(`"${itemFavoritoSelecionado.nome}" adicionado com sucesso à sua lista!`);
        fecharModalSelecao();

    } catch (err) {
        alert('Erro ao enviar item para a lista: ' + err.message);
    }
}

async function removerFavorito(idFavorito) {
    try {
        const { error } = await _supabase
            .from('favoritos')
            .delete()
            .eq('id', idFavorito);

        if (error) throw error;
        carregarFavoritos();
    } catch (err) {
        alert('Erro ao remover dos favoritos: ' + err.message);
    }
}

document.addEventListener('DOMContentLoaded', checkSession);