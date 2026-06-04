const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de controle do modal ativo
let modalActionContext = null; 
let idListaSelecionada = null;

async function checkSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    configurarEventosModal();
    carregarListasCompras();
}

async function carregarListasCompras() {
    const container = document.getElementById('listas-container');
    if (!container) return;

    try {
        const { data: listas, error } = await _supabase
            .from('listas_compras')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!listas || listas.length === 0) {
            container.classList.add('empty-state');
            container.innerHTML = `
                <button class="btn-criar-lista" onclick="abrirModalCriar()">
                    + Criar Lista
                </button>
            `;
            return;
        }

        container.classList.remove('empty-state');
        
        let htmlCards = listas.map(lista => `
            <div class="lista-item-card">
                <div class="lista-item-title" onclick="abrirDetalhesLista('${lista.id}')">
                    <i class="fas fa-shopping-basket" style="color: var(--primary-blue); margin-right: 10px;"></i>
                    ${lista.nome_lista}
                </div>
                <button class="btn-deletar-lista" onclick="abrirModalDeletar('${lista.id}', '${lista.nome_lista}')" title="Excluir Lista">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = `
            <button class="btn-criar-lista" style="margin-bottom: 10px; width: 100%; padding: 10px 0;" onclick="abrirModalCriar()">
                + Criar Nova Lista
            </button>
            ${htmlCards}
        `;

    } catch (err) {
        console.error('Erro ao carregar listas:', err.message);
    }
}

// ================= LÓGICA E GERENCIAMENTO DO POP-UP =================

function configurarEventosModal() {
    document.getElementById('modal-cancel-btn').onclick = fecharModal;
    document.getElementById('modal-confirm-btn').onclick = processarConfirmacaoModal;
}

function abrirModalCriar() {
    modalActionContext = 'criar';
    
    document.getElementById('modal-title').textContent = 'Criar Nova Lista';
    document.getElementById('modal-subtitle').textContent = 'Digite o nome da sua lista abaixo:';
    
    const input = document.getElementById('modal-input');
    input.style.display = 'block';
    input.value = '';
    
    document.getElementById('custom-modal').classList.add('show');
}

function abrirModalDeletar(idLista, nomeLista) {
    modalActionContext = 'deletar';
    idListaSelecionada = idLista;
    
    document.getElementById('modal-title').textContent = 'Excluir Lista';
    document.getElementById('modal-subtitle').textContent = `Tem certeza que deseja apagar a lista "${nomeLista}"?`;
    
    document.getElementById('modal-input').style.display = 'none'; // Esconde o input na exclusão
    
    document.getElementById('custom-modal').classList.add('show');
}

function fecharModal() {
    document.getElementById('custom-modal').classList.remove('show');
    modalActionContext = null;
    idListaSelecionada = null;
}

function processarConfirmacaoModal() {
    if (modalActionContext === 'criar') {
        executarCriarLista();
    } else if (modalActionContext === 'deletar') {
        executarDeletarLista();
    }
}

async function executarCriarLista() {
    const nomeDaLista = document.getElementById('modal-input').value;
    
    if (!nomeDaLista || nomeDaLista.trim() === "") {
        alert("Por favor, digite um nome válido.");
        return;
    }

    try {
        const { data: { user } } = await _supabase.auth.getUser();
        const { error } = await _supabase
            .from('listas_compras')
            .insert([{ user_id: user.id, nome_lista: nomeDaLista.trim() }]);

        if (error) throw error;

        fecharModal();
        carregarListasCompras();
    } catch (err) {
        alert('Erro ao criar lista: ' + err.message);
    }
}

async function executarDeletarLista() {
    if (!idListaSelecionada) return;

    try {
        const { error } = await _supabase
            .from('listas_compras')
            .delete()
            .eq('id', idListaSelecionada);

        if (error) throw error;

        fecharModal();
        carregarListasCompras();
    } catch (err) {
        alert('Erro ao deletar lista: ' + err.message);
    }
}

function abrirDetalhesLista(idLista) {
    window.location.href = `detalhes_lista.html?id=${idLista}`;
}
document.addEventListener('DOMContentLoaded', checkSession);