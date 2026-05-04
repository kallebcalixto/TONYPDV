let totalVendas = 0;
let totalInsumos = 0;
let totalFiados = 0;
let editandoId = null;

// ATUALIZAR SENHA DO CAIXA
function atualizarSenhaCaixa() {
    const novaSenha = document.getElementById('senhaCaixa').value;
    if (novaSenha.trim() !== "") {
        database.ref('configuracoes').update({ senhaCaixa: novaSenha }).then(() => {
            alert("Senha atualizada! ✅");
            document.getElementById('senhaCaixa').value = "";
        });
    }
}

// SALVAR PRODUTO
function salvarProduto() {
    const nome = document.getElementById('nomeProd').value;
    const preco = parseFloat(document.getElementById('precoProd').value);
    const estoque = parseInt(document.getElementById('estoqueProd').value) || 0;
    const foto = document.getElementById('fotoProd').value;

    if (nome && preco) {
        if (editandoId) {
            database.ref('produtos/' + editandoId).update({ nome, preco, estoque, foto });
            editandoId = null;
        } else {
            database.ref('produtos').push({ nome, preco, estoque, foto });
        }
        limparCampos(['nomeProd', 'precoProd', 'estoqueProd', 'fotoProd']);
    }
}

// MONITOR DE ESTOQUE
database.ref('produtos').on('value', snapshot => {
    const body = document.getElementById('lista-corpo');
    body.innerHTML = "";
    const dados = snapshot.val();
    if (dados) {
        Object.keys(dados).forEach(id => {
            const p = dados[id];
            const corEstoque = p.estoque < 5 ? 'color:red; font-weight:bold;' : '';
            body.innerHTML += `<tr><td>${p.nome}</td><td>R$ ${p.preco.toFixed(2)}</td><td style="${corEstoque}">${p.estoque} un</td>
                <td><button onclick="prepararEdicao('${id}', '${p.nome}', ${p.preco}, ${p.estoque}, '${p.foto}')">Editar</button>
                <button onclick="removerItem('produtos/${id}')">Excluir</button></td></tr>`;
        });
    }
});

// MONITOR DE MENSALISTAS (FIADO)
database.ref('mensalistas').on('value', snapshot => {
    totalFiados = 0;
    const body = document.getElementById('lista-fiados-body');
    body.innerHTML = "";
    const dados = snapshot.val();
    if (dados) {
        Object.keys(dados).forEach(nome => {
            const saldo = dados[nome].saldo_devedor;
            totalFiados += saldo;
            body.innerHTML += `<tr><td>${nome}</td><td>R$ ${saldo.toFixed(2)}</td>
                <td><button onclick="receberFiado('${nome}', ${saldo})" style="color:var(--success)">Pagar / Baixar</button></td></tr>`;
        });
    }
    calcFinanceiro();
});

// QUANDO O CLIENTE PAGA O FIADO
function receberFiado(nome, valor) {
    if (confirm(`Confirmar recebimento de R$ ${valor.toFixed(2)} de ${nome}?`)) {
        // 1. Remove o débito do cliente
        database.ref('mensalistas/' + nome).remove();
        // 2. Registra como uma venda em dinheiro real
        database.ref('vendas').push({
            total: valor,
            data: new Date().toLocaleString(),
            metodo: 'Recebimento de Mensalista'
        }).then(() => alert("Pagamento registrado no caixa! ✅"));
    }
}

// LÓGICA FINANCEIRA
database.ref('vendas').on('value', s => {
    totalVendas = 0;
    if (s.val()) Object.values(s.val()).forEach(v => totalVendas += parseFloat(v.total));
    calcFinanceiro();
});

database.ref('insumos').on('value', s => {
    totalInsumos = 0;
    if (s.val()) Object.values(s.val()).forEach(i => totalInsumos += parseFloat(i.valor));
    calcFinanceiro();
});

function calcFinanceiro() {
    document.getElementById('total-vendas').innerText = "R$ " + totalVendas.toFixed(2);
    document.getElementById('total-fiados').innerText = "R$ " + totalFiados.toFixed(2);
    document.getElementById('total-insumos').innerText = "R$ " + totalInsumos.toFixed(2);
    document.getElementById('total-lucro').innerText = "R$ " + (totalVendas - totalInsumos).toFixed(2);
}

function salvarInsumo() {
    const nome = document.getElementById('nomeInsumo').value;
    const valor = parseFloat(document.getElementById('valorInsumo').value);
    if (nome && valor) {
        database.ref('insumos').push({ nome, valor });
        limparCampos(['nomeInsumo', 'valorInsumo']);
    }
}

function prepararEdicao(id, nome, preco, estoque, foto) {
    editandoId = id;
    document.getElementById('nomeProd').value = nome;
    document.getElementById('precoProd').value = preco;
    document.getElementById('estoqueProd').value = estoque;
    document.getElementById('fotoProd').value = foto;
}

function removerItem(caminho) { if (confirm("Deseja remover?")) database.ref(caminho).remove(); }
function limparCampos(ids) { ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); }

function zerarMes() {
    if (confirm("⚠️ Zerar apenas vendas e gastos? (Os fiados pendentes serão mantidos)")) {
        database.ref('vendas').remove().then(() => database.ref('insumos').remove());
        alert("Mês zerado! ✅");
    }
}
