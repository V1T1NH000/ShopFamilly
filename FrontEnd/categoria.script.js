const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Banco de imagens específicas para cada categoria
const imagensCategorias = {
    "Carnes": "https://cdn-icons-png.flaticon.com/512/1046/1046769.png",
    "Vegetais": "https://cdn-icons-png.flaticon.com/512/13988/13988686.png",
    "Frutas": "https://cdn-icons-png.flaticon.com/512/415/415733.png",
    "Pão": "https://cdn-icons-png.flaticon.com/512/3348/3348101.png",
    "Lanches": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
    "Padaria": "https://cdn-icons-png.flaticon.com/512/992/992747.png",
    "Laticínios e Doces": "https://cdn-icons-png.flaticon.com/512/12505/12505632.png",
    "Frangos": "https://cdn-icons-png.flaticon.com/512/821/821023.png",
    "Produtos de Limpeza": "https://cdn-icons-png.flaticon.com/512/2553/2553642.png"
};


const imagemPadrao = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200";

async function checkSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    inicializarCategoria();
}

async function inicializarCategoria() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaNome = urlParams.get('tipo');

    if (!categoriaNome || categoriaNome === 'undefined') {
        console.error('Nome da categoria não foi encontrado na URL.');
        window.location.href = 'mais_compras.html';
        return;
    }

    const tituloElemento = document.getElementById('category-title');
    if (tituloElemento) {
        tituloElemento.textContent = categoriaNome;
    }

    const container = document.getElementById('produtos-container');
    if (!container) return;

    try {
        const { data: produtos, error } = await _supabase
            .from('itens_lista')
            .select('*')
            .eq('categoria', categoriaNome);

        if (error) throw error;

        if (!produtos || produtos.length === 0) {
            container.innerHTML = `
                <div class="empty-state-message" style="grid-column: span 2;">
                    Nenhum produto cadastrado em ${categoriaNome} ainda.
                </div>
            `;
            return;
        }

        const fotoDaCategoria = imagensCategorias[categoriaNome] || imagemPadrao;

        container.innerHTML = produtos.map(prod => {
            const estiloComprado = prod.comprado ? 'opacity: 0.5; text-decoration: line-through;' : '';
            const textoQuantidade = prod.quantidade ? `Qtd: ${prod.quantidade}` : '1';
            
            // Formatando o preço para exibir bonito no card do favorito
            const precoFormatado = prod.valor_unitario 
                ? prod.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : 'R$ 0,00';

            // Escapa o objeto para passar com segurança no clique do botão
            const prodString = JSON.stringify(prod).replace(/'/g, "\\'");

            return `
                <div class="product-card" style="width: 100%; min-width: unset; height: auto; padding-bottom: 10px; ${estiloComprado}">
                    <div class="product-image" style="background-image: url('${fotoDaCategoria}'); height: 95px;"></div>
                    <div class="product-info">
                        <h3>${prod.nome_item}</h3>
                        <p class="weight" style="margin-top: 2px;">Qtd: ${textoQuantidade}</p>
                    </div>
                    <div class="price-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0 10px; margin-top: auto;">
                        <span class="product-price" style="font-weight: bold; color: var(--text-white);">${precoFormatado}</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="favorite-btn" onclick='adicionarAosFavoritos(${prodString}, "${fotoDaCategoria}")' title="Favoritar Item" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem;">
                                <i class="far fa-heart"></i>
                            </button>
                            <button class="add-btn" style="position: static; margin: 0;">${prod.comprado ? '✓' : '+'}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Erro ao carregar produtos:', err.message);
        container.innerHTML = `<div class="empty-state-message" style="grid-column: span 2;">Erro ao carregar os itens.</div>`;
    }
}

// ================= NOVA FUNÇÃO: SALVA O ITEM NA TABELA DE FAVORITOS =================
async function adicionarAosFavoritos(produtoObj, fotoUrl) {
    // Formata os dados para o padrão que a sua tabela 'favoritos' exige
    const precoTexto = produtoObj.valor_unitario 
        ? produtoObj.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
        : 'R$ 0,00';
        
    const pesoTexto = produtoObj.quantidade ? `${produtoObj.quantidade} un` : '1 un';

    try {
        // Envia para o Supabase
        const { error } = await _supabase
            .from('favoritos')
            .insert([{
                nome: produtoObj.nome_item,
                loja: "Geral", // Valor padrão já que a tabela itens_lista não tem coluna loja
                peso: pesoTexto,
                preco: precoTexto,
                foto_url: fotoUrl
            }]);

        if (error) throw error;

        alert(`"${produtoObj.nome_item}" foi adicionado aos seus favoritos! ❤️`);

    } catch (err) {
        // Tratamento caso dê erro ou o item já seja favorito (se você tiver uma constraint única)
        alert('Erro ao favoritar item: ' + err.message);
    }
}

document.addEventListener('DOMContentLoaded', checkSession);