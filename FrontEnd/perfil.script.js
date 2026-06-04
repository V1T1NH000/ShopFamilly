const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSession() {
    try {
        const { data: { session }, error } = await _supabase.auth.getSession();
        
        if (error || !session) {
            window.location.href = 'login.html';
            return;
        }

        renderizarDadosUsuario(session.user);
        configurarBotaoLogout();
        configurarFormularioSenha();

    } catch (err) {
        console.error('Erro ao verificar sessão:', err.message);
        window.location.href = 'login.html';
    }
}

function renderizarDadosUsuario(user) {
    const nomes = document.querySelectorAll('.user-profile-name');
    const emails = document.querySelectorAll('.user-profile-email');

    emails.forEach(el => el.textContent = user.email);

    let nomeFinal = "Usuário";
    if (user.user_metadata && user.user_metadata.full_name) {
        nomeFinal = user.user_metadata.full_name;
    } else if (user.user_metadata && user.user_metadata.nome_completo) {
        nomeFinal = user.user_metadata.nome_completo;
    } else {
        const primeiraParteEmail = user.email.split('@')[0];
        const nomeFormatado = primeiraParteEmail.split('.')[0].split('_')[0];
        nomeFinal = nomeFormatado.charAt(0).toUpperCase() + nomeFormatado.slice(1);
    }

    nomes.forEach(el => el.textContent = nomeFinal);
}

// Lógica universal para expandir os Accordions (Conta e Configurações)
function toggleAccordion(idSubmenu, cardElemento) {
    const submenu = document.getElementById(idSubmenu);
    const arrow = cardElemento.querySelector('.arrow-icon');
    
    if (submenu.classList.contains('show')) {
        submenu.classList.remove('show');
        if (arrow) arrow.style.transform = "rotate(0deg)";
    } else {
        submenu.classList.add('show');
        if (arrow) arrow.style.transform = "rotate(180deg)";
    }
}

// Navegação instantânea de views
function mudarView(idNovaView) {
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
    });
    const novaView = document.getElementById(idNovaView);
    if (novaView) {
        novaView.classList.add('active');
    }
}

// ================= FUNÇÃO: LIMPAR HISTÓRICO DE BUSCA =================
function limparHistoricoBusca() {
    const confirmar = confirm("Deseja mesmo limpar seu histórico de buscas recentes no app?");
    if (!confirmar) return;

    // Remove do localStorage as chaves usadas para guardar buscas
    localStorage.removeItem('historico_buscas');
    localStorage.removeItem('recent_searches');

    alert("Histórico de busca limpo com sucesso! 🧹");
}

// ================= FUNÇÃO: ALTERAR SENHA DIRETAMENTE PELO APP =================
function configurarFormularioSenha() {
    const formSenha = document.getElementById('form-alterar-senha');
    if (!formSenha) return;

    formSenha.onsubmit = async function(e) {
        e.preventDefault();
        const novaSenha = document.getElementById('input-nova-senha').value;

        if (novaSenha.length < 6) {
            alert("A senha deve conter no mínimo 6 caracteres!");
            return;
        }

        try {
            // Atualiza a senha do usuário ativo direto no Supabase Auth
            const { error } = await _supabase.auth.updateUser({ password: novaSenha });
            if (error) throw error;

            alert("Senha alterada com sucesso! 🎉");
            document.getElementById('input-nova-senha').value = '';
            mudarView('view-perfil-main'); // Volta para a tela principal

        } catch (err) {
            alert("Erro ao atualizar senha: " + err.message);
        }
    };
}

function configurarBotaoLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (!btnLogout) return;

    btnLogout.onclick = async function() {
        const confirmar = confirm("Tem certeza que deseja sair da sua conta?");
        if (!confirmar) return;

        try {
            await _supabase.auth.signOut();
            localStorage.clear();
            window.location.href = 'login.html';
        } catch (err) {
            alert('Erro ao sair da conta: ' + err.message);
        }
    };
}

document.addEventListener('DOMContentLoaded', checkSession);