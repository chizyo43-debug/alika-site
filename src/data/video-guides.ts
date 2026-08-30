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

function createLocalizedGuideVideos(language: 'de' | 'fr' | 'pt' | 'ru', seeds: readonly LocalizedGuideSeed[]): readonly GuideVideo[] {
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

const groupLabels = (
  start: string, panel: string, rules: string, learning: string, devices: string, reports: string, system: string,
): Record<GuideVideoGroup, string> => ({ start, panel, rules, learning, devices, reports, system });

export const GUIDE_LANGUAGES: readonly GuideLanguage[] = [
  {
    code: 'tr', youtubeLocale: 'tr', nativeName: 'Türkçe', playlistId: 'PLb83uFzWZ16Q', status: 'public', videos: trVideos,
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
    code: 'en', youtubeLocale: 'en', nativeName: 'English', playlistId: 'PLcfP4qWx0x4k', status: 'public', videos: enVideos,
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
    code: 'de', youtubeLocale: 'de', nativeName: 'Deutsch', playlistId: 'PLeJpTO5eMvbM', status: 'public', videos: deVideos,
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
    code: 'es', youtubeLocale: 'es', nativeName: 'Español', playlistId: 'PLGs9cZUQyNJg', status: 'public', videos: esVideos,
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
    code: 'fr', youtubeLocale: 'fr', nativeName: 'Français', playlistId: 'PLJfxtPILegJ8', status: 'public', videos: frVideos,
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
    code: 'pt', youtubeLocale: 'pt-BR', nativeName: 'Português (Brasil)', playlistId: 'PLYDOAXkT60aU', status: 'public', videos: ptVideos,
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
    code: 'ru', youtubeLocale: 'ru', nativeName: 'Русский', playlistId: 'PLNmRBY5CU7Q8', status: 'public', videos: ruVideos,
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
    code: 'ja', youtubeLocale: 'ja', nativeName: '日本語', playlistId: '', status: 'preparing', videos: [],
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
    code: 'ko', youtubeLocale: 'ko', nativeName: '한국어', playlistId: '', status: 'preparing', videos: [],
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
