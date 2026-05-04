// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
let carrinho = [];
let senhaCaixaAtual = "";

// 1. SINCRONIZAÇÃO DA SENHA DO CAIXA (Definida no Admin)
database.ref('configuracoes/senhaCaixa').on('value', snapshot => {
    senhaCaixaAtual = snapshot.val() || "123"; // Senha padrão caso não exista no banco
});

// 2. CARREGAMENTO DA GRADE DE PRODUTOS
database.ref('produtos').on('value', snapshot => {
    const grade = document.getElementById('grade-produtos');
    if (!grade) return;
    
    grade.innerHTML = "";
    const produtos = snapshot.val();
    
    if (produtos) {
        Object.keys(produtos).forEach(id => {
            const p = produtos[id];
            const esgotado = p.estoque <= 0;
            
            // Layout compatível com fundo preto/dark mode
            grade.innerHTML += `
                <div class="card-item" 
                     style="${esgotado ? 'opacity:0.4; filter:grayscale(1); cursor:not-allowed;' : 'cursor:pointer'}" 
                     onclick="${!esgotado ? `adicionarAoCarrinho('${id}', '${p.nome}', ${p.preco})` : "alert('Produto Esgotado!')"}">
                    <img src="${p.foto || 'https://via.placeholder.com/150'}" alt="${p.nome}">
                    <h4>${p.nome}</h4>
                    <span class="preco">R$ ${p.preco.toFixed(2)}</span>
                    <small>Estoque: ${p.estoque} un</small>
                </div>`;
        });
    }
});

// 3. LOGICA DO CARRINHO
function adicionarAoCarrinho(id, nome, preco) {
    carrinho.push({ id, nome, preco: parseFloat(preco) });
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const lista = document.getElementById('itens-checkout');
    const displayTotal = document.getElementById('total-caixa');
    let totalAcumulado = 0;

    if (lista) {
        lista.innerHTML = carrinho.map((item, index) => {
            totalAcumulado += item.preco;
            return `
                <div class="item-linha" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #222;">
                    <span>${item.nome}</span>
                    <div>
                        <b>R$ ${item.preco.toFixed(2)}</b>
                        <button onclick="removerDoCarrinho(${index})" style="background:none; border:none; color:#ff4d4d; margin-left:10px; cursor:pointer;">X</button>
                    </div>
                </div>`;
        }).join('');
    }
    
    if (displayTotal) displayTotal.innerText = totalAcumulado.toFixed(2);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

// 4. FINALIZAÇÃO DA VENDA (DINHEIRO VS FIADO)
function finalizarVenda() {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");

    const totalVenda = parseFloat(document.getElementById('total-caixa').innerText);
    
    // Pergunta o método de pagamento
    const opcao = prompt("FORMA DE PAGAMENTO:\n1 - Dinheiro / Pix\n2 - Fiado (Mensalista)");

    if (opcao === "1") {
        executarBaixa("Dinheiro", totalVenda, null);
    } else if (opcao === "2") {
        const nomeCliente = prompt("Digite o NOME da Cliente Mensalista:");
        if (!nomeCliente) return alert("Erro: É necessário o nome da cliente para registrar o fiado!");
        
        executarBaixa("Fiado", totalVenda, nomeCliente);
    } else {
        alert("Opção inválida!");
    }
}

// 5. PROCESSAMENTO DE DADOS E ESTOQUE
function executarBaixa(tipo, valor, cliente) {
    const confirmacaoSenha = prompt("Digite a Senha do Caixa para autorizar:");
    
    if (confirmacaoSenha !== senhaCaixaAtual) {
        return alert("Senha incorreta! Venda não realizada.");
    }

    // A - Baixa o estoque de cada item no Firebase
    carrinho.forEach(item => {
        database.ref('produtos/' + item.id).transaction(produto => {
            if (produto) {
                produto.estoque = (produto.estoque || 0) - 1;
            }
            return produto;
        });
    });

    // B - Direciona o financeiro
    if (tipo === "Dinheiro") {
        // Vai para o faturamento real do mês
        database.ref('vendas').push({
            total: valor,
            data: new Date().toLocaleString(),
            metodo: "Dinheiro/Pix"
        });
    } else {
        // Vai para o nó de mensalistas (Fiado) para o Admin cobrar depois
        database.ref('mensalistas/' + cliente + '/saldo_devedor').transaction(saldoAtual => {
            return (saldoAtual || 0) + valor;
        });
    }

    alert(`Venda finalizada com sucesso (${tipo})! ✅`);
    limparCarrinho();
}

function limparCarrinho() {
    carrinho = [];
    atualizarInterfaceCarrinho();
}
