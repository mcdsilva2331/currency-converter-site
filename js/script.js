const API_KEY = '00ce7f29b54f43a56c17a8eb';
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;
let rates = {};
let chart = null;
let isLoading = false;
let currentUser = null;

const CURRENCIES = [
    { code: 'USD', name: 'United States Dollar', flag: 'US' },
    { code: 'EUR', name: 'Euro', flag: 'EU' },
    { code: 'BRL', name: 'Brazil Real', flag: 'BR' },
    { code: 'GBP', name: 'United Kingdom Pound', flag: 'GB' },
    { code: 'JPY', name: 'Japan Yen', flag: 'JP' },
    { code: 'CAD', name: 'Canada Dollar', flag: 'CA' },
    { code: 'AUD', name: 'Australia Dollar', flag: 'AU' },
    { code: 'CHF', name: 'Switzerland Franc', flag: 'CH' },
    { code: 'CNY', name: 'China Yuan', flag: 'CN' },
    { code: 'SEK', name: 'Sweden Krona', flag: 'SE' },
    { code: 'INR', name: 'India Rupee', flag: 'IN' },
    { code: 'MXN', name: 'Mexico Peso', flag: 'MX' },
    { code: 'ZAR', name: 'South Africa Rand', flag: 'ZA' },
    { code: 'SGD', name: 'Singapore Dollar', flag: 'SG' },
    { code: 'HKD', name: 'Hong Kong Dollar', flag: 'HK' },
    { code: 'KRW', name: 'South Korea Won', flag: 'KR' },
    { code: 'TRY', name: 'Turkey Lira', flag: 'TR' },
    { code: 'RUB', name: 'Russia Ruble', flag: 'RU' },
    { code: 'PLN', name: 'Poland Zloty', flag: 'PL' },
    { code: 'THB', name: 'Thailand Baht', flag: 'TH' },
    { code: 'IDR', name: 'Indonesia Rupiah', flag: 'ID' },
    { code: 'HUF', name: 'Hungary Forint', flag: 'HU' },
    { code: 'CZK', name: 'Czech Republic Koruna', flag: 'CZ' },
    { code: 'ILS', name: 'Israel Shekel', flag: 'IL' },
    { code: 'CLP', name: 'Chile Peso', flag: 'CL' },
    { code: 'PHP', name: 'Philippines Peso', flag: 'PH' },
    { code: 'AED', name: 'UAE Dirham', flag: 'AE' },
    { code: 'COP', name: 'Colombia Peso', flag: 'CO' },
    { code: 'SAR', name: 'Saudi Arabia Riyal', flag: 'SA' },
    { code: 'MYR', name: 'Malaysia Ringgit', flag: 'MY' }
];

const $ = id => document.getElementById(id);

// BANDEIRA SVG
function getFlag(code) {
    return `<i class="fp ${code.toLowerCase()}"></i>`;
}

document.addEventListener('DOMContentLoaded', () => {
    populateCurrencies();
    setupTheme();
    setupLogin();
    setupEvents();
    checkLogin();
    setInterval(() => fetchRates($('fromCurrency').value), 600000);
});

// === DROPDOWN COM BANDEIRAS ===
function populateCurrencies() {
    const from = $('fromCurrency');
    const to = $('toCurrency');
    from.innerHTML = '';
    to.innerHTML = '';

    CURRENCIES.forEach(c => {
        const flag = getFlag(c.flag);
        const html = `${flag} ${c.name} (${c.code})`;
        const optionFrom = document.createElement('option');
        const optionTo = document.createElement('option');
        optionFrom.value = optionTo.value = c.code;
        optionFrom.innerHTML = optionTo.innerHTML = html;
        from.appendChild(optionFrom);
        to.appendChild(optionTo);
    });
    from.value = 'USD';
    to.value = 'BRL';
}

// === TEMA, LOGIN, EVENTOS (igual) ===
function setupTheme() {
    const saved = localStorage.getItem('cambioTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
    $('themeToggle').addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('themeToggle').textContent = theme === 'dark' ? 'Sun' : 'Moon';
    localStorage.setItem('cambioTheme', theme);
}

function setupLogin() {
    $('loginSubmit').addEventListener('click', () => {
        const email = $('loginEmail').value.trim();
        const pass = $('loginPass').value;
        if (email && pass) {
            currentUser = { email };
            localStorage.setItem('cambioUser', JSON.stringify(currentUser));
            checkLogin();
        }
    });
    $('logoutLink').addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('cambioUser');
        location.reload();
    });
}
function checkLogin() {
    const user = localStorage.getItem('cambioUser');
    if (user) {
        currentUser = JSON.parse(user);
        $('userName').textContent = currentUser.email.split('@')[0];
        $('userInfo').style.display = 'block';
        $('loginModal').style.display = 'none';
        fetchRates('USD');
    } else {
        $('loginModal').style.display = 'flex';
    }
}

function setupEvents() {
    $('convertBtn').addEventListener('click', convertCurrency);
    $('compareBtn').addEventListener('click', showComparison);
    $('setAlertBtn').addEventListener('click', () => {
        const input = $('alertInput').value.trim();
        $('alertStatus').innerHTML = input ? `<p style="color:green;">Alerta: <strong>${input}</strong></p>` : '';
    });
    $('exportCSV').addEventListener('click', exportCSV);
}

// === API, CONVERSÃO, COMPARTILHAR (igual) ===
async function fetchRates(base) {
    if (isLoading) return;
    isLoading = true;
    $('convertBtn').disabled = true;
    $('result').innerHTML = '<small>Carregando...</small>';

    try {
        const res = await fetch(API_URL + base);
        const data = await res.json();
        if (data.result === 'success') {
            rates = data.conversion_rates;
            $('result').innerHTML = '<small style="color:green;">OK!</small>';
            updateChart(base);
        } else {
            throw new Error(data['error-type']);
        }
    } catch (err) {
        $('result').innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
        rates = { USD:1, EUR:0.92, BRL:5.70, GBP:0.79, JPY:151, CAD:1.38, AUD:1.51, CHF:0.87, CNY:7.18, SEK:10.8 };
    } finally {
        isLoading = false;
        $('convertBtn').disabled = false;
    }
}

function convertCurrency() {
    const amount = parseFloat($('amount').value) || 0;
    const from = $('fromCurrency').value;
    const to = $('toCurrency').value;

    if (amount <= 0) return $('result').innerHTML = '<span style="color:#ffc107;">Inválido.</span>';
    if (!rates[from]) return fetchRates(from).then(() => setTimeout(convertCurrency, 800));

    const rate = rates[to] / rates[from];
    const converted = amount * rate;
    const text = `${amount.toFixed(2)} ${from} = ${converted.toFixed(2)} ${to}`;
    $('result').innerHTML = `<strong>${text}</strong><br><small>1 ${from} = ${rate.toFixed(6)} ${to}</small>`;

    addToHistory(amount, from, to, converted, rate);
    showShare(text);
}

function showShare(text) {
    const sb = $('shareButtons');
    sb.style.display = 'flex';
    $('shareWhats').onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    $('shareEmail').onclick = () => window.open(`mailto:?subject=Câmbio&body=${encodeURIComponent(text)}`);
}

// === TABELA ===
function showComparison() {
    const amount = parseFloat($('amount').value) || 1;
    const from = $('fromCurrency').value;
    const tbody = $('comparisonTable').querySelector('tbody');
    tbody.innerHTML = '';

    CURRENCIES.forEach(c => {
        if (c.code === from) return;
        const rate = rates[c.code] / rates[from];
        const val = amount * rate;
        const flag = getFlag(c.flag);
        tbody.innerHTML += `<tr><td>${flag} <strong>${c.code}</strong></td><td>${rate.toFixed(6)}</td><td>${val.toFixed(2)}</td></tr>`;
    });
    $('comparisonTable').style.display = 'table';
}

// === GRÁFICO COM BANDEIRAS (HTML) ===
function updateChart(base) {
    if (!rates[base]) return;
    const ctx = $('rateChart').getContext('2d');
    
    const labels = CURRENCIES
        .filter(c => c.code !== base)
        .map(c => `${getFlag(c.flag)} ${c.code}`);
    
    const data = labels.map((_, i) => {
        const code = CURRENCIES.find(c => c.code !== base && labels[i].includes(c.code)).code;
        return ((rates[code] / rates[base]) * 100).toFixed(2);
    });

    if (chart) chart.destroy();

    // Plugin para renderizar HTML nos labels
    const htmlLegendPlugin = {
        id: 'htmlLegend',
        afterUpdate(chart) {
            const items = chart.options.plugins.legend.labels.generateLabels(chart);
            const legendContainer = document.getElementById('legend-container');
            if (!legendContainer) return;
            legendContainer.innerHTML = items.map(item => {
                return `<div style="display:flex; align-items:center; margin:5px;">
                    <span style="background:${item.fillStyle}; width:10px; height:10px; display:inline-block; margin-right:5px;"></span>
                    <span>${item.text}</span>
                </div>`;
            }).join('');
        }
    };

    chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{
            label: `Variação % vs 1 ${base}`,
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]},
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}%` } }
            },
            scales: { y: { beginAtZero: false } }
        },
        plugins: [htmlLegendPlugin]
    });
}

// === HISTÓRICO E CSV (igual) ===
function addToHistory(a, f, t, c, r) {
    const h = JSON.parse(localStorage.getItem('currencyHistory') || '[]');
    h.unshift({ amount: a, from: f, to: t, converted: c.toFixed(2), rate: r.toFixed(6), date: new Date().toLocaleString('pt-BR') });
    if (h.length > 50) h.pop();
    localStorage.setItem('currencyHistory', JSON.stringify(h));
    loadHistory();
}
function loadHistory() {
    const list = $('historyList');
    const h = JSON.parse(localStorage.getItem('currencyHistory') || '[]');
    list.innerHTML = h.map(i => `<li><small>${i.date}</small><br>${i.amount} ${i.from} → ${i.converted} ${i.to}</li>`).join('');
}

function exportCSV() {
    const h = JSON.parse(localStorage.getItem('currencyHistory') || '[]');
    if (!h.length) return alert('Histórico vazio!');
    let csv = 'Data,De,Para,Valor,Convertido,Taxa\n';
    h.forEach(i => {
        const [d] = i.date.split(', ');
        csv += `${d},${i.from},${i.to},${i.amount},${i.converted},${i.rate}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'historico.csv'; a.click();
}