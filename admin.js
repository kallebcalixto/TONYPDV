let totalVendas = 0;
let totalInsumos = 0;
let editandoId = null;

// Salvar ou Editar Produto[cite: 2]
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

// Monitor de Estoque em Tempo Real[cite: 2]
database.ref('produtos').on('value', snapshot => {
    const body = document.getElementById('lista-corpo');
    body.innerHTML = "";
    const dados = snapshot.val();
    if (dados) {
        Object.keys(dados).forEach(id => {
            const p = dados[id];
            const corEstoque = p.estoque < 5 ? 'color:red; font-weight:bold;' : '';
            body.innerHTML += `
                <tr>
                    <td>${p.nome}</td>
                    <td>R$ ${p.preco.toFixed(2)}</td>
                    <td style="${corEstoque}">${p.estoque} un</td>
                    <td>
                        <button onclick="prepararEdicao('${id}', '${p.nome}', ${p.preco}, ${p.estoque}, '${p.foto}')" style="color:#3b82f6; border:none; background:none; cursor:pointer;">Editar</button>
                        <button onclick="removerItem('produtos/${id}')" style="color:red; border:none; background:none; cursor:pointer;">Excluir</button>
                    </td>
                </tr>`;
        });
    }
});

// Lógica Financeira[cite: 2]
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

function salvarInsumo() {
    const nome = document.getElementById('nomeInsumo').value;
    const valor = parseFloat(document.getElementById('valorInsumo').value);
    if (nome && valor) {
        database.ref('insumos').push({ nome, valor });
        limparCampos(['nomeInsumo', 'valorInsumo']);
    }
}

function removerItem(caminho) { if (confirm("Deseja remover?")) database.ref(caminho).remove(); }
function limparCampos(ids) { ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); }