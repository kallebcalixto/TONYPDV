let carrinho = [];
let senhaMestra = "";
const somCaixa = new Audio('https://www.soundjay.com/misc/sounds/cash-register-05.mp3');

// Monitora produtos e estoque para o vendedor[cite: 7]
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

database.ref('configuracao/senhaCaixa').on('value', s => { senhaMestra = s.val(); });

// Adiciona ao carrinho salvando o ID para garantir a baixa correta[cite: 7]
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

// FINALIZAÇÃO COM BAIXA REAL NO ESTOQUE[cite: 7]
function finalizar() {
    if (carrinho.length === 0) return;
    
    if (prompt("Senha do Caixa:") === senhaMestra) {
        somCaixa.play();
        const totalVenda = document.getElementById('total-caixa').innerText;

        // 1. Registra a venda no financeiro[cite: 7]
        database.ref('vendas').push({
            total: totalVenda,
            data: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            
            // 2. BAIXA AUTOMÁTICA VIA TRANSACTION (Garante a precisão)[cite: 7]
            carrinho.forEach(item => {
                const produtoRef = database.ref('produtos/' + item.id);
                produtoRef.transaction((produto) => {
                    if (produto) {
                        if (produto.estoque > 0) {
                            produto.estoque = produto.estoque - 1;
                        }
                    }
                    return produto;
                });
            });

            setTimeout(() => { 
                alert("Venda Concluída! O estoque foi baixado com sucesso."); 
                carrinho = []; 
                render(); 
            }, 500);
        });
    } else {
        alert("Senha incorreta!");
    }
}

function limpar() { carrinho = []; render(); }
