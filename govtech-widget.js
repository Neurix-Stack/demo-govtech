/*!
 * GovTech Chat Widget v1.0 — Neurix
 * Assistente virtual para portais de prefeituras.
 *
 * Uso (colar antes do </body> do site):
 * <script src="https://SEU-CDN/govtech-widget.js"
 *   data-webhook="https://webhook.connectcreativelab.com.br/webhook/govtech-chat"
 *   data-cor="#1B4B91"
 *   data-titulo="Atendimento ao Cidadão"
 *   data-subtitulo="Prefeitura de Restinga/SP"
 *   data-telefone="(16) 99205-2002"
 *   data-horario="Seg. a sex., 08h às 17h"></script>
 */
(function () {
  'use strict';

  var script = document.currentScript || {};
  var ds = script.dataset || {};

  var cfg = {
    webhook: ds.webhook || 'https://webhook.connectcreativelab.com.br/webhook/govtech-chat',
    cor: ds.cor || '#1B4B91',
    titulo: ds.titulo || 'Atendimento ao Cidadão',
    subtitulo: ds.subtitulo || 'Prefeitura de Restinga/SP',
    telefone: ds.telefone || '(16) 99205-2002',
    horario: ds.horario || 'Seg. a sex., 08h às 17h',
    sugestoes: [
      'Como tiro a 2ª via do IPTU?',
      'Qual o telefone do Conselho Tutelar?',
      'Como emitir nota fiscal?'
    ]
  };

  var historico = [];
  var ocupado = false;
  var jaConversou = false;

  /* ---------- Host + Shadow DOM (isola o CSS do site da prefeitura) ---------- */
  var host = document.createElement('div');
  host.id = 'govtech-chat';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  root.innerHTML = [
    '<style>',
    ':host { all: initial; }',
    '* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }',
    ':focus-visible { outline: 3px solid ' + cfg.cor + '; outline-offset: 2px; }',
    '',
    '.fab { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;',
    '  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;',
    '  background: ' + cfg.cor + '; color: #fff; display: flex; align-items: center; justify-content: center;',
    '  box-shadow: 0 6px 24px rgba(0,0,0,.28); transition: transform .15s ease; }',
    '.fab:hover { transform: scale(1.06); }',
    '.fab svg { width: 28px; height: 28px; }',
    '',
    '.panel { position: fixed; right: 20px; bottom: 92px; z-index: 2147483000;',
    '  width: 380px; max-width: calc(100vw - 40px); height: min(600px, calc(100vh - 120px));',
    '  background: #fff; border-radius: 16px; overflow: hidden;',
    '  box-shadow: 0 12px 48px rgba(0,0,0,.3); display: flex; flex-direction: column; }',
    '.panel[hidden] { display: none; }',
    '',
    '.cab { background: ' + cfg.cor + '; color: #fff; padding: 16px 18px; display: flex; align-items: flex-start; gap: 12px; }',
    '.cab .info { flex: 1; min-width: 0; }',
    '.cab h2 { font-size: 16px; font-weight: 700; line-height: 1.25; }',
    '.cab .sub { font-size: 12.5px; opacity: .92; margin-top: 2px; }',
    '.cab .ia { font-size: 10.5px; opacity: .78; margin-top: 6px; display: flex; align-items: center; gap: 6px; }',
    '.cab .dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex: none; }',
    '.fechar { background: none; border: none; color: #fff; cursor: pointer; padding: 4px; border-radius: 6px; flex: none; }',
    '.fechar svg { width: 20px; height: 20px; }',
    '',
    '.corpo { flex: 1; overflow-y: auto; padding: 16px 14px; background: #F4F6F9; display: flex; flex-direction: column; gap: 10px; }',
    '.msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 15px; line-height: 1.55; overflow-wrap: break-word; }',
    '.msg.bot { background: #fff; color: #1c2430; border-bottom-left-radius: 4px; align-self: flex-start; box-shadow: 0 1px 2px rgba(0,0,0,.08); }',
    '.msg.user { background: ' + cfg.cor + '; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }',
    '.msg a { color: #1a56c4; text-decoration: underline; word-break: break-all; }',
    '.msg.user a { color: #dbe7ff; }',
    '',
    '.digitando { align-self: flex-start; background: #fff; border-radius: 14px; border-bottom-left-radius: 4px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(0,0,0,.08); display: flex; gap: 5px; }',
    '.digitando i { width: 7px; height: 7px; border-radius: 50%; background: #9aa7b8; animation: pulsar 1.2s infinite; }',
    '.digitando i:nth-child(2) { animation-delay: .2s; } .digitando i:nth-child(3) { animation-delay: .4s; }',
    '@keyframes pulsar { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }',
    '@media (prefers-reduced-motion: reduce) { .digitando i { animation: none; } .fab { transition: none; } }',
    '',
    '.chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 14px 10px; background: #F4F6F9; }',
    '.chips button { border: 1px solid ' + cfg.cor + '; color: ' + cfg.cor + '; background: #fff;',
    '  border-radius: 999px; padding: 8px 14px; font-size: 13.5px; cursor: pointer; }',
    '.chips button:hover { background: ' + cfg.cor + '; color: #fff; }',
    '',
    '.entrada { display: flex; gap: 8px; padding: 12px 14px; background: #fff; border-top: 1px solid #e5e9f0; }',
    '.entrada input { flex: 1; border: 1.5px solid #cdd6e1; border-radius: 10px; padding: 11px 13px; font-size: 15px; }',
    '.entrada input:focus { border-color: ' + cfg.cor + '; outline: none; }',
    '.entrada button { border: none; background: ' + cfg.cor + '; color: #fff; border-radius: 10px; width: 46px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex: none; }',
    '.entrada button:disabled { opacity: .55; cursor: default; }',
    '.entrada button svg { width: 20px; height: 20px; }',
    '',
    '.rodape { background: #fff; padding: 8px 14px 12px; font-size: 12px; color: #5b6675; text-align: center; line-height: 1.45; }',
    '.rodape strong { color: #1c2430; }',
    '',
    '@media (max-width: 480px) {',
    '  .panel { right: 0; bottom: 0; width: 100vw; max-width: 100vw; height: 100dvh; border-radius: 0; }',
    '  .fab { right: 16px; bottom: 16px; }',
    '}',
    '</style>',
    '',
    '<button class="fab" aria-label="Abrir atendimento virtual" title="Atendimento virtual">',
    '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '</button>',
    '',
    '<section class="panel" hidden role="dialog" aria-label="Atendimento virtual da prefeitura">',
    '  <header class="cab">',
    '    <div class="info">',
    '      <h2></h2>',
    '      <div class="sub"></div>',
    '      <div class="ia"><span class="dot" aria-hidden="true"></span>Atendimento automatizado por intelig&ecirc;ncia artificial</div>',
    '    </div>',
    '    <button class="fechar" aria-label="Fechar atendimento"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>',
    '  </header>',
    '  <div class="corpo" aria-live="polite"></div>',
    '  <div class="chips"></div>',
    '  <form class="entrada">',
    '    <input type="text" maxlength="500" placeholder="Digite sua d&uacute;vida..." aria-label="Sua mensagem" autocomplete="off" />',
    '    <button type="submit" aria-label="Enviar mensagem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></button>',
    '  </form>',
    '  <div class="rodape">Prefere falar com uma pessoa? Ligue <strong></strong><br/><span class="hor"></span></div>',
    '</section>'
  ].join('\n');

  /* ---------- Referências ---------- */
  var $ = function (sel) { return root.querySelector(sel); };
  var fab = $('.fab'), panel = $('.panel'), corpo = $('.corpo'), chips = $('.chips');
  var form = $('.entrada'), input = $('.entrada input'), btnEnviar = $('.entrada button');

  $('.cab h2').textContent = cfg.titulo;
  $('.cab .sub').textContent = cfg.subtitulo;
  $('.rodape strong').textContent = cfg.telefone;
  $('.rodape .hor').textContent = cfg.horario;

  /* ---------- Renderização segura de markdown básico ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function md(s) {
    var h = esc(s);
    var guardados = [];
    // 1) links markdown viram placeholder (protege de reprocessamento)
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, txt, url) {
      guardados.push('<a href="' + limpaUrl(url) + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>');
      return '\u0000' + (guardados.length - 1) + '\u0000';
    });
    // 2) URLs soltas viram placeholder
    h = h.replace(/https?:\/\/[^\s<]+/g, function (url) {
      var u = limpaUrl(url);
      guardados.push('<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>');
      return '\u0000' + (guardados.length - 1) + '\u0000';
    });
    // 3) formatacao de texto (ja sem URLs no caminho)
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\n/g, '<br/>');
    // 4) restaura os links
    return h.replace(/\u0000(\d+)\u0000/g, function (_, i) { return guardados[i]; });
  }

  // remove pontuacao/caracteres invisiveis grudados no fim da URL
  function limpaUrl(u) {
    return String(u).replace(/[\u200B-\u200D\uFEFF\uFFFC]/g, '').replace(/[.,;:!?)\]}'"\u00bb]+$/, '');
  }

  function addMsg(role, texto) {
    var div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    div.innerHTML = md(texto);
    corpo.appendChild(div);
    corpo.scrollTop = corpo.scrollHeight;
  }

  function mostrarDigitando() {
    var d = document.createElement('div');
    d.className = 'digitando';
    d.setAttribute('aria-label', 'Assistente digitando');
    d.innerHTML = '<i></i><i></i><i></i>';
    corpo.appendChild(d);
    corpo.scrollTop = corpo.scrollHeight;
    return d;
  }

  /* ---------- Sugestões iniciais ---------- */
  cfg.sugestoes.forEach(function (texto) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', function () { enviar(texto); });
    chips.appendChild(b);
  });

  /* ---------- Envio ---------- */
  function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto || ocupado) return;

    if (!jaConversou) { jaConversou = true; chips.style.display = 'none'; }

    var payload = { mensagem: texto, historico: historico.slice(-10) };
    addMsg('user', texto);
    input.value = '';
    ocupado = true;
    btnEnviar.disabled = true;
    var digitando = mostrarDigitando();

    fetch(cfg.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var resposta = (data && data.resposta) || fallback();
        digitando.remove();
        addMsg('bot', resposta);
        historico.push({ role: 'user', content: texto });
        historico.push({ role: 'assistant', content: resposta });
      })
      .catch(function () {
        digitando.remove();
        addMsg('bot', fallback());
      })
      .finally(function () {
        ocupado = false;
        btnEnviar.disabled = false;
        input.focus();
      });
  }

  function fallback() {
    return 'Estou com uma instabilidade t\u00e9cnica neste momento. Tente novamente em instantes ou fale com a Central de Atendimento: ' + cfg.telefone + ' (' + cfg.horario + ').';
  }

  /* ---------- Eventos ---------- */
  fab.addEventListener('click', function () {
    var abrir = panel.hidden;
    panel.hidden = !abrir;
    fab.setAttribute('aria-label', abrir ? 'Fechar atendimento virtual' : 'Abrir atendimento virtual');
    if (abrir) {
      if (!corpo.childElementCount) {
        addMsg('bot', 'Ol\u00e1! Sou o assistente virtual da ' + cfg.subtitulo + '. Posso te ajudar a encontrar servi\u00e7os, documentos e contatos do munic\u00edpio. Como posso ajudar?');
      }
      input.focus();
    }
  });
  $('.fechar').addEventListener('click', function () { panel.hidden = true; fab.focus(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); enviar(input.value); });
})();
