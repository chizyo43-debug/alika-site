export type GuideLanguageCode = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'ru' | 'ja' | 'ko';
export type GuideReleaseStatus = 'preparing' | 'review' | 'public';
export type GuideVideoGroup = 'start' | 'panel' | 'rules' | 'learning' | 'devices' | 'reports' | 'system';

export interface GuideVideo {
  key: string;
  order: number;
  group: GuideVideoGroup;
  id: string;
  duration: string;
  eyebrow: string;
  title: string;
  description: string;
  poster: string;
  captions?: string;
}

interface GuideLanguageCopy {
  sectionEyebrow: string;
  sectionTitle: string;
  sectionLead: string;
  channelLabel: string;
  playLabel: string;
  youtubeLabel: string;
  publishedLabel: string;
  preparingLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  privacyLabel: string;
  totalLabel: (count: number, duration: string) => string;
  groupLabels: Record<GuideVideoGroup, string>;
}

export interface GuideLanguage {
  code: GuideLanguageCode;
  youtubeLocale: string;
  nativeName: string;
  playlistId: string;
  status: GuideReleaseStatus;
  copy: GuideLanguageCopy;
  videos: readonly GuideVideo[];
}

const trVideos = [
  {
    key: 'windows-overview', order: 1, group: 'start', id: 'yaxrITEsqyI', duration: '0:57',
    eyebrow: '01/13 · Genel bakış', title: 'AliKa Windows ne işe yarar?',
    description: 'Ekran süresi, öğrenme, görev ve aile düzeninin tek Windows panelinde nasıl birleştiğini görün.',
    poster: '/videos/tr/01-windows-overview.jpg', captions: '/videos/captions/tr/01-windows-overview.vtt',
  },
  {
    key: 'windows-installation', order: 2, group: 'start', id: 'RZDOb072nyk', duration: '1:29',
    eyebrow: '02/13 · Kurulum ve güvenlik', title: 'AliKa Windows nasıl kurulur?',
    description: 'Microsoft Store kurulumu, dil, ebeveyn PIN’i, rıza, kurtarma kodu ve Güvenli Mod adımlarını izleyin.',
    poster: '/videos/tr/02-windows-installation.jpg', captions: '/videos/captions/tr/02-windows-installation.vtt',
  },
  {
    key: 'windows-panel', order: 3, group: 'panel', id: 'c_eggz-1wxQ', duration: '1:26',
    eyebrow: '03/13 · Panel', title: 'Panelde günlük kullanım ve aile özeti',
    description: 'Kalan süreyi, puanları, saatlik dağılımı, uygulamaları, cihaz sağlığını ve yaklaşan programı inceleyin.',
    poster: '/videos/tr/03-windows-panel.jpg', captions: '/videos/captions/tr/03-windows-panel.vtt',
  },
  {
    key: 'windows-child-rules', order: 4, group: 'rules', id: 'sXvHkeOegIo', duration: '4:39',
    eyebrow: '04/13 · Çocuk ve Kurallar', title: 'Çocuk profili ve ekran kuralları nasıl yönetilir?',
    description: 'Zaman, uygulama, site, uyku, haftalık plan, web koruması ve sınav ayarlarının tüm sekmelerini görün.',
    poster: '/videos/tr/04-windows-child-rules.jpg', captions: '/videos/captions/tr/04-windows-child-rules.vtt',
  },
  {
    key: 'windows-learning-content', order: 5, group: 'learning', id: '3IOYQxvISlo', duration: '2:55',
    eyebrow: '05/13 · Öğrenme', title: 'İçerik ve ChatGPT soru bankası nasıl eklenir?',
    description: 'XLSX, CSV, AliKa paketi, belge ve ChatGPT ile hazırlanan ZIP dosyasını ekleme ve onaylama yollarını görün.',
    poster: '/videos/tr/05-windows-learning-content.jpg', captions: '/videos/captions/tr/05-windows-learning-content.vtt',
  },
  {
    key: 'windows-child-learning', order: 6, group: 'learning', id: 'PIbXrMdlXDc', duration: '1:59',
    eyebrow: '06/13 · Öğrenme', title: 'Çocuk çalışma ve öğrenme ekranı',
    description: 'Çocuğun konu anlatımını açmasını, soru bankasını seçmesini, çalışmasını ve ilerlemesini takip etmesini görün.',
    poster: '/videos/tr/06-windows-child-learning.jpg', captions: '/videos/captions/tr/06-windows-child-learning.vtt',
  },
  {
    key: 'windows-child-question', order: 7, group: 'learning', id: 'cMxuoJaG77E', duration: '1:49',
    eyebrow: '07/13 · Öğrenme', title: 'Çocuk soru ekranı ve süre kazanma',
    description: 'Soru çözme, doğru ve yanlış geri bildirimi, açıklama, Çözüm Kağıdı ve kontrollü süre kazanma akışını görün.',
    poster: '/videos/tr/07-windows-child-question.jpg', captions: '/videos/captions/tr/07-windows-child-question.vtt',
  },
  {
    key: 'windows-task-homework-exam', order: 8, group: 'learning', id: 'XjlLQnRvyjY', duration: '2:13',
    eyebrow: '08/13 · Öğrenme', title: 'Görev, ödev ve sınav nasıl oluşturulur?',
    description: 'Görev ödüllerini, içerikten ödev göndermeyi ve planlı deneme sınavı oluşturmayı adım adım izleyin.',
    poster: '/videos/tr/08-windows-task-homework-exam.jpg', captions: '/videos/captions/tr/08-windows-task-homework-exam.vtt',
  },
  {
    key: 'windows-devices-family', order: 9, group: 'devices', id: '8cCkgvU3AJs', duration: '1:50',
    eyebrow: '09/13 · Cihazlar ve Aile Ağı', title: 'Aile cihazları nasıl eşleştirilir?',
    description: 'Yerel ağı, QR eşleştirmeyi, cihaz durumlarını, aile mesajını ve hedef cihaza gönderilen işlemleri öğrenin.',
    poster: '/videos/tr/09-windows-devices-family.jpg', captions: '/videos/captions/tr/09-windows-devices-family.vtt',
  },
  {
    key: 'windows-reports', order: 10, group: 'reports', id: '2ooX93agqDo', duration: '1:49',
    eyebrow: '10/13 · Raporlar ve Bildirimler', title: 'Kullanım ve öğrenme sonuçları nereden görülür?',
    description: 'Haftalık karneyi, kullanım dağılımını, soru sonuçlarını, olay geçmişini ve bildirimleri inceleyin.',
    poster: '/videos/tr/10-windows-reports.jpg', captions: '/videos/captions/tr/10-windows-reports.vtt',
  },
  {
    key: 'windows-privacy', order: 11, group: 'system', id: 'cxzZrfLhJjE', duration: '2:05',
    eyebrow: '11/13 · Gizlilik', title: 'Gizlilik ve yerel veri nasıl korunur?',
    description: 'Açık rızayı, cihaz içi veri saklamayı, PIN korumasını ve isteğe bağlı şifreli yerel aile ağını görün.',
    poster: '/videos/tr/11-windows-privacy.jpg', captions: '/videos/captions/tr/11-windows-privacy.vtt',
  },
  {
    key: 'windows-settings', order: 12, group: 'system', id: '2rhPfMD_Jfw', duration: '2:21',
    eyebrow: '12/13 · Ayarlar', title: 'Profiller, iyi oluş ve koruma ayarları',
    description: 'Dil, profiller, yaş önerileri, göz molası, yumuşak iniş, PIN kurtarma, yedek ve Koruma Motorunu öğrenin.',
    poster: '/videos/tr/12-windows-settings.jpg', captions: '/videos/captions/tr/12-windows-settings.vtt',
  },
  {
    key: 'windows-auxiliary', order: 13, group: 'system', id: '97UKyqIPevE', duration: '1:36',
    eyebrow: '13/13 · Windows yardımcıları', title: 'Sistem tepsisi, Kısa Panel ve kilit ekranı',
    description: 'Günlük erişim seçeneklerini, Kısa Paneli, açık kilit nedenlerini ve güvenli çocuk eylemlerini görün.',
    poster: '/videos/tr/13-windows-auxiliary.jpg', captions: '/videos/captions/tr/13-windows-auxiliary.vtt',
  },
] as const satisfies readonly GuideVideo[];

const enVideos = [
  {
    key: 'windows-overview', order: 1, group: 'start', id: 'SdS-m7unbX0', duration: '0:59',
    eyebrow: '01/13 · Overview', title: 'What Is AliKa for Windows?',
    description: 'See how visible screen-time rules, parent-approved learning, tasks and family reports come together in one Windows app.',
    poster: '/videos/en/01-windows-overview.jpg',
  },
  {
    key: 'windows-installation', order: 2, group: 'start', id: 'RM_sQN-AvcE', duration: '1:25',
    eyebrow: '02/13 · Setup and safety', title: 'Windows Installation and First Setup',
    description: 'Install from Microsoft Store, choose English, create the parent PIN and complete consent, recovery and optional Safe Mode setup.',
    poster: '/videos/en/02-windows-installation.jpg',
  },
  {
    key: 'windows-panel', order: 3, group: 'panel', id: '-wdMQzfUnOk', duration: '1:17',
    eyebrow: '03/13 · Dashboard', title: 'Dashboard and Daily Summary',
    description: 'Review remaining time, reward values, hourly use, top apps, device health and the upcoming family schedule.',
    poster: '/videos/en/03-windows-panel.jpg',
  },
  {
    key: 'windows-child-rules', order: 4, group: 'rules', id: 'sySIxlhd3yU', duration: '3:45',
    eyebrow: '04/13 · Child and Rules', title: 'Child & Rules: Every Tab Explained',
    description: 'Explore time, apps, websites, bedtime, weekly planning, web protection and Exam Mode using the real English interface.',
    poster: '/videos/en/04-windows-child-rules.jpg',
  },
  {
    key: 'windows-learning-content', order: 5, group: 'learning', id: 'mfHmGjd_auc', duration: '2:24',
    eyebrow: '05/13 · Learning', title: 'Add Lessons and Questions',
    description: 'Add parent-approved lessons and question banks from supported files or a ChatGPT-created AliKa package. Content is not included by default.',
    poster: '/videos/en/05-windows-learning-content.jpg',
  },
  {
    key: 'windows-child-learning', order: 6, group: 'learning', id: '3Yj3fwIk7Io', duration: '1:56',
    eyebrow: '06/13 · Learning', title: 'The Child Learning Screen',
    description: 'See today’s work, approved lesson notes, question practice, progress, earned time and assigned tasks from the child’s view.',
    poster: '/videos/en/06-windows-child-learning.jpg',
  },
  {
    key: 'windows-child-question', order: 7, group: 'learning', id: 'DvnCY3BCqt4', duration: '1:31',
    eyebrow: '07/13 · Learning', title: 'Questions, Explanations and Earned Time',
    description: 'Follow the complete answer flow: daily reward limits, feedback, explanations, retries and controlled earned screen time.',
    poster: '/videos/en/07-windows-child-question.jpg',
  },
  {
    key: 'windows-task-homework-exam', order: 8, group: 'learning', id: 'PYBYdRCCvOg', duration: '2:02',
    eyebrow: '08/13 · Learning', title: 'Create Tasks, Homework and Exams',
    description: 'Learn the difference between tasks, content-based homework and scheduled exams, then create each one step by step.',
    poster: '/videos/en/08-windows-task-homework-exam.jpg',
  },
  {
    key: 'windows-devices-family', order: 9, group: 'devices', id: '1QsuK4jYReY', duration: '1:27',
    eyebrow: '09/13 · Devices and Family Network', title: 'Devices and Family Network',
    description: 'Pair a family device locally, inspect its status and send only the visible actions supported for the selected device.',
    poster: '/videos/en/09-windows-devices-family.jpg',
  },
  {
    key: 'windows-reports', order: 10, group: 'reports', id: '-cNjtPRs7os', duration: '1:29',
    eyebrow: '10/13 · Reports and Notifications', title: 'Reports and Notifications',
    description: 'Read weekly or monthly summaries, hourly use, subject results, event history and notifications without mixing usage and learning data.',
    poster: '/videos/en/10-windows-reports.jpg',
  },
  {
    key: 'windows-privacy', order: 11, group: 'system', id: 'kh5pMIuRk68', duration: '1:55',
    eyebrow: '11/13 · Privacy', title: 'Privacy and Local Data',
    description: 'Understand consent, on-device storage, auditable records, parent-controlled deletion, PIN protection and the optional local family network.',
    poster: '/videos/en/11-windows-privacy.jpg',
  },
  {
    key: 'windows-settings', order: 12, group: 'system', id: 'NddzxRlQLAk', duration: '1:55',
    eyebrow: '12/13 · Settings', title: 'Settings, Profiles and Protection',
    description: 'Configure language, profiles, age presets, wellbeing, PIN recovery, encrypted backup and the Windows protection engine.',
    poster: '/videos/en/12-windows-settings.jpg',
  },
  {
    key: 'windows-auxiliary', order: 13, group: 'system', id: 'F2be4BPfqLw', duration: '1:28',
    eyebrow: '13/13 · Windows tools', title: 'System Tray, Quick Panel and Lock Screen',
    description: 'Use the system tray and Quick Panel, understand lock reasons and see which safe actions remain available to the child.',
    poster: '/videos/en/13-windows-auxiliary.jpg',
  },
] as const satisfies readonly GuideVideo[];

const groupLabels = (
  start: string, panel: string, rules: string, learning: string, devices: string, reports: string, system: string,
): Record<GuideVideoGroup, string> => ({ start, panel, rules, learning, devices, reports, system });

export const GUIDE_LANGUAGES: readonly GuideLanguage[] = [
  {
    code: 'tr', youtubeLocale: 'tr', nativeName: 'Türkçe', playlistId: '', status: 'public', videos: trVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube rehberleri · 9 uygulama dili', sectionTitle: 'Rehberleri kendi dilinizde izleyin.',
      sectionLead: 'Bir dil seçtiğinizde yalnız o dilde yayımlanmış Windows rehberleri gösterilir.', channelLabel: 'AliKa kanalını aç',
      playLabel: 'Videoyu oynat', youtubeLabel: 'YouTube’da aç', publishedLabel: 'Yayımlanan rehberler', preparingLabel: 'Hazırlanıyor',
      emptyTitle: 'Türkçe rehberler hazırlanıyor.', emptyDescription: 'Bu dilin eksiksiz Windows rehber seti yayımlandığında burada görünecek.',
      privacyLabel: 'Video yalnız oynat düğmesine bastığınızda YouTube’a bağlanır.', totalLabel: (count, duration) => `${count} açıklamalı rehber · toplam ${duration}`,
      groupLabels: groupLabels('Başlangıç ve Kurulum', 'Panel', 'Çocuk ve Kurallar', 'Öğrenme', 'Cihazlar ve Aile Ağı', 'Raporlar ve Bildirimler', 'Ayarlar, Gizlilik ve Windows Yardımcıları'),
    },
  },
  {
    code: 'en', youtubeLocale: 'en', nativeName: 'English', playlistId: 'PLcfP4qWx0x4k', status: 'public', videos: enVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube guides · 9 app languages', sectionTitle: 'Watch the guides in your language.',
      sectionLead: 'Choose a language to see only the published Windows guides in that language.', channelLabel: 'Open the AliKa channel',
      playLabel: 'Play video', youtubeLabel: 'Open on YouTube', publishedLabel: 'Published guides', preparingLabel: 'In preparation',
      emptyTitle: 'English video guides are being prepared.', emptyDescription: 'The complete English Windows guide set will appear here after publication.',
      privacyLabel: 'YouTube is contacted only after you press play.', totalLabel: (count, duration) => `${count} guided videos · ${duration} total`,
      groupLabels: groupLabels('Introduction and Setup', 'Dashboard', 'Child and Rules', 'Learning', 'Devices and Family Network', 'Reports and Notifications', 'Settings, Privacy and Windows Tools'),
    },
  },
  {
    code: 'de', youtubeLocale: 'de', nativeName: 'Deutsch', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'AliKa-YouTube-Anleitungen · 9 App-Sprachen', sectionTitle: 'Anleitungen in Ihrer Sprache ansehen.',
      sectionLead: 'Wählen Sie eine Sprache, um ausschließlich veröffentlichte Windows-Anleitungen in dieser Sprache zu sehen.', channelLabel: 'AliKa-Kanal öffnen',
      playLabel: 'Video abspielen', youtubeLabel: 'Auf YouTube öffnen', publishedLabel: 'Veröffentlichte Anleitungen', preparingLabel: 'In Vorbereitung',
      emptyTitle: 'Deutsche Videoanleitungen werden vorbereitet.', emptyDescription: 'Nach der Veröffentlichung erscheint hier die vollständige deutsche Windows-Serie.',
      privacyLabel: 'Eine Verbindung zu YouTube wird erst nach dem Klick auf Wiedergabe hergestellt.', totalLabel: (count, duration) => `${count} Anleitungen · insgesamt ${duration}`,
      groupLabels: groupLabels('Einführung und Installation', 'Übersicht', 'Kind und Regeln', 'Lernen', 'Geräte und Familiennetzwerk', 'Berichte und Benachrichtigungen', 'Einstellungen, Datenschutz und Windows-Werkzeuge'),
    },
  },
  {
    code: 'es', youtubeLocale: 'es', nativeName: 'Español', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'Guías de AliKa en YouTube · 9 idiomas', sectionTitle: 'Vea las guías en su idioma.',
      sectionLead: 'Elija un idioma para ver únicamente las guías de Windows publicadas en ese idioma.', channelLabel: 'Abrir el canal de AliKa',
      playLabel: 'Reproducir vídeo', youtubeLabel: 'Abrir en YouTube', publishedLabel: 'Guías publicadas', preparingLabel: 'En preparación',
      emptyTitle: 'Las guías en español están en preparación.', emptyDescription: 'La serie completa de Windows en español aparecerá aquí cuando se publique.',
      privacyLabel: 'YouTube solo se conecta después de pulsar reproducir.', totalLabel: (count, duration) => `${count} guías · ${duration} en total`,
      groupLabels: groupLabels('Introducción e instalación', 'Panel', 'Niño y reglas', 'Aprendizaje', 'Dispositivos y red familiar', 'Informes y notificaciones', 'Ajustes, privacidad y herramientas de Windows'),
    },
  },
  {
    code: 'fr', youtubeLocale: 'fr', nativeName: 'Français', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'Guides AliKa sur YouTube · 9 langues', sectionTitle: 'Regardez les guides dans votre langue.',
      sectionLead: 'Choisissez une langue pour afficher uniquement les guides Windows publiés dans cette langue.', channelLabel: 'Ouvrir la chaîne AliKa',
      playLabel: 'Lire la vidéo', youtubeLabel: 'Ouvrir sur YouTube', publishedLabel: 'Guides publiés', preparingLabel: 'En préparation',
      emptyTitle: 'Les guides vidéo en français sont en préparation.', emptyDescription: 'La série Windows complète en français apparaîtra ici après sa publication.',
      privacyLabel: 'La connexion à YouTube ne se fait qu’après avoir appuyé sur Lecture.', totalLabel: (count, duration) => `${count} guides · ${duration} au total`,
      groupLabels: groupLabels('Présentation et installation', 'Tableau de bord', 'Enfant et règles', 'Apprentissage', 'Appareils et réseau familial', 'Rapports et notifications', 'Paramètres, confidentialité et outils Windows'),
    },
  },
  {
    code: 'pt', youtubeLocale: 'pt-BR', nativeName: 'Português (Brasil)', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'Guias do AliKa no YouTube · 9 idiomas', sectionTitle: 'Assista aos guias no seu idioma.',
      sectionLead: 'Escolha um idioma para ver somente os guias do Windows publicados nesse idioma.', channelLabel: 'Abrir o canal do AliKa',
      playLabel: 'Reproduzir vídeo', youtubeLabel: 'Abrir no YouTube', publishedLabel: 'Guias publicados', preparingLabel: 'Em preparação',
      emptyTitle: 'Os guias em português estão sendo preparados.', emptyDescription: 'A série completa do Windows em português aparecerá aqui após a publicação.',
      privacyLabel: 'O YouTube só é conectado depois que você pressiona reproduzir.', totalLabel: (count, duration) => `${count} guias · ${duration} no total`,
      groupLabels: groupLabels('Introdução e instalação', 'Painel', 'Criança e regras', 'Aprendizagem', 'Dispositivos e rede familiar', 'Relatórios e notificações', 'Configurações, privacidade e ferramentas do Windows'),
    },
  },
  {
    code: 'ru', youtubeLocale: 'ru', nativeName: 'Русский', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'Видеоинструкции AliKa · 9 языков приложения', sectionTitle: 'Смотрите инструкции на своём языке.',
      sectionLead: 'Выберите язык, чтобы увидеть только опубликованные инструкции Windows на этом языке.', channelLabel: 'Открыть канал AliKa',
      playLabel: 'Воспроизвести видео', youtubeLabel: 'Открыть на YouTube', publishedLabel: 'Опубликованные инструкции', preparingLabel: 'Готовится',
      emptyTitle: 'Видеоинструкции на русском языке готовятся.', emptyDescription: 'Полная серия инструкций Windows появится здесь после публикации.',
      privacyLabel: 'Соединение с YouTube устанавливается только после нажатия кнопки воспроизведения.', totalLabel: (count, duration) => `${count} инструкций · всего ${duration}`,
      groupLabels: groupLabels('Знакомство и установка', 'Панель', 'Ребёнок и правила', 'Обучение', 'Устройства и семейная сеть', 'Отчёты и уведомления', 'Настройки, конфиденциальность и инструменты Windows'),
    },
  },
  {
    code: 'ja', youtubeLocale: 'ja', nativeName: '日本語', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'AliKa YouTube ガイド · アプリ対応9言語', sectionTitle: 'お使いの言語でガイドをご覧ください。',
      sectionLead: '言語を選ぶと、その言語で公開済みのWindowsガイドだけが表示されます。', channelLabel: 'AliKaチャンネルを開く',
      playLabel: '動画を再生', youtubeLabel: 'YouTubeで開く', publishedLabel: '公開済みガイド', preparingLabel: '準備中',
      emptyTitle: '日本語の動画ガイドを準備しています。', emptyDescription: '日本語版Windowsガイド全13本の公開後、ここに表示されます。',
      privacyLabel: '再生ボタンを押すまでYouTubeには接続しません。', totalLabel: (count, duration) => `${count}本のガイド · 合計${duration}`,
      groupLabels: groupLabels('概要とインストール', 'パネル', '子どもとルール', '学習', 'デバイスとファミリーネットワーク', 'レポートと通知', '設定・プライバシー・Windowsツール'),
    },
  },
  {
    code: 'ko', youtubeLocale: 'ko', nativeName: '한국어', playlistId: '', status: 'preparing', videos: [],
    copy: {
      sectionEyebrow: 'AliKa YouTube 가이드 · 앱 지원 9개 언어', sectionTitle: '내 언어로 가이드를 시청하세요.',
      sectionLead: '언어를 선택하면 해당 언어로 공개된 Windows 가이드만 표시됩니다.', channelLabel: 'AliKa 채널 열기',
      playLabel: '동영상 재생', youtubeLabel: 'YouTube에서 열기', publishedLabel: '공개된 가이드', preparingLabel: '준비 중',
      emptyTitle: '한국어 동영상 가이드를 준비하고 있습니다.', emptyDescription: '한국어 Windows 가이드 13편이 모두 공개되면 여기에 표시됩니다.',
      privacyLabel: '재생 버튼을 누르기 전에는 YouTube에 연결하지 않습니다.', totalLabel: (count, duration) => `가이드 ${count}편 · 총 ${duration}`,
      groupLabels: groupLabels('소개 및 설치', '패널', '자녀와 규칙', '학습', '기기 및 가족 네트워크', '보고서 및 알림', '설정·개인정보·Windows 도구'),
    },
  },
] as const;

export const GUIDE_VIDEO_GROUP_ORDER: readonly GuideVideoGroup[] = ['start', 'panel', 'rules', 'learning', 'devices', 'reports', 'system'];

for (const language of GUIDE_LANGUAGES) {
  if (language.status === 'public' && language.videos.length !== 13) {
    throw new Error(`${language.code}: a public guide release must contain exactly 13 videos`);
  }
  const orders = language.videos.map((video) => video.order);
  const ids = language.videos.map((video) => video.id);
  if (new Set(orders).size !== orders.length || new Set(ids).size !== ids.length) {
    throw new Error(`${language.code}: duplicate guide order or YouTube id`);
  }
  if (language.videos.length > 0 && orders.some((order, index) => order !== index + 1)) {
    throw new Error(`${language.code}: guide videos must be ordered from 1 to 13`);
  }
}

export function getPublishedGuideVideos(language: GuideLanguage): readonly GuideVideo[] {
  return language.status === 'public' && language.videos.length === 13 ? language.videos : [];
}
