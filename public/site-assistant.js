(() => {
  'use strict';

  const config = window.ALIKA_ASSISTANT_CONFIG || {};
  const endpoint = typeof config.endpoint === 'string' ? config.endpoint.replace(/\/+$/, '') : '';
  if (!endpoint || (!endpoint.startsWith('https://') && !endpoint.startsWith('http://localhost'))) return;

  const language = (document.documentElement.lang || 'tr').slice(0, 2).toLowerCase();
  const supported = new Set(['tr', 'en', 'de', 'es', 'fr', 'pt', 'ru', 'ja', 'ko']);
  const lang = supported.has(language) ? language : 'tr';
  const EVIDENCE_COPY = {
    tr: { actions: 'Önerilen bağlantılar', sources: 'Doğrulanmış kaynaklar', verified: 'Son doğrulama', guide: 'Program kılavuzu', page: 'Site sayfası', video: 'Eğitim videosu', all: 'AliKa geneli', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Cihazlar arası' },
    en: { actions: 'Suggested links', sources: 'Verified sources', verified: 'Last verified', guide: 'Product guide', page: 'Site page', video: 'Tutorial video', all: 'AliKa overall', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Cross-device' },
    de: { actions: 'Empfohlene Links', sources: 'Verifizierte Quellen', verified: 'Zuletzt geprüft', guide: 'Produkthandbuch', page: 'Webseite', video: 'Anleitungsvideo', all: 'AliKa allgemein', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Geräteübergreifend' },
    es: { actions: 'Enlaces sugeridos', sources: 'Fuentes verificadas', verified: 'Última verificación', guide: 'Guía del producto', page: 'Página web', video: 'Vídeo tutorial', all: 'AliKa general', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Entre dispositivos' },
    fr: { actions: 'Liens suggérés', sources: 'Sources vérifiées', verified: 'Dernière vérification', guide: 'Guide du produit', page: 'Page du site', video: 'Tutoriel vidéo', all: 'AliKa général', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Entre appareils' },
    pt: { actions: 'Ligações sugeridas', sources: 'Fontes verificadas', verified: 'Última verificação', guide: 'Guia do produto', page: 'Página do site', video: 'Vídeo de instruções', all: 'AliKa geral', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Entre dispositivos' },
    ru: { actions: 'Рекомендуемые ссылки', sources: 'Проверенные источники', verified: 'Последняя проверка', guide: 'Руководство по продукту', page: 'Страница сайта', video: 'Обучающее видео', all: 'Общие сведения AliKa', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'Между устройствами' },
    ja: { actions: 'おすすめリンク', sources: '検証済みの情報源', verified: '最終確認', guide: '製品ガイド', page: 'サイトページ', video: '解説動画', all: 'AliKa全般', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': 'デバイス間' },
    ko: { actions: '추천 링크', sources: '검증된 출처', verified: '최종 확인', guide: '제품 가이드', page: '사이트 페이지', video: '사용 안내 영상', all: 'AliKa 전체', windows: 'Windows', android: 'Android', 'android-tv': 'Android TV', 'cross-platform': '기기 간' },
  };
  const evidenceCopy = EVIDENCE_COPY[lang];
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
    tr: ['30 saniyede doğru yolu bulun', 'Ailenize uygun özellik, plan ve videoyu birlikte seçelim.'],
    en: ['Find the right path in 30 seconds', 'Choose the right feature, plan and video for your family.'],
    de: ['Passt AliKa zu Ihrer Familie?', 'Fragen Sie den KI-Assistenten nach Funktionen und Preis.'],
    es: ['¿AliKa encaja con su familia?', 'Pregunte al asistente de IA por funciones y precio.'],
    fr: ['AliKa convient-il à votre famille ?', 'Demandez les fonctions et le prix à l’assistant IA.'],
    pt: ['A AliKa é adequada à sua família?', 'Pergunte ao assistente de IA sobre funções e preço.'],
    ru: ['Подойдёт ли AliKa вашей семье?', 'Спросите ИИ-помощника о функциях и цене.'],
    ja: ['AliKaはご家庭に合いますか？', '機能や価格をAIアシスタントに質問できます。'],
    ko: ['AliKa가 우리 가족에게 맞을까요?', '기능과 가격을 AI 도우미에게 물어보세요.'],
  };
  const JOURNEY_COPY = {
    tr: { heading: 'Nereden başlayalım?', fitTitle: 'AliKa aileme uygun mu?', fitDesc: 'Cihaz ve hedeflerinize göre dürüst değerlendirme', fitPrompt: 'AliKa aileme uygun mu, birlikte değerlendirelim.', fitQuestion: 'AliKa’yı hangi cihazda kullanmayı düşünüyorsunuz: Windows bilgisayar, Android telefon/tablet veya Android TV?', planTitle: 'Dijital denge planı hazırla', planDesc: 'Ailenize göre esnek bir başlangıç rutini', planPrompt: 'Ailemiz için dijital denge başlangıç planı hazırlayalım.', planQuestion: 'Planı hangi geniş yaş grubu için hazırlayalım: okul öncesi, ilkokul, ortaokul veya lise?', tourTitle: 'Siteyi birlikte gez', tourDesc: 'Doğru sayfayı ve kullanım videosunu bulun', tourPrompt: 'İhtiyacıma göre AliKa sitesini birlikte gezmek istiyorum.', tourQuestion: 'Sitede en çok neyi bulmak istiyorsunuz: özellikler, kurulum, fiyat, gizlilik veya kullanım videosu?', feedbackTitle: 'Sorun veya fikir gönder', feedbackDesc: 'Yapay zekâyla düzenleyin, e-postanızdan gönderin', feedbackPrompt: 'AliKa ekibine güvenli bir sorun bildirimi veya geliştirme fikri hazırlamak istiyorum.', feedbackQuestion: 'Bu bir sorun bildirimi mi, yoksa geliştirme fikri mi?', draftTitle: 'E-posta taslağınız hazır', draftSubject: 'Konu', draftNote: 'Metni kontrol edin; düğme yalnızca e-posta uygulamanızı açar. Gönderme işlemi size aittir.', draftOpen: 'E-postada aç ve gönder', restart: 'Yeni görüşme', next: 'Sıradaki kısa soru' },
    en: { heading: 'Where shall we start?', fitTitle: 'Is AliKa right for us?', fitDesc: 'An honest fit check for your devices and goals', fitPrompt: 'Help me assess whether AliKa fits my family.', fitQuestion: 'Which device would use AliKa: a Windows computer, Android phone/tablet, or Android TV?', planTitle: 'Create a balance plan', planDesc: 'A flexible starter routine for your family', planPrompt: 'Let us create a digital balance starter plan for my family.', planQuestion: 'Which broad age group is this plan for: preschool, primary, middle school, or teen?', tourTitle: 'Guide me through the site', tourDesc: 'Find the right page and how-to video', tourPrompt: 'Guide me through the AliKa site based on what I need.', tourQuestion: 'What do you most want to find: features, setup, pricing, privacy, or a how-to video?', feedbackTitle: 'Send an issue or idea', feedbackDesc: 'Refine it with AI, then send from your email', feedbackPrompt: 'I want to prepare a safe issue report or improvement idea for the AliKa team.', feedbackQuestion: 'Is this an issue report or an improvement idea?', draftTitle: 'Your email draft is ready', draftSubject: 'Subject', draftNote: 'Review the text first; the button only opens your email app. You choose whether to send it.', draftOpen: 'Open in email and send', restart: 'New conversation', next: 'One short question' },
    de: { heading: 'Womit möchten Sie beginnen?', fitTitle: 'Passt AliKa zu uns?', fitDesc: 'Ehrliche Einschätzung nach Geräten und Zielen', fitPrompt: 'Prüfen wir gemeinsam, ob AliKa zu meiner Familie passt.', fitQuestion: 'Auf welchem Gerät soll AliKa laufen: Windows-PC, Android-Handy/Tablet oder Android TV?', planTitle: 'Balanceplan erstellen', planDesc: 'Ein flexibler Startplan für Ihre Familie', planPrompt: 'Erstellen wir einen digitalen Balanceplan für meine Familie.', planQuestion: 'Für welche Altersgruppe ist der Plan: Vorschule, Grundschule, Mittelstufe oder Jugendliche?', tourTitle: 'Website gemeinsam erkunden', tourDesc: 'Die richtige Seite und Anleitung finden', tourPrompt: 'Führen Sie mich passend zu meinem Bedarf durch die AliKa-Website.', tourQuestion: 'Was möchten Sie finden: Funktionen, Einrichtung, Preis, Datenschutz oder ein Anleitungsvideo?', feedbackTitle: 'Problem oder Idee senden', feedbackDesc: 'Mit KI formulieren und per E-Mail senden', feedbackPrompt: 'Ich möchte einen sicheren Problembericht oder Verbesserungsvorschlag für das AliKa-Team vorbereiten.', feedbackQuestion: 'Handelt es sich um einen Problembericht oder eine Verbesserungsidee?', draftTitle: 'Ihr E-Mail-Entwurf ist fertig', draftSubject: 'Betreff', draftNote: 'Prüfen Sie den Text; die Schaltfläche öffnet nur Ihre E-Mail-App. Sie entscheiden über das Senden.', draftOpen: 'In E-Mail öffnen und senden', restart: 'Neues Gespräch', next: 'Eine kurze Frage' },
    es: { heading: '¿Por dónde empezamos?', fitTitle: '¿AliKa encaja con nosotros?', fitDesc: 'Evaluación honesta según dispositivos y objetivos', fitPrompt: 'Ayúdeme a evaluar si AliKa encaja con mi familia.', fitQuestion: '¿En qué dispositivo usaría AliKa: PC Windows, teléfono/tableta Android o Android TV?', planTitle: 'Crear un plan de equilibrio', planDesc: 'Una rutina inicial flexible para su familia', planPrompt: 'Preparemos un plan inicial de equilibrio digital para mi familia.', planQuestion: '¿Para qué grupo de edad es el plan: preescolar, primaria, secundaria o adolescente?', tourTitle: 'Recorrer el sitio juntos', tourDesc: 'Encuentre la página y el vídeo adecuados', tourPrompt: 'Guíeme por el sitio de AliKa según lo que necesito.', tourQuestion: '¿Qué desea encontrar: funciones, instalación, precio, privacidad o un vídeo de uso?', feedbackTitle: 'Enviar problema o idea', feedbackDesc: 'Mejórelo con IA y envíelo desde su correo', feedbackPrompt: 'Quiero preparar un informe seguro de problema o una idea de mejora para el equipo de AliKa.', feedbackQuestion: '¿Es un informe de problema o una idea de mejora?', draftTitle: 'Su borrador está listo', draftSubject: 'Asunto', draftNote: 'Revise el texto; el botón solo abre su aplicación de correo. Usted decide si lo envía.', draftOpen: 'Abrir en correo y enviar', restart: 'Nueva conversación', next: 'Una pregunta breve' },
    fr: { heading: 'Par où commencer ?', fitTitle: 'AliKa nous convient-il ?', fitDesc: 'Une évaluation honnête selon vos appareils et objectifs', fitPrompt: 'Aidez-moi à évaluer si AliKa convient à ma famille.', fitQuestion: 'Sur quel appareil utiliser AliKa : PC Windows, téléphone/tablette Android ou Android TV ?', planTitle: 'Créer un plan d’équilibre', planDesc: 'Une routine de départ souple pour votre famille', planPrompt: 'Créons un plan de départ pour l’équilibre numérique de ma famille.', planQuestion: 'Pour quel groupe d’âge : maternelle, primaire, collège ou adolescent ?', tourTitle: 'Explorer le site ensemble', tourDesc: 'Trouvez la bonne page et la bonne vidéo', tourPrompt: 'Guidez-moi sur le site AliKa selon mon besoin.', tourQuestion: 'Que cherchez-vous : fonctions, installation, prix, confidentialité ou vidéo pratique ?', feedbackTitle: 'Envoyer un problème ou une idée', feedbackDesc: 'Reformulez avec l’IA, puis envoyez par e-mail', feedbackPrompt: 'Je souhaite préparer un signalement sûr ou une idée d’amélioration pour l’équipe AliKa.', feedbackQuestion: 'S’agit-il d’un problème ou d’une idée d’amélioration ?', draftTitle: 'Votre brouillon est prêt', draftSubject: 'Objet', draftNote: 'Relisez le texte ; le bouton ouvre seulement votre messagerie. Vous décidez de l’envoi.', draftOpen: 'Ouvrir dans la messagerie', restart: 'Nouvelle conversation', next: 'Une question courte' },
    pt: { heading: 'Por onde começamos?', fitTitle: 'A AliKa é adequada para nós?', fitDesc: 'Avaliação honesta por dispositivos e objetivos', fitPrompt: 'Ajude-me a avaliar se a AliKa é adequada para a minha família.', fitQuestion: 'Em que dispositivo usaria a AliKa: PC Windows, telemóvel/tablet Android ou Android TV?', planTitle: 'Criar plano de equilíbrio', planDesc: 'Uma rotina inicial flexível para a sua família', planPrompt: 'Vamos criar um plano inicial de equilíbrio digital para a minha família.', planQuestion: 'Para que grupo etário: pré-escolar, primário, secundário ou adolescente?', tourTitle: 'Explorar o site em conjunto', tourDesc: 'Encontre a página e o vídeo certos', tourPrompt: 'Guie-me pelo site da AliKa conforme a minha necessidade.', tourQuestion: 'O que procura: funcionalidades, instalação, preço, privacidade ou vídeo de utilização?', feedbackTitle: 'Enviar problema ou ideia', feedbackDesc: 'Aperfeiçoe com IA e envie pelo seu e-mail', feedbackPrompt: 'Quero preparar um relato seguro de problema ou uma ideia de melhoria para a equipa AliKa.', feedbackQuestion: 'É um relato de problema ou uma ideia de melhoria?', draftTitle: 'O seu rascunho está pronto', draftSubject: 'Assunto', draftNote: 'Reveja o texto; o botão apenas abre a aplicação de e-mail. O envio depende de si.', draftOpen: 'Abrir no e-mail e enviar', restart: 'Nova conversa', next: 'Uma pergunta breve' },
    ru: { heading: 'С чего начнём?', fitTitle: 'Подойдёт ли нам AliKa?', fitDesc: 'Честная оценка по устройствам и целям', fitPrompt: 'Помогите понять, подходит ли AliKa моей семье.', fitQuestion: 'На каком устройстве нужна AliKa: ПК Windows, телефон/планшет Android или Android TV?', planTitle: 'Составить план баланса', planDesc: 'Гибкий стартовый распорядок для семьи', planPrompt: 'Составим стартовый план цифрового баланса для моей семьи.', planQuestion: 'Для какой возрастной группы: дошкольник, младшая, средняя или старшая школа?', tourTitle: 'Пройти по сайту вместе', tourDesc: 'Найдите нужную страницу и видео', tourPrompt: 'Проведите меня по сайту AliKa с учётом моей цели.', tourQuestion: 'Что вы хотите найти: функции, установку, цену, конфиденциальность или видео?', feedbackTitle: 'Отправить проблему или идею', feedbackDesc: 'Уточните с ИИ и отправьте из своей почты', feedbackPrompt: 'Я хочу безопасно подготовить сообщение о проблеме или идею улучшения для команды AliKa.', feedbackQuestion: 'Это сообщение о проблеме или идея улучшения?', draftTitle: 'Черновик письма готов', draftSubject: 'Тема', draftNote: 'Проверьте текст: кнопка только откроет почтовое приложение. Решение об отправке принимаете вы.', draftOpen: 'Открыть в почте и отправить', restart: 'Новый разговор', next: 'Один короткий вопрос' },
    ja: { heading: 'どこから始めますか？', fitTitle: 'AliKaはわが家に合う？', fitDesc: '端末と目的に合わせて正直にご案内', fitPrompt: 'AliKaがわが家に合うか一緒に確認したいです。', fitQuestion: '利用予定の端末はWindows PC、Androidスマホ／タブレット、Android TVのどれですか？', planTitle: 'デジタルバランス計画', planDesc: 'ご家庭に合う柔軟な最初の習慣', planPrompt: '家族向けのデジタルバランス開始プランを作りたいです。', planQuestion: '対象は未就学、小学生、中学生、高校生のどの年齢層ですか？', tourTitle: 'サイトを一緒に見る', tourDesc: '適切なページと使い方動画をご案内', tourPrompt: '目的に合わせてAliKaサイトを案内してください。', tourQuestion: '機能、設定、価格、プライバシー、使い方動画のうち何を探していますか？', feedbackTitle: '問題やアイデアを送る', feedbackDesc: 'AIで文章を整え、メールから送信', feedbackPrompt: 'AliKaチームへ安全な問題報告または改善案を作成したいです。', feedbackQuestion: '問題報告ですか、それとも改善案ですか？', draftTitle: 'メール下書きができました', draftSubject: '件名', draftNote: '内容を確認してください。ボタンはメールアプリを開くだけで、送信はご自身で行います。', draftOpen: 'メールで開いて送信', restart: '新しい会話', next: '次の短い質問' },
    ko: { heading: '어디서 시작할까요?', fitTitle: 'AliKa가 우리 가족에게 맞을까?', fitDesc: '기기와 목표에 맞춘 솔직한 안내', fitPrompt: 'AliKa가 우리 가족에게 맞는지 함께 확인하고 싶어요.', fitQuestion: '사용할 기기는 Windows PC, Android 휴대폰/태블릿, Android TV 중 무엇인가요?', planTitle: '디지털 균형 계획 만들기', planDesc: '가족에게 맞는 유연한 시작 루틴', planPrompt: '우리 가족을 위한 디지털 균형 시작 계획을 만들고 싶어요.', planQuestion: '계획 대상은 미취학, 초등학생, 중학생, 고등학생 중 어느 연령대인가요?', tourTitle: '사이트 함께 둘러보기', tourDesc: '알맞은 페이지와 사용 영상을 찾아보세요', tourPrompt: '필요에 맞게 AliKa 사이트를 안내해 주세요.', tourQuestion: '기능, 설치, 가격, 개인정보 보호, 사용 영상 중 무엇을 찾고 있나요?', feedbackTitle: '문제 또는 아이디어 보내기', feedbackDesc: 'AI로 다듬고 이메일에서 전송하세요', feedbackPrompt: 'AliKa 팀에 보낼 안전한 문제 보고서 또는 개선 아이디어를 준비하고 싶어요.', feedbackQuestion: '문제 신고인가요, 아니면 개선 아이디어인가요?', draftTitle: '이메일 초안이 준비됐어요', draftSubject: '제목', draftNote: '내용을 확인하세요. 버튼은 이메일 앱만 열며, 전송 여부는 사용자가 결정합니다.', draftOpen: '이메일에서 열어 보내기', restart: '새 대화', next: '다음 짧은 질문' },
  };
  const copy = COPY[lang];
  const nudgeCopy = NUDGE[lang];
  const journeyCopy = JOURNEY_COPY[lang];
  const host = document.createElement('div');
  host.id = 'alika-site-assistant';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{--navy:#07172d;--blue:#54c7ea;--gold:#e4b84c;--paper:#fffaf0;--ink:#14243a;position:fixed;z-index:2147483000;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));font-family:Nunito,'Segoe UI',system-ui,sans-serif;color:var(--ink)}
      *{box-sizing:border-box}[hidden]{display:none!important}.nudge{position:absolute;right:0;bottom:68px;display:grid;grid-template-columns:1fr auto;gap:12px;width:min(315px,calc(100vw - 24px));padding:14px 15px;border:1px solid #e4b84c80;border-radius:18px;color:#fff;background:linear-gradient(135deg,#102f52,#0b203a);box-shadow:0 18px 50px #07172d66;cursor:pointer;text-align:left}.nudge b,.nudge small{display:block}.nudge b{color:#ffe08a;font-size:13px}.nudge small{margin-top:4px;color:#e3edf4;font-size:11px;line-height:1.35}.nudge i{align-self:center;color:#59c5ea;font-size:22px;font-style:normal}.launcher{position:relative;display:flex;align-items:center;gap:9px;min-height:52px;padding:10px 16px 10px 11px;border:1px solid #ffffff2b;border-radius:999px;color:#fff;background:linear-gradient(135deg,#0a2140,#102f52);box-shadow:0 14px 38px #07172d55;cursor:pointer;font:800 14px/1 inherit}.launcher:after{position:absolute;top:-7px;right:8px;padding:3px 6px;border-radius:999px;content:'AI';color:#07172d;background:#ffe08a;box-shadow:0 4px 12px #07172d40;font-size:8px;font-weight:950;letter-spacing:.08em}.launcher img{width:32px;height:32px;border-radius:50%;object-fit:contain;background:#fff;padding:2px}.launcher:hover{transform:translateY(-1px);box-shadow:0 18px 42px #07172d66}.panel{position:absolute;right:0;bottom:66px;width:min(410px,calc(100vw - 24px));height:min(680px,calc(100vh - 104px));overflow:hidden;border:1px solid #ffffff26;border-radius:22px;background:var(--paper);box-shadow:0 24px 80px #06142670;display:grid;grid-template-rows:auto 1fr auto;transform-origin:bottom right}.head{display:flex;align-items:center;gap:10px;padding:14px 15px;color:#fff;background:linear-gradient(135deg,#081a33,#123b61)}.head img{width:38px;height:38px;object-fit:contain;border-radius:11px;background:#fff;padding:3px}.head>div:not(.headActions){min-width:0;flex:1}.head strong,.head small{display:block}.head strong{font-size:15px}.head small{margin-top:2px;color:#cfeaf4;font-size:11px}.headActions{display:flex;gap:6px}.headActions button{width:34px;height:34px;border:1px solid #ffffff2a;border-radius:50%;color:#fff;background:#ffffff0f;cursor:pointer;font-size:18px}.body{min-height:0;overflow:auto;padding:14px;scroll-behavior:smooth}.consent{display:grid;gap:13px;align-content:start;padding:7px 2px}.consentMark{display:grid;width:48px;height:48px;place-items:center;border-radius:16px;color:#08233c;background:#dff6fc;font-size:24px}.consent h2{margin:0;font-size:20px}.consent p{margin:0;color:#4b5b6c;font-size:13px;line-height:1.55}.consent button,.send{min-height:44px;border:0;border-radius:13px;color:#fff;background:#0d789d;cursor:pointer;font:800 13px/1 inherit}.conversation{display:grid;gap:11px}.message{max-width:88%;padding:10px 12px;border-radius:15px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.assistant{justify-self:start;border:1px solid #d9e3e8;background:#fff}.user{justify-self:end;color:#fff;background:#123d60}.waiting{color:#677789;font-style:italic}.links{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 3px}.links a{padding:8px 10px;border:1px solid #9acddd;border-radius:999px;color:#075c78;background:#effbfe;text-decoration:none;font-size:11px;font-weight:800}.links a.videoLink{border-color:#0d789d;color:#fff;background:#0d789d;box-shadow:0 6px 16px #0d789d30}.sourceLabel{width:100%;margin:4px 0 -1px;color:#71808d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.evidence{display:grid;gap:7px;margin:2px 0 5px;padding:10px;border:1px solid #d6e3e8;border-radius:14px;background:#f7fbfc}.evidence h3{margin:0;color:#516777;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.evidence a{display:grid;gap:4px;padding:8px 9px;border:1px solid #dbe8ec;border-radius:10px;color:#173952;background:#fff;text-decoration:none}.evidence a:hover,.evidence a:focus-visible{border-color:#4daeca;box-shadow:0 4px 12px #0d789d16;outline:none}.evidenceTitle{font-size:11px;font-weight:900;line-height:1.35}.evidenceMeta{color:#647886;font-size:9px;line-height:1.35}.journeys{display:grid;gap:8px}.journeyHeading{margin:3px 1px 0;color:#6c7a86;font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.journey{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;width:100%;padding:11px;border:1px solid #d7e6eb;border-radius:15px;color:#17324c;background:linear-gradient(135deg,#fff,#f4fbfd);cursor:pointer;text-align:left;font:inherit}.journey:hover,.journey:focus-visible{border-color:#55bddd;box-shadow:0 7px 20px #0d789d18;transform:translateY(-1px);outline:none}.journeyIcon{display:grid;width:36px;height:36px;place-items:center;border-radius:12px;color:#0c6380;background:#dff6fc;font-size:18px}.journey b,.journey small{display:block}.journey b{font-size:12px}.journey small{margin-top:3px;color:#667889;font-size:10px;line-height:1.35}.journeyArrow{color:#0d789d;font-size:18px}.nextPrompt{padding:10px 12px;border-left:3px solid var(--gold);border-radius:4px 13px 13px 4px;background:#fff6d9;color:#253b50}.nextPrompt small,.nextPrompt strong{display:block}.nextPrompt small{color:#80651b;font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.nextPrompt strong{margin-top:4px;font-size:12px;line-height:1.4}.emailDraft{display:grid;gap:9px;padding:13px;border:1px solid #e4b84c;border-radius:16px;background:linear-gradient(145deg,#fffdf7,#fff5d7);box-shadow:0 8px 22px #82641518}.emailDraft h3,.emailDraft p{margin:0}.emailDraft h3{color:#18344e;font-size:14px}.emailDraft .emailSubject{padding:8px 9px;border-radius:9px;background:#fff;color:#294158;font-size:11px;line-height:1.4}.emailDraft .emailBody{max-height:180px;overflow:auto;padding:9px;border:1px solid #eadcae;border-radius:10px;background:#fff;color:#34495c;font-size:11px;line-height:1.45;white-space:pre-wrap}.emailDraft .emailNote{color:#6d6040;font-size:10px;line-height:1.4}.emailDraft a{display:block;padding:11px 12px;border-radius:11px;color:#fff;background:#0d789d;text-align:center;text-decoration:none;font-size:12px;font-weight:900}.emailDraft a:hover,.emailDraft a:focus-visible{background:#086986;outline:3px solid #36bce52b}.form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 12px 7px;border-top:1px solid #dfe5e8;background:#fff}.form textarea{width:100%;min-height:44px;max-height:100px;resize:none;padding:11px 12px;border:1px solid #c9d3da;border-radius:13px;color:#10243a;background:#fff;font:600 13px/1.35 inherit;outline:none}.form textarea:focus{border-color:#1594be;box-shadow:0 0 0 3px #36bce52b}.send{min-width:70px;padding:0 13px}.send:disabled,.consent button:disabled{opacity:.55;cursor:wait}.privacy{grid-column:1/-1;margin:0;color:#71808d;font-size:9px;line-height:1.35}.trap{position:absolute;left:-9999px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
      @media(max-width:1050px){.nudge{display:none}}
      @media(max-width:520px){:host{right:8px;bottom:8px}.launcher{min-height:48px;padding:8px 13px 8px 9px}.panel{position:fixed;inset:8px;width:auto;height:auto;border-radius:20px;transform-origin:bottom center}.message{max-width:92%}}
      @media(prefers-reduced-motion:no-preference){.nudge{animation:nudgeIn .45s .5s both}.panel{animation:appear .18s ease-out}.launcher,.links a{transition:transform .16s ease,box-shadow .16s ease}.launcher{animation:launcherGlow 2.8s 1.2s 2}@keyframes appear{from{opacity:0;transform:translateY(8px) scale(.98)}}@keyframes nudgeIn{from{opacity:0;transform:translateY(10px) scale(.97)}}@keyframes launcherGlow{50%{box-shadow:0 14px 38px #07172d55,0 0 0 8px #59c5ea24}}}
    </style>
    <button class="nudge" type="button"><span><b>${nudgeCopy[0]}</b><small>${nudgeCopy[1]}</small></span><i aria-hidden="true">→</i></button>
    <button class="launcher" type="button" aria-expanded="false"><img src="/brand/alika-logo.png" alt="AliKa logosu"><span>${copy.open}</span></button>
    <section class="panel" role="dialog" aria-modal="false" aria-labelledby="alika-assistant-title" hidden>
      <header class="head"><img src="/brand/alika-logo.png" alt="AliKa logosu"><div><strong id="alika-assistant-title">${copy.title}</strong><small>${copy.subtitle} · AI beta</small></div><div class="headActions"><button class="restart" type="button" aria-label="${journeyCopy.restart}" title="${journeyCopy.restart}" hidden>↺</button><button class="close" type="button" aria-label="${copy.close}">×</button></div></header>
      <div class="body"><div class="consent"><span class="consentMark" aria-hidden="true">✦</span><h2>${copy.consentTitle}</h2><p>${copy.consent}</p><button type="button">${copy.accept}</button></div><div class="conversation" hidden aria-live="polite"></div></div>
      <form class="form" hidden><label class="sr" for="alika-assistant-input">${copy.placeholder}</label><textarea id="alika-assistant-input" maxlength="800" rows="1" placeholder="${copy.placeholder}" required></textarea><button class="send" type="submit">${copy.send}</button><input class="trap" name="website" tabindex="-1" autocomplete="off"><p class="privacy">${copy.privacy}</p></form>
    </section>`;

  const launcher = root.querySelector('.launcher');
  const nudge = root.querySelector('.nudge');
  const panel = root.querySelector('.panel');
  const closeButton = root.querySelector('.close');
  const restartButton = root.querySelector('.restart');
  const consent = root.querySelector('.consent');
  const consentButton = consent.querySelector('button');
  const conversation = root.querySelector('.conversation');
  const form = root.querySelector('.form');
  const input = root.querySelector('textarea');
  const send = root.querySelector('.send');
  const history = [];
  let busy = false;
  let activeJourney = 'general';

  function addMessage(role, text, links = [], sourceLinks = []) {
    const item = document.createElement('div');
    item.className = `message ${role}`;
    item.textContent = text;
    conversation.append(item);
    const actionLinks = links.filter((link, index, items) => link && items.findIndex((candidate) => candidate.href === link.href) === index);
    if (actionLinks.length) {
      const group = document.createElement('div');
      group.className = 'links';
      const label = document.createElement('span');
      label.className = 'sourceLabel';
      label.textContent = evidenceCopy.actions;
      group.append(label);
      for (const link of actionLinks.slice(0, 3)) {
        const href = safeHref(link.href);
        if (!href) continue;
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = String(link.label || evidenceCopy.actions).slice(0, 80);
        if (href.startsWith('https://www.youtube.com/watch?v=')) anchor.classList.add('videoLink');
        if (href.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
        group.append(anchor);
      }
      if (group.childElementCount > 1) conversation.append(group);
    }
    renderSourceEvidence(sourceLinks);
    conversation.parentElement.scrollTop = conversation.parentElement.scrollHeight;
    return item;
  }

  function renderSourceEvidence(sources) {
    if (!Array.isArray(sources) || !sources.length) return;
    const evidence = document.createElement('section');
    evidence.className = 'evidence';
    evidence.setAttribute('aria-label', evidenceCopy.sources);
    const heading = document.createElement('h3');
    heading.textContent = evidenceCopy.sources;
    evidence.append(heading);
    for (const source of sources.slice(0, 4)) {
      const href = safeHref(source?.href);
      if (!href) continue;
      const anchor = document.createElement('a');
      anchor.href = href;
      if (href.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
      const title = document.createElement('span');
      title.className = 'evidenceTitle';
      title.textContent = String(source.label || copy.sources).slice(0, 100);
      const metadata = document.createElement('span');
      metadata.className = 'evidenceMeta';
      const kind = evidenceCopy[source.kind] || evidenceCopy.page;
      const platform = evidenceCopy[source.platform] || source.platform || evidenceCopy.all;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(source.verifiedAt || '')
        ? new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${source.verifiedAt}T00:00:00Z`))
        : '';
      metadata.textContent = [kind, platform, date ? `${evidenceCopy.verified}: ${date}` : ''].filter(Boolean).join(' · ');
      anchor.append(title, metadata);
      evidence.append(anchor);
    }
    if (evidence.childElementCount > 1) conversation.append(evidence);
  }

  function safeHref(value) {
    if (typeof value !== 'string') return '';
    if (/^\/[a-z0-9/_?=&.-]*$/i.test(value)) return value;
    if (value.startsWith('https://apps.microsoft.com/detail/9N3P9F5ZKR5S')) return value;
    if (/^https:\/\/www\.youtube\.com\/watch\?v=[a-z0-9_-]{11}$/i.test(value)) return value;
    if (value === 'mailto:alika.destek@gmail.com') return value;
    return '';
  }

  function renderJourneyMenu() {
    const group = document.createElement('div');
    group.className = 'journeys';
    const heading = document.createElement('p');
    heading.className = 'journeyHeading';
    heading.textContent = journeyCopy.heading;
    group.append(heading);
    const choices = [
      ['fit', '◎', journeyCopy.fitTitle, journeyCopy.fitDesc, journeyCopy.fitPrompt, journeyCopy.fitQuestion],
      ['plan', '◷', journeyCopy.planTitle, journeyCopy.planDesc, journeyCopy.planPrompt, journeyCopy.planQuestion],
      ['tour', '↗', journeyCopy.tourTitle, journeyCopy.tourDesc, journeyCopy.tourPrompt, journeyCopy.tourQuestion],
      ['feedback', '✉', journeyCopy.feedbackTitle, journeyCopy.feedbackDesc, journeyCopy.feedbackPrompt, journeyCopy.feedbackQuestion],
    ];
    for (const [journey, icon, title, description, prompt, firstQuestion] of choices) {
      const button = document.createElement('button');
      button.className = 'journey';
      button.type = 'button';
      button.innerHTML = `<span class="journeyIcon" aria-hidden="true">${icon}</span><span><b>${title}</b><small>${description}</small></span><span class="journeyArrow" aria-hidden="true">→</span>`;
      button.addEventListener('click', () => startJourney(journey, title, prompt, firstQuestion));
      group.append(button);
    }
    conversation.append(group);
  }

  function renderWelcome() {
    addMessage('assistant', copy.hello);
    renderJourneyMenu();
  }

  function renderNextPrompt(text) {
    const prompt = document.createElement('div');
    prompt.className = 'nextPrompt';
    const label = document.createElement('small');
    label.textContent = journeyCopy.next;
    const question = document.createElement('strong');
    question.textContent = text;
    prompt.append(label, question);
    conversation.append(prompt);
    conversation.parentElement.scrollTop = conversation.parentElement.scrollHeight;
  }

  function renderEmailDraft(draft) {
    const subject = typeof draft?.subject === 'string' ? draft.subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 120) : '';
    const body = typeof draft?.body === 'string' ? draft.body.replace(/\0/g, '').trim().slice(0, 3000) : '';
    if (!subject || !body) return;
    const card = document.createElement('section');
    card.className = 'emailDraft';
    const title = document.createElement('h3');
    title.textContent = journeyCopy.draftTitle;
    const recipient = document.createElement('p');
    recipient.className = 'emailSubject';
    recipient.textContent = 'alika.destek@gmail.com';
    const subjectPreview = document.createElement('p');
    subjectPreview.className = 'emailSubject';
    subjectPreview.textContent = `${journeyCopy.draftSubject}: ${subject}`;
    const bodyPreview = document.createElement('p');
    bodyPreview.className = 'emailBody';
    bodyPreview.textContent = body;
    const note = document.createElement('p');
    note.className = 'emailNote';
    note.textContent = journeyCopy.draftNote;
    const open = document.createElement('a');
    open.href = `mailto:alika.destek@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    open.textContent = journeyCopy.draftOpen;
    card.append(title, recipient, subjectPreview, bodyPreview, note, open);
    conversation.append(card);
    conversation.parentElement.scrollTop = conversation.parentElement.scrollHeight;
  }

  function startJourney(journey, title, prompt, firstQuestion) {
    if (busy) return;
    activeJourney = journey;
    conversation.querySelector('.journeys')?.remove();
    addMessage('user', title);
    renderNextPrompt(firstQuestion);
    history.push({ role: 'user', text: prompt }, { role: 'assistant', text: firstQuestion });
    input.focus();
  }

  function showConversation() {
    consent.hidden = true;
    conversation.hidden = false;
    form.hidden = false;
    restartButton.hidden = false;
    if (!conversation.childElementCount) renderWelcome();
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

  function resetConversation() {
    if (busy) return;
    history.splice(0);
    activeJourney = 'general';
    conversation.replaceChildren();
    renderWelcome();
    input.value = '';
    input.focus();
  }

  async function submitQuestion(question, displayText = question) {
    const message = String(question || '').trim();
    if (busy || message.length < 2) return;
    busy = true;
    input.value = '';
    send.disabled = true;
    conversation.querySelector('.journeys')?.remove();
    addMessage('user', String(displayText || message));
    const waiting = addMessage('assistant waiting', copy.sending);
    try {
      const response = await fetch(`${endpoint}/v1/chat`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: lang, journey: activeJourney, pagePath: location.pathname, history: history.slice(-6), website: form.elements.website.value }),
      });
      const data = await response.json().catch(() => ({}));
      waiting.remove();
      if (!response.ok) {
        addMessage('assistant', response.status === 429 ? copy.limit : copy.error, [{ label: copy.sources, href: lang === 'tr' ? '/contact/' : `/${lang}/contact/` }]);
        return;
      }
      addMessage('assistant', data.answer, data.actions, data.sources);
      const assistantHistory = data.followUp ? `${data.answer}\n${data.followUp}` : data.answer;
      history.push({ role: 'user', text: message }, { role: 'assistant', text: assistantHistory });
      if (data.followUp) renderNextPrompt(data.followUp);
      if (!data.followUp && data.emailDraft) renderEmailDraft(data.emailDraft);
      if (!data.followUp) activeJourney = 'general';
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
  restartButton.addEventListener('click', resetConversation);
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
