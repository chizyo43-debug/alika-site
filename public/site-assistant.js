(() => {
  'use strict';

  const config = window.ALIKA_ASSISTANT_CONFIG || {};
  const endpoint = typeof config.endpoint === 'string' ? config.endpoint.replace(/\/+$/, '') : '';
  if (!endpoint || (!endpoint.startsWith('https://') && !endpoint.startsWith('http://localhost'))) return;

  const language = (document.documentElement.lang || 'tr').slice(0, 2).toLowerCase();
  const supported = new Set(['tr', 'en', 'de', 'es', 'fr', 'pt', 'ru', 'ja', 'ko']);
  const lang = supported.has(language) ? language : 'tr';
  const COPY = {
    tr: { open: 'AliKa’ya sor', title: 'AliKa site asistanı', subtitle: 'Ürünü tanıyın, doğru sayfayı bulun', close: 'Kapat', consentTitle: 'Başlamadan önce', consent: 'Mesajınız ve bu oturumdaki son konuşma, yanıt üretmek için Google Gemini’ye gönderilir. Sohbeti saklamayız. Çocuk adı, PIN, parola, okul, sağlık veya gezinme verisi yazmayın.', accept: 'Anladım, asistanı aç', hello: 'Merhaba! AliKa’nın özellikleri, kurulumu, fiyatı ve ailenize uygunluğu hakkında sorabilirsiniz.', placeholder: 'AliKa hakkında sorun…', send: 'Gönder', sending: 'Yanıt hazırlanıyor…', error: 'Şu anda yanıt veremiyorum. Lütfen tekrar deneyin veya destek sayfasını açın.', limit: 'Kısa sürede çok fazla soru gönderildi. Birkaç dakika sonra yeniden deneyin.', sources: 'İlgili sayfalar', privacy: 'Mesajlar Google Gemini ile işlenir · Kişisel veri yazmayın', q1: 'AliKa ailem için uygun mu?', q2: 'Soru çözerek süre nasıl kazanılır?', q3: 'Fiyat ve 7 günlük deneme nedir?' },
    en: { open: 'Ask AliKa', title: 'AliKa site assistant', subtitle: 'Understand the product and find the right page', close: 'Close', consentTitle: 'Before you start', consent: 'Your message and recent chat context are sent to Google Gemini to generate a reply. We do not store the chat. Do not enter a child’s name, PIN, password, school, health or browsing data.', accept: 'I understand, open assistant', hello: 'Hello! Ask about AliKa features, setup, pricing, or whether it fits your family.', placeholder: 'Ask about AliKa…', send: 'Send', sending: 'Preparing an answer…', error: 'I cannot answer right now. Please try again or open Support.', limit: 'Too many questions were sent in a short time. Please try again in a few minutes.', sources: 'Relevant pages', privacy: 'Messages are processed by Google Gemini · Do not enter personal data', q1: 'Is AliKa right for my family?', q2: 'How does earning time with questions work?', q3: 'What are the price and 7-day trial?' },
    de: { open: 'AliKa fragen', title: 'AliKa Website-Assistent', subtitle: 'Produkt verstehen und richtige Seite finden', close: 'Schließen', consentTitle: 'Vor dem Start', consent: 'Ihre Nachricht und der letzte Gesprächskontext werden zur Antworterstellung an Google Gemini gesendet. Wir speichern den Chat nicht. Keine Namen von Kindern, PINs, Passwörter, Schul-, Gesundheits- oder Browserdaten eingeben.', accept: 'Verstanden, Assistent öffnen', hello: 'Hallo! Fragen Sie nach Funktionen, Einrichtung, Preis oder Eignung für Ihre Familie.', placeholder: 'Frage zu AliKa…', send: 'Senden', sending: 'Antwort wird erstellt…', error: 'Derzeit ist keine Antwort möglich. Bitte erneut versuchen oder Support öffnen.', limit: 'Zu viele Fragen in kurzer Zeit. Bitte in einigen Minuten erneut versuchen.', sources: 'Passende Seiten', privacy: 'Nachrichten werden von Google Gemini verarbeitet · Keine persönlichen Daten', q1: 'Passt AliKa zu meiner Familie?', q2: 'Wie funktioniert Lernzeit als Belohnung?', q3: 'Wie sind Preis und 7-Tage-Test?' },
    es: { open: 'Pregunta a AliKa', title: 'Asistente web de AliKa', subtitle: 'Conozca el producto y encuentre la página correcta', close: 'Cerrar', consentTitle: 'Antes de empezar', consent: 'Su mensaje y el contexto reciente se envían a Google Gemini para generar la respuesta. No guardamos el chat. No escriba nombres de menores, PIN, contraseñas ni datos escolares, médicos o de navegación.', accept: 'Entiendo, abrir asistente', hello: '¡Hola! Pregunte por funciones, instalación, precio o si AliKa encaja con su familia.', placeholder: 'Pregunte sobre AliKa…', send: 'Enviar', sending: 'Preparando respuesta…', error: 'No puedo responder ahora. Inténtelo de nuevo o abra Soporte.', limit: 'Se enviaron demasiadas preguntas. Inténtelo de nuevo en unos minutos.', sources: 'Páginas relacionadas', privacy: 'Google Gemini procesa los mensajes · No escriba datos personales', q1: '¿AliKa es adecuado para mi familia?', q2: '¿Cómo se gana tiempo respondiendo?', q3: '¿Cuál es el precio y la prueba de 7 días?' },
    fr: { open: 'Demander à AliKa', title: 'Assistant du site AliKa', subtitle: 'Comprendre le produit et trouver la bonne page', close: 'Fermer', consentTitle: 'Avant de commencer', consent: 'Votre message et le contexte récent sont envoyés à Google Gemini pour produire la réponse. Nous ne conservons pas le chat. Ne saisissez aucun nom d’enfant, PIN, mot de passe ni donnée scolaire, médicale ou de navigation.', accept: 'J’ai compris, ouvrir', hello: 'Bonjour ! Posez vos questions sur les fonctions, l’installation, le prix ou l’adéquation à votre famille.', placeholder: 'Question sur AliKa…', send: 'Envoyer', sending: 'Préparation de la réponse…', error: 'Je ne peux pas répondre maintenant. Réessayez ou ouvrez l’assistance.', limit: 'Trop de questions ont été envoyées. Réessayez dans quelques minutes.', sources: 'Pages associées', privacy: 'Messages traités par Google Gemini · Aucune donnée personnelle', q1: 'AliKa convient-il à ma famille ?', q2: 'Comment gagner du temps avec les questions ?', q3: 'Quel est le prix et l’essai de 7 jours ?' },
    pt: { open: 'Perguntar à AliKa', title: 'Assistente do site AliKa', subtitle: 'Conheça o produto e encontre a página certa', close: 'Fechar', consentTitle: 'Antes de começar', consent: 'A sua mensagem e o contexto recente são enviados ao Google Gemini para criar a resposta. Não guardamos a conversa. Não introduza nome da criança, PIN, palavra-passe nem dados escolares, médicos ou de navegação.', accept: 'Compreendi, abrir assistente', hello: 'Olá! Pergunte sobre funcionalidades, instalação, preço ou adequação à sua família.', placeholder: 'Pergunte sobre a AliKa…', send: 'Enviar', sending: 'A preparar resposta…', error: 'Não consigo responder agora. Tente novamente ou abra o Apoio.', limit: 'Foram enviadas demasiadas perguntas. Tente novamente dentro de alguns minutos.', sources: 'Páginas relacionadas', privacy: 'Mensagens processadas pelo Google Gemini · Não introduza dados pessoais', q1: 'A AliKa é adequada para a minha família?', q2: 'Como se ganha tempo com perguntas?', q3: 'Qual é o preço e o teste de 7 dias?' },
    ru: { open: 'Спросить AliKa', title: 'Помощник сайта AliKa', subtitle: 'Узнайте о продукте и найдите нужную страницу', close: 'Закрыть', consentTitle: 'Перед началом', consent: 'Ваше сообщение и недавний контекст отправляются Google Gemini для ответа. Мы не сохраняем чат. Не вводите имя ребёнка, PIN, пароль, школьные, медицинские данные или историю просмотра.', accept: 'Понятно, открыть помощника', hello: 'Здравствуйте! Спросите о функциях, установке, цене или о том, подходит ли AliKa вашей семье.', placeholder: 'Спросите об AliKa…', send: 'Отправить', sending: 'Готовим ответ…', error: 'Сейчас ответить не удалось. Попробуйте снова или откройте поддержку.', limit: 'Слишком много вопросов за короткое время. Повторите через несколько минут.', sources: 'Связанные страницы', privacy: 'Сообщения обрабатывает Google Gemini · Не вводите личные данные', q1: 'Подойдёт ли AliKa моей семье?', q2: 'Как получать время за ответы?', q3: 'Каковы цена и 7-дневный пробный период?' },
    ja: { open: 'AliKaに質問', title: 'AliKaサイトアシスタント', subtitle: '製品を知り、適切なページへご案内します', close: '閉じる', consentTitle: '開始する前に', consent: '回答生成のため、メッセージと直近の会話内容がGoogle Geminiに送信されます。チャットは保存しません。お子様の氏名、PIN、パスワード、学校、健康、閲覧データは入力しないでください。', accept: '理解して開く', hello: 'こんにちは。AliKaの機能、設定、価格、ご家庭への適合について質問できます。', placeholder: 'AliKaについて質問…', send: '送信', sending: '回答を準備中…', error: '現在回答できません。再試行するかサポートページをご覧ください。', limit: '短時間に多くの質問が送信されました。数分後にお試しください。', sources: '関連ページ', privacy: 'Google Geminiで処理されます · 個人情報を入力しないでください', q1: 'AliKaはわが家に合いますか？', q2: '問題で利用時間を得る仕組みは？', q3: '価格と7日間体験について教えて' },
    ko: { open: 'AliKa에 질문', title: 'AliKa 사이트 도우미', subtitle: '제품을 이해하고 알맞은 페이지를 찾으세요', close: '닫기', consentTitle: '시작하기 전에', consent: '답변 생성을 위해 메시지와 최근 대화가 Google Gemini로 전송됩니다. 대화는 저장하지 않습니다. 자녀 이름, PIN, 비밀번호, 학교, 건강 또는 탐색 데이터를 입력하지 마세요.', accept: '이해했어요, 도우미 열기', hello: '안녕하세요! AliKa 기능, 설치, 가격 또는 가족에게 맞는지 물어보세요.', placeholder: 'AliKa에 대해 질문…', send: '보내기', sending: '답변 준비 중…', error: '지금은 답변할 수 없습니다. 다시 시도하거나 지원 페이지를 여세요.', limit: '짧은 시간에 너무 많은 질문이 전송되었습니다. 몇 분 뒤 다시 시도하세요.', sources: '관련 페이지', privacy: 'Google Gemini에서 처리 · 개인정보를 입력하지 마세요', q1: 'AliKa가 우리 가족에게 맞나요?', q2: '문제를 풀어 시간을 얻는 방법은?', q3: '가격과 7일 체험은 어떻게 되나요?' },
  };
  const NUDGE = {
    tr: ['AliKa ailenize uygun mu?', 'Özellikleri ve fiyatı yapay zekâ asistana sorun.'],
    en: ['Is AliKa right for your family?', 'Ask the AI assistant about features and pricing.'],
    de: ['Passt AliKa zu Ihrer Familie?', 'Fragen Sie den KI-Assistenten nach Funktionen und Preis.'],
    es: ['¿AliKa encaja con su familia?', 'Pregunte al asistente de IA por funciones y precio.'],
    fr: ['AliKa convient-il à votre famille ?', 'Demandez les fonctions et le prix à l’assistant IA.'],
    pt: ['A AliKa é adequada à sua família?', 'Pergunte ao assistente de IA sobre funções e preço.'],
    ru: ['Подойдёт ли AliKa вашей семье?', 'Спросите ИИ-помощника о функциях и цене.'],
    ja: ['AliKaはご家庭に合いますか？', '機能や価格をAIアシスタントに質問できます。'],
    ko: ['AliKa가 우리 가족에게 맞을까요?', '기능과 가격을 AI 도우미에게 물어보세요.'],
  };
  const copy = COPY[lang];
  const nudgeCopy = NUDGE[lang];
  const host = document.createElement('div');
  host.id = 'alika-site-assistant';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{--navy:#07172d;--blue:#54c7ea;--gold:#e4b84c;--paper:#fffaf0;--ink:#14243a;position:fixed;z-index:2147483000;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));font-family:Nunito,'Segoe UI',system-ui,sans-serif;color:var(--ink)}
      *{box-sizing:border-box}[hidden]{display:none!important}.nudge{position:absolute;right:0;bottom:68px;display:grid;grid-template-columns:1fr auto;gap:12px;width:min(300px,calc(100vw - 24px));padding:14px 15px;border:1px solid #e4b84c80;border-radius:18px;color:#fff;background:linear-gradient(135deg,#102f52,#0b203a);box-shadow:0 18px 50px #07172d66;cursor:pointer;text-align:left}.nudge b,.nudge small{display:block}.nudge b{color:#ffe08a;font-size:13px}.nudge small{margin-top:4px;color:#e3edf4;font-size:11px;line-height:1.35}.nudge i{align-self:center;color:#59c5ea;font-size:22px;font-style:normal}.launcher{position:relative;display:flex;align-items:center;gap:9px;min-height:52px;padding:10px 16px 10px 11px;border:1px solid #ffffff2b;border-radius:999px;color:#fff;background:linear-gradient(135deg,#0a2140,#102f52);box-shadow:0 14px 38px #07172d55;cursor:pointer;font:800 14px/1 inherit}.launcher:after{position:absolute;top:-7px;right:8px;padding:3px 6px;border-radius:999px;content:'AI';color:#07172d;background:#ffe08a;box-shadow:0 4px 12px #07172d40;font-size:8px;font-weight:950;letter-spacing:.08em}.launcher img{width:32px;height:32px;border-radius:50%;object-fit:contain;background:#fff;padding:2px}.launcher:hover{transform:translateY(-1px);box-shadow:0 18px 42px #07172d66}.panel{position:absolute;right:0;bottom:66px;width:min(390px,calc(100vw - 24px));height:min(650px,calc(100vh - 104px));overflow:hidden;border:1px solid #ffffff26;border-radius:22px;background:var(--paper);box-shadow:0 24px 80px #06142670;display:grid;grid-template-rows:auto 1fr auto;transform-origin:bottom right}.head{display:flex;align-items:center;gap:10px;padding:14px 15px;color:#fff;background:linear-gradient(135deg,#081a33,#123b61)}.head img{width:38px;height:38px;object-fit:contain;border-radius:11px;background:#fff;padding:3px}.head div{min-width:0;flex:1}.head strong,.head small{display:block}.head strong{font-size:15px}.head small{margin-top:2px;color:#cfeaf4;font-size:11px}.head button{width:34px;height:34px;border:1px solid #ffffff2a;border-radius:50%;color:#fff;background:#ffffff0f;cursor:pointer;font-size:19px}.body{min-height:0;overflow:auto;padding:14px;scroll-behavior:smooth}.consent{display:grid;gap:13px;align-content:start;padding:7px 2px}.consentMark{display:grid;width:48px;height:48px;place-items:center;border-radius:16px;color:#08233c;background:#dff6fc;font-size:24px}.consent h2{margin:0;font-size:20px}.consent p{margin:0;color:#4b5b6c;font-size:13px;line-height:1.55}.consent button,.send{min-height:44px;border:0;border-radius:13px;color:#fff;background:#0d789d;cursor:pointer;font:800 13px/1 inherit}.conversation{display:grid;gap:11px}.message{max-width:88%;padding:10px 12px;border-radius:15px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.assistant{justify-self:start;border:1px solid #d9e3e8;background:#fff}.user{justify-self:end;color:#fff;background:#123d60}.waiting{color:#677789;font-style:italic}.links{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 3px}.links a{padding:8px 10px;border:1px solid #9acddd;border-radius:999px;color:#075c78;background:#effbfe;text-decoration:none;font-size:11px;font-weight:800}.links a.videoLink{border-color:#0d789d;color:#fff;background:#0d789d;box-shadow:0 6px 16px #0d789d30}.sourceLabel{width:100%;margin:4px 0 -1px;color:#71808d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.quick{display:flex;flex-wrap:wrap;gap:7px}.quick button{padding:8px 10px;border:1px solid #d6dde2;border-radius:999px;color:#304659;background:#fff;cursor:pointer;font:700 11px/1.25 inherit}.form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 12px 7px;border-top:1px solid #dfe5e8;background:#fff}.form textarea{width:100%;min-height:44px;max-height:100px;resize:none;padding:11px 12px;border:1px solid #c9d3da;border-radius:13px;color:#10243a;background:#fff;font:600 13px/1.35 inherit;outline:none}.form textarea:focus{border-color:#1594be;box-shadow:0 0 0 3px #36bce52b}.send{min-width:70px;padding:0 13px}.send:disabled,.consent button:disabled{opacity:.55;cursor:wait}.privacy{grid-column:1/-1;margin:0;color:#71808d;font-size:9px;line-height:1.35}.trap{position:absolute;left:-9999px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
      @media(max-width:520px){:host{right:8px;bottom:8px}.nudge{right:0;bottom:62px;width:min(280px,calc(100vw - 16px))}.launcher{min-height:48px;padding:8px 13px 8px 9px}.panel{position:fixed;inset:8px;width:auto;height:auto;border-radius:20px;transform-origin:bottom center}.message{max-width:92%}}
      @media(prefers-reduced-motion:no-preference){.nudge{animation:nudgeIn .45s .5s both}.panel{animation:appear .18s ease-out}.launcher,.links a{transition:transform .16s ease,box-shadow .16s ease}.launcher{animation:launcherGlow 2.8s 1.2s 2}@keyframes appear{from{opacity:0;transform:translateY(8px) scale(.98)}}@keyframes nudgeIn{from{opacity:0;transform:translateY(10px) scale(.97)}}@keyframes launcherGlow{50%{box-shadow:0 14px 38px #07172d55,0 0 0 8px #59c5ea24}}}
    </style>
    <button class="nudge" type="button"><span><b>${nudgeCopy[0]}</b><small>${nudgeCopy[1]}</small></span><i aria-hidden="true">→</i></button>
    <button class="launcher" type="button" aria-expanded="false"><img src="/brand/alika-logo.png" alt=""><span>${copy.open}</span></button>
    <section class="panel" role="dialog" aria-modal="false" aria-labelledby="alika-assistant-title" hidden>
      <header class="head"><img src="/brand/alika-logo.png" alt=""><div><strong id="alika-assistant-title">${copy.title}</strong><small>${copy.subtitle} · AI beta</small></div><button type="button" aria-label="${copy.close}">×</button></header>
      <div class="body"><div class="consent"><span class="consentMark" aria-hidden="true">✦</span><h2>${copy.consentTitle}</h2><p>${copy.consent}</p><button type="button">${copy.accept}</button></div><div class="conversation" hidden aria-live="polite"></div></div>
      <form class="form" hidden><label class="sr" for="alika-assistant-input">${copy.placeholder}</label><textarea id="alika-assistant-input" maxlength="800" rows="1" placeholder="${copy.placeholder}" required></textarea><button class="send" type="submit">${copy.send}</button><input class="trap" name="website" tabindex="-1" autocomplete="off"><p class="privacy">${copy.privacy}</p></form>
    </section>`;

  const launcher = root.querySelector('.launcher');
  const nudge = root.querySelector('.nudge');
  const panel = root.querySelector('.panel');
  const closeButton = root.querySelector('.head button');
  const consent = root.querySelector('.consent');
  const consentButton = consent.querySelector('button');
  const conversation = root.querySelector('.conversation');
  const form = root.querySelector('.form');
  const input = root.querySelector('textarea');
  const send = root.querySelector('.send');
  const history = [];
  let busy = false;

  function addMessage(role, text, links = [], sourceLinks = []) {
    const item = document.createElement('div');
    item.className = `message ${role}`;
    item.textContent = text;
    conversation.append(item);
    const allLinks = [...links, ...sourceLinks].filter((link, index, items) => link && items.findIndex((candidate) => candidate.href === link.href) === index);
    if (allLinks.length) {
      const group = document.createElement('div');
      group.className = 'links';
      const label = document.createElement('span');
      label.className = 'sourceLabel';
      label.textContent = copy.sources;
      group.append(label);
      for (const link of allLinks.slice(0, 4)) {
        const href = safeHref(link.href);
        if (!href) continue;
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = String(link.label || copy.sources).slice(0, 80);
        if (href.startsWith('https://www.youtube.com/watch?v=')) anchor.classList.add('videoLink');
        if (href.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
        group.append(anchor);
      }
      if (group.childElementCount > 1) conversation.append(group);
    }
    conversation.parentElement.scrollTop = conversation.parentElement.scrollHeight;
    return item;
  }

  function safeHref(value) {
    if (typeof value !== 'string') return '';
    if (/^\/[a-z0-9/_?=&.-]*$/i.test(value)) return value;
    if (value.startsWith('https://apps.microsoft.com/detail/9N3P9F5ZKR5S')) return value;
    if (/^https:\/\/www\.youtube\.com\/watch\?v=[a-z0-9_-]{11}$/i.test(value)) return value;
    if (value === 'mailto:alika.destek@gmail.com') return value;
    return '';
  }

  function showConversation() {
    consent.hidden = true;
    conversation.hidden = false;
    form.hidden = false;
    if (!conversation.childElementCount) {
      addMessage('assistant', copy.hello);
      const quick = document.createElement('div');
      quick.className = 'quick';
      [copy.q1, copy.q2, copy.q3].forEach((question) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = question;
        button.addEventListener('click', () => submitQuestion(question));
        quick.append(button);
      });
      conversation.append(quick);
    }
    window.setTimeout(() => input.focus(), 0);
  }

  function hasConsent() {
    try { return sessionStorage.getItem('alika-ai-consent-v1') === 'yes'; } catch { return false; }
  }

  function openPanel() {
    nudge.remove();
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (hasConsent()) showConversation();
    else window.setTimeout(() => consentButton.focus(), 0);
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  async function submitQuestion(question) {
    const message = String(question || '').trim();
    if (busy || message.length < 2) return;
    busy = true;
    input.value = '';
    send.disabled = true;
    addMessage('user', message);
    const waiting = addMessage('assistant waiting', copy.sending);
    try {
      const response = await fetch(`${endpoint}/v1/chat`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: lang, pagePath: location.pathname, history: history.slice(-6), website: form.elements.website.value }),
      });
      const data = await response.json().catch(() => ({}));
      waiting.remove();
      if (!response.ok) {
        addMessage('assistant', response.status === 429 ? copy.limit : copy.error, [{ label: copy.sources, href: lang === 'tr' ? '/contact/' : `/${lang}/contact/` }]);
        return;
      }
      addMessage('assistant', data.answer, data.actions, data.sources);
      history.push({ role: 'user', text: message }, { role: 'assistant', text: data.answer });
      if (data.followUp) {
        const quick = document.createElement('div');
        quick.className = 'quick';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = data.followUp;
        button.addEventListener('click', () => submitQuestion(data.followUp));
        quick.append(button);
        conversation.append(quick);
      }
    } catch {
      waiting.remove();
      addMessage('assistant', copy.error, [{ label: copy.sources, href: lang === 'tr' ? '/contact/' : `/${lang}/contact/` }]);
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  nudge.addEventListener('click', openPanel);
  closeButton.addEventListener('click', closePanel);
  consentButton.addEventListener('click', () => {
    try { sessionStorage.setItem('alika-ai-consent-v1', 'yes'); } catch { /* Session storage may be unavailable. */ }
    showConversation();
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); submitQuestion(input.value); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });
})();
