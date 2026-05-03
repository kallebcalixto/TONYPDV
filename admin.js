let totalVendas = 0;
let totalInsumos = 0;
let editandoId = null;

// FUNÇÃO PARA SALVAR NOVA SENHA DO CAIXA[cite: 1, 2]
function atualizarSenhaCaixa() {
    const novaSenha = document.getElementById('senhaCaixa').value;
    if (novaSenha.trim() !== "") {
        database.ref('configuracoes').update({
            senhaCaixa: novaSenha
        }).then(() => {
            alert("Senha do Caixa atualizada com sucesso! ✅");
            document.getElementById('senhaCaixa').value = "";
        }).catch((erro) => {
            alert("Erro ao salvar senha no banco de dados.");
        });
    } else {
        alert("Digite uma senha válida.");
    }
}

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

// Monitor de Estoque e Tabela[cite: 2]
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

// Lógica Financeira e Insumos[cite: 2]
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

// FUNÇÃO PARA ZERAR VENDAS E GASTOS (Zerar Mês)[cite: 12, 13]
function zerarMes() {
    if (confirm("⚠️ ATENÇÃO: Deseja realmente zerar todas as vendas e gastos? Isso não pode ser desfeito.")) {
        database.ref('vendas').remove()
            .then(() => {
                return database.ref('insumos').remove();
            })
            .then(() => {
                alert("Mês zerado com sucesso! ✅");
            })
            .catch((error) => {
                console.error("Erro ao zerar dados:", error);
                alert("Erro ao tentar zerar os dados.");
            });
    }
}
