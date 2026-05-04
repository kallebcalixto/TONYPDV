database.ref('produtos').on('value', snapshot => {
    const grade = document.getElementById('grade-produtos');
    if (!grade) return;
    grade.innerHTML = "";
    snapshot.forEach(item => {
        const p = item.val();
        if (p.estoque > 0) {
            grade.innerHTML += `
                <div class="card-item" onclick="adicionarAoCarrinho('${item.key}', '${p.nome}', ${p.preco})">
                    <img src="${p.foto || 'https://via.placeholder.com/150'}" alt="${p.nome}">
                    <h4>${p.nome}</h4>
                    <p class="preco">R$ ${p.preco.toFixed(2)}</p>
                    <small style="color:var(--text-muted)">Estoque: ${p.estoque}</small>
                </div>`;
        }
    });
});

let carrinho = [];

function adicionarAoCarrinho(id, nome, preco) {
    carrinho.push({ id, nome, preco });
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const itens = document.getElementById('itens-checkout');
    const totalTxt = document.getElementById('total-caixa');
    itens.innerHTML = "";
    let total = 0;
    carrinho.forEach((item, index) => {
        total += item.preco;
        itens.innerHTML += `
            <div class="item-linha">
                <span>${item.nome}</span>
                <span>R$ ${item.preco.toFixed(2)} 
                    <button onclick="removerDoCarrinho(${index})" style="background:none; border:none; color:red; cursor:pointer">✕</button>
                </span>
            </div>`;
    });
    totalTxt.innerText = total.toFixed(2);
}

function removerDoCarrinho(i) { carrinho.splice(i, 1); renderizarCarrinho(); }
function limpar() { carrinho = []; renderizarCarrinho(); }

async function finalizarVenda() {
    const totalVenda = parseFloat(document.getElementById('total-caixa').innerText);
    if (totalVenda <= 0) return alert("Carrinho vazio!");

    // 1. ESCOLHER TIPO
    const opcao = prompt("Escolha a opção:\n1 - Dinheiro ou Pix\n2 - Fiado Mensalista");
    if (!opcao) return;

    let clienteFiado = null;
    let metodoVenda = "";

    if (opcao === "1") {
        metodoVenda = "Dinheiro/Pix";
    } else if (opcao === "2") {
        metodoVenda = "Fiado";
        clienteFiado = prompt("DIGITE O NOME DO MENSALISTA:");
        if (!clienteFiado) return alert("Nome necessário para fiado!");
    } else {
        return alert("Opção inválida!");
    }

    // 2. SENHA DO VENDEDOR
    const senha = prompt("SENHA DO VENDEDOR PARA FINALIZAR:");
    if (!senha) return;

    const snap = await database.ref('vendedores').once('value');
    const lista = snap.val();
    let vendedorNome = null;

    if (lista) {
        for (let nome in lista) {
            if (lista[nome].senha === senha) vendedorNome = nome;
        }
    }

    if (!vendedorNome) return alert("Senha incorreta!");

    // 3. GRAVAR
    if (opcao === "1") {
        database.ref('vendas').push({
            total: totalVenda,
            vendedor: vendedorNome,
            data: new Date().toLocaleString(),
            metodo: metodoVenda
        }).then(() => concluir(vendedorNome));
    } else {
        database.ref('mensalistas/' + clienteFiado).once('value').then(s => {
            const saldo = (s.val() ? s.val().saldo_devedor : 0) + totalVenda;
            database.ref('mensalistas/' + clienteFiado).update({ saldo_devedor: saldo }).then(() => {
                concluir(vendedorNome, clienteFiado);
            });
        });
    }
}

function concluir(vendedor, cliente = null) {
    carrinho.forEach(item => {
        database.ref('produtos/' + item.id + '/estoque').transaction(a => (a || 0) - 1);
    });
    alert(cliente ? `Lançado para ${cliente}!` : `Venda concluída!\nResponsável: ${vendedor}`);
    limpar();
}
