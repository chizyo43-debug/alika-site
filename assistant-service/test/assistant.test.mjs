import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssistantClient,
  parseModelResponse,
  retrieveConversationKnowledge,
  retrieveKnowledge,
} from '../src/assistant.mjs';
import { retrieveVideoGuide } from '../src/video-guides.mjs';

test('retrieval prioritizes pricing facts', () => {
  const results = retrieveKnowledge('Fiyatı ne kadar, deneme var mı?', 4);
  assert.equal(results[0].id, 'pricing');
});

test('retrieval prioritizes privacy facts', () => {
  const results = retrieveKnowledge('Çocuğumun verileri buluta gidiyor mu?', 4);
  assert.equal(results[0].id, 'privacy');
});

test('retrieval does not pad a specific answer with generic marketing facts', () => {
  const results = retrieveKnowledge('İnternet kesilirse AliKa çevrimdışı çalışır mı?', 5);
  assert.equal(results[0].id, 'privacy');
  assert.equal(results.some((item) => item.id === 'marketing-fit'), false);
  assert.equal(results.some((item) => item.id === 'installation-support'), false);
});

test('retrieval uses recent user context for a short follow-up', () => {
  const results = retrieveConversationKnowledge('Peki bunu nasıl ayarlarım?', [
    { role: 'user', text: 'Android telefonda uygulama süre sınırı koyabilir miyim?' },
    { role: 'assistant', text: 'Evet, ebeveyn rolünden yönetebilirsiniz.' },
  ], 5);
  assert.equal(results[0].id, 'manual-android-rules');
  assert.equal(results.some((item) => item.id === 'android'), true);
  assert.equal(results.some((item) => item.id === 'overview'), false);
});

test('retrieval finds detailed Windows menu instructions', () => {
  const results = retrieveKnowledge('Windows uygulamasına süre limiti nereden eklenir?', 5);
  assert.equal(results[0].platform, 'windows');
  assert.equal(results.some((item) => item.id === 'manual-windows-app-site-rules'), true);
});

test('retrieval finds Android shared-device instructions without mixing Windows menus', () => {
  const results = retrieveKnowledge('Android telefonumu çocuk modunda nasıl paylaşırım?', 6);
  assert.equal(results[0].id, 'manual-android-sharing');
  assert.equal(results[0].platform, 'android');
  assert.equal(results.slice(0, 3).some((item) => item.platform === 'windows'), false);
});

test('family resistance questions use the specific coaching facts', () => {
  const results = retrieveKnowledge('Çocuğum karşı çıkıyor, kavga etmeden nasıl anlatırım?', 4);
  assert.equal(results[0].id, 'family-coaching');
});

test('family fit questions retrieve the verified assessment framework', () => {
  const results = retrieveKnowledge('AliKa aileme uygun mu, satın almalı mıyım?', 5);
  assert.equal(results[0].id, 'manual-family-fit-assessment');
});

test('family balance requests retrieve the verified planning framework', () => {
  const results = retrieveKnowledge('Okul günü ve hafta sonu için dijital denge planı hazırla', 5);
  assert.equal(results[0].id, 'manual-family-balance-plan');
});

test('video retrieval opens the exact Turkish guide for the requested task', () => {
  const installationArticles = retrieveKnowledge('Windows kurulumu ve ilk ayarlar', 4);
  const installation = retrieveVideoGuide('Windows uygulamasını nasıl kurarım?', [], 'tr', installationArticles);
  assert.equal(installation?.key, 'windows-installation');
  assert.equal(installation?.href, 'https://www.youtube.com/watch?v=RZDOb072nyk');

  const taskArticles = retrieveKnowledge('görev ödev sınav oluşturma', 4);
  const task = retrieveVideoGuide('Görev ve sınav nasıl oluşturulur?', [], 'tr', taskArticles);
  assert.equal(task?.key, 'windows-task-homework-exam');
  assert.equal(task?.href, 'https://www.youtube.com/watch?v=XjlLQnRvyjY');
});

test('video retrieval ignores generic site browsing and finds the exact app-limit guide', () => {
  const genericArticles = retrieveKnowledge('Özellikleri görmek istiyorum', 4);
  const generic = retrieveVideoGuide(
    'Özellikleri görmek istiyorum',
    [{ role: 'user', text: 'İhtiyacıma göre AliKa sitesini birlikte gezmek istiyorum.' }],
    'tr',
    genericArticles,
  );
  assert.equal(generic, null);

  const ruleArticles = retrieveKnowledge('Windows bilgisayarda YouTube uygulamasına süre sınırı koyma', 4);
  const exact = retrieveVideoGuide(
    'Windows bilgisayarda YouTube uygulamasına süre sınırı koyma videosu',
    [],
    'tr',
    ruleArticles,
  );
  assert.equal(exact?.key, 'windows-child-rules');
});

test('video retrieval uses the selected language and suppresses Windows guides for Android', () => {
  const japanese = retrieveVideoGuide('Windowsへのインストール方法を動画で見たい', [], 'ja', []);
  assert.equal(japanese?.key, 'windows-installation');
  assert.equal(japanese?.href, 'https://www.youtube.com/watch?v=VNCzShdldOw');

  const androidArticles = retrieveKnowledge('Android telefonda uygulama limiti', 4);
  assert.equal(retrieveVideoGuide('Android telefonda uygulama limiti nasıl eklenir?', [], 'tr', androidArticles), null);
  assert.equal(retrieveVideoGuide('Aile içinde çatışma yaşıyoruz', [], 'tr', []), null);
});

test('verified video action is added and unlisted YouTube URLs are rejected', () => {
  const articles = retrieveKnowledge('Windows soru çözerek süre kazanma', 4);
  const video = retrieveVideoGuide('Windows soru çözerek süre kazanmayı göster', [], 'tr', articles);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Soru ekranında doğru cevap kontrollü süre kazandırabilir.',
    actions: [{ label: 'Yanlış video', href: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' }],
    followUp: '',
  }), articles, 'tr', video);
  assert.deepEqual(result.actions, [
    { label: video.label, href: 'https://www.youtube.com/watch?v=cMxuoJaG77E' },
    { label: 'Soru sistemi rehberi', href: '/rehber/soru-cozerek-ekran-suresi-kazanma/' },
  ]);
});

test('model actions are restricted to retrieved AliKa links', () => {
  const articles = retrieveKnowledge('fiyat deneme', 3);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Yedi günlük deneme vardır.',
    actions: [
      { label: 'İndir', href: '/downloads/' },
      { label: 'Aynı adres', href: '/downloads/' },
      { label: 'Kötü bağlantı', href: 'https://example.com/phishing' },
    ],
    followUp: '',
  }), articles, 'tr');
  assert.deepEqual(result.actions, [{ label: 'İndir', href: '/downloads/' }]);
  assert.ok(result.sources.length > 0);
});

test('the primary verified page is added even when the model chooses a secondary page', () => {
  const articles = retrieveKnowledge('Android telefonda YouTube için süre sınırı nereden eklenir?', 5);
  assert.equal(articles[0].id, 'manual-android-rules');
  const result = parseModelResponse(JSON.stringify({
    answer: 'Kurallar ekranından uygulama limiti ekleyebilirsiniz.',
    actions: [{ label: 'Genel ekosistem', href: '/ecosystem/' }],
    followUp: '',
    emailSubject: '',
    emailBody: '',
  }), articles, 'tr');
  assert.deepEqual(result.actions[0], { label: 'Android kuralları', href: '/features/' });
  assert.equal(result.actions.some((item) => item.href === '/ecosystem/'), true);
});

test('the exact verified video stays ahead of the primary page', () => {
  const articles = retrieveKnowledge('Windows kurulumu nasıl yapılır?', 5);
  const video = retrieveVideoGuide('Windows kurulum videosunu aç', [], 'tr', articles);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Kurulum rehberini izleyebilirsiniz.',
    actions: [
      { label: 'Kurulum sayfası', href: articles[0].links[0].href },
      { label: 'Kurulum videosu', href: video.href },
    ],
    followUp: '',
    emailSubject: '',
    emailBody: '',
  }), articles, 'tr', video);
  assert.equal(result.actions[0].href, video.href);
  assert.equal(result.actions[1].href, articles[0].links[0].href);
});

test('critical help questions resolve to the expected product section', () => {
  const cases = [
    ['Windows haftalık süre planını nasıl ayarlarım?', 'manual-windows-rules-time', 'windows'],
    ['Windows çocuğa hızlı 15 dakika nasıl verilir?', 'manual-windows-panel', 'windows'],
    ['Windows çocuk profili nereden eklenir?', 'manual-windows-profiles', 'windows'],
    ['Windows web ve video geçmişi ne kaydediyor?', 'manual-windows-reports', 'windows'],
    ['Android telefonda YouTube limiti nasıl eklenir?', 'manual-android-rules', 'android'],
    ['Android yerel VPN web filtresi nasıl açılır?', 'manual-android-web-filter', 'android'],
    ['Android telefonu çocuğa paylaşımlı modda nasıl veririm?', 'manual-android-sharing', 'android'],
    ['Android izinler ve koruma sağlığını nerede görürüm?', 'manual-android-reports-settings', 'android'],
    ['Windows ve Android cihazı QR ile nasıl eşleştiririm?', 'manual-cross-platform-pairing', 'cross-platform'],
    ['Kazanılan süreyi başka cihaza nasıl aktarırım?', 'manual-duration-economy', 'cross-platform'],
    ['Android TV aile panosu nerede?', 'manual-android-tv', 'android-tv'],
    ['Kural çalışmıyorsa hangi kontrolleri yapmalıyım?', 'manual-troubleshooting', 'all'],
  ];
  for (const [query, expectedId, expectedPlatform] of cases) {
    const result = retrieveKnowledge(query, 5)[0];
    assert.equal(result.id, expectedId, query);
    assert.equal(result.platform, expectedPlatform, query);
  }
});

test('localized internal links retain the selected language', () => {
  const articles = retrieveKnowledge('installation support', 3);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Open the guides.',
    actions: [{ label: 'Guides', href: '/en/how-it-works/' }],
    followUp: '',
  }), articles, 'en');
  assert.deepEqual(result.actions, [{ label: 'Guides', href: '/en/how-it-works/' }]);
});

test('a guided follow-up question is not repeated inside the answer', () => {
  const result = parseModelResponse(JSON.stringify({
    answer: 'Windows 11 AliKa tarafından desteklenir. Çocuğunuzun yaş grubunu paylaşabilir misiniz?',
    actions: [],
    followUp: 'Çocuğunuzun yaş grubu nedir?',
  }), [], 'tr');
  assert.equal(result.answer, 'Windows 11 AliKa tarafından desteklenir.');
  assert.equal(result.followUp, 'Çocuğunuzun yaş grubu nedir?');
});

test('completed feedback returns a sanitized email draft only for the feedback journey', () => {
  const response = JSON.stringify({
    answer: 'Taslağı hazırladım; göndermeden önce kontrol edin.',
    actions: [{ label: 'Beklenmeyen bağlantı', href: '/contact/' }],
    followUp: '',
    emailSubject: '[AliKa Sorun Bildirimi]\r\nWindows süre ekranı',
    emailBody: 'Merhaba AliKa ekibi,\n\nWindows süre ekranı açılmıyor.\0',
  });
  const feedback = parseModelResponse(response, [], 'tr', null, 'feedback');
  assert.deepEqual(feedback.emailDraft, {
    subject: '[AliKa Sorun Bildirimi] Windows süre ekranı',
    body: 'Merhaba AliKa ekibi,\n\nWindows süre ekranı açılmıyor.',
  });
  assert.deepEqual(feedback.actions, []);
  assert.deepEqual(feedback.sources, []);
  assert.equal(parseModelResponse(response, [], 'tr').emailDraft, null);
});

test('feedback does not expose an email draft while another question is required', () => {
  const result = parseModelResponse(JSON.stringify({
    answer: 'Türü not ettim.',
    actions: [],
    followUp: 'Sorun hangi platformda yaşanıyor?',
    emailSubject: '[AliKa Sorun Bildirimi] Eksik taslak',
    emailBody: 'Henüz tamamlanmadı.',
  }), [], 'tr', null, 'feedback');
  assert.equal(result.emailDraft, null);
});

test('assistant uses the reasoning model and anti-template conversation rules', async () => {
  let request;
  const fakeClient = {
    models: {
      async generateContent(value) {
        request = value;
        return { text: JSON.stringify({ answer: 'Net yanıt.', actions: [], followUp: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });

  await assistant.answer({ message: 'Ailemiz için bir başlangıç planı hazırlayalım.', language: 'tr', journey: 'plan' });

  assert.equal(request.model, 'gemini-3.5-flash');
  assert.equal(request.config.temperature, 1);
  assert.equal(request.config.maxOutputTokens, 2200);
  assert.equal(request.config.thinkingConfig.thinkingLevel, 'LOW');
  assert.match(request.config.systemInstruction, /evidence, not as a script/);
  assert.match(request.config.systemInstruction, /followUp to an empty string by default/);
  assert.match(request.config.systemInstruction, /Never use stock praise/);
  assert.match(request.config.systemInstruction, /Do not invent screen names/);
  assert.match(request.config.systemInstruction, /Never mix Windows, Android and Android TV menus/);
  assert.match(request.config.systemInstruction, /Do not mention an account login/);
  assert.match(request.config.systemInstruction, /Never imply that AliKa replaces parental communication/);
  assert.match(request.config.systemInstruction, /RECOMMENDED VERIFIED VIDEO GUIDE/);
  assert.match(request.config.systemInstruction, /ACTIVE GUIDED JOURNEY/);
  assert.match(request.config.systemInstruction, /exactly one information item per question/);
  assert.match(request.config.systemInstruction, /Strong fit/);
  assert.match(request.config.systemInstruction, /two-step low-friction start/);
  assert.match(request.config.systemInstruction, /do not sell around the mismatch/);
  assert.match(request.config.systemInstruction, /separately labelled learning, free-screen-time, screen-free-break and wind-down blocks/);
  assert.match(request.config.systemInstruction, /one simple review point after the first week/);
  assert.match(request.config.systemInstruction, /help the visitor prepare either an issue report or an improvement idea/);
  assert.match(request.config.systemInstruction, /do not tell the visitor to copy it manually/);
  assert.match(request.contents.at(-1).parts[0].text, /ACTIVE GUIDED JOURNEY: plan/);
});

test('plan journey carries all answers into a bounded final-plan prompt', async () => {
  const requests = [];
  const fakeClient = {
    models: {
      async generateContent(value) {
        requests.push(value);
        return { text: JSON.stringify({ answer: 'Başlangıç planı.', actions: [], followUp: '', emailSubject: '', emailBody: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });

  await assistant.answer({
    message: 'İlkokul, 8-11 yaş',
    language: 'tr',
    journey: 'plan',
    history: [
      { role: 'user', text: 'Ailemiz için dijital denge başlangıç planı hazırlayalım.' },
      { role: 'assistant', text: 'Plan hangi yaş grubu için?' },
    ],
  });
  await assistant.answer({
    message: 'Hafta içi 16:00 evde, 17:00 ödev; hafta sonu sabah serbest.',
    language: 'tr',
    journey: 'plan',
    history: [
      { role: 'user', text: 'Ailemiz için dijital denge başlangıç planı hazırlayalım.' },
      { role: 'assistant', text: 'Plan hangi yaş grubu için?' },
      { role: 'user', text: 'İlkokul, 8-11 yaş' },
      { role: 'assistant', text: 'Okul günü ve hafta sonu ritminiz nasıl?' },
    ],
  });
  await assistant.answer({
    message: 'Ödevin önce gelmesi ve akşam tartışmasının azalması',
    language: 'tr',
    journey: 'plan',
    history: [
      { role: 'user', text: 'Ailemiz için dijital denge başlangıç planı hazırlayalım.' },
      { role: 'assistant', text: 'Plan hangi yaş grubu için?' },
      { role: 'user', text: 'İlkokul, 8-11 yaş' },
      { role: 'assistant', text: 'Okul günü ve hafta sonu ritminiz nasıl?' },
      { role: 'user', text: 'Hafta içi 16:00 evde, 17:00 ödev; hafta sonu sabah serbest.' },
      { role: 'assistant', text: 'Ailenizin tek ana önceliği nedir?' },
    ],
  });

  assert.match(requests[0].contents.at(-1).parts[0].text, /JOURNEY PROGRESS: \{"visitorAnswersReceived":1,"maximumVisitorAnswers":3\}/);
  assert.match(requests[0].contents.at(-1).parts[0].text, /Ask only for the school-day\/weekend rhythm now/);
  assert.match(requests[1].contents.at(-1).parts[0].text, /Ask only for the single family priority now/);
  const finalPrompt = requests[2].contents.at(-1).parts[0].text;
  assert.match(finalPrompt, /JOURNEY PROGRESS: \{"visitorAnswersReceived":3,"maximumVisitorAnswers":3\}/);
  assert.match(finalPrompt, /Write the completed tailored plan now/);
  assert.match(finalPrompt, /manual-family-balance-plan/);
  assert.equal(
    requests[2].contents.some((item) =>
      item.parts?.some((part) => part.text.includes('Hafta içi 16:00 evde')),
    ),
    true,
  );
});

test('fit journey tells the model when to ask and when to conclude', async () => {
  const requests = [];
  const fakeClient = {
    models: {
      async generateContent(value) {
        requests.push(value);
        return { text: JSON.stringify({ answer: 'Değerlendirme.', actions: [], followUp: '', emailSubject: '', emailBody: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });

  await assistant.answer({
    message: 'Windows bilgisayar',
    language: 'tr',
    journey: 'fit',
    history: [
      { role: 'user', text: 'AliKa aileme uygun mu, birlikte değerlendirelim.' },
      { role: 'assistant', text: 'Hangi cihazda kullanacaksınız?' },
    ],
  });
  await assistant.answer({
    message: 'Ekran süresi tartışmasını azaltmak',
    language: 'tr',
    journey: 'fit',
    history: [
      { role: 'user', text: 'AliKa aileme uygun mu, birlikte değerlendirelim.' },
      { role: 'assistant', text: 'Hangi cihazda kullanacaksınız?' },
      { role: 'user', text: 'Windows bilgisayar' },
      { role: 'assistant', text: 'Hangi yaş grubu?' },
      { role: 'user', text: '8-11 yaş' },
      { role: 'assistant', text: 'Ailenizin ana hedefi nedir?' },
    ],
  });

  assert.match(requests[0].contents.at(-1).parts[0].text, /JOURNEY PROGRESS: \{"visitorAnswersReceived":1,"maximumVisitorAnswers":3\}/);
  assert.match(requests[1].contents.at(-1).parts[0].text, /JOURNEY PROGRESS: \{"visitorAnswersReceived":3,"maximumVisitorAnswers":3\}/);
  assert.match(requests[1].contents.at(-1).parts[0].text, /manual-family-fit-assessment/);
});

test('assistant supplies verified menu paths and ordered steps to the model', async () => {
  let request;
  const fakeClient = {
    models: {
      async generateContent(value) {
        request = value;
        return { text: JSON.stringify({ answer: 'Kurallar ekranını açın.', actions: [], followUp: '', emailSubject: '', emailBody: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });
  await assistant.answer({ message: 'Android telefonda YouTube için süre sınırı nasıl koyarım?', language: 'tr' });
  const prompt = request.contents.at(-1).parts[0].text;
  assert.match(prompt, /manual-android-rules/);
  assert.match(prompt, /Kurallar → Ayrıntılı kurallar/);
  assert.match(prompt, /Uygulama süre limitleri → Uygulama limiti ekle/);
});

test('feedback journey requests structured email fields and suppresses video suggestions', async () => {
  let request;
  const fakeClient = {
    models: {
      async generateContent(value) {
        request = value;
        return { text: JSON.stringify({
          answer: 'Taslağı hazırladım; göndermeden önce kontrol edin.',
          actions: [],
          followUp: '',
          emailSubject: '[AliKa Geliştirme Fikri] Daha açık süre özeti',
          emailBody: 'Merhaba AliKa ekibi,\n\nSüre özetinin daha açık olmasını öneriyorum.\n\nBu taslak AliKa site asistanı yardımıyla hazırlanmıştır.',
        }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });
  const result = await assistant.answer({ message: 'Süre özeti için fikrim var.', language: 'tr', journey: 'feedback' });

  assert.equal(request.config.responseSchema.required.includes('emailSubject'), true);
  assert.equal(request.config.responseSchema.required.includes('emailBody'), true);
  assert.match(request.contents.at(-1).parts[0].text, /ACTIVE GUIDED JOURNEY: feedback/);
  assert.match(request.contents.at(-1).parts[0].text, /RECOMMENDED VERIFIED VIDEO GUIDE:\nnull/);
  assert.equal(result.emailDraft.subject, '[AliKa Geliştirme Fikri] Daha açık süre özeti');
});

test('site tour is grounded in the current page and does not invent an opening video', async () => {
  let request;
  const fakeClient = {
    models: {
      async generateContent(value) {
        request = value;
        return { text: JSON.stringify({ answer: 'Bu sayfa gizlilik yaklaşımını açıklar.', actions: [], followUp: 'En çok hangi konuyu bulmak istiyorsunuz?' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });
  const result = await assistant.answer({ message: 'Siteyi birlikte gezelim.', language: 'tr', pagePath: '/privacy/', journey: 'tour' });
  const prompt = request.contents.at(-1).parts[0].text;
  assert.match(prompt, /"id":"privacy"/);
  assert.match(prompt, /RECOMMENDED VERIFIED VIDEO GUIDE:\nnull/);
  assert.deepEqual(result.actions, []);
  assert.deepEqual(result.sources, []);
});

test('site tour routes common goals to one correct primary destination', async () => {
  const fakeClient = {
    models: {
      async generateContent() {
        return { text: JSON.stringify({ answer: 'Doğru bölümü buldum.', actions: [], followUp: '', emailSubject: '', emailBody: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });
  const history = [
    { role: 'user', text: 'İhtiyacıma göre AliKa sitesini birlikte gezmek istiyorum.' },
    { role: 'assistant', text: 'Sitede en çok neyi bulmak istiyorsunuz?' },
  ];
  const cases = [
    ['Özellikleri görmek istiyorum', '/features/'],
    ['Fiyat ve deneme bilgisi', '/downloads/'],
    ['Gizlilik ve verilerin nerede tutulduğu', '/privacy/'],
    ['Yaş gruplarını karşılaştırmak istiyorum', '/age-groups/'],
    ['Güncel ürün durumu ve yol haritası', '/roadmap/'],
  ];

  for (const [message, expectedHref] of cases) {
    const result = await assistant.answer({ message, history, language: 'tr', pagePath: '/', journey: 'tour' });
    assert.equal(result.actions[0]?.href, expectedHref, message);
  }
});

test('site tour puts the exact verified Windows task video first', async () => {
  const fakeClient = {
    models: {
      async generateContent() {
        return { text: JSON.stringify({ answer: 'Bu video doğrudan uygulama sınırı ekranını gösterir.', actions: [], followUp: '', emailSubject: '', emailBody: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });
  const result = await assistant.answer({
    message: 'Windows bilgisayarda YouTube uygulamasına süre sınırı koyma videosu',
    language: 'tr',
    pagePath: '/',
    journey: 'tour',
    history: [
      { role: 'user', text: 'İhtiyacıma göre AliKa sitesini birlikte gezmek istiyorum.' },
      { role: 'assistant', text: 'Hangi işlemi yapmak istiyorsunuz?' },
    ],
  });
  assert.equal(result.actions[0]?.href, 'https://www.youtube.com/watch?v=sXvHkeOegIo');
});

test('site tour asks for a concrete task instead of guessing a vague video', async () => {
  const assistant = createAssistantClient({}, {
    client: { models: { async generateContent() { throw new Error('model should not be called'); } } },
  });
  const result = await assistant.answer({
    message: 'Sadece bir kullanım videosu arıyorum',
    language: 'tr',
    pagePath: '/',
    journey: 'tour',
    history: [],
  });
  assert.match(result.followUp, /Hangi işlemi/);
  assert.deepEqual(result.actions, []);
  assert.deepEqual(result.sources, []);
});
