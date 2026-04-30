let totalVendas = 0, totalInsumos = 0, editandoId = null;

// ATUALIZAR SENHA DO CAIXA NO FIREBASE
function atualizarSenhaCaixa() {
    const novaSenha = document.getElementById('senhaCaixa').value;
    if (novaSenha.trim() !== "") {
        database.ref('configuracoes').update({ senhaCaixa: novaSenha })
        .then(() => { alert("Senha do Caixa Atualizada! ✅"); document.getElementById('senhaCaixa').value = ""; })
        .catch(() => alert("Erro ao salvar senha."));
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
        database.ref('insumos').push({ nome, valor });
        limparCampos(['nomeInsumo', 'valorInsumo']);
    }
}

database.ref('produtos').on('value', snapshot => {
    const body = document.getElementById('lista-corpo');
    body.innerHTML = "";
    const dados = snapshot.val();
    if (dados) {
        Object.keys(dados).forEach(id => {
            const p = dados[id];
            body.innerHTML += `<tr>
                <td>${p.nome}</td>
                <td>R$ ${p.preco.toFixed(2)}</td>
                <td style="${p.estoque < 5 ? 'color:red; font-weight:bold' : ''}">${p.estoque} un</td>
                <td><button onclick="prepararEdicao('${id}', '${p.nome}', ${p.preco}, ${p.estoque}, '${p.foto}')">Editar</button></td>
            </tr>`;
        });
    }
});

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
    document.getElementById('total-lucro').innerText = "R$ " + (totalVendas - totalInsumos).toFixed(2);
}

function prepararEdicao(id, nome, preco, estoque, foto) {
    editandoId = id;
    document.getElementById('nomeProd').value = nome;
    document.getElementById('precoProd').value = preco;
    document.getElementById('estoqueProd').value = estoque;
    document.getElementById('fotoProd').value = foto;
}

function limparCampos(ids) { ids.forEach(id => document.getElementById(id).value = ""); }
