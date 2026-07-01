let listaProdutos = [];
let carrinho = [];
let usuarioLogado = "";

// 1. SISTEMA DE LOGIN DE SEGURANÇA
function executarLogin(event) {
    event.preventDefault(); // Evita recarga da página
    
    const userIn = document.getElementById('usuario').value;
    const senhaIn = document.getElementById('senha').value;

    // Autenticação simples
    if (userIn.trim() !== "" && senhaIn.trim() !== "") {
        usuarioLogado = userIn;
        
        // Altera as telas de exibição
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('conteudo-loja').style.display = 'block';
        document.getElementById('nome-usuario-logado').innerText = `👤 Conta: ${usuarioLogado}`;
        
        // Puxa o banco de dados
        carregarJogos();
    }
}

// 2. BUSCA DO BANCO DE DADOS DOS PRODUTOS (CORRIGIDO PARA O SEU JSON)
async function carregarJogos() {
    const container = document.getElementById('games-container');
    if (!container) return;

    try {
        const resposta = await fetch('produtos.json');
        listaProdutos = await resposta.json();

        container.innerHTML = ''; 

        listaProdutos.forEach(jogo => {
            const card = document.createElement('div');
            card.className = 'game-card';
            // Corrigido para as suas chaves: jogo.imagem, jogo.desc e jogo.precoTexto
            card.innerHTML = `
                <img src="${jogo.imagem}" alt="${jogo.desc}" class="game-thumb">
                <div class="game-details">
                    <div class="game-title" title="${jogo.desc}">${jogo.desc}</div>
                    <div class="game-footer">
                        <span class="discount-badge">Destaque</span>
                        <span class="price">${jogo.precoTexto}</span>
                    </div>
                    <button class="btn-buy" onclick="adicionarAoCarrinho(${jogo.id})">
                        Adicionar ao Carrinho
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro no arquivo JSON:", erro);
        container.innerHTML = `<p style="color: #ff5555; padding: 20px;">Abra pelo Live Server para carregar os produtos.</p>`;
    }
}

function toggleCarrinho() {
    document.getElementById('janela-carrinho').classList.toggle('active');
}

function fecharNoFundo(event) {
    if (event.target.id === 'janela-carrinho') toggleCarrinho();
}

// 3. FLUXO DE COMPRA E QUANTIDADES (CORRIGIDO PARA O SEU JSON)
function adicionarAoCarrinho(idProduto) {
    const produto = listaProdutos.find(item => item.id === idProduto);
    if (produto) {
        const itemExistente = carrinho.find(item => item.id === idProduto);
        if (itemExistente) {
            itemExistente.quantidade += 1;
        } else {
            carrinho.push({ ...produto, quantidade: 1 });
        }
        atualizarInterfaceCarrinho();
    }
}

function removerDoCarrinho(idProduto) {
    const itemIndex = carrinho.findIndex(item => item.id === idProduto);
    if (itemIndex !== -1) {
        if (carrinho[itemIndex].quantidade > 1) {
            carrinho[itemIndex].quantidade -= 1;
        } else {
            carrinho.splice(itemIndex, 1);
        }
        atualizarInterfaceCarrinho();
    }
}

function atualizarInterfaceCarrinho() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    document.getElementById('cart-count').innerText = totalItens;

    const listaHtml = document.getElementById('itens-do-carrinho');
    listaHtml.innerHTML = ''; 

    if (carrinho.length === 0) {
        listaHtml.innerHTML = '<p class="carrinho-vazio">Seu carrinho está limpo no momento.</p>';
        document.getElementById('valor-total').innerText = 'R$ 0,00';
        return;
    }

    let somaTotal = 0;
    carrinho.forEach(item => {
        // Corrigido para a sua chave matemática: item.valor
        somaTotal += (item.valor * item.quantidade);
        const elemento = document.createElement('div');
        elemento.className = 'item-carrinho';
        elemento.innerHTML = `
            <div>
                <p style="font-weight: 700; color: #fff; font-size: 14px;">${item.desc}</p>
                <p style="font-size: 12px; color: var(--text-blue); margin-top: 2px;">
                    ${item.quantidade}x de R$ ${item.valor.toFixed(2).replace('.', ',')}
                </p>
            </div>
            <button class="btn-remover" onclick="removerDoCarrinho(${item.id})">Remover</button>
        `;
        listaHtml.appendChild(elemento);
    });

    document.getElementById('valor-total').innerText = `R$ ${somaTotal.toFixed(2).replace('.', ',')}`;
}

// 4. CHECKOUT COM GERAÇÃO DE NOTA FISCAL EM ARQUIVO .TXT (CORRIGIDO PARA O SEU JSON)
function processarCheckout() {
    if (carrinho.length === 0) {
        alert("Adicione produtos antes de finalizar!");
        return;
    }

    const metodo = document.getElementById('metodo-pagamento').value;
    let somaTotal = 0;
    
    // Gerando o texto estruturado da Nota Fiscal
    let textoNota = "=========================================\n";
    textoNota += "           STEAM STORE VIRTUAL           \n";
    textoNota += "            NOTA FISCAL COMPRA           \n";
    textoNota += "=========================================\n";
    textoNota += `Cliente: ${usuarioLogado}\n`;
    textoNota += `Data da Compra: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    textoNota += `Forma de Pagamento: ${metodo}\n`;
    textoNota += "-----------------------------------------\n";
    textoNota += "PRODUTOS ADQUIRIDOS:\n\n";

    carrinho.forEach(item => {
        // Corrigido para a sua chave matemática: item.valor e de texto: item.desc
        const subtotalItem = item.valor * item.quantidade;
        somaTotal += subtotalItem;
        
        textoNota += `Jogo: ${item.desc}\n`;
        textoNota += `Qtd: ${item.quantidade}x  |  Valor Unitário: R$ ${item.valor.toFixed(2).replace('.', ',')}\n`;
        textoNota += `Subtotal: R$ ${subtotalItem.toFixed(2).replace('.', ',')}\n`;
        textoNota += "-----------------------------------------\n";
    });

    textoNota += `VALOR TOTAL DA COMPRA: R$ ${somaTotal.toFixed(2).replace('.', ',')}\n`;
    textoNota += "=========================================\n";
    textoNota += "    Obrigado por comprar na sestemlux !       \n";
    textoNota += "=========================================";

    // Disparando o download do arquivo de texto (.txt) gerado dinamicamente
    const blob = new Blob([textoNota], { type: "text/plain;charset=utf-8" });
    const linkDownload = document.createElement("a");
    linkDownload.href = URL.createObjectURL(blob);
    linkDownload.download = `Nota_Fiscal_Steam_${usuarioLogado}.txt`;
    
    document.body.appendChild(linkDownload);
    linkDownload.click(); // Abre o salvamento automático do arquivo
    document.body.removeChild(linkDownload);

    alert(`Sucesso! Pagamento via ${metodo} processado e arquivo de Nota Fiscal emitido.`);
    
    // Reseta o carrinho
    carrinho = [];
    atualizarInterfaceCarrinho();
    toggleCarrinho();
}
