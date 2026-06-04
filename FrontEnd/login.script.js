const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Se o usuário JÁ estiver logado e entrar na tela de login, jogamos ele para a Home automaticamente
async function verificarUsuarioLogado() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Lógica do formulário de Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        try {
            const { data, error } = await _supabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) throw error;

            alert('Login efetuado com sucesso!');
            window.location.href = 'index.html'; 
        } catch (error) {
            alert('Erro ao entrar: ' + error.message);
        }
    });
}

// Lógica do formulário de Cadastro
const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
    cadastroForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const nome = document.getElementById('cad-nome').value;
        const email = document.getElementById('cad-email').value;
        const familia = document.getElementById('cad-familia').value;
        const senha = document.getElementById('cad-senha').value;
        const confirmar = document.getElementById('cad-confirmar').value;

        if (senha !== confirmar) {
            alert('As senhas não coincidem!');
            return false;
        }

        try {
            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: senha,
                options: {
                    data: {
                        nome_completo: nome,
                        nome_familia: familia
                    }
                }
            });

            if (error) throw error;

            alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
            window.location.href = 'login.html';
        } catch (error) {
            alert('Erro no cadastro: ' + error.message);
        }
    });
}

// Lógica de Esqueci Senha
const esqueciSenhaForm = document.getElementById('esqueciSenhaForm');
if (esqueciSenhaForm) {
    esqueciSenhaForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('recuperar-email').value;
        const confirmarEmail = document.getElementById('recuperar-confirmar-email').value;

        if (email !== confirmarEmail) {
            alert('Os e-mails não coincidem!');
            return;
        }

        try {
            const { data, error } = await _supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/redefinir-senha.html' 
            });

            if (error) throw error;

            alert('Link de recuperação enviado para o seu e-mail!');
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    });
}

// Login Social
async function loginSocial(provedor) {
    try {
        const options = {
            redirectTo: window.location.origin + '/index.html'
        };

        if (provedor === 'facebook') {
            options.scopes = 'public_profile';
        }

        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: provedor,
            options: options
        });
        
        if (error) throw error;
    } catch (error) {
        alert('Erro ao conectar com ' + provedor + ': ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', verificarUsuarioLogado);