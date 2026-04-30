let carrinho = [];
let senhaMestra = "";
const somCaixa = new Audio('https://www.soundjay.com/misc/sounds/cash-register-05.mp3');

// BUSCA A SENHA DINÂMICA DO FIREBASE
database.ref('configuracoes/senhaCaixa').on('value', snapshot => {
    senhaMestra = snapshot.val();
});

// Monitora produtos para o vendedor[cite: 4]
database.ref('produtos').on('value', snapshot => {
    const div = document.getElementById('grade-produtos');
    div.innerHTML = "";
    const dados = snapshot.val();
    if (dados) {
        Object.keys(dados).forEach(id => {
            const p = dados[id];
            const esgotado = p.estoque <= 0;
            div.innerHTML += `
                <div class="card-item" style="${esgotado ? 'opacity:0.5; filter:grayscale(1)' : ''}" 
                    onclick="${!esgotado ? `add('${id}', '${p.nome}', ${p.preco})` : "alert('Produto esgotado!')"}">
                    <img src="${p.foto || 'https://via.placeholder.com/200x140'}">
                    <h4>${p.nome}</h4>
                    <span class="preco">R$ ${p.preco.toFixed(2)}</span>
                    <p style="font-size:11px; color:${p.estoque < 5 ? 'red' : 'gray'}">Estoque: ${p.estoque} un</p>
                </div>`;
        });
    }
});

function add(id, nome, preco) {
    carrinho.push({ id, nome, preco: parseFloat(preco) });
    render();
}

function render() {
    const lista = document.getElementById('itens-checkout');
    let t = 0;
    lista.innerHTML = carrinho.map(i => {
        t += i.preco;
        return `<div class="item-linha"><span>${i.nome}</span><b>R$ ${i.preco.toFixed(2)}</b></div>`;
    }).join('');
    document.getElementById('total-caixa').innerText = t.toFixed(2);
}

// FINALIZAÇÃO COM SENHA DINÂMICA E BAIXA DE ESTOQUE[cite: 4]
function finalizar() {
    if (carrinho.length === 0) return alert("Carrinho vazio!");
    
    if (prompt("Digite a Senha do Caixa para finalizar:") === senhaMestra) {
        somCaixa.play();
        const totalVenda = document.getElementById('total-caixa').innerText;

        database.ref('vendas').push({
            total: totalVenda,
            data: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Baixa automática no estoque via Transaction[cite: 4]
            carrinho.forEach(item => {
                database.ref('produtos/' + item.id).transaction((produto) => {
                    if (produto && produto.estoque > 0) {
                        produto.estoque -= 1;
                    }
                    return produto;
                });
            });

            setTimeout(() => { 
                alert("Venda Concluída com sucesso! ✅"); 
                carrinho = []; 
                render(); 
            }, 500);
        });
    } else {
        alert("Senha do caixa incorreta!");
    }
}

function limpar() { if(confirm("Limpar carrinho?")) { carrinho = []; render(); } }
