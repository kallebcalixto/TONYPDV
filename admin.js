// VARIÁVEIS GLOBAIS DE CONTROLE FINANCEIRO
let totalVendasReal = 0;
let totalInsumosGerais = 0;
let totalFiadoPendente = 0;
let editandoId = null;

// 1. MONITOR DE MENSALISTAS (EXIBE NOME E VALOR NO ADMIN)
database.ref('mensalistas').on('value', snapshot => {
    const bodyFiados = document.getElementById('lista-fiados-body');
    const displayFiado = document.getElementById('total-fiados');
    
    if (bodyFiados) {
        bodyFiados.innerHTML = "";
        totalFiadoPendente = 0;
        
        const devedores = snapshot.val();
        if (devedores) {
            Object.keys(devedores).forEach(nomeCliente => {
                const saldo = devedores[nomeCliente].saldo_devedor;
                totalFiadoPendente += saldo;

                // Cria a linha na tabela com o Nome da Cliente Devedora
                bodyFiados.innerHTML += `
                    <tr>
                        <td style="color: #fff; font-weight: bold;">${nomeCliente}</td>
                        <td style="color: #f39c12; font-weight: bold;">R$ ${saldo.toFixed(2)}</td>
                        <td>
                            <button onclick="receberPagamentoFiado('${nomeCliente}', ${saldo})" 
                                    style="background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                Dar Baixa / Pagou
                            </button>
                        </td>
                    </tr>`;
            });
        }
    }
    if (displayFiado) displayFiado.innerText = "R$ " + totalFiadoPendente.toFixed(2);
    atualizarResumoFinanceiro();
});

// 2. FUNÇÃO PARA DAR BAIXA NO FIADO (MOVE O DINHEIRO PARA O CAIXA REAL)
function receberPagamentoFiado(nome, valor) {
    if (confirm(`Confirmar que a cliente ${nome} pagou R$ ${valor.toFixed(2)}?`)) {
        // Remove a dívida do sistema de mensalistas
        database.ref('mensalistas/' + nome).remove();

        // Registra o valor como faturamento real no banco de vendas
        database.ref('vendas').push({
            total: valor,
            data: new Date().toLocaleString(),
            tipo: "Recebimento: " + nome
        });

        alert(`Pagamento de ${nome} recebido com sucesso! O valor entrou no seu lucro real. ✅`);
    }
}

// 3. GESTÃO DE PRODUTOS E ESTOQUE
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
    } else {
        alert("Preencha o nome e o preço!");
    }
}

// Monitora a lista de produtos para exibir no admin
database.ref('produtos').on('value', snapshot => {
    const body = document.getElementById('lista-corpo');
    if (body) {
        body.innerHTML = "";
        const dados = snapshot.val();
        if (dados) {
            Object.keys(dados).forEach(id => {
                const p = dados[id];
                const corEstoque = p.estoque < 5 ? 'color:#ff4d4d; font-weight:bold;' : '';
                body.innerHTML += `
                    <tr>
                        <td>${p.nome}</td>
                        <td>R$ ${p.preco.toFixed(2)}</td>
                        <td style="${corEstoque}">${p.estoque} un</td>
                        <td>
                            <button onclick="prepararEdicao('${id}', '${p.nome}', ${p.preco}, ${p.estoque}, '${p.foto}')">Editar</button>
                            <button onclick="removerItem('produtos/${id}')" style="color:#ff4d4d">Excluir</button>
                        </td>
                    </tr>`;
            });
        }
    }
});

// 4. GESTÃO DE INSUMOS (GASTOS)
function salvarInsumo() {
    const nome = document.getElementById('nomeInsumo').value;
    const valor = parseFloat(document.getElementById('valorInsumo').value);
    if (nome && valor) {
        database.ref('insumos').push({ nome, valor, data: new Date().toLocaleString() });
        limparCampos(['nomeInsumo', 'valorInsumo']);
    }
}

// 5. CÁLCULO FINANCEIRO E RESUMO
database.ref('vendas').on('value', s => {
    totalVendasReal = 0;
    if (s.val()) Object.values(s.val()).forEach(v => totalVendasReal += parseFloat(v.total));
    atualizarResumoFinanceiro();
});

database.ref('insumos').on('value', s => {
    totalInsumosGerais = 0;
    if (s.val()) Object.values(s.val()).forEach(i => totalInsumosGerais += parseFloat(i.valor));
    atualizarResumoFinanceiro();
});

function atualizarResumoFinanceiro() {
    const v = document.getElementById('total-vendas');
    const i = document.getElementById('total-insumos');
    const l = document.getElementById('total-lucro');
    
    if(v) v.innerText = "R$ " + totalVendasReal.toFixed(2);
    if(i) i.innerText = "R$ " + totalInsumosGerais.toFixed(2);
    if(l) l.innerText = "R$ " + (totalVendasReal - totalInsumosGerais).toFixed(2);
}

// FUNÇÕES AUXILIARES
function prepararEdicao(id, nome, preco, estoque, foto) {
    editandoId = id;
    document.getElementById('nomeProd').value = nome;
    document.getElementById('precoProd').value = preco;
    document.getElementById('estoqueProd').value = estoque;
    document.getElementById('fotoProd').value = foto;
    window.scrollTo(0,0);
}

function removerItem(caminho) {
    if (confirm("Deseja realmente excluir este item?")) database.ref(caminho).remove();
}

function limparCampos(ids) {
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
}

function zerarMes() {
    if (confirm("⚠️ Isso apagará todas as vendas e gastos do mês atual. As clientes devedoras NÃO serão apagadas. Continuar?")) {
        database.ref('vendas').remove();
        database.ref('insumos').remove();
        alert("Mês zerado com sucesso! ✅");
    }
}
