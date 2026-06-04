const SUPABASE_URL = "https://xfediknteojdombkcteu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWRpa250ZW9qZG9tYmtjdGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTQ2OTgsImV4cCI6MjA5NTQ5MDY5OH0.7Q4xw9Hc9e3yvqbkTSNcnwG_mT9tOHheF_U3PE1-sdA";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Categorias fixas que SEMPRE vão aparecer na tela
const categoriasFallback = [
    { nome: "Carnes", sub: "Congelados", icone: "https://cdn-icons-png.flaticon.com/512/1046/1046769.png" },
    { nome: "Vegetais", sub: "Hortifruti", icone: "https://cdn-icons-png.flaticon.com/512/13988/13988686.png" },
    { nome: "Frutas", sub: "Naturais", icone: "https://cdn-icons-png.flaticon.com/512/415/415733.png" },
    { nome: "Pão", sub: "Naturais", icone: "https://cdn-icons-png.flaticon.com/512/3348/3348101.png" },
    { nome: "Lanches", sub: "Petiscos", icone: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png" },
    { nome: "Padaria", sub: "Farinhas e Massas", icone: "https://cdn-icons-png.flaticon.com/512/992/992747.png" },
    { nome: "Laticínios e Doces", sub: "Na loja", icone: "https://cdn-icons-png.flaticon.com/512/12505/12505632.png" },
    { nome: "Frangos", sub: "Congelados", icone: "https://cdn-icons-png.flaticon.com/512/821/821023.png" },
    { nome: "Produtos de Limpeza", sub: "Casa e Lavanderia", icone: "https://cdn-icons-png.flaticon.com/512/2553/2553642.png" } 
];

async function checkSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    carregarCategorias();
}

function carregarCategorias() {
    renderizarGrid(categoriasFallback);
}

function renderizarGrid(lista) {
    const grid = document.getElementById('categorias-grid');
    if (!grid) return;

    grid.innerHTML = lista.map(cat => {
        return `
            <div class="category-card" onclick="abrirCategoria('${cat.nome}')">
                <div class="category-info">
                    <span class="category-name">${cat.nome}</span>
                    <span class="category-sub">${cat.sub}</span>
                </div>
                <div class="category-icon-container">
                    <img src="${cat.icone}" alt="${cat.nome}">
                </div>
            </div>
        `;
    }).join('');
}

function abrirCategoria(nomeCategoria) {
    window.location.href = `categoria.html?tipo=${encodeURIComponent(nomeCategoria)}`;
}

document.addEventListener('DOMContentLoaded', checkSession);