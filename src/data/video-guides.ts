export type GuideLanguageCode = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'ru' | 'ja' | 'ko';
export type GuideReleaseStatus = 'preparing' | 'review' | 'public';
export type GuidePlatform = 'windows' | 'android';
export type GuideVideoGroup = 'start' | 'child' | 'panel' | 'rules' | 'learning' | 'devices' | 'reports' | 'profile' | 'settings' | 'system';

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

export interface GuideLanguageCopy {
  sectionEyebrow: string;
  sectionTitle: string;
  sectionLead: string;
  channelLabel: string;
  playlistLabel: string;
  playLabel: string;
  youtubeLabel: string;
  publishedLabel: string;
  preparingLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  privacyLabel: string;
  videoCountLabel: (count: number) => string;
  totalLabel: (count: number, duration: string) => string;
  groupLabels: Record<GuideVideoGroup, string>;
}

export interface GuideLanguage {
  platform: GuidePlatform;
  expectedVideoCount: number;
  code: GuideLanguageCode;
  youtubeLocale: string;
  nativeName: string;
  playlistId: string;
  status: GuideReleaseStatus;
  copy: GuideLanguageCopy;
  videos: readonly GuideVideo[];
}

export interface GuideSeries {
  platform: GuidePlatform;
  expectedVideoCount: number;
  groupOrder: readonly GuideVideoGroup[];
  languages: readonly GuideLanguage[];
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

const esVideos = [
  {
    key: 'windows-overview', order: 1, group: 'start', id: 'FCUzUCOW0Vs', duration: '1:08',
    eyebrow: '01/13 · Vista general', title: '¿Qué es AliKa para Windows?',
    description: 'Descubra cómo AliKa reúne reglas visibles de tiempo de pantalla, aprendizaje aprobado por la familia, tareas e informes en Windows.',
    poster: '/videos/es/01-windows-overview.jpg',
  },
  {
    key: 'windows-installation', order: 2, group: 'start', id: '0CtUlbYO3i0', duration: '1:53',
    eyebrow: '02/13 · Instalación y seguridad', title: 'Instalación en Windows y configuración inicial',
    description: 'Instale AliKa desde Microsoft Store y configure el idioma, el PIN parental, el consentimiento, la recuperación y el modo seguro opcional.',
    poster: '/videos/es/02-windows-installation.jpg',
  },
  {
    key: 'windows-panel', order: 3, group: 'panel', id: 'kuppA30WmCw', duration: '1:45',
    eyebrow: '03/13 · Panel', title: 'Panel y resumen diario',
    description: 'Revise el tiempo restante, las recompensas, el uso por horas, las aplicaciones principales, el estado del dispositivo y la agenda familiar.',
    poster: '/videos/es/03-windows-panel.jpg',
  },
  {
    key: 'windows-child-rules', order: 4, group: 'rules', id: '1OHNLIztKcw', duration: '5:11',
    eyebrow: '04/13 · Menor y reglas', title: 'Menú del menor y reglas: explicación de cada pestaña',
    description: 'Conozca las pestañas de tiempo, aplicaciones, sitios, sueño, planificación semanal, protección web y modo de examen.',
    poster: '/videos/es/04-windows-child-rules.jpg',
  },
  {
    key: 'windows-learning-content', order: 5, group: 'learning', id: 'yhgNkJgfuWc', duration: '3:23',
    eyebrow: '05/13 · Aprendizaje', title: 'Añadir lecciones y preguntas',
    description: 'Añada lecciones y bancos de preguntas aprobados por la familia desde archivos compatibles o un paquete de AliKa creado con ChatGPT.',
    poster: '/videos/es/05-windows-learning-content.jpg',
  },
  {
    key: 'windows-child-learning', order: 6, group: 'learning', id: 'UdwEoYk0nFw', duration: '2:28',
    eyebrow: '06/13 · Aprendizaje', title: 'Pantalla de aprendizaje del menor',
    description: 'Vea el trabajo de hoy, las lecciones aprobadas, la práctica, el progreso, el tiempo ganado y las tareas asignadas desde la vista del menor.',
    poster: '/videos/es/06-windows-child-learning.jpg',
  },
  {
    key: 'windows-child-question', order: 7, group: 'learning', id: 'nHDYR9WYCso', duration: '2:03',
    eyebrow: '07/13 · Aprendizaje', title: 'Preguntas, explicaciones y tiempo ganado',
    description: 'Siga el flujo completo de respuesta: límite diario, retroalimentación, explicaciones, nuevos intentos y tiempo de pantalla controlado.',
    poster: '/videos/es/07-windows-child-question.jpg',
  },
  {
    key: 'windows-task-homework-exam', order: 8, group: 'learning', id: 'd2ExBERYWB8', duration: '2:42',
    eyebrow: '08/13 · Aprendizaje', title: 'Crear tareas, deberes y exámenes',
    description: 'Distinga entre tareas, deberes basados en contenido y exámenes programados, y aprenda a crear cada tipo paso a paso.',
    poster: '/videos/es/08-windows-task-homework-exam.jpg',
  },
  {
    key: 'windows-devices-family', order: 9, group: 'devices', id: 'SXVwe5NArrw', duration: '2:02',
    eyebrow: '09/13 · Dispositivos y red familiar', title: 'Dispositivos y red familiar',
    description: 'Vincule un dispositivo en la red local, consulte su estado y envíe únicamente las acciones visibles compatibles con el dispositivo elegido.',
    poster: '/videos/es/09-windows-devices-family.jpg',
  },
  {
    key: 'windows-reports', order: 10, group: 'reports', id: 'eW9yqxJD-uo', duration: '2:08',
    eyebrow: '10/13 · Informes y notificaciones', title: 'Informes y notificaciones',
    description: 'Consulte resúmenes semanales o mensuales, uso por horas, resultados por materia, historial de eventos y notificaciones.',
    poster: '/videos/es/10-windows-reports.jpg',
  },
  {
    key: 'windows-privacy', order: 11, group: 'system', id: 'RpXs2bI0QF8', duration: '2:43',
    eyebrow: '11/13 · Privacidad', title: 'Privacidad y datos locales',
    description: 'Comprenda el consentimiento, el almacenamiento local, los registros auditables, el borrado parental, el PIN y la red familiar opcional.',
    poster: '/videos/es/11-windows-privacy.jpg',
  },
  {
    key: 'windows-settings', order: 12, group: 'system', id: 'NPuyEnWqNFA', duration: '2:42',
    eyebrow: '12/13 · Ajustes', title: 'Ajustes, perfiles y protección',
    description: 'Configure idioma, perfiles, recomendaciones por edad, bienestar, recuperación del PIN, copia cifrada y protección de Windows.',
    poster: '/videos/es/12-windows-settings.jpg',
  },
  {
    key: 'windows-auxiliary', order: 13, group: 'system', id: 'cKEl4GGeXzA', duration: '2:05',
    eyebrow: '13/13 · Herramientas de Windows', title: 'Bandeja del sistema, panel rápido y pantalla de bloqueo',
    description: 'Use la bandeja y el panel rápido, comprenda los motivos del bloqueo y vea qué acciones seguras siguen disponibles para el menor.',
    poster: '/videos/es/13-windows-auxiliary.jpg',
  },
] as const satisfies readonly GuideVideo[];

interface LocalizedGuideSeed {
  id: string;
  duration: string;
  eyebrow: string;
  title: string;
  description: string;
}

const LOCALIZED_VIDEO_KEYS = [
  'windows-overview', 'windows-installation', 'windows-panel', 'windows-child-rules',
  'windows-learning-content', 'windows-child-learning', 'windows-child-question',
  'windows-task-homework-exam', 'windows-devices-family', 'windows-reports',
  'windows-privacy', 'windows-settings', 'windows-auxiliary',
] as const;

const LOCALIZED_VIDEO_GROUPS: readonly GuideVideoGroup[] = [
  'start', 'start', 'panel', 'rules', 'learning', 'learning', 'learning',
  'learning', 'devices', 'reports', 'system', 'system', 'system',
];

function createLocalizedGuideVideos(language: 'de' | 'fr' | 'pt' | 'ru' | 'ja' | 'ko', seeds: readonly LocalizedGuideSeed[]): readonly GuideVideo[] {
  return seeds.map((seed, index) => ({
    key: LOCALIZED_VIDEO_KEYS[index],
    order: index + 1,
    group: LOCALIZED_VIDEO_GROUPS[index],
    id: seed.id,
    duration: seed.duration,
    eyebrow: seed.eyebrow,
    title: seed.title,
    description: seed.description,
    poster: `/videos/${language}/${String(index + 1).padStart(2, '0')}-${LOCALIZED_VIDEO_KEYS[index]}.jpg`,
  }));
}

const deVideos = createLocalizedGuideVideos('de', [
  {
    id: 'wKZss-8oe98', duration: '0:59', eyebrow: '01/13 · Überblick', title: 'Was ist AliKa für Windows?',
    description: 'Erfahren Sie, wie sichtbare Bildschirmzeitregeln, freigegebene Lerninhalte, Aufgaben und Familienberichte in einer Windows-App zusammenkommen.',
  },
  {
    id: 'zOTSf5zP9aM', duration: '1:33', eyebrow: '02/13 · Installation und Sicherheit', title: 'Windows-Installation und erste Einrichtung',
    description: 'Installieren Sie AliKa aus dem Microsoft Store und richten Sie Sprache, Eltern-PIN, Einwilligung, Wiederherstellung und den optionalen abgesicherten Modus ein.',
  },
  {
    id: 'Bo7GVv9xwEQ', duration: '1:14', eyebrow: '03/13 · Übersicht', title: 'Übersicht und Tageszusammenfassung',
    description: 'Prüfen Sie Restzeit, Belohnungswerte, stündliche Nutzung, häufige Apps, Gerätezustand und den kommenden Familienplan.',
  },
  {
    id: 'hZOCbrnrIbE', duration: '4:06', eyebrow: '04/13 · Kind und Regeln', title: 'Kind und Regeln: alle Bereiche erklärt',
    description: 'Lernen Sie Zeitlimits, Apps, Websites, Schlafenszeit, Wochenplanung, Webschutz und Prüfungsmodus in der echten deutschen Oberfläche kennen.',
  },
  {
    id: 'P1a_rD3xnO0', duration: '2:44', eyebrow: '05/13 · Lernen', title: 'Lerninhalte und Fragen hinzufügen',
    description: 'Fügen Sie von Eltern geprüfte Lernnotizen und Fragenbanken aus unterstützten Dateien oder einem mit ChatGPT erstellten AliKa-Paket hinzu.',
  },
  {
    id: 'N92Rk8bV-EU', duration: '2:04', eyebrow: '06/13 · Lernen', title: 'Der Lernbereich für Kinder',
    description: 'Sehen Sie Tagesaufgaben, freigegebene Lernnotizen, Fragenübungen, Fortschritt, verdiente Zeit und zugewiesene Arbeiten aus Kindersicht.',
  },
  {
    id: 'QUbGX9fF5Hw', duration: '1:36', eyebrow: '07/13 · Lernen', title: 'Fragen, Erklärungen und verdiente Zeit',
    description: 'Verfolgen Sie den vollständigen Ablauf mit Tagesgrenze, Antwortfeedback, Erklärungen, weiteren Versuchen und kontrolliert verdienter Bildschirmzeit.',
  },
  {
    id: 'D0GdYikoq2A', duration: '2:16', eyebrow: '08/13 · Lernen', title: 'Aufgaben, Hausaufgaben und Prüfungen erstellen',
    description: 'Unterscheiden Sie tägliche Aufgaben, inhaltsbezogene Hausaufgaben und geplante Prüfungen und erstellen Sie jeden Typ Schritt für Schritt.',
  },
  {
    id: '2c32WJIEWsw', duration: '1:39', eyebrow: '09/13 · Geräte und Familiennetzwerk', title: 'Geräte und Familiennetzwerk',
    description: 'Koppeln Sie ein Familiengerät im lokalen Netz, prüfen Sie seinen Zustand und senden Sie nur die für das gewählte Gerät sichtbaren Aktionen.',
  },
  {
    id: 'HCN70qwVjfE', duration: '1:41', eyebrow: '10/13 · Berichte und Mitteilungen', title: 'Berichte und Mitteilungen',
    description: 'Lesen Sie Wochen- und Monatsübersichten, stündliche Nutzung, Ergebnisse nach Fach, Ereignisverlauf und wichtige Mitteilungen.',
  },
  {
    id: 'Vi1ylZEIozA', duration: '2:06', eyebrow: '11/13 · Datenschutz', title: 'Datenschutz und lokale Daten',
    description: 'Verstehen Sie Einwilligung, lokale Datenspeicherung, prüfbare Einträge, elterngesteuertes Löschen, PIN-Schutz und das optionale lokale Familiennetz.',
  },
  {
    id: '7dSyJx3GqvQ', duration: '2:07', eyebrow: '12/13 · Einstellungen', title: 'Einstellungen, Profile und Schutz',
    description: 'Konfigurieren Sie Sprache, Profile, Altersvorgaben, Wohlbefinden, PIN-Wiederherstellung, verschlüsselte Sicherung und den Windows-Schutzdienst.',
  },
  {
    id: 'enM6lEeSiBA', duration: '1:28', eyebrow: '13/13 · Windows-Werkzeuge', title: 'Infobereich, Schnellübersicht und Sperrbildschirm',
    description: 'Nutzen Sie Infobereich und Schnellübersicht, verstehen Sie Sperrgründe und sehen Sie, welche sicheren Aktionen dem Kind weiter zur Verfügung stehen.',
  },
]);

const frVideos = createLocalizedGuideVideos('fr', [
  {
    id: '6rtIT5shmNQ', duration: '1:09', eyebrow: '01/13 · Présentation', title: 'À quoi sert AliKa pour Windows ?',
    description: 'Découvrez comment les règles de temps d’écran, les contenus approuvés, les tâches et les rapports familiaux se réunissent dans une application Windows.',
  },
  {
    id: '7UvYVK_V-qo', duration: '1:48', eyebrow: '02/13 · Installation et sécurité', title: 'Installation Windows et première configuration',
    description: 'Installez AliKa depuis le Microsoft Store puis configurez la langue, le PIN parental, le consentement, la récupération et le mode sécurisé facultatif.',
  },
  {
    id: 'fPblmRoDypg', duration: '1:45', eyebrow: '03/13 · Tableau de bord', title: 'Tableau de bord et résumé quotidien',
    description: 'Consultez le temps restant, les récompenses, l’utilisation horaire, les applications principales, l’état de l’appareil et le programme familial.',
  },
  {
    id: 'wrj8DjzCDCQ', duration: '5:17', eyebrow: '04/13 · Enfant et règles', title: 'Enfant et règles : chaque onglet expliqué',
    description: 'Parcourez le temps, les applications, les sites, le coucher, le planning hebdomadaire, la protection web et le mode examen dans l’interface française.',
  },
  {
    id: 'Ip8_FnTd9Pw', duration: '3:06', eyebrow: '05/13 · Apprentissage', title: 'Ajouter des leçons et des questions',
    description: 'Ajoutez des leçons et banques de questions approuvées depuis les fichiers compatibles ou un paquet AliKa créé avec ChatGPT.',
  },
  {
    id: 'QcWtDHnXVc4', duration: '2:15', eyebrow: '06/13 · Apprentissage', title: 'L’écran d’apprentissage de l’enfant',
    description: 'Découvrez le travail du jour, les leçons approuvées, les exercices, la progression, le temps gagné et les tâches attribuées côté enfant.',
  },
  {
    id: 'zTLApkih1RI', duration: '1:58', eyebrow: '07/13 · Apprentissage', title: 'Questions, explications et temps gagné',
    description: 'Suivez le parcours complet : limite quotidienne, retour sur la réponse, explication, nouvelle tentative et temps d’écran gagné de façon contrôlée.',
  },
  {
    id: 'Ac1JrRQqsNM', duration: '2:30', eyebrow: '08/13 · Apprentissage', title: 'Créer des tâches, devoirs et examens',
    description: 'Distinguez les tâches quotidiennes, les devoirs liés à un contenu et les examens programmés, puis créez chaque type étape par étape.',
  },
  {
    id: 'Hf5kwd4Cm14', duration: '1:58', eyebrow: '09/13 · Appareils et réseau familial', title: 'Appareils et réseau familial',
    description: 'Associez un appareil sur le réseau local, vérifiez son état et envoyez uniquement les actions visibles compatibles avec l’appareil choisi.',
  },
  {
    id: '89htC2N97pA', duration: '2:09', eyebrow: '10/13 · Rapports et notifications', title: 'Rapports et notifications',
    description: 'Consultez les bilans hebdomadaires ou mensuels, l’utilisation horaire, les résultats par matière, l’historique des événements et les notifications.',
  },
  {
    id: '0jRPD2whdik', duration: '2:30', eyebrow: '11/13 · Confidentialité', title: 'Confidentialité et données locales',
    description: 'Comprenez le consentement, le stockage local, les données vérifiables, l’effacement parental, le PIN et le réseau familial local facultatif.',
  },
  {
    id: 'cWGb4qciXqk', duration: '2:34', eyebrow: '12/13 · Paramètres', title: 'Paramètres, profils et protection',
    description: 'Configurez la langue, les profils, les recommandations par âge, le bien-être, la récupération du PIN, la sauvegarde chiffrée et la protection Windows.',
  },
  {
    id: 'dv9QnGzT7QM', duration: '1:56', eyebrow: '13/13 · Outils Windows', title: 'Barre d’état, panneau rapide et écran de verrouillage',
    description: 'Utilisez la barre d’état et le panneau rapide, comprenez les motifs de verrouillage et les actions sûres encore disponibles pour l’enfant.',
  },
]);

const ptVideos = createLocalizedGuideVideos('pt', [
  {
    id: 'WYzSbP7lHt8', duration: '1:12', eyebrow: '01/13 · Visão geral', title: 'Para que serve o AliKa para Windows?',
    description: 'Veja como regras visíveis de tempo de tela, conteúdo aprovado, tarefas e relatórios da família se reúnem em um único aplicativo para Windows.',
  },
  {
    id: '6Pqy5WuA4xI', duration: '1:51', eyebrow: '02/13 · Instalação e segurança', title: 'Instalação no Windows e configuração inicial',
    description: 'Instale pela Microsoft Store e configure idioma, PIN parental, consentimento, recuperação offline e o Modo Seguro opcional.',
  },
  {
    id: '01QCagdmylU', duration: '1:40', eyebrow: '03/13 · Painel', title: 'Painel e resumo diário',
    description: 'Confira o tempo restante, recompensas, uso por hora, aplicativos principais, estado do dispositivo e a agenda da família.',
  },
  {
    id: 'yvvJmi3Eq7g', duration: '5:00', eyebrow: '04/13 · Criança e regras', title: 'Criança e regras: todas as abas explicadas',
    description: 'Conheça tempo, aplicativos, sites, horário de dormir, planejamento semanal, proteção web e Modo Prova na interface real em português.',
  },
  {
    id: 'M0XhV1fgqQ8', duration: '3:31', eyebrow: '05/13 · Aprendizagem', title: 'Adicionar aulas e perguntas',
    description: 'Adicione aulas e bancos de perguntas aprovados a partir de arquivos compatíveis ou de um pacote AliKa criado com o ChatGPT.',
  },
  {
    id: 'emoYHCau3aw', duration: '2:43', eyebrow: '06/13 · Aprendizagem', title: 'Tela de aprendizagem da criança',
    description: 'Veja o trabalho do dia, aulas aprovadas, prática de perguntas, progresso, tempo ganho e tarefas atribuídas na visão da criança.',
  },
  {
    id: 'wAwqcrV4rgA', duration: '2:10', eyebrow: '07/13 · Aprendizagem', title: 'Perguntas, explicações e tempo ganho',
    description: 'Acompanhe o fluxo completo: limite diário, retorno da resposta, explicação, nova tentativa e tempo de tela ganho de forma controlada.',
  },
  {
    id: '9FYGqVpSRMY', duration: '2:49', eyebrow: '08/13 · Aprendizagem', title: 'Criar tarefas, lições de casa e simulados',
    description: 'Diferencie tarefas diárias, lições de casa baseadas em conteúdo e simulados agendados, criando cada tipo passo a passo.',
  },
  {
    id: 'NVPCtS-m12g', duration: '2:06', eyebrow: '09/13 · Dispositivos e rede familiar', title: 'Dispositivos e rede familiar',
    description: 'Emparelhe um dispositivo pela rede local, confira seu estado e envie apenas as ações visíveis compatíveis com o dispositivo escolhido.',
  },
  {
    id: 'DQDsbvEj0gM', duration: '2:02', eyebrow: '10/13 · Relatórios e notificações', title: 'Relatórios e notificações',
    description: 'Consulte resumos semanais ou mensais, uso por hora, resultados por matéria, histórico de eventos e notificações.',
  },
  {
    id: 'EmOQjvXg-_M', duration: '2:50', eyebrow: '11/13 · Privacidade', title: 'Privacidade e dados locais',
    description: 'Entenda consentimento, armazenamento local, registros verificáveis, exclusão pelos pais, proteção por PIN e a rede familiar local opcional.',
  },
  {
    id: 'alwpqakMLmE', duration: '2:43', eyebrow: '12/13 · Configurações', title: 'Configurações, perfis e proteção',
    description: 'Configure idioma, perfis, recomendações por idade, bem-estar, recuperação do PIN, backup criptografado e a proteção do Windows.',
  },
  {
    id: 'u8yVQXbTMuc', duration: '2:10', eyebrow: '13/13 · Ferramentas do Windows', title: 'Bandeja do sistema, Painel rápido e Tela de bloqueio',
    description: 'Use a bandeja e o Painel rápido, entenda os motivos do bloqueio e quais ações seguras continuam disponíveis para a criança.',
  },
]);

const ruVideos = createLocalizedGuideVideos('ru', [
  {
    id: '0-FfzOa4n-U', duration: '1:03', eyebrow: '01/13 · Обзор', title: 'Для чего нужен AliKa для Windows?',
    description: 'Узнайте, как понятные правила экранного времени, одобренные материалы, задания и семейные отчёты объединяются в одном приложении Windows.',
  },
  {
    id: 'jBs4FF1tAsQ', duration: '1:43', eyebrow: '02/13 · Установка и безопасность', title: 'Установка в Windows и первая настройка',
    description: 'Установите AliKa из Microsoft Store и настройте русский язык, родительский PIN-код, согласие, восстановление и необязательный безопасный режим.',
  },
  {
    id: 'DvmGYfbFoG4', duration: '1:48', eyebrow: '03/13 · Панель', title: 'Панель и сводка за день',
    description: 'Проверьте оставшееся время, награды, использование по часам, основные приложения, состояние устройства и семейное расписание.',
  },
  {
    id: 'jbf8xLRd8Q0', duration: '5:08', eyebrow: '04/13 · Ребёнок и правила', title: 'Профиль ребёнка и правила: все вкладки',
    description: 'Разберите ограничения времени, приложения, сайты, отбой, недельный план, веб-защиту и режим экзамена в настоящем русском интерфейсе.',
  },
  {
    id: 'rlCl18_jlgI', duration: '2:45', eyebrow: '05/13 · Обучение', title: 'Добавление уроков и вопросов',
    description: 'Добавьте одобренные родителями уроки и банки вопросов из поддерживаемых файлов или пакета AliKa, подготовленного с помощью ChatGPT.',
  },
  {
    id: 'YPBu8_Mxeyk', duration: '2:15', eyebrow: '06/13 · Обучение', title: 'Учебный экран ребёнка',
    description: 'Посмотрите глазами ребёнка на работу дня, одобренные уроки, практику, прогресс, заработанное время и назначенные задания.',
  },
  {
    id: 'G3NMB8CxDkQ', duration: '1:54', eyebrow: '07/13 · Обучение', title: 'Вопросы, пояснения и заработанное время',
    description: 'Проследите полный процесс: дневной лимит, ответ, пояснение, повторная попытка и контролируемое начисление экранного времени.',
  },
  {
    id: 'GtTMNW5ftbY', duration: '2:40', eyebrow: '08/13 · Обучение', title: 'Создание заданий, домашних работ и экзаменов',
    description: 'Различайте ежедневные задания, домашние работы на основе материалов и запланированные экзамены, создавая каждый тип по шагам.',
  },
  {
    id: '7voTN9hKdFk', duration: '1:51', eyebrow: '09/13 · Устройства и семейная сеть', title: 'Устройства и семейная сеть',
    description: 'Подключите семейное устройство по локальной сети, проверьте его состояние и отправляйте только доступные для него действия.',
  },
  {
    id: '35_CvTNW8es', duration: '2:05', eyebrow: '10/13 · Отчёты и уведомления', title: 'Отчёты и уведомления',
    description: 'Просматривайте недельные и месячные сводки, использование по часам, результаты по предметам, журнал событий и уведомления.',
  },
  {
    id: 'yJWMdRQ9PlM', duration: '2:27', eyebrow: '11/13 · Конфиденциальность', title: 'Конфиденциальность и локальные данные',
    description: 'Разберитесь в согласии, локальном хранении, проверяемых записях, удалении родителем, PIN-защите и необязательной семейной сети.',
  },
  {
    id: 'nhEtbYp1EA8', duration: '2:35', eyebrow: '12/13 · Настройки', title: 'Настройки, профили и защита',
    description: 'Настройте язык, профили, возрастные рекомендации, цифровое благополучие, восстановление PIN, шифрованную копию и защиту Windows.',
  },
  {
    id: 'TjVSglHAYbo', duration: '2:04', eyebrow: '13/13 · Инструменты Windows', title: 'Область уведомлений, быстрая панель и блокировка',
    description: 'Используйте область уведомлений и быструю панель, понимайте причины блокировки и безопасные действия, доступные ребёнку.',
  },
]);

const jaVideos = createLocalizedGuideVideos('ja', [
  {
    id: 'P_89E1TYVa8', duration: '1:09', eyebrow: '01/13 · 概要', title: 'AliKa for Windowsでできること',
    description: '明確なスクリーンタイム規則、保護者が承認した教材、タスク、報酬、家族レポートが1つのWindowsアプリにどうまとまるかをご覧ください。',
  },
  {
    id: 'VNCzShdldOw', duration: '1:34', eyebrow: '02/13 · インストールと安全', title: 'Windowsへのインストールと初期設定',
    description: 'Microsoft StoreからAliKaをインストールし、日本語、保護者PIN、同意、オフライン復旧、任意のセーフモードを設定します。',
  },
  {
    id: 'E-wrWpoy5lA', duration: '1:35', eyebrow: '03/13 · ダッシュボード', title: 'ダッシュボードと今日のまとめ',
    description: '残り時間、報酬、時間帯別の利用状況、主なアプリ、デバイスの状態、家族の予定を確認します。',
  },
  {
    id: 'Tm6XfHOC1Po', duration: '4:40', eyebrow: '04/13 · 子どもとルール', title: '子どもとルール：すべてのタブを解説',
    description: '時間、アプリ、Webサイト、就寝時間、週間計画、Web保護、試験モードの各設定を実際の日本語画面で確認します。',
  },
  {
    id: 'VOJvDqWBAl4', duration: '2:58', eyebrow: '05/13 · 学習', title: 'レッスンと問題の追加',
    description: '対応ファイルやChatGPTで作成したAliKaパッケージから、保護者が確認・承認するレッスンと問題集を追加します。',
  },
  {
    id: 'o8LyU7jtk2k', duration: '2:13', eyebrow: '06/13 · 学習', title: '子どもの学習画面',
    description: '子どもの視点から、今日の作業、承認済み教材、問題演習、進捗、獲得時間、割り当てられたタスクを確認します。',
  },
  {
    id: 'nENt9Slcb7o', duration: '1:58', eyebrow: '07/13 · 学習', title: '問題・解説と獲得時間',
    description: '1日の報酬上限、回答、正誤フィードバック、解説、再挑戦、管理されたスクリーンタイム獲得までの流れを確認します。',
  },
  {
    id: 'D3HKk0K7zZk', duration: '2:34', eyebrow: '08/13 · 学習', title: 'タスク、宿題、試験の作成',
    description: '日常のタスク、教材を使う宿題、日時を指定する試験の違いを理解し、それぞれを手順に沿って作成します。',
  },
  {
    id: 'qrUhafVV4LI', duration: '1:55', eyebrow: '09/13 · デバイスとファミリーネットワーク', title: 'デバイスとファミリーネットワーク',
    description: '家族のデバイスをローカルネットワークでペアリングし、状態を確認して、対応する操作だけを安全に送信します。',
  },
  {
    id: '5EElgi4sCGI', duration: '1:52', eyebrow: '10/13 · レポートと通知', title: 'レポートと通知',
    description: '週次・月次の概要、時間帯別の利用状況、科目別の結果、イベント履歴、通知を分かりやすく確認します。',
  },
  {
    id: 'OGRFudDY43Y', duration: '2:19', eyebrow: '11/13 · プライバシー', title: 'プライバシーとローカルデータ',
    description: '同意、端末内保存、確認可能な記録、保護者による削除、PIN保護、任意のローカル家族ネットワークを解説します。',
  },
  {
    id: 'WHY_2o3KHEQ', duration: '2:21', eyebrow: '12/13 · 設定', title: '設定、プロファイルと保護',
    description: '言語、プロファイル、年齢別の提案、デジタルウェルビーイング、PIN復旧、暗号化バックアップ、Windows保護を設定します。',
  },
  {
    id: 'KAdWqbYdwZw', duration: '1:42', eyebrow: '13/13 · Windowsツール', title: 'システムトレイ、クイックパネル、ロック画面',
    description: 'システムトレイとクイックパネルの使い方、ロック理由の確認、子どもが利用できる安全な操作を説明します。',
  },
]);

const koVideos = createLocalizedGuideVideos('ko', [
  {
    id: '40_M-PYYyFY', duration: '1:03', eyebrow: '01/13 · 소개', title: 'AliKa Windows는 무엇을 하나요?',
    description: '명확한 화면 시간 규칙, 보호자가 승인한 학습 자료, 과제, 보상 및 가족 보고서가 하나의 Windows 앱에서 어떻게 연결되는지 확인하세요.',
  },
  {
    id: '95-M1Ew6mqY', duration: '1:26', eyebrow: '02/13 · 설치 및 안전', title: 'Windows 설치 및 첫 설정',
    description: 'Microsoft Store에서 AliKa를 설치하고 한국어, 보호자 PIN, 동의, 오프라인 복구 및 선택형 안전 모드를 설정합니다.',
  },
  {
    id: 'kbFD_mURoRA', duration: '1:19', eyebrow: '03/13 · 대시보드', title: '대시보드와 오늘의 요약',
    description: '남은 시간, 보상, 시간대별 사용량, 주요 앱, 기기 상태 및 예정된 가족 일정을 한눈에 확인합니다.',
  },
  {
    id: 'rtVYUNCloOs', duration: '3:55', eyebrow: '04/13 · 자녀와 규칙', title: '자녀와 규칙: 모든 탭 안내',
    description: '실제 한국어 화면에서 시간, 앱, 웹사이트, 취침 시간, 주간 계획, 웹 보호 및 시험 모드 설정을 살펴봅니다.',
  },
  {
    id: 'LNgdQ-iGjPk', duration: '2:35', eyebrow: '05/13 · 학습', title: '학습 콘텐츠와 문제 추가',
    description: '지원 파일 또는 ChatGPT로 만든 AliKa 패키지에서 보호자가 검토하고 승인할 학습 자료와 문제 은행을 추가합니다.',
  },
  {
    id: 'JAvy2FJKSro', duration: '2:03', eyebrow: '06/13 · 학습', title: '자녀 학습 화면',
    description: '자녀의 시점에서 오늘의 학습, 승인된 자료, 문제 연습, 진행 상황, 획득 시간 및 할당된 과제를 확인합니다.',
  },
  {
    id: '6GoL_IZhkQY', duration: '1:34', eyebrow: '07/13 · 학습', title: '문제 풀이, 설명과 시간 획득',
    description: '일일 보상 한도, 답변, 정답·오답 피드백, 설명, 재도전 및 관리된 화면 시간 획득 과정을 확인합니다.',
  },
  {
    id: 'a2-GUC4PElM', duration: '2:08', eyebrow: '08/13 · 학습', title: '과제, 숙제와 시험 만들기',
    description: '일상 과제, 학습 자료에 연결된 숙제 및 일정이 지정된 시험의 차이를 이해하고 각각 단계별로 만듭니다.',
  },
  {
    id: 'ZEbpxISW9b4', duration: '1:36', eyebrow: '09/13 · 기기 및 가족 네트워크', title: '기기 및 가족 네트워크',
    description: '로컬 네트워크에서 가족 기기를 페어링하고 상태를 확인한 뒤 선택한 기기에서 지원하는 작업만 전송합니다.',
  },
  {
    id: 'txU6oS9d7o4', duration: '1:34', eyebrow: '10/13 · 보고서 및 알림', title: '보고서 및 알림',
    description: '주간·월간 요약, 시간대별 사용량, 과목별 학습 결과, 이벤트 기록 및 주요 알림을 확인합니다.',
  },
  {
    id: 'pCH22TF9n0M', duration: '2:00', eyebrow: '11/13 · 개인정보 보호', title: '개인정보 보호와 로컬 데이터',
    description: '동의, 기기 내 저장, 확인 가능한 기록, 보호자 삭제, PIN 보호 및 선택형 로컬 가족 네트워크를 설명합니다.',
  },
  {
    id: 'oAXdFSVcv5o', duration: '2:02', eyebrow: '12/13 · 설정', title: '설정, 프로필, 디지털 웰빙과 보호',
    description: '언어, 프로필, 연령별 권장 설정, 디지털 웰빙, PIN 복구, 암호화된 백업 및 Windows 보호를 구성합니다.',
  },
  {
    id: 'MQV6egS3pEk', duration: '1:37', eyebrow: '13/13 · Windows 도구', title: '시스템 트레이, 빠른 패널과 잠금 화면',
    description: '시스템 트레이와 빠른 패널을 사용하고 잠금 이유와 자녀가 이용할 수 있는 안전한 작업을 확인합니다.',
  },
]);

const groupLabels = (
  start: string, panel: string, rules: string, learning: string, devices: string, reports: string, system: string,
): Record<GuideVideoGroup, string> => ({
  start, child: rules, panel, rules, learning, devices, reports, profile: system, settings: system, system,
});

export const GUIDE_LANGUAGES: readonly GuideLanguage[] = [
  {
    platform: 'windows', expectedVideoCount: 13, code: 'tr', youtubeLocale: 'tr', nativeName: 'Türkçe', playlistId: 'PLb83uFzWZ16Q', status: 'public', videos: trVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube rehberleri · 9 uygulama dili', sectionTitle: 'AliKa Windows video rehberleri',
      sectionLead: 'Dilinizi seçin; 01–13 sırasındaki rehberleri konu başlıklarına göre adım adım izleyin.', channelLabel: 'AliKa kanalını aç', playlistLabel: '13 videoluk seriyi aç',
      playLabel: 'Videoyu oynat', youtubeLabel: 'YouTube’da aç', publishedLabel: 'Yayımlanan rehberler', preparingLabel: 'Hazırlanıyor',
      emptyTitle: 'Türkçe rehberler hazırlanıyor.', emptyDescription: 'Bu dilin eksiksiz Windows rehber seti yayımlandığında burada görünecek.',
      privacyLabel: 'Video yalnız oynat düğmesine bastığınızda YouTube’a bağlanır.', totalLabel: (count, duration) => `${count} açıklamalı rehber · toplam ${duration}`, videoCountLabel: (count) => `${count} video`,
      groupLabels: groupLabels('Başlangıç ve Kurulum', 'Panel', 'Çocuk ve Kurallar', 'Öğrenme', 'Cihazlar ve Aile Ağı', 'Raporlar ve Bildirimler', 'Ayarlar, Gizlilik ve Windows Yardımcıları'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'en', youtubeLocale: 'en', nativeName: 'English', playlistId: 'PLcfP4qWx0x4k', status: 'public', videos: enVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube guides · 9 app languages', sectionTitle: 'AliKa for Windows video guides',
      sectionLead: 'Choose your language and follow guides 01–13 step by step, organized by topic.', channelLabel: 'Open the AliKa channel', playlistLabel: 'Open the 13-video series',
      playLabel: 'Play video', youtubeLabel: 'Open on YouTube', publishedLabel: 'Published guides', preparingLabel: 'In preparation',
      emptyTitle: 'English video guides are being prepared.', emptyDescription: 'The complete English Windows guide set will appear here after publication.',
      privacyLabel: 'YouTube is contacted only after you press play.', totalLabel: (count, duration) => `${count} guided videos · ${duration} total`, videoCountLabel: (count) => `${count} videos`,
      groupLabels: groupLabels('Introduction and Setup', 'Dashboard', 'Child and Rules', 'Learning', 'Devices and Family Network', 'Reports and Notifications', 'Settings, Privacy and Windows Tools'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'de', youtubeLocale: 'de', nativeName: 'Deutsch', playlistId: 'PLeJpTO5eMvbM', status: 'public', videos: deVideos,
    copy: {
      sectionEyebrow: 'AliKa-YouTube-Anleitungen · 9 App-Sprachen', sectionTitle: 'AliKa Windows-Videoanleitungen',
      sectionLead: 'Wählen Sie Ihre Sprache und folgen Sie den Anleitungen 01–13 Schritt für Schritt, nach Themen geordnet.', channelLabel: 'AliKa-Kanal öffnen', playlistLabel: 'Alle 13 Videos öffnen',
      playLabel: 'Video abspielen', youtubeLabel: 'Auf YouTube öffnen', publishedLabel: 'Veröffentlichte Anleitungen', preparingLabel: 'In Vorbereitung',
      emptyTitle: 'Deutsche Videoanleitungen werden vorbereitet.', emptyDescription: 'Nach der Veröffentlichung erscheint hier die vollständige deutsche Windows-Serie.',
      privacyLabel: 'Eine Verbindung zu YouTube wird erst nach dem Klick auf Wiedergabe hergestellt.', totalLabel: (count, duration) => `${count} Anleitungen · insgesamt ${duration}`, videoCountLabel: (count) => `${count} Videos`,
      groupLabels: groupLabels('Einführung und Installation', 'Übersicht', 'Kind und Regeln', 'Lernen', 'Geräte und Familiennetzwerk', 'Berichte und Benachrichtigungen', 'Einstellungen, Datenschutz und Windows-Werkzeuge'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'es', youtubeLocale: 'es', nativeName: 'Español', playlistId: 'PLGs9cZUQyNJg', status: 'public', videos: esVideos,
    copy: {
      sectionEyebrow: 'Guías de AliKa en YouTube · 9 idiomas', sectionTitle: 'Guías en vídeo de AliKa para Windows',
      sectionLead: 'Elija su idioma y siga las guías 01–13 paso a paso, organizadas por tema.', channelLabel: 'Abrir el canal de AliKa', playlistLabel: 'Abrir la serie de 13 vídeos',
      playLabel: 'Reproducir vídeo', youtubeLabel: 'Abrir en YouTube', publishedLabel: 'Guías publicadas', preparingLabel: 'En preparación',
      emptyTitle: 'Las guías en español están en preparación.', emptyDescription: 'La serie completa de Windows en español aparecerá aquí cuando se publique.',
      privacyLabel: 'YouTube solo se conecta después de pulsar reproducir.', totalLabel: (count, duration) => `${count} guías · ${duration} en total`, videoCountLabel: (count) => `${count} vídeos`,
      groupLabels: groupLabels('Introducción e instalación', 'Panel', 'Niño y reglas', 'Aprendizaje', 'Dispositivos y red familiar', 'Informes y notificaciones', 'Ajustes, privacidad y herramientas de Windows'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'fr', youtubeLocale: 'fr', nativeName: 'Français', playlistId: 'PLJfxtPILegJ8', status: 'public', videos: frVideos,
    copy: {
      sectionEyebrow: 'Guides AliKa sur YouTube · 9 langues', sectionTitle: 'Guides vidéo AliKa pour Windows',
      sectionLead: 'Choisissez votre langue et suivez les guides 01–13 étape par étape, classés par thème.', channelLabel: 'Ouvrir la chaîne AliKa', playlistLabel: 'Ouvrir la série de 13 vidéos',
      playLabel: 'Lire la vidéo', youtubeLabel: 'Ouvrir sur YouTube', publishedLabel: 'Guides publiés', preparingLabel: 'En préparation',
      emptyTitle: 'Les guides vidéo en français sont en préparation.', emptyDescription: 'La série Windows complète en français apparaîtra ici après sa publication.',
      privacyLabel: 'La connexion à YouTube ne se fait qu’après avoir appuyé sur Lecture.', totalLabel: (count, duration) => `${count} guides · ${duration} au total`, videoCountLabel: (count) => `${count} vidéos`,
      groupLabels: groupLabels('Présentation et installation', 'Tableau de bord', 'Enfant et règles', 'Apprentissage', 'Appareils et réseau familial', 'Rapports et notifications', 'Paramètres, confidentialité et outils Windows'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'pt', youtubeLocale: 'pt-BR', nativeName: 'Português (Brasil)', playlistId: 'PLYDOAXkT60aU', status: 'public', videos: ptVideos,
    copy: {
      sectionEyebrow: 'Guias do AliKa no YouTube · 9 idiomas', sectionTitle: 'Guias em vídeo do AliKa para Windows',
      sectionLead: 'Escolha seu idioma e acompanhe os guias 01–13 passo a passo, organizados por assunto.', channelLabel: 'Abrir o canal do AliKa', playlistLabel: 'Abrir a série de 13 vídeos',
      playLabel: 'Reproduzir vídeo', youtubeLabel: 'Abrir no YouTube', publishedLabel: 'Guias publicados', preparingLabel: 'Em preparação',
      emptyTitle: 'Os guias em português estão sendo preparados.', emptyDescription: 'A série completa do Windows em português aparecerá aqui após a publicação.',
      privacyLabel: 'O YouTube só é conectado depois que você pressiona reproduzir.', totalLabel: (count, duration) => `${count} guias · ${duration} no total`, videoCountLabel: (count) => `${count} vídeos`,
      groupLabels: groupLabels('Introdução e instalação', 'Painel', 'Criança e regras', 'Aprendizagem', 'Dispositivos e rede familiar', 'Relatórios e notificações', 'Configurações, privacidade e ferramentas do Windows'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'ru', youtubeLocale: 'ru', nativeName: 'Русский', playlistId: 'PLNmRBY5CU7Q8', status: 'public', videos: ruVideos,
    copy: {
      sectionEyebrow: 'Видеоинструкции AliKa · 9 языков приложения', sectionTitle: 'Смотрите инструкции на своём языке.',
      sectionLead: 'Выберите язык, чтобы увидеть только опубликованные инструкции Windows на этом языке.', channelLabel: 'Открыть канал AliKa', playlistLabel: 'Открыть серию из 13 видео',
      playLabel: 'Воспроизвести видео', youtubeLabel: 'Открыть на YouTube', publishedLabel: 'Опубликованные инструкции', preparingLabel: 'Готовится',
      emptyTitle: 'Видеоинструкции на русском языке готовятся.', emptyDescription: 'Полная серия инструкций Windows появится здесь после публикации.',
      privacyLabel: 'Соединение с YouTube устанавливается только после нажатия кнопки воспроизведения.', totalLabel: (count, duration) => `${count} инструкций · всего ${duration}`, videoCountLabel: (count) => `${count} видео`,
      groupLabels: groupLabels('Знакомство и установка', 'Панель', 'Ребёнок и правила', 'Обучение', 'Устройства и семейная сеть', 'Отчёты и уведомления', 'Настройки, конфиденциальность и инструменты Windows'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'ja', youtubeLocale: 'ja', nativeName: '日本語', playlistId: 'PLOPeP3QrjNDg', status: 'public', videos: jaVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube ガイド · アプリ対応9言語', sectionTitle: 'お使いの言語でガイドをご覧ください。',
      sectionLead: '言語を選ぶと、その言語で公開済みのWindowsガイドだけが表示されます。', channelLabel: 'AliKaチャンネルを開く', playlistLabel: '全13本のシリーズを開く',
      playLabel: '動画を再生', youtubeLabel: 'YouTubeで開く', publishedLabel: '公開済みガイド', preparingLabel: '準備中',
      emptyTitle: '日本語の動画ガイドを準備しています。', emptyDescription: '日本語版Windowsガイド全13本の公開後、ここに表示されます。',
      privacyLabel: '再生ボタンを押すまでYouTubeには接続しません。', totalLabel: (count, duration) => `${count}本のガイド · 合計${duration}`, videoCountLabel: (count) => `${count}本`,
      groupLabels: groupLabels('概要とインストール', 'パネル', '子どもとルール', '学習', 'デバイスとファミリーネットワーク', 'レポートと通知', '設定・プライバシー・Windowsツール'),
    },
  },
  {
    platform: 'windows', expectedVideoCount: 13, code: 'ko', youtubeLocale: 'ko', nativeName: '한국어', playlistId: 'PLMC3Z8z69Ujk', status: 'public', videos: koVideos,
    copy: {
      sectionEyebrow: 'AliKa YouTube 가이드 · 앱 지원 9개 언어', sectionTitle: '내 언어로 가이드를 시청하세요.',
      sectionLead: '언어를 선택하면 해당 언어로 공개된 Windows 가이드만 표시됩니다.', channelLabel: 'AliKa 채널 열기', playlistLabel: '13개 동영상 시리즈 열기',
      playLabel: '동영상 재생', youtubeLabel: 'YouTube에서 열기', publishedLabel: '공개된 가이드', preparingLabel: '준비 중',
      emptyTitle: '한국어 동영상 가이드를 준비하고 있습니다.', emptyDescription: '한국어 Windows 가이드 13편이 모두 공개되면 여기에 표시됩니다.',
      privacyLabel: '재생 버튼을 누르기 전에는 YouTube에 연결하지 않습니다.', totalLabel: (count, duration) => `가이드 ${count}편 · 총 ${duration}`, videoCountLabel: (count) => `${count}개 동영상`,
      groupLabels: groupLabels('소개 및 설치', '패널', '자녀와 규칙', '학습', '기기 및 가족 네트워크', '보고서 및 알림', '설정·개인정보·Windows 도구'),
    },
  },
] as const;

const androidGroupLabels = (
  start: string,
  child: string,
  panel: string,
  rules: string,
  learning: string,
  devices: string,
  reports: string,
  profile: string,
  settings: string,
): Record<GuideVideoGroup, string> => ({
  start, child, panel, rules, learning, devices, reports, profile, settings, system: settings,
});

const androidCopyOverrides: Record<GuideLanguageCode, Pick<GuideLanguageCopy,
  'sectionTitle' | 'sectionLead' | 'playlistLabel' | 'emptyTitle' | 'emptyDescription' | 'groupLabels'
>> = {
  tr: {
    sectionTitle: 'AliKa Android telefon ve tablet rehberleri',
    sectionLead: 'Android rehberleri 01–21 sırasında; çocuk, ebeveyn ve ortak telefon ekranları ayrı başlıklarda gösterilecek.',
    playlistLabel: '21 videoluk Android serisini aç',
    emptyTitle: 'Türkçe Android rehberleri hazırlanıyor.',
    emptyDescription: 'Gerçek telefon çekimleri onaylanıp Android dağıtımı açıldığında 21 videonun tamamı burada birlikte yayımlanacak.',
    groupLabels: androidGroupLabels('Kurulum', 'Çocuk Ekranı', 'Panel', 'Kurallar', 'Öğrenme', 'Cihazlar ve Aile Ağı', 'Raporlar', 'Profil', 'Ayarlar'),
  },
  en: {
    sectionTitle: 'AliKa Android phone and tablet guides',
    sectionLead: 'The 01–21 Android series will keep child, parent and shared-phone screens in clearly separated topics.',
    playlistLabel: 'Open the 21-video Android series',
    emptyTitle: 'English Android guides are in preparation.',
    emptyDescription: 'All 21 videos will appear together after real-device review and Android distribution are ready.',
    groupLabels: androidGroupLabels('Setup', 'Child Screen', 'Dashboard', 'Rules', 'Learning', 'Devices and Family Network', 'Reports', 'Profile', 'Settings'),
  },
  de: {
    sectionTitle: 'AliKa-Android-Anleitungen für Smartphone und Tablet',
    sectionLead: 'Die Android-Reihe 01–21 trennt Kinder-, Eltern- und gemeinsam genutzte Geräte klar nach Themen.',
    playlistLabel: 'Android-Serie mit 21 Videos öffnen',
    emptyTitle: 'Deutsche Android-Anleitungen werden vorbereitet.',
    emptyDescription: 'Alle 21 Videos erscheinen gemeinsam nach der Prüfung am echten Gerät und dem Start der Android-Verteilung.',
    groupLabels: androidGroupLabels('Einrichtung', 'Kinderansicht', 'Übersicht', 'Regeln', 'Lernen', 'Geräte und Familiennetzwerk', 'Berichte', 'Profil', 'Einstellungen'),
  },
  es: {
    sectionTitle: 'Guías de AliKa para teléfonos y tabletas Android',
    sectionLead: 'La serie Android 01–21 separa claramente las pantallas del niño, de los padres y del teléfono compartido.',
    playlistLabel: 'Abrir la serie Android de 21 vídeos',
    emptyTitle: 'Las guías de Android en español están en preparación.',
    emptyDescription: 'Los 21 vídeos aparecerán juntos tras la revisión en un dispositivo real y el inicio de la distribución Android.',
    groupLabels: androidGroupLabels('Instalación', 'Pantalla infantil', 'Panel', 'Reglas', 'Aprendizaje', 'Dispositivos y red familiar', 'Informes', 'Perfil', 'Ajustes'),
  },
  fr: {
    sectionTitle: 'Guides AliKa pour téléphones et tablettes Android',
    sectionLead: 'La série Android 01–21 sépare clairement les écrans enfant, parent et téléphone partagé.',
    playlistLabel: 'Ouvrir la série Android de 21 vidéos',
    emptyTitle: 'Les guides Android en français sont en préparation.',
    emptyDescription: 'Les 21 vidéos paraîtront ensemble après la validation sur appareil réel et l’ouverture de la distribution Android.',
    groupLabels: androidGroupLabels('Installation', 'Écran enfant', 'Tableau de bord', 'Règles', 'Apprentissage', 'Appareils et réseau familial', 'Rapports', 'Profil', 'Paramètres'),
  },
  pt: {
    sectionTitle: 'Guias do AliKa para celulares e tablets Android',
    sectionLead: 'A série Android 01–21 separa claramente as telas da criança, dos responsáveis e do celular compartilhado.',
    playlistLabel: 'Abrir a série Android de 21 vídeos',
    emptyTitle: 'Os guias Android em português estão sendo preparados.',
    emptyDescription: 'Os 21 vídeos aparecerão juntos após a revisão em aparelho real e a abertura da distribuição Android.',
    groupLabels: androidGroupLabels('Configuração', 'Tela da criança', 'Painel', 'Regras', 'Aprendizagem', 'Dispositivos e rede familiar', 'Relatórios', 'Perfil', 'Configurações'),
  },
  ru: {
    sectionTitle: 'Руководства AliKa для телефонов и планшетов Android',
    sectionLead: 'В серии Android 01–21 экраны ребёнка, родителя и общего телефона разделены по понятным темам.',
    playlistLabel: 'Открыть серию Android из 21 видео',
    emptyTitle: 'Руководства Android на русском языке готовятся.',
    emptyDescription: 'Все 21 видео появятся вместе после проверки на реальном устройстве и запуска распространения Android.',
    groupLabels: androidGroupLabels('Установка', 'Экран ребёнка', 'Панель', 'Правила', 'Обучение', 'Устройства и семейная сеть', 'Отчёты', 'Профиль', 'Настройки'),
  },
  ja: {
    sectionTitle: 'AliKa Androidスマートフォン・タブレットガイド',
    sectionLead: 'Android 01–21シリーズでは、子ども・保護者・共有端末の画面を分かりやすい項目に分けて紹介します。',
    playlistLabel: 'Android全21本のシリーズを開く',
    emptyTitle: '日本語のAndroidガイドを準備しています。',
    emptyDescription: '実機確認とAndroid配布の開始後、全21本をまとめて公開します。',
    groupLabels: androidGroupLabels('セットアップ', '子ども画面', 'パネル', 'ルール', '学習', 'デバイスとファミリーネットワーク', 'レポート', 'プロフィール', '設定'),
  },
  ko: {
    sectionTitle: 'AliKa Android 휴대폰·태블릿 가이드',
    sectionLead: 'Android 01–21 시리즈는 자녀, 보호자, 공용 휴대폰 화면을 이해하기 쉬운 주제로 나누어 보여 줍니다.',
    playlistLabel: 'Android 21개 동영상 시리즈 열기',
    emptyTitle: '한국어 Android 가이드를 준비하고 있습니다.',
    emptyDescription: '실제 기기 검토와 Android 배포가 시작되면 21개 동영상을 한 번에 공개합니다.',
    groupLabels: androidGroupLabels('설정', '자녀 화면', '패널', '규칙', '학습', '기기 및 가족 네트워크', '보고서', '프로필', '설정'),
  },
};

export const ANDROID_GUIDE_LANGUAGES: readonly GuideLanguage[] = GUIDE_LANGUAGES.map((windowsLanguage) => ({
  ...windowsLanguage,
  platform: 'android',
  expectedVideoCount: 21,
  playlistId: '',
  status: 'preparing',
  videos: [],
  copy: { ...windowsLanguage.copy, ...androidCopyOverrides[windowsLanguage.code] },
}));

export const GUIDE_VIDEO_GROUP_ORDER: readonly GuideVideoGroup[] = ['start', 'panel', 'rules', 'learning', 'devices', 'reports', 'system'];
export const ANDROID_GUIDE_VIDEO_GROUP_ORDER: readonly GuideVideoGroup[] = ['start', 'child', 'panel', 'rules', 'learning', 'devices', 'reports', 'profile', 'settings'];

export const WINDOWS_GUIDE_SERIES: GuideSeries = {
  platform: 'windows', expectedVideoCount: 13, groupOrder: GUIDE_VIDEO_GROUP_ORDER, languages: GUIDE_LANGUAGES,
};
export const ANDROID_GUIDE_SERIES: GuideSeries = {
  platform: 'android', expectedVideoCount: 21, groupOrder: ANDROID_GUIDE_VIDEO_GROUP_ORDER, languages: ANDROID_GUIDE_LANGUAGES,
};
export const GUIDE_SERIES_BY_PLATFORM: Record<GuidePlatform, GuideSeries> = {
  windows: WINDOWS_GUIDE_SERIES,
  android: ANDROID_GUIDE_SERIES,
};

for (const series of Object.values(GUIDE_SERIES_BY_PLATFORM)) {
  for (const language of series.languages) {
    if (language.platform !== series.platform || language.expectedVideoCount !== series.expectedVideoCount) {
      throw new Error(`${series.platform}/${language.code}: guide series metadata differs`);
    }
    if (language.status === 'public' && language.videos.length !== series.expectedVideoCount) {
      throw new Error(`${series.platform}/${language.code}: a public guide release must contain exactly ${series.expectedVideoCount} videos`);
    }
    const orders = language.videos.map((video) => video.order);
    const ids = language.videos.map((video) => video.id);
    if (new Set(orders).size !== orders.length || new Set(ids).size !== ids.length) {
      throw new Error(`${series.platform}/${language.code}: duplicate guide order or YouTube id`);
    }
    if (language.videos.length > 0 && orders.some((order, index) => order !== index + 1)) {
      throw new Error(`${series.platform}/${language.code}: guide videos must be ordered from 1 to ${series.expectedVideoCount}`);
    }
  }
}

export function getPublishedGuideVideos(language: GuideLanguage): readonly GuideVideo[] {
  return language.status === 'public' && language.videos.length === language.expectedVideoCount ? language.videos : [];
}
