// FUNÇÃO PARA FINALIZAR VENDA COM SENHA DO BANCO DE DADOS
function finalizar() {
    if (carrinho.length === 0) return alert("Carrinho vazio!");

    // Busca a senha atualizada no Firebase
    database.ref('configuracoes/senhaCaixa').once('value').then(snapshot => {
        const senhaCorreta = snapshot.val() || "1234"; // "1234" é o padrão caso o banco esteja vazio
        const senhaDigitada = prompt("Confirme a Senha do Caixa para Finalizar:");

        if (senhaDigitada === senhaCorreta) {
            processarVenda(); // Função que já existe no seu código para baixar estoque e salvar venda
        } else {
            alert("Senha Incorreta! A venda não foi processada.");
        }
    });
}

function processarVenda() {
    const totalVenda = calcularTotal();
    
    // Baixa de estoque para cada item
    carrinho.forEach(item => {
        database.ref('produtos/' + item.id).transaction(produto => {
            if (produto) {
                produto.estoque -= item.quantidade;
            }
            return produto;
        });
    });

    // Registra a venda
    database.ref('vendas').push({
        total: totalVenda,
        data: new Date().toISOString(),
        itens: carrinho
    });

    alert("Venda realizada com sucesso!");
    limparCarrinho();
}
