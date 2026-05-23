// ─── PRODUTOS ────────────────────────────────────────────────
// [código, nome, categoria, preço venda, preço custo, estoque mínimo]
const PRODUTOS = [
  ["P001","Tabaco Amsterdam",            "Tabaco",    18, 0,  5],
  ["P002","Tabaco Acrema 20g",           "Tabaco",    18, 0,  5],
  ["P003","Hi Tabaco",                   "Tabaco",    28, 0,  3],
  ["P004","Tabaco Solto (dose)",         "Tabaco",     5, 0,  0],
  ["P005","Seda Bem Bolado Brown Slim",  "Seda",       5, 0, 10],
  ["P006","Seda Bem Bolado Brown Large", "Seda",       5, 0, 10],
  ["P007","Seda Guru Spirit Slim",       "Seda",       4, 0, 10],
  ["P008","Seda Guru Spirit Brown Longa","Seda",       5, 0, 10],
  ["P009","Seda Papelito Brown Slim",    "Seda",       5, 0, 10],
  ["P010","Seda Smoking KS Brown",       "Seda",       5, 0, 10],
  ["P011","Piteira Tonabê Large",        "Piteira",    7, 0,  5],
  ["P012","Piteira Mega Large Tonabê",   "Piteira",    7, 0,  5],
  ["P013","Piteira Sadhu Large",         "Piteira",    5, 0,  5],
  ["P014","Cuia Tonabê",                 "Cuia",      16, 0,  3],
  ["P015","Cuia Abduzido Banheira",      "Cuia",      25, 0,  3],
  ["P016","Kit Tabas",                   "Kit",       30, 0,  3],
  ["P017","Kit Tabas Premium",           "Kit",       40, 0,  3],
  ["P018","Kit Completo",                "Kit",       45, 0,  2],
  ["P019","Clipper (Isqueiro)",          "Acessório",  9, 0,  5],
  ["P020","Filtro Aleda Longo",          "Acessório",  8, 0,  5],
  ["P021","Tesoura Dobrável Tonabê",     "Acessório", 12, 0,  3],
  ["P022","Bic (Isqueiro)",              "Acessório",  9, 0,  5],
  ["P023","Múltiplos Produtos (combo)",  "Combo",      0, 0,  0],
];

// ─── DATA LAYER (localStorage) ───────────────────────────────
const DB = {
  _get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
  _set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),

  vendas: {
    all:   ()  => DB._get('brisaria_vendas'),
    add:   (v) => { const a = DB.vendas.all(); a.push({ ...v, id: Date.now() }); DB._set('brisaria_vendas', a); },
    del:   (id) => DB._set('brisaria_vendas', DB.vendas.all().filter(x => x.id !== id)),
  },
  compras: {
    all:   ()  => DB._get('brisaria_compras'),
    add:   (c) => { const a = DB.compras.all(); a.push({ ...c, id: Date.now() }); DB._set('brisaria_compras', a); },
    del:   (id) => DB._set('brisaria_compras', DB.compras.all().filter(x => x.id !== id)),
  },
  saidas: {
    all:   ()  => DB._get('brisaria_saidas'),
    add:   (s) => { const a = DB.saidas.all(); a.push({ ...s, id: Date.now() }); DB._set('brisaria_saidas', a); },
    del:   (id) => DB._set('brisaria_saidas', DB.saidas.all().filter(x => x.id !== id)),
  },
  estoqueInicial: {
    all: () => JSON.parse(localStorage.getItem('brisaria_estoque') || '{}'),
    set: (produto, qtd) => {
      const e = DB.estoqueInicial.all();
      e[produto] = parseInt(qtd) || 0;
      localStorage.setItem('brisaria_estoque', JSON.stringify(e));
    },
  },
};

// ─── UTILS ───────────────────────────────────────────────────
const fmt = {
  money: (v) => {
    const n = parseFloat(v) || 0;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  date: (d) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  },
  today: () => new Date().toISOString().split('T')[0],
  monthKey: (d) => {
    if (!d) return '';
    const [y, m] = d.split('-');
    return `${y}-${m}`;
  },
  currentMonth: () => fmt.monthKey(fmt.today()),
};

// ─── CÁLCULOS ────────────────────────────────────────────────
function calcEstoque(nomeProduto) {
  const ei = DB.estoqueInicial.all()[nomeProduto] || 0;
  const comprado = DB.compras.all()
    .filter(c => c.produto === nomeProduto)
    .reduce((s, c) => s + (parseInt(c.quantidade) || 0), 0);
  const vendido = DB.vendas.all()
    .filter(v => v.produto === nomeProduto)
    .reduce((s, v) => s + (parseInt(v.quantidade) || 0), 0);
  return ei + comprado - vendido;
}

function calcDashboard() {
  const mes = fmt.currentMonth();
  const vendas  = DB.vendas.all();
  const compras = DB.compras.all();
  const saidas  = DB.saidas.all();

  const receitaMes  = vendas.filter(v => fmt.monthKey(v.data) === mes).reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
  const comprasMes  = compras.filter(c => fmt.monthKey(c.data) === mes).reduce((s, c) => s + (parseFloat(c.custoTotal) || 0), 0);
  const receitaTotal = vendas.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
  const comprasTotal = compras.reduce((s, c) => s + (parseFloat(c.custoTotal) || 0), 0);
  const saidasTotal  = saidas.reduce((s, sd) => s + (parseFloat(sd.valor) || 0), 0);

  return {
    receitaMes,
    comprasMes,
    resultadoMes: receitaMes - comprasMes,
    saldo: receitaTotal - comprasTotal - saidasTotal,
  };
}

// ─── NAVEGAÇÃO ───────────────────────────────────────────────
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  const titles = {
    dashboard: 'Dashboard',
    venda:     'Registrar Venda',
    compra:    'Registrar Compra',
    estoque:   'Estoque',
    historico: 'Histórico',
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('content').innerHTML = views[page]();
  bindEvents(page);
}

// ─── VIEWS ───────────────────────────────────────────────────
const views = {

  dashboard() {
    const { receitaMes, comprasMes, resultadoMes, saldo } = calcDashboard();
    const resultClass = resultadoMes >= 0 ? 'card-green' : 'card-red';

    const alertas = PRODUTOS
      .filter(p => p[5] > 0 || true) // inclui todos com estoque finito
      .map(p => ({ nome: p[1], atual: calcEstoque(p[1]), min: p[5] }))
      .filter(p => p.atual <= p.min && p.min >= 0 && p.nome !== 'Múltiplos Produtos (combo)' && p.nome !== 'Tabaco Solto (dose)')
      .filter(p => p.atual <= 0 || p.atual <= p.min);

    const ultimasVendas = DB.vendas.all()
      .sort((a, b) => b.id - a.id)
      .slice(0, 8);

    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });

    return `
      <div class="cards">
        <div class="card card-green">
          <div class="card-label">Receita ${mesNome}</div>
          <div class="card-value">${fmt.money(receitaMes)}</div>
        </div>
        <div class="card card-red">
          <div class="card-label">Compras ${mesNome}</div>
          <div class="card-value">${fmt.money(comprasMes)}</div>
        </div>
        <div class="card ${resultClass}">
          <div class="card-label">Resultado ${mesNome}</div>
          <div class="card-value">${fmt.money(resultadoMes)}</div>
        </div>
        <div class="card card-primary">
          <div class="card-label">Saldo em Caixa (total)</div>
          <div class="card-value card-value-big">${fmt.money(saldo)}</div>
        </div>
      </div>

      ${alertas.length > 0 ? `
        <div class="section-title">⚠️ Estoque Baixo</div>
        <div class="alert-list">
          ${alertas.map(p => `
            <div class="alert-item ${p.atual <= 0 ? 'alert-red' : 'alert-yellow'}">
              <span>${p.nome}</span>
              <span>${p.atual <= 0 ? '🔴 Esgotado' : `⚠️ ${p.atual} un.`}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div class="alert-list"><div class="alert-item alert-yellow" style="justify-content:center">✅ Estoque OK em todos os produtos</div></div>'}

      <div class="section-title">Últimas Vendas</div>
      ${ultimasVendas.length === 0 ? `
        <div class="empty">Nenhuma venda registrada ainda.<br>Toque em "Venda" para começar.</div>
      ` : `
        <div class="transaction-list">
          ${ultimasVendas.map(v => `
            <div class="transaction-item">
              <div class="transaction-main">
                <span class="transaction-desc">${v.produto}</span>
                <span class="transaction-value green">${fmt.money(v.valor)}</span>
              </div>
              <div class="transaction-sub">
                <span>${fmt.date(v.data)} · ${v.quantidade}x · ${v.pagamento}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  venda() {
    return `
      <form id="form-venda" class="form">
        <div class="form-group">
          <label>Data</label>
          <input type="date" name="data" value="${fmt.today()}" required>
        </div>
        <div class="form-group">
          <label>Produto</label>
          <select name="produto" id="sel-produto" required>
            <option value="">Selecione...</option>
            ${PRODUTOS.map(p => `<option value="${p[1]}" data-preco="${p[3]}">${p[1]}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantidade</label>
            <input type="number" name="quantidade" id="inp-qtd" value="1" min="1" required>
          </div>
          <div class="form-group">
            <label>Valor Total (R$)</label>
            <input type="number" name="valor" id="inp-valor" placeholder="0.00" step="0.01" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <label>Pagamento</label>
          <div class="payment-btns">
            <button type="button" class="pay-btn active" data-pay="Pix">Pix</button>
            <button type="button" class="pay-btn" data-pay="Dinheiro">Dinheiro</button>
            <button type="button" class="pay-btn" data-pay="Débito">Débito</button>
            <button type="button" class="pay-btn" data-pay="Crédito">Crédito</button>
          </div>
          <input type="hidden" name="pagamento" value="Pix">
        </div>
        <div class="form-group">
          <label>Cliente (opcional)</label>
          <input type="text" name="cliente" placeholder="Nome ou apelido">
        </div>
        <button type="submit" class="btn-primary">✓&nbsp; Registrar Venda</button>
      </form>
    `;
  },

  compra() {
    return `
      <form id="form-compra" class="form">
        <div class="form-group">
          <label>Data</label>
          <input type="date" name="data" value="${fmt.today()}" required>
        </div>
        <div class="form-group">
          <label>Fornecedor</label>
          <input type="text" name="fornecedor" placeholder="Ex: Sadhu, distribuidora..." required>
        </div>
        <div class="form-group">
          <label>Produto</label>
          <select name="produto" required>
            <option value="">Selecione...</option>
            ${PRODUTOS.filter(p => p[1] !== 'Múltiplos Produtos (combo)').map(p => `<option value="${p[1]}">${p[1]}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantidade</label>
            <input type="number" name="quantidade" id="c-qtd" value="1" min="1" required>
          </div>
          <div class="form-group">
            <label>Custo Unit. (R$)</label>
            <input type="number" name="custoUnit" id="c-unit" placeholder="0.00" step="0.01" min="0">
          </div>
        </div>
        <div class="form-group">
          <label>Custo Total (R$)</label>
          <input type="number" name="custoTotal" id="c-total" placeholder="Auto-calculado ou manual" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>Observações (opcional)</label>
          <input type="text" name="obs" placeholder="Nota fiscal, lote, etc.">
        </div>
        <button type="submit" class="btn-secondary">✓&nbsp; Registrar Compra</button>
        <button type="button" class="btn-outline" onclick="abrirModalSaida()">+ Saída Avulsa (despesa / pro-labore)</button>
      </form>

      <div id="modal-saida" class="modal hidden">
        <div class="modal-content">
          <h3>Saída Avulsa</h3>
          <div class="form-group">
            <label>Descrição</label>
            <input type="text" id="saida-desc" placeholder="Ex: Pro-labore, frete, embalagem...">
          </div>
          <div class="form-group">
            <label>Valor (R$)</label>
            <input type="number" id="saida-valor" placeholder="0.00" step="0.01" min="0">
          </div>
          <div class="modal-btns">
            <button class="btn-secondary" onclick="salvarSaida()">Salvar Saída</button>
            <button class="btn-outline" onclick="fecharModalSaida()">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  },

  estoque() {
    const ei = DB.estoqueInicial.all();
    const listaSemCombo = PRODUTOS.filter(p => p[1] !== 'Múltiplos Produtos (combo)');

    return `
      <div class="estoque-header">
        <span>Produto</span>
        <span>Ini / Atual</span>
        <span></span>
      </div>
      <div class="estoque-list">
        ${listaSemCombo.map(p => {
          const atual = calcEstoque(p[1]);
          const statusClass = atual <= 0 ? 'out' : atual <= p[5] ? 'low' : 'ok';
          const statusIcon  = atual <= 0 ? '🔴' : atual <= p[5] ? '⚠️' : '✅';
          return `
            <div class="estoque-item">
              <div class="estoque-nome">${p[1]}</div>
              <div class="estoque-qtd">
                <input type="number" class="estoque-input" data-produto="${p[1]}"
                  value="${ei[p[1]] || 0}" min="0" title="Estoque inicial">
                <span class="estoque-atual ${statusClass}">${atual}</span>
              </div>
              <div>${statusIcon}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="estoque-legend">
        <small>Campo editável = estoque inicial &nbsp;|&nbsp; Número em negrito = estoque atual</small>
      </div>
    `;
  },

  historico() {
    const vendas  = DB.vendas.all().map(v  => ({ ...v, _tipo: 'Venda',  _cor: 'green', _valor: v.valor,      _desc: v.produto }));
    const compras = DB.compras.all().map(c  => ({ ...c, _tipo: 'Compra', _cor: 'red',   _valor: c.custoTotal,  _desc: c.produto }));
    const saidas  = DB.saidas.all().map(s   => ({ ...s, _tipo: 'Saída',  _cor: 'red',   _valor: s.valor,       _desc: s.descricao }));

    const todos = [...vendas, ...compras, ...saidas].sort((a, b) => b.id - a.id);

    if (todos.length === 0) {
      return '<div class="empty">Nenhum registro ainda.<br>Registre vendas e compras para ver o histórico.</div>';
    }

    return `
      <div class="transaction-list">
        ${todos.map(t => `
          <div class="transaction-item">
            <div class="transaction-main">
              <span class="transaction-desc">
                <span class="tag tag-${t._cor}">${t._tipo}</span>${t._desc || ''}
              </span>
              <span class="transaction-value ${t._cor}">${t._cor === 'green' ? '+' : '−'}${fmt.money(t._valor)}</span>
            </div>
            <div class="transaction-sub">
              <span>${fmt.date(t.data)}${t.pagamento ? ' · ' + t.pagamento : ''}${t.quantidade ? ' · ' + t.quantidade + 'x' : ''}</span>
              <button class="btn-del" onclick="deletarRegistro('${t._tipo.toLowerCase()}', ${t.id})">×</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="export-bar">
        <button class="btn-outline" onclick="exportarCSV()">📥 Exportar CSV</button>
      </div>
    `;
  },
};

// ─── BIND EVENTS ─────────────────────────────────────────────
function bindEvents(page) {

  if (page === 'venda') {
    // Botões de pagamento
    document.querySelectorAll('.pay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector('[name=pagamento]').value = btn.dataset.pay;
      });
    });

    // Auto-preenche preço ao selecionar produto
    const selProduto = document.getElementById('sel-produto');
    const inpQtd   = document.getElementById('inp-qtd');
    const inpValor = document.getElementById('inp-valor');

    function atualizarPreco() {
      const opt = selProduto.selectedOptions[0];
      const preco = parseFloat(opt?.dataset.preco || 0);
      const qtd   = parseInt(inpQtd.value) || 1;
      if (preco > 0) inpValor.value = (preco * qtd).toFixed(2);
    }

    selProduto.addEventListener('change', atualizarPreco);
    inpQtd.addEventListener('input', atualizarPreco);

    // Submit venda
    document.getElementById('form-venda').addEventListener('submit', function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if (!data.produto) return;
      DB.vendas.add(data);
      showToast('✅ Venda registrada!');
      this.reset();
      document.querySelector('[name=data]').value = fmt.today();
      document.querySelector('[name=pagamento]').value = 'Pix';
      document.querySelectorAll('.pay-btn').forEach(b => b.classList.toggle('active', b.dataset.pay === 'Pix'));
      inpQtd.value = '1';
    });
  }

  if (page === 'compra') {
    const cQtd   = document.getElementById('c-qtd');
    const cUnit  = document.getElementById('c-unit');
    const cTotal = document.getElementById('c-total');

    function calcTotal() {
      const qtd  = parseFloat(cQtd.value)  || 0;
      const unit = parseFloat(cUnit.value) || 0;
      if (qtd > 0 && unit > 0) cTotal.value = (qtd * unit).toFixed(2);
    }

    cQtd.addEventListener('input', calcTotal);
    cUnit.addEventListener('input', calcTotal);

    document.getElementById('form-compra').addEventListener('submit', function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if (!data.produto) return;
      DB.compras.add(data);
      showToast('✅ Compra registrada!');
      this.reset();
      document.querySelector('[name=data]').value = fmt.today();
      cQtd.value = '1';
    });
  }

  if (page === 'estoque') {
    document.querySelectorAll('.estoque-input').forEach(input => {
      input.addEventListener('change', function() {
        DB.estoqueInicial.set(this.dataset.produto, this.value);
        // Atualiza só o número atual sem re-renderizar tudo
        const atual = calcEstoque(this.dataset.produto);
        const item  = this.closest('.estoque-item');
        const span  = item.querySelector('.estoque-atual');
        const icon  = item.querySelector('div:last-child');
        const prod  = PRODUTOS.find(p => p[1] === this.dataset.produto);
        const min   = prod ? prod[5] : 0;
        span.textContent = atual;
        span.className = 'estoque-atual ' + (atual <= 0 ? 'out' : atual <= min ? 'low' : 'ok');
        icon.textContent = atual <= 0 ? '🔴' : atual <= min ? '⚠️' : '✅';
      });
    });
  }
}

// ─── AÇÕES GLOBAIS ───────────────────────────────────────────
function abrirModalSaida() {
  document.getElementById('modal-saida').classList.remove('hidden');
}

function fecharModalSaida() {
  document.getElementById('modal-saida').classList.add('hidden');
}

function salvarSaida() {
  const desc  = document.getElementById('saida-desc').value.trim();
  const valor = parseFloat(document.getElementById('saida-valor').value) || 0;
  if (!desc)  return alert('Informe a descrição.');
  if (!valor) return alert('Informe o valor.');
  DB.saidas.add({ data: fmt.today(), descricao: desc, valor });
  fecharModalSaida();
  showToast('✅ Saída registrada!');
}

function deletarRegistro(tipo, id) {
  if (!confirm('Remover este registro?')) return;
  if (tipo === 'venda')  DB.vendas.del(id);
  else if (tipo === 'compra') DB.compras.del(id);
  else if (tipo === 'saída')  DB.saidas.del(id);
  navigate('historico');
}

function exportarCSV() {
  const cabecalho = 'Data,Tipo,Descricao,Qtd,Valor,Pagamento,Cliente';
  const linhasV = DB.vendas.all().map(v =>
    `${v.data},Venda,"${v.produto}",${v.quantidade},${v.valor},${v.pagamento},"${v.cliente || ''}"`
  );
  const linhasC = DB.compras.all().map(c =>
    `${c.data},Compra,"${c.produto}",${c.quantidade},${c.custoTotal},"${c.fornecedor || ''}",""`
  );
  const linhasS = DB.saidas.all().map(s =>
    `${s.data},Saída,"${s.descricao}",1,${s.valor},,`
  );
  const csv = [cabecalho, ...linhasV, ...linhasC, ...linhasS].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `brisaria_${fmt.today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
