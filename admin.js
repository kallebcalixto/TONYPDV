let totalVendas = 0;
let totalInsumos = 0;
let totalFiados = 0;
let editandoId = null;

function salvarVendedor() {
    const nome = document.getElementById('nomeVendedor').value;
    const senha = document.getElementById('passVendedor').value;
    if (nome && senha) {
        database.ref('vendedores/' + nome).set({ senha: senha }).then(() => {
            alert("Vendedor cadastrado! ✅");
            limparCampos(['nomeVendedor', 'passVendedor']);
        });
    }
}

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

function salvarInsumo() {
    const nome = document.getElementById('nomeInsumo').value;
    const valor = parseFloat(document.getElementById('valorInsumo').value);
    if (nome && valor) {
        database.ref('insumos').push({ nome, valor }).then(() => {
            alert("Gasto registrado!");
            limparCampos(['nomeInsumo', 'valorInsumo']);
        });
    }
}

database.ref('produtos').on('value', s => {
    const body = document.getElementById('lista-corpo');
    body.innerHTML = "";
    s.forEach(item => {
        const p = item.val();
        body.innerHTML += `<tr><td>${p.nome}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.estoque} un</td>
            <td><button onclick="prepararEdicao('${item.key}', '${p.nome}', ${p.preco}, ${p.estoque}, '${p.foto}')">Editar</button>
            <button onclick="removerItem('produtos/${item.key}')">Excluir</button></td></tr>`;
    });
});

database.ref('vendas').on('value', s => {
    totalVendas = 0;
    const bodyRelatorio = document.getElementById('relatorio-vendas-body');
    bodyRelatorio.innerHTML = "";
    const lista = [];
    s.forEach(item => {
        const v = item.val();
        totalVendas += v.total;
        lista.push(v);
    });
    lista.reverse().forEach(v => {
        bodyRelatorio.innerHTML += `<tr><td>${v.data}</td><td><b>${v.vendedor || 'Sistema'}</b></td><td>R$ ${v.total.toFixed(2)}</td><td>${v.metodo}</td></tr>`;
    });
    calcFinanceiro();
});

database.ref('insumos').on('value', s => {
    totalInsumos = 0;
    if (s.val()) Object.values(s.val()).forEach(i => totalInsumos += parseFloat(i.valor));
    calcFinanceiro();
});

database.ref('mensalistas').on('value', s => {
    totalFiados = 0;
    const body = document.getElementById('lista-fiados-body');
    body.innerHTML = "";
    s.forEach(item => {
        const nome = item.key;
        const saldo = item.val().saldo_devedor;
        totalFiados += saldo;
        body.innerHTML += `<tr><td>${nome}</td><td>R$ ${saldo.toFixed(2)}</td>
            <td><button onclick="receberFiado('${nome}', ${saldo})" style="color:var(--success); font-weight:bold">BAIXAR</button></td></tr>`;
    });
    calcFinanceiro();
});

function receberFiado(nome, valor) {
    if (confirm(`Confirmar pagamento de ${nome}?`)) {
        database.ref('mensalistas/' + nome).remove();
        database.ref('vendas').push({ total: valor, vendedor: 'Recebimento Fiado', data: new Date().toLocaleString(), metodo: 'Recebimento' });
    }
}

function calcFinanceiro() {
    document.getElementById('total-vendas').innerText = "R$ " + totalVendas.toFixed(2);
    document.getElementById('total-fiados').innerText = "R$ " + totalFiados.toFixed(2);
    document.getElementById('total-insumos').innerText = "R$ " + totalInsumos.toFixed(2);
    document.getElementById('total-lucro').innerText = "R$ " + (totalVendas - totalInsumos).toFixed(2);
}

function prepararEdicao(id, nome, preco, estoque, foto) {
    editandoId = id;
    document.getElementById('nomeProd').value = nome;
    document.getElementById('precoProd').value = preco;
    document.getElementById('estoqueProd').value = estoque;
    document.getElementById('fotoProd').value = foto;
}

function removerItem(c) { if (confirm("Remover?")) database.ref(c).remove(); }
function limparCampos(ids) { ids.forEach(id => document.getElementById(id).value = ""); }
function zerarMes() { if (confirm("Zerar mês?")) { database.ref('vendas').remove(); database.ref('insumos').remove(); } }
