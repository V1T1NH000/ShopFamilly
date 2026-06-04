const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let listaIdAtual = null;
let itemIdSelecionadoParaEditar = null;

async function checkSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    listaIdAtual = urlParams.get('id');

    if (!listaIdAtual) {
        window.location.href = 'listas.html';
        return;
    }

    configurarEventosPopUp();
    buscarInfoLista();
    carregarItensDaLista();
}

async function buscarInfoLista() {
    const { data, error } = await _supabase
        .from('listas_compras')
        .select('nome_lista')
        .eq('id', listaIdAtual)
        .single();

    if (!error && data) {
        document.getElementById('nome-lista-titulo').textContent = data.nome_lista;
    }
}

async function carregarItensDaLista() {
    const container = document.getElementById('itens-lista-container');
    if (!container) return;

    try {
        const { data: itens, error } = await _supabase
            .from('itens_lista')
            .select('*')
            .eq('lista_id', listaIdAtual)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!itens || itens.length === 0) {
            container.innerHTML = `<div class="empty-state-message">Sua lista está vazia! Adicione itens acima.</div>`;
            atualizarRodapeTotal(0, 0);
            return;
        }

        let somaTotalGeral = 0;
        let totalItensContagem = itens.length;

        itens.forEach(item => {
            const multiplicador = parseFloat(item.quantidade) || 1;
            const valorUnitario = item.valor_unitario || 0;
            somaTotalGeral += (multiplicador * valorUnitario);
        });

        atualizarRodapeTotal(somaTotalGeral, totalItensContagem);

        const itensAgrupados = itens.reduce((grupos, item) => {
            const cat = item.categoria || 'Outros';
            if (!grupos[cat]) grupos[cat] = [];
            grupos[cat].push(item);
            return grupos;
        }, {});

        container.innerHTML = Object.keys(itensAgrupados).map(cat => `
            <div class="categoria-group-box">
                <div class="categoria-group-title">${cat}</div>
                ${itensAgrupados[cat].map(item => {
                    const multiplicador = parseFloat(item.quantidade) || 1;
                    const valorUnitario = item.valor_unitario || 0;
                    const valorTotalItem = multiplicador * valorUnitario;

                    const precoExibicao = valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const totalExibicao = valorTotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const qtdExibicao = item.quantidade || '1';
                    
                    return `
                    <div class="item-lista-row ${item.comprado ? 'comprado' : ''}">
                        <div class="item-text-container" onclick="alternarStatusComprado('${item.id}', ${item.comprado})">
                            <i class="${item.comprado ? 'fas fa-check-circle' : 'far fa-circle'}" style="color: ${item.comprado ? 'var(--primary-blue)' : '#475569'};"></i>
                            <div style="display: flex; flex-direction: column;">
                                <span>${item.nome_item}</span>
                                <span class="item-meta-info">Qtd: ${qtdExibicao} • Unid: ${precoExibicao} • <strong style="color: var(--text-white);">Total: ${totalExibicao}</strong></span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <button class="btn-remover-item-lista" style="color: var(--primary-blue);" onclick="abrirModalItem('${item.id}', '${item.nome_item}', '${qtdExibicao}', '${valorUnitario}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn-remover-item-lista" onclick="removerItemLista('${item.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `).join('');

    } catch (err) {
        console.error('Erro ao buscar itens:', err.message);
    }
}

function atualizarRodapeTotal(valorTotal, totalItens) {
    document.getElementById('total-itens-count').textContent = `${totalItens} ${totalItens === 1 ? 'item adicionado' : 'itens adicionados'}`;
    document.getElementById('total-lista-preco').textContent = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Escuta os inputs do pop-up para calcular em tempo real enquanto o usuário digita
function configurarEventosPopUp() {
    const calcularTotalNoModal = () => {
        const qtd = parseFloat(document.getElementById('modal-item-qtd').value) || 0;
        const valor = parseFloat(document.getElementById('modal-item-valor').value) || 0;
        const total = qtd * valor;
        document.getElementById('modal-item-total-preview').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    document.getElementById('modal-item-qtd').oninput = calcularTotalNoModal;
    document.getElementById('modal-item-valor').oninput = calcularTotalNoModal;
}

function abrirModalItem(id, nome, qtd, valor) {
    itemIdSelecionadoParaEditar = id;
    document.getElementById('details-modal-title').textContent = nome;
    document.getElementById('modal-item-qtd').value = qtd;
    document.getElementById('modal-item-valor').value = valor;
    
    // Calcula o total inicial ao abrir o pop-up
    const totalInicial = (parseFloat(qtd) || 0) * (parseFloat(valor) || 0);
    document.getElementById('modal-item-total-preview').textContent = totalInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    document.getElementById('item-details-modal').classList.add('show');
}

function fecharModalItem() {
    document.getElementById('item-details-modal').classList.remove('show');
    itemIdSelecionadoParaEditar = null;
}

async function salvarDetalhesDoItem() {
    if (!itemIdSelecionadoParaEditar) return;

    const qtd = document.getElementById('modal-item-qtd').value.trim() || '1';
    const valor = parseFloat(document.getElementById('modal-item-valor').value) || 0;

    try {
        const { error } = await _supabase
            .from('itens_lista')
            .update({ quantidade: qtd, valor_unitario: valor })
            .eq('id', itemIdSelecionadoParaEditar);

        if (error) throw error;

        fecharModalItem();
        carregarItensDaLista();
    } catch (err) {
        alert('Erro ao atualizar valores: ' + err.message);
    }
}

async function adicionarItemNoBanco() {
    const inputNome = document.getElementById('input-item-nome');
    const selectCat = document.getElementById('select-item-categoria');

    const nome = inputNome.value.trim();
    const categoria = selectCat.value;

    if (!nome) {
        alert("Por favor, digite o nome do item!");
        return;
    }

    try {
        const { error } = await _supabase
            .from('itens_lista')
            .insert([{ lista_id: listaIdAtual, nome_item: nome, categoria: categoria }]);

        if (error) throw error;

        inputNome.value = '';
        selectCat.value = 'Outros';
        carregarItensDaLista();

    } catch (err) {
        alert('Erro ao adicionar item: ' + err.message);
    }
}

async function alternarStatusComprado(itemId, statusAtual) {
    try {
        const { error } = await _supabase
            .from('itens_lista')
            .update({ comprado: !statusAtual })
            .eq('id', itemId);

        if (error) throw error;
        carregarItensDaLista();
    } catch (err) {
        console.error(err.message);
    }
}

async function removerItemLista(itemId) {
    try {
        const { error } = await _supabase
            .from('itens_lista')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
        carregarItensDaLista();
    } catch (err) {
        console.error(err.message);
    }
}

document.addEventListener('DOMContentLoaded', checkSession);