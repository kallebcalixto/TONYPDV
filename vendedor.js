let carrinho = [];
let senhaMestra = "";

// BUSCA SENHA ATUALIZADA
database.ref('configuracoes/senhaCaixa').on('value', snapshot => {
    senhaMestra = snapshot.val();
});

// CARREGA PRODUTOS NA GRADE
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
                    onclick="${!esgotado ? `add('${id}', '${p.nome}', ${p.preco})` : "alert('Esgotado!')"}">
                    <img src="${p.foto || 'https://via.placeholder.com/150'}">
                    <h4>${p.nome}</h4>
                    <span class="preco">R$ ${p.preco.toFixed(2)}</span>
                    <small>Estoque: ${p.estoque}</small>
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
    const totalCaixa = document.getElementById('total-caixa');
    let t = 0;
    lista.innerHTML = carrinho.map(i => {
        t += i.preco;
        return `<div class="item-linha"><span>${i.nome}</span><b>R$ ${i.preco.toFixed(2)}</b></div>`;
    }).join('');
    totalCaixa.innerText = t.toFixed(2);
}

// FINALIZAR VENDA
function finalizar() {
    if (carrinho.length === 0) return alert("Carrinho vazio!");

    const metodo = prompt("Escolha o método:\n1 - Dinheiro / Pix\n2 - Fiado (Mensalista)");
    if (metodo !== "1" && metodo !== "2") return alert("Opção inválida!");

    let nomeCliente = "";
    if (metodo === "2") {
        nomeCliente = prompt("Digite o nome do cliente:");
        if (!nomeCliente) return alert("Nome obrigatório para fiado!");
    }

    if (prompt("Digite a Senha do Caixa:") === senhaMestra) {
        const totalVenda = parseFloat(document.getElementById('total-caixa').innerText);
        
        // SE FOR DINHEIRO (1), VAI PARA VENDAS. SE FOR FIADO (2), VAI PARA MENSALISTAS.
        if (metodo === "1") {
            database.ref('vendas').push({ total: totalVenda, data: new Date().toLocaleString() });
        } else {
            const refM = database.ref('mensalistas/' + nomeCliente + '/saldo_devedor');
            refM.transaction(atual => (atual || 0) + totalVenda);
        }

        // BAIXA NO ESTOQUE (SEMPRE OCORRE)
        carrinho.forEach(item => {
            database.ref('produtos/' + item.id).transaction(p => {
                if (p) p.estoque = (p.estoque || 0) - 1;
                return p;
            });
        });

        alert("Concluído! ✅");
        carrinho = [];
        render();
    } else {
        alert("Senha incorreta!");
    }
}

function limpar() { if(confirm("Limpar tudo?")) { carrinho = []; render(); } }
