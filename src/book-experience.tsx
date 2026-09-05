'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import {
  GUIDE_SERIES_BY_PLATFORM,
  getPublishedGuideVideos,
  type GuideLanguage,
  type GuideLanguageCode,
  type GuidePlatform,
  type GuideVideo,
} from './data/video-guides';
import localeData from './data/locales.json';

type BookPhase = 'closed' | 'morphing' | 'opening' | 'reading' | 'flipping';
type PageKind = 'contents' | 'method' | 'difference' | 'day-story' | 'platforms' | 'android-mobile' | 'android-tv' | 'learning' | 'evidence' | 'age-intro' | 'age-band' | 'planning' | 'routine' | 'family' | 'ecosystem-actions' | 'games-intro' | 'games-group' | 'trust' | 'status' | 'content' | 'content-catalog' | 'feedback' | 'closing';
type PageStatus = 'Bugün kullanılabilir' | 'Geliştiriliyor' | 'Planlandı';
type SiteLanguage = keyof typeof localeData;
type LocaleCopy = (typeof localeData)[SiteLanguage];

interface BookPage {
  id: string;
  title: string;
  chapter: string;
  kind: PageKind;
  summary: string;
  navLabel?: string;
  status?: PageStatus;
}

interface BookChapter {
  id: string;
  label: string;
  start: number;
}

interface ContentSubject {
  id: string;
  label: string;
  topics: number;
  questions: number;
}

interface ContentGrade {
  id: string;
  label: string;
  topics: number;
  questions: number;
  subjects: ContentSubject[];
}

interface PublishedContentGrade {
  country_slug: string;
  country: string;
  grade_slug: string;
  grade: number | string;
  notes: number;
  questions: number;
  download_url: string;
}

interface PublishedContentSubject {
  country_slug: string;
  country: string;
  grade_slug: string;
  subject_slug: string;
  subject: string;
  notes: number;
  questions: number;
  download_url: string;
}

interface PublishedContentCatalog {
  grades: PublishedContentGrade[];
  subjects: PublishedContentSubject[];
  totals?: {
    countries: number;
    subjects: number;
    questions: number;
  };
}

interface GameInfo {
  id: string;
  coverId?: string;
  title: string;
  category: string;
  players: string;
  duration: string;
  mark: string;
  tone: 'cyan' | 'amber' | 'coral' | 'green' | 'violet';
  summary: string;
  steps: readonly [string, string, string];
}

interface AgeBandInfo {
  id: string;
  range: string;
  mode: string;
  eyebrow: string;
  headline: string;
  purpose: string;
  childView: string;
  learning: string;
  parentRole: string;
  motivation: string;
  rhythm: string;
  quizCards: number;
  tone: 'young' | 'mid' | 'teen' | 'senior';
}


const SITE_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', href: '/', flag: '/flags/tr.svg' },
  { code: 'en', label: 'English', href: '/en/', flag: '/flags/en.svg' },
  { code: 'de', label: 'Deutsch', href: '/de/', flag: '/flags/de.svg' },
  { code: 'es', label: 'Español', href: '/es/', flag: '/flags/es.svg' },
  { code: 'fr', label: 'Français', href: '/fr/', flag: '/flags/fr.svg' },
  { code: 'pt', label: 'Português', href: '/pt/', flag: '/flags/pt.svg' },
  { code: 'ru', label: 'Русский', href: '/ru/', flag: '/flags/ru.svg' },
  { code: 'ja', label: '日本語', href: '/ja/', flag: '/flags/ja.svg' },
  { code: 'ko', label: '한국어', href: '/ko/', flag: '/flags/ko.svg' },
] as const;

const BOOK_UI_COPY: Record<SiteLanguage, {
  bookLabel: string;
  openBook: string;
  touchLogo: string;
  previous: string;
  next: string;
  previousSection: string;
  nextSection: string;
  scrollDown: string;
  coverEyebrow: string;
  coverHookLead: string;
  coverHookReward: string;
  trialLabel: string;
}> = {
  tr: { bookLabel: 'AliKa etkileşimli ürün kitabı', openBook: 'Kitabı aç', touchLogo: 'Logo üzerine dokunun', previous: 'Önceki', next: 'Sonraki', previousSection: 'Önceki bölüm', nextSection: 'Sonraki bölüm', scrollDown: 'Aşağı kaydır', coverEyebrow: 'Aile için dijital denge', coverHookLead: 'Soru çöz', coverHookReward: 'Süre kazan', trialLabel: '7 gün ücretsiz deneyin' },
  en: { bookLabel: 'AliKa interactive product book', openBook: 'Open the book', touchLogo: 'Tap the logo', previous: 'Previous', next: 'Next', previousSection: 'Previous section', nextSection: 'Next section', scrollDown: 'Scroll down', coverEyebrow: 'Digital balance for families', coverHookLead: 'Solve questions', coverHookReward: 'Earn time', trialLabel: 'Try free for 7 days' },
  de: { bookLabel: 'Interaktives AliKa-Produktbuch', openBook: 'Buch öffnen', touchLogo: 'Logo antippen', previous: 'Zurück', next: 'Weiter', previousSection: 'Vorheriger Abschnitt', nextSection: 'Nächster Abschnitt', scrollDown: 'Nach unten', coverEyebrow: 'Digitale Balance für Familien', coverHookLead: 'Aufgaben lösen', coverHookReward: 'Zeit gewinnen', trialLabel: '7 Tage kostenlos testen' },
  es: { bookLabel: 'Libro interactivo de AliKa', openBook: 'Abrir el libro', touchLogo: 'Toque el logotipo', previous: 'Anterior', next: 'Siguiente', previousSection: 'Sección anterior', nextSection: 'Sección siguiente', scrollDown: 'Desplazar', coverEyebrow: 'Equilibrio digital familiar', coverHookLead: 'Resuelve', coverHookReward: 'Gana tiempo', trialLabel: 'Pruébalo gratis durante 7 días' },
  fr: { bookLabel: 'Livre produit interactif AliKa', openBook: 'Ouvrir le livre', touchLogo: 'Touchez le logo', previous: 'Précédent', next: 'Suivant', previousSection: 'Section précédente', nextSection: 'Section suivante', scrollDown: 'Faire défiler', coverEyebrow: 'Équilibre numérique familial', coverHookLead: 'Résous', coverHookReward: 'Gagne du temps', trialLabel: 'Essayez gratuitement pendant 7 jours' },
  pt: { bookLabel: 'Livro interativo AliKa', openBook: 'Abrir o livro', touchLogo: 'Toque no logótipo', previous: 'Anterior', next: 'Seguinte', previousSection: 'Secção anterior', nextSection: 'Secção seguinte', scrollDown: 'Descer', coverEyebrow: 'Equilíbrio digital familiar', coverHookLead: 'Resolva', coverHookReward: 'Ganhe tempo', trialLabel: 'Experimente grátis durante 7 dias' },
  ru: { bookLabel: 'Интерактивная книга AliKa', openBook: 'Открыть книгу', touchLogo: 'Нажмите на логотип', previous: 'Назад', next: 'Далее', previousSection: 'Предыдущий раздел', nextSection: 'Следующий раздел', scrollDown: 'Прокрутить', coverEyebrow: 'Цифровой баланс семьи', coverHookLead: 'Решай задачи', coverHookReward: 'Получай время', trialLabel: 'Попробуйте бесплатно 7 дней' },
  ja: { bookLabel: 'AliKaインタラクティブ製品ブック', openBook: '本を開く', touchLogo: 'ロゴをタップ', previous: '前へ', next: '次へ', previousSection: '前のセクション', nextSection: '次のセクション', scrollDown: '下へスクロール', coverEyebrow: '家族のデジタルバランス', coverHookLead: '問題を解く', coverHookReward: '時間を獲得', trialLabel: '7日間無料でお試し' },
  ko: { bookLabel: 'AliKa 인터랙티브 제품 책', openBook: '책 열기', touchLogo: '로고를 누르세요', previous: '이전', next: '다음', previousSection: '이전 섹션', nextSection: '다음 섹션', scrollDown: '아래로 스크롤', coverEyebrow: '가족을 위한 디지털 균형', coverHookLead: '문제를 풀고', coverHookReward: '시간을 얻어요', trialLabel: '7일 무료 체험' },
};

function resolveSiteLanguage(): SiteLanguage {
  if (typeof window === 'undefined') return 'tr';
  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  return segment && segment in localeData ? segment as SiteLanguage : 'tr';
}

function microsoftStoreUrl(language: SiteLanguage) {
  return `https://apps.microsoft.com/detail/9N3P9F5ZKR5S?cid=site_home_${language}`;
}

const BOOK_PAGES: BookPage[] = [
  { id: 'baslangic', chapter: 'Başlangıç', kind: 'contents', title: 'Bırakın ekran, onu öğrenmeye yakınlaştırsın.', summary: 'AliKa’nın ailelere sözü.' },
  { id: 'neden-alika', chapter: 'AliKa nedir?', kind: 'method', navLabel: 'Soru çöz, süre kazan', title: 'Çocuk soru çözerek ekran süresi kazanır.', summary: 'AliKa’nın temel farkı: doğru cevapları güvenli ve sınırlı ek süreye dönüştüren öğrenme akışı.' },
  { id: 'alika-farki', chapter: 'AliKa nedir?', kind: 'difference', navLabel: 'Farkımız', title: 'Yalnızca engellemez; çocuğa bir sonraki adımı gösterir.', summary: 'Klasik ekran sınırlama yaklaşımı ile AliKa’nın plan, öğrenme ve katılım yaklaşımının farkı.' },
  { id: 'bir-gun-alika', chapter: 'AliKa nedir?', kind: 'day-story', navLabel: 'Bir gün nasıl işler?', title: 'AliKa ile sıradan bir gün nasıl ilerler?', summary: 'Ebeveynin kuralı belirlemesinden çocuğun soru çözerek süre kazanmasına uzanan örnek günlük akış.' },
  { id: 'windows', chapter: 'Nasıl çalışır?', kind: 'platforms', navLabel: 'Windows', title: 'Windows’ta bütün aile düzeni tek panelde.', summary: 'Gerçek Windows ekranlarıyla süre, kural, rapor ve öğrenme araçları.', status: 'Bugün kullanılabilir' },
  { id: 'android-mobil', chapter: 'Nasıl çalışır?', kind: 'android-mobile', navLabel: 'Telefon / tablet', title: 'Ebeveyn yönetir, çocuk ne yapacağını görür.', summary: 'Kapalı alfa Android ekranlarıyla ebeveyn paneli, çocuk görünümü ve soru çözme önizlemesi.', status: 'Geliştiriliyor' },
  { id: 'android-tv', chapter: 'Nasıl çalışır?', kind: 'android-tv', navLabel: 'Android TV', title: 'TV, ailenin ortak ekranına dönüşür.', summary: 'Geliştirme aşamasındaki ortak ekran, aile cihazları ve telefonla katılım önizlemesi.', status: 'Geliştiriliyor' },
  { id: 'ogrenme', chapter: 'Öğrenme', kind: 'learning', navLabel: 'Nasıl işler?', title: 'Öğrenme ekran süresinin içine girer.', summary: 'Konu anlatımı, soru çözme, ilerleme ve kontrollü süre kazanma akışı.', status: 'Bugün kullanılabilir' },
  { id: 'urun-kaniti', chapter: 'Öğrenme', kind: 'evidence', navLabel: 'Ürün ekranları', title: 'Çocuğun gördüğü gerçek ekranlar.', summary: 'Soru çözme ve ilerleme görünümünün gerçek ürün ekranları.', status: 'Bugün kullanılabilir' },
  { id: 'yas-gruplari', chapter: 'Yaş grupları', kind: 'age-intro', navLabel: 'Genel bakış', title: 'Aynı AliKa, yaşa göre farklı anlatım.', summary: 'Dört yaş grubunda dil, görünüm, motivasyon ve ebeveyn rolünün nasıl değiştiği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-5-7', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '5–7 yaş', title: 'Önce güven, sonra merak.', summary: 'Büyük görseller, tek adımlı yönlendirme ve şefkatli geri bildirim.', status: 'Bugün kullanılabilir' },
  { id: 'yas-8-11', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '8–11 yaş', title: 'Merakı alışkanlığa dönüştür.', summary: 'Kısa açıklamalar, görünür ilerleme ve dengeli maskot desteği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-12-14', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '12–14 yaş', title: 'Hedefini gör, ilerlemeni yönet.', summary: 'Daha sade görünüm, haftalık hedefler ve öz yönetim desteği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-15-18', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '15–18 yaş', title: 'Sade, ciddi ve veri odaklı.', summary: 'Maskotsuz, sonuç odaklı ve gencin alanına saygılı deneyim.', status: 'Bugün kullanılabilir' },
  { id: 'planlama', chapter: 'Planlama', kind: 'planning', navLabel: 'Kurallar', title: 'Çocuk ne zaman duracağını önceden bilir.', summary: 'Süre, uygulama, uyku ve görev kurallarının anlaşılır günlük planı.', status: 'Bugün kullanılabilir' },
  { id: 'gunluk-duzen', chapter: 'Planlama', kind: 'routine', navLabel: 'Ebeveyn görünümü', title: 'Bugün ne olduğunu tek ekrandan görün.', summary: 'Kalan süre, görev onayı ve süre hediyesinin ebeveyn görünümü.', status: 'Bugün kullanılabilir' },
  { id: 'aile', chapter: 'AliKa Ekosistemi', kind: 'family', navLabel: 'Cihazlar', title: 'Her cihazın görevi bellidir.', summary: 'Windows temeli ve geliştirme aşamasındaki telefon/ortak ekran ekosistemi.', status: 'Geliştiriliyor' },
  { id: 'ekosistem-olanaklari', chapter: 'AliKa Ekosistemi', kind: 'ecosystem-actions', navLabel: 'Neler yapılabilir?', title: 'Bir cihazdan fazlası: ailece yapılabilenler.', summary: 'Windows’ta hazır planlama ve aile ağı temeli; geliştirilmekte olan telefon, ortak ekran ve aile oyunu deneyimleri.' },
  { id: 'oyunlar', chapter: 'Oyunlar', kind: 'games-intro', navLabel: 'Oyun kitaplığı', title: 'Altı premium aile oyunu geliştiriliyor.', summary: '10–16 yaşındaki gençlerle yetişkinlerin aynı ekranda tekrar oynamak isteyeceği altı özgün Türkçe deneyim.', status: 'Geliştiriliyor' },
  { id: 'oyunlar-bilgi', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Bilgi & kelime', title: 'Kelime ve bilgi arenası.', summary: 'Kelime Çarkı ve Bilgi Arenası: kısa turlar, gizli seçimler ve ailece konuşma.' },
  { id: 'oyunlar-yaraticilik', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Aile Sahnesi', title: 'Anlat, çiz, canlandır.', summary: 'Aile Sahnesi; Sessiz Sinema, Çiz ve Bil ve Yasak Kelimeler modlarını tek başlıkta toplar.' },
  { id: 'oyunlar-aile', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Kaçış gecesi', title: 'Her rol çözümün bir parçası.', summary: 'Aile Kaçış Gecesi; özel telefon rolleri, ortak envanter ve birlikte çözülen bulmacalar sunar.' },
  { id: 'oyunlar-stem', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Işık & kodlama', title: 'Deneyerek çöz, birlikte çalıştır.', summary: 'Işık Laboratuvarı ve Robot Kodlama Arenası, ortak ekranda görsel problem çözmeyi öne çıkarır.' },
  { id: 'guven', chapter: 'Güven', kind: 'trust', navLabel: 'Yerel çalışma', title: 'Temel veriler cihazda kalır.', summary: 'Bulut hesabı, reklam ve ürün telemetrisi gerektirmeyen yerel çalışma; aile cihazları arasında isteğe bağlı şifreli ev ağı.' },
  { id: 'durum', chapter: 'Güven', kind: 'status', navLabel: 'Ürün durumu', title: 'Ne hazırsa onu söylüyoruz.', summary: 'Bugün çalışan, geliştirilen ve planlanan özelliklerin dürüst ayrımı.' },
  { id: 'hazir-icerik', chapter: 'Hazır içerik', kind: 'content', navLabel: 'Kütüphane', title: 'Ders, konu ve soru içerikleri tek kütüphanede.', summary: 'Hazırlanan eğitim içeriklerinin güncel görünümü.' },
  { id: 'icerik-katalogu', chapter: 'Hazır içerik', kind: 'content-catalog', navLabel: 'Ders ve konular', title: 'Öğrenme yolu hazır.', summary: 'Ders, konu anlatımı ve soru paketlerinin paylaşım alanı.' },
  { id: 'iletisim', chapter: 'Edinin', kind: 'feedback', navLabel: 'İletişim', title: 'AliKa’yı birlikte geliştirelim.', summary: 'Hata, fikir ve eleştiriler için doğrudan iletişim.' },
  { id: 'edin', chapter: 'Edinin', kind: 'closing', navLabel: 'AliKa’yı edinin', title: 'Ailenizin ekran düzenini birlikte kurun.', summary: 'AliKa’yı edinme ve destek bağlantıları.' },
];

const CHAPTERS: BookChapter[] = [
  { id: 'baslangic', label: 'Başlangıç', start: 0 },
  { id: 'alika-nedir', label: 'AliKa nedir?', start: 1 },
  { id: 'nasil-calisir', label: 'Nasıl çalışır?', start: 4 },
  { id: 'ogrenme', label: 'Öğrenme', start: 7 },
  { id: 'yas-gruplari', label: 'Yaş grupları', start: 9 },
  { id: 'planlama', label: 'Planlama', start: 14 },
  { id: 'aile', label: 'AliKa Ekosistemi', start: 16 },
  { id: 'oyunlar', label: 'Oyunlar', start: 18 },
  { id: 'guven', label: 'Güven', start: 23 },
  { id: 'hazir-icerik', label: 'Hazır içerik', start: 25 },
  { id: 'iletisim', label: 'Edinin', start: 27 },
];

function localizedChapters(language: SiteLanguage, copy: LocaleCopy): BookChapter[] {
  if (language === 'tr') return CHAPTERS;
  const labels = [
    copy.hero_kicker,
    copy.approach_kicker,
    copy.pages['how-it-works'][0],
    copy.content_kicker,
    copy.pages['age-groups'][0],
    copy.pill[1],
    copy.ecosystem_kicker,
    copy.eco_items[4],
    copy.trust_kicker,
    copy.content_kicker,
    copy.pages.contact[0],
  ];
  return CHAPTERS.map((chapter, index) => ({ ...chapter, label: labels[index] }));
}

function localizedPages(language: SiteLanguage, copy: LocaleCopy, chapters: BookChapter[]): BookPage[] {
  if (language === 'tr') return BOOK_PAGES;
  const ageIds = ['yas-5-7', 'yas-8-11', 'yas-12-14', 'yas-15-18'];
  const gameIds = ['oyunlar-bilgi', 'oyunlar-yaraticilik', 'oyunlar-aile', 'oyunlar-stem'];

  return BOOK_PAGES.map((page, index) => {
    const chapter = [...chapters].reverse().find((item) => index >= item.start)?.label ?? chapters[0].label;
    let title = page.title;
    let summary = page.summary;
    let navLabel = page.navLabel;

    switch (page.id) {
      case 'baslangic':
        title = copy.hero_title; summary = copy.hero_body; navLabel = copy.hero_kicker; break;
      case 'neden-alika':
        title = copy.approach_title; summary = copy.approach_body; navLabel = copy.pill[0]; break;
      case 'alika-farki':
        title = copy.proof_title; summary = copy.proof_body; navLabel = copy.pages.features[0]; break;
      case 'bir-gun-alika':
        title = copy.pages['how-it-works'][0]; summary = copy.pages['how-it-works'][1]; navLabel = copy.hero_alt; break;
      case 'windows':
        title = `${copy.proof_title} · Windows`; summary = copy.proof_body; navLabel = 'Windows'; break;
      case 'android-mobil':
        title = `${copy.proof_title} · Android`; summary = copy.proof_body; navLabel = 'Android'; break;
      case 'android-tv':
        title = `${copy.ecosystem_title} · Android TV`; summary = copy.ecosystem_body; navLabel = 'Android TV'; break;
      case 'ogrenme':
        title = copy.content_title; summary = copy.content_body; navLabel = copy.pill[0]; break;
      case 'urun-kaniti':
        title = copy.proof_title; summary = copy.proof_body; navLabel = copy.proof_kicker; break;
      case 'yas-gruplari':
        title = copy.age_title; summary = copy.age_body; navLabel = copy.pages['age-groups'][0]; break;
      case 'planlama':
        title = copy.approach_title; summary = copy.approach_body; navLabel = copy.pill[1]; break;
      case 'gunluk-duzen':
        title = copy.pages['how-it-works'][0]; summary = copy.pages['how-it-works'][1]; navLabel = copy.pill[2]; break;
      case 'aile':
        title = copy.ecosystem_title; summary = copy.ecosystem_body; navLabel = copy.ecosystem_kicker; break;
      case 'ekosistem-olanaklari':
        title = copy.pages.ecosystem[0]; summary = copy.pages.ecosystem[1]; navLabel = copy.learn_more; break;
      case 'oyunlar':
        title = copy.eco_items[4]; summary = copy.ecosystem_body; navLabel = copy.eco_items[4]; break;
      case 'guven':
        title = copy.trust_title; summary = copy.trust_body; navLabel = copy.trust_kicker; break;
      case 'durum':
        title = copy.pages.roadmap[0]; summary = copy.pages.roadmap[1]; navLabel = copy.pages.roadmap[0]; break;
      case 'hazir-icerik':
        title = copy.content_title; summary = copy.content_body; navLabel = copy.pages.content[0]; break;
      case 'icerik-katalogu':
        title = copy.pages.content[0]; summary = copy.pages.content[1]; navLabel = copy.learn_more; break;
      case 'iletisim':
        title = copy.pages.contact[0]; summary = copy.pages.contact[1]; navLabel = copy.pages.contact[0]; break;
      case 'edin':
        title = copy.final_title; summary = copy.final_body; navLabel = copy.get; break;
      default: {
        const ageIndex = ageIds.indexOf(page.id);
        const gameIndex = gameIds.indexOf(page.id);
        if (ageIndex >= 0) {
          title = copy.age_labels[ageIndex]; summary = copy.age_body; navLabel = `${['5–7', '8–11', '12–14', '15–18'][ageIndex]}`;
        } else if (gameIndex >= 0) {
          title = copy.eco_items[gameIndex]; summary = copy.ecosystem_body; navLabel = copy.eco_items[gameIndex];
        }
      }
    }

    return { ...page, chapter, title, summary, navLabel };
  });
}

const AGE_BANDS: AgeBandInfo[] = [
  {
    id: 'yas-5-7', range: '5–7', mode: 'Şarj Kampı', eyebrow: 'Oyunla güven kurar', tone: 'young',
    headline: 'Önce güven, sonra merak.', purpose: 'Çocuğun kuralla karşılaştığında korkmadan ne olacağını anlaması ve kısa öğrenme adımlarına istekle katılması.',
    childView: 'Büyük dokunma alanları, tek seferde tek yönerge, az metin ve güçlü görsel işaretler görür. AliKa maskotu yol arkadaşlığı yapar.',
    learning: 'Kısa anlatım, çok kısa soru turları ve somut örnekler kullanılır. Yanlış cevap yumuşak bir dille yeniden denemeye çağırır; ceza vermez.',
    parentRole: 'Günlük sınırı ve uyku saatini ebeveyn belirler; çocuğa planı kısa cümlelerle anlatır ve ilk turlarda yanında olur.',
    motivation: 'Maskot, renk ve küçük kutlama anları daha görünürdür. Kazanılan süre yine ebeveynin belirlediği günlük tavanla sınırlıdır.',
    rhythm: '15 dakikada bir mola önerisi · günde 3 kısa soru kartı', quizCards: 3,
  },
  {
    id: 'yas-8-11', range: '8–11', mode: 'Süper İrade', eyebrow: 'Merakı düzene dönüştürür', tone: 'mid',
    headline: 'Merakı alışkanlığa dönüştür.', purpose: 'Çocuğun süreyi yalnız tüketmek yerine planlamayı, görevini tamamlamayı ve ilerlemesini kendi gözüyle takip etmeyi öğrenmesi.',
    childView: 'Kısa açıklamalar, anlaşılır seçimler ve sınırlı sayıda bilgi kartı görür. Maskot hâlâ eşlik eder ama içeriğin önüne geçmez.',
    learning: 'Kelime ve kısa cümlelerle anlatım; konu, soru ve sonuç arasında net bağ kurar. Başarı serileri ve rozetler düzenli çalışmayı görünür kılar.',
    parentRole: 'Ebeveyn hedefi ve sınırı belirler; gün sonunda sonuçlara birlikte bakar. Her adımı yönetmek yerine çocuğun kendi seçimini yapmasına alan açar.',
    motivation: 'Koleksiyon, seri ve rozetler kullanılabilir. Ödülün miktarı ve günlük üst sınır her zaman ebeveyndedir.',
    rhythm: '20 dakikada bir mola önerisi · günde 5 kısa soru kartı', quizCards: 5,
  },
  {
    id: 'yas-12-14', range: '12–14', mode: 'Derin Odak', eyebrow: 'Öz yönetimi güçlendirir', tone: 'teen',
    headline: 'Hedefini gör, ilerlemeni yönet.', purpose: 'Gencin yalnız kurala uymasını değil; haftalık hedefi, çalışma düzenini ve ekran tercihinin sonucunu anlamasını sağlamak.',
    childView: 'Daha sade bir arayüz, daha fazla ilerleme bilgisi ve küçük, durağan maskot kullanılır. Çocukça kutlamaların dozu belirgin biçimde azalır.',
    learning: 'Kısa mesaj ve cümlelerle beceri haritası, haftalık hedef ve eksik konu görünümü sunulur. Doğruluk kadar düzenli ilerleme de önemlidir.',
    parentRole: 'Ebeveyn sınırları gençle birlikte konuşur; sürekli kontrol yerine haftalık değerlendirme yapar. Uyku ve güvenlik kuralları yine korunur.',
    motivation: 'Rozetten çok hedef, ilerleme yüzdesi ve tamamlanan çalışma öne çıkar. Soru çözerek kazanılan süre planın içinde kalır.',
    rhythm: '25 dakikada bir mola önerisi · günde 7 kısa soru kartı', quizCards: 7,
  },
  {
    id: 'yas-15-18', range: '15–18', mode: 'Gerçek Dünya Modu', eyebrow: 'Sonuca ve dengeye odaklanır', tone: 'senior',
    headline: 'Sade, ciddi ve veri odaklı.', purpose: 'Gencin sınav, günlük yaşam ve dijital denge hedeflerini kendi verisiyle değerlendirmesi; ebeveynle karşılıklı güven kurması.',
    childView: 'Maskotsuz, daha yoğun ama temiz bir bilgi düzeni görür. Hız, doğruluk, tamamlanan hedef ve eksik konular açık biçimde sunulur.',
    learning: 'Mesaj ve paragraf düzeyinde içerik; sınav ve gerçek yaşam örnekleriyle ilerler. Amaç yalnız çok soru değil, doğru hız–başarı dengesidir.',
    parentRole: 'Ebeveyn temel sınırları korurken gencin mahremiyetine ve karar alanına saygı gösterir; ayrıntılı gözetim yerine ortak hedefleri konuşur.',
    motivation: 'Çocukça ödüller yerine kanıt, hedef ve sonuç kullanılır. Soru çözerek süre kazanma seçeneği varsa kuralları yine ebeveyn belirler.',
    rhythm: '30 dakikada bir mola önerisi · günde 10 kısa soru kartı', quizCards: 10,
  },
];

function getVideoLibraryDuration(videos: readonly GuideVideo[]) {
  const totalSeconds = videos.reduce((total, video) => {
    const [minutes, seconds] = video.duration.split(':').map(Number);
    return total + (minutes * 60) + seconds;
  }, 0);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

const FIELD_ROWS: Array<{ state: PageStatus; title: string; detail: string }> = [
  { state: 'Bugün kullanılabilir', title: 'Windows 10/11 sürümü', detail: 'Ekran kuralları, soru çözerek süre kazanma, görevler ve raporlar Microsoft Store sürümünde kullanılabilir.' },
  { state: 'Geliştiriliyor', title: 'Android telefon, tablet ve Android TV', detail: 'Gerçek ürün ekranları geliştirme ve kapalı alfa durumunu gösterir; henüz genel mağaza indirmesi değildir.' },
  { state: 'Geliştiriliyor', title: 'TV oyun kitaplığı ve çoklu telefon deneyimi', detail: 'Oyun, aile panosu, ayarlar, kumanda ve çoklu oyuncu akışı genel dağıtıma hazırlanıyor.' },
];

const GAMES: GameInfo[] = [
  { id: 'carkifelek', title: 'Kelime Çarkı', category: 'Kelime', players: '2–6 oyuncu', duration: '5 / 10 dk', mark: '◒', tone: 'amber', summary: 'Çark, harf seçimi, takım ipucu ve çözüm hamlesini kısa bir aile maçında birleştirir.', steps: ['Oyuncu sayısını, maç süresini ve iş birliği ya da rekabet tercihini seçin.', 'Çarkı çevirin; harf, takım ipucu veya çözüm hamlesi yapın.', 'Canlı harf tahtasını tamamlayın, skoru görün ve rövanşa geçin.'] },
  { id: 'bilgi-yarismasi', title: 'Bilgi Arenası', category: 'Bilgi & blöf', players: '2–8 oyuncu', duration: '5 / 10 / 20 dk', mark: '?', tone: 'cyan', summary: 'Eşzamanlı cevap, güven puanı ve Yalanı Bul modu aile sohbetini oyuna taşır.', steps: ['Süreyi ve klasik soru ya da Yalanı Bul modunu seçin.', 'Herkes cevabını ve ne kadar emin olduğunu telefonundan gizlice işaretlesin.', 'Cevapları aynı anda açın; kısa takım konuşmasıyla turun sonucunu değerlendirin.'] },
  { id: 'aile-sahnesi', coverId: 'ciz-ve-bil', title: 'Aile Sahnesi', category: 'Sahne & çizim', players: '3–8 oyuncu', duration: '5 / 10 / 20 dk', mark: '✎', tone: 'coral', summary: 'Sessiz Sinema, Çiz ve Bil ve Yasak Kelimeler birbirinden belirgin üç modda buluşur.', steps: ['Modu seçin; gizli kart yalnız o turun oyuncusunun telefonunda açılsın.', 'Kartı canlandırın, çizin veya yasak kelimeleri kullanmadan anlatın.', 'Takım tahminini ortak ekranda görsün; sırayı değiştirip yeni tura geçin.'] },
  { id: 'aile-kacis', title: 'Aile Kaçış Gecesi', category: 'İş birliği', players: '2–6 oyuncu', duration: '10 / 20 dk', mark: '⌂', tone: 'violet', summary: 'Özel telefon rolleri ve ortak envanter, çözümü en az iki oyuncunun katkısına bağlar.', steps: ['Rolünüzü ve yalnız sizin göreceğiniz ipucunu telefonunuzda alın.', 'Oda haritasını ve ortak envanteri birlikte inceleyip bulguları paylaşın.', 'En az iki rolün bilgisini birleştirerek kilidi açın ve odayı tamamlayın.'] },
  { id: 'robot-kodlama', title: 'Robot Kodlama Arenası', category: 'Kodlama', players: '2–6 oyuncu', duration: '5 / 10 / 20 dk', mark: '</>', tone: 'amber', summary: 'Oyuncular komut dizilerini telefonlarında kurar, robotlar ortak ekranda eşzamanlı çalışır.', steps: ['İş birliği ya da takım yarışı modunu ve görev haritasını seçin.', 'İleri, dönüş, tekrar ve koşul komutlarını telefonunuzda sıralayın.', 'Dizileri aynı anda çalıştırın; sonucu izleyip programı birlikte iyileştirin.'] },
  { id: 'isik-laboratuvari', title: 'Işık Laboratuvarı', category: 'Optik & fizik', players: '2–6 oyuncu', duration: '5 / 10 / 20 dk', mark: '◇', tone: 'green', summary: 'Her oyuncu farklı ayna, prizma veya filtreyi kontrol ederek ortak ışık hedefini çözer.', steps: ['Işık kaynağını, hedefi ve oyunculara dağıtılan optik araçları inceleyin.', 'Ayna, prizma ve filtreleri sırayla ya da eşzamanlı ayarlayın.', 'Doğru renk ve açıdaki ışığı hedefe ulaştırıp yeni düzene geçin.'] },
];

const GAME_GROUPS: Record<string, { kicker: string; title: string; description: string; ids: string[] }> = {
  'oyunlar-bilgi': { kicker: 'Bilgi & kelime', title: 'Düşün, tartış, çöz.', description: 'Kelime ve bilgi turları kısa maçlar, eşzamanlı seçimler ve aile konuşması etrafında kurulur.', ids: ['carkifelek', 'bilgi-yarismasi'] },
  'oyunlar-yaraticilik': { kicker: 'Aile Sahnesi', title: 'Anlat, çiz, canlandır.', description: 'Üç ayrı mod aynı başlık altında; gizli kart yalnız sıradaki oyuncunun telefonunda kalır.', ids: ['aile-sahnesi'] },
  'oyunlar-aile': { kicker: 'Kaçış gecesi', title: 'Her rol sonucu değiştirir.', description: 'Ortak envanter ve birbirini tamamlayan özel ipuçları, aileyi aynı çözümde buluşturur.', ids: ['aile-kacis'] },
  'oyunlar-stem': { kicker: 'Işık & kodlama', title: 'Deneyerek çöz, birlikte çalıştır.', description: 'Optik araçlar ve komut dizileri ortak ekranda görünür, kararlar oyuncu telefonlarında alınır.', ids: ['robot-kodlama', 'isik-laboratuvari'] },
};

const GAME_DETAILS: Record<string, { setup: string; finish: string; age: string }> = {
  'bilgi-yarismasi': { setup: 'Oyuncu sayısı, 5/10/20 dakika ve klasik soru ya da Yalanı Bul modu seçilir. İlk sürüm yalnız insan onaylı Türkçe içerik kullanır.', finish: 'Cevap ve güven puanları aynı anda açılır. Klasik modda bilgi, Yalanı Bul modunda yanıltıcı seçeneği fark etme ödüllendirilir.', age: '10–12 için daha somut seçenekler ve uzun süre; 13–16 için yakın çeldiriciler, gerekçe konuşması ve daha hızlı tempo kullanılır.' },
  'ulke-baskent': { setup: '100 ülke–başkent çiftinden tur için 2–12 çift seçilir, kartlar kapanıp karıştırılır.', finish: 'Oyuncu iki kart açar. Eşleşirse çifti alıp yeniden oynar; kartlar bitince en çok çifti toplayan kazanır.', age: 'Küçük yaşta az kart ve daha uzun inceleme; büyük yaşta daha fazla çift ve kısa hatırlama süresi kullanılır.' },
  carkifelek: { setup: 'Oyuncu sayısı, 5/10 dakika, enerji düzeyi ve iş birliği ya da rekabet seçilir; puansız eğitim turu gerçek kumandayla oynanır.', finish: 'Çark, harf, takım ipucu ve çözüm hamleleri canlı harf tahtasını açar. Maç süresi dolduğunda skor gösterilir ve rövanş önerilir.', age: '10–12 profilinde daha kısa sözcükler ve görünür ipucu; 13–16 profilinde daha uzun yanıt, sınırlı ipucu ve riskli çark sektörleri kullanılır.' },
  'aile-sahnesi': { setup: 'Sessiz Sinema, Çiz ve Bil ya da Yasak Kelimeler seçilir; gizli kart yalnız sıradaki oyuncunun telefonunda gösterilir.', finish: 'Takım süre içinde tahmin ederse puan alır. Tur sonunda oyuncu değişir; aynı maç içinde mod değiştirilebilir.', age: '10–12 profilinde somut eylem ve nesneler; 13–16 profilinde daha soyut kavramlar, çizim kısıtları ve yakın yasak kelimeler kullanılır.' },
  tabu: { setup: 'İki takım kurulur; anlatıcı hedef kelimeyi ve dört yasak sözcüğü yalnız kendi cihazında görür.', finish: 'Yasak sözcük kullanmadan anlatılan her doğru kart puandır. Yasak sözcük, pas veya süre sonu kartı geçersiz kılar.', age: 'Küçük yaşta gündelik sözcükler ve uzun süre; büyük yaşta soyut kavramlar ve daha sıkı süre kullanılır.' },
  'kelime-avi': { setup: 'Sistem 200 bulmacalık yaş ve dil havuzundan karışık harfleri, kategoriyi ve varsa yanıltıcı harfleri seçer.', finish: 'Harfler doğru sıraya taşınır. Kelime tamamlanınca yeni bulmaca açılır; süre içinde en çok kelimeyi çözen kazanır.', age: '5–7 yaşta ilk harf ipucu ve uzun süre; ileri yaşlarda daha uzun kelime ve yanıltıcı harfler bulunur.' },
  'bu-kim': { setup: '200 kaynaklı kişi arasından bir kart seçilir; kişinin adı cevap açılana kadar ortak ekranda gösterilmez.', finish: 'İpuçları sırayla açılır ve her ipucundan sonra tahmin alınır. Daha erken doğru tahmin daha yüksek puan getirir.', age: 'Küçük yaşta tanınabilir roller ve açık ipuçları; büyük yaşta tarih, bilim ve kültürden daha dolaylı ipuçları kullanılır.' },
  'sessiz-sinema': { setup: 'Klasik takım, beş kartlık hızlı tur, ortak aile veya oyuncu zinciri modu seçilir; anlatıcı kartı gizlice görür.', finish: 'Konuşmadan yapılan canlandırmayı süre içinde bilen takım puanı alır. Güvenli olmayan hareketler pas geçilebilir.', age: 'Yaşa göre hareket karmaşıklığı, tur süresi ve güvenli pas hakkı otomatik değişir.' },
  'ciz-ve-bil': { setup: 'Çizer, 200 sahneden seçilen kartı yalnız cihazında görür; kâğıt, tahta veya ekrandaki çizim alanı hazırlanır.', finish: 'Yazı ve konuşma olmadan çizilen sahneyi takım tahmin eder. Doğru tahmin puan; art arda başarı seri bonusudur.', age: 'Küçük yaşta şekil ipucu ve iki kat süre; büyük yaşta özel çizim koşulları ve daha zor sahneler açılır.' },
  'hikaye-macerasi': { setup: 'Tek anlatıcı, aile zinciri, 60 saniyelik hızlı tur veya geç sürpriz modu seçilir; beş hikâye kartı açılır.', finish: 'Karakter, mekân, eşya, görev ve sürpriz hikâyede anlamlı biçimde kullanılır. Aile tamamlanan hikâyeyi birlikte değerlendirir.', age: 'Küçük yaşta tek cümlelik yönlendirme; büyük yaşta tutarlılık, süre ve beklenmedik sürpriz koşulları artar.' },
  'ritim-sahnesi': { setup: 'Özgün ritim dizisi, tempo ve kullanılacak el/masa sesi seçilir; telifli şarkı veya ses kaydı kullanılmaz.', finish: 'Ekrandaki vuruş dizisi dinlenip aynı sırada tekrar edilir. Doğru zamanlama seriyi uzatır; hata aynı bölümü yeniden açar.', age: '5–7 yaşta yavaş sekiz adım ve tek ses; ileri yaşlarda 24 adım, iki ses, aksan ve salınım bulunur.' },
  yalanci: { setup: 'Karttaki üç ifade ortak ekranda okunur: ikisi doğru, biri yanlıştır. Her oyuncu seçimini gizlice yapar.', finish: 'Seçimler aynı anda açılır. Yanlış ifadeyi bulan puan alır; açıklama ekranı doğru bilgiyi ailece konuşmaya açar.', age: 'Küçük yaşta somut ve kısa ifadeler; büyük yaşta neden–sonuç kurmayı gerektiren daha yakın seçenekler kullanılır.' },
  'aile-kacis': { setup: 'İpucu kâşifi, desen çözücü, anahtar koruyucu ve kasa uzmanı rolleri oyunculara özel dağıtılır; ortak envanter ekranda kalır.', finish: 'En az iki rolün bilgisi birleştirilmeden açılamayan son kilit çözülür. Oda tamamlanınca bekleme payı ve rol katkıları görünür.', age: '10–12 profilinde açık desen ve isteğe bağlı sınırsız süre; 13–16 profilinde çok aşamalı bağlantılar ve daha az yönlendirme vardır.' },
  'isim-sehir': { setup: 'Tur harfi seçilir. İsim ve şehir her zaman bulunur; yaşa göre hayvan, bitki, eşya gibi kategoriler eklenir.', finish: 'Süre sonunda cevaplar açılır. Ortak cevaplar elenir, benzersiz geçerli cevaplar puan alır; itirazları aile oylar.', age: 'Yaş büyüdükçe kategori sayısı artar ve yazma süresi kısalır; dilin özgün harf sistemi korunur.' },
  'kelime-bahcesi': { setup: '200 kelimelik havuzdan kategoriye uygun gizli kelime seçilir; harf yerleri ve deneme hakkı gösterilir.', finish: 'Doğru harfler kelimeyi açarken bahçe çiçeklenir. Haklar bitmeden kelime tamamlanırsa bahçe turu kazanılır.', age: 'Küçük yaşta daha fazla deneme ve ipucu vardır; darağacı, ip veya korkutucu kayıp görseli hiçbir yaşta kullanılmaz.' },
  'renkli-pazar': { setup: 'Yıldız para bütçesi, ürün rafı ve tamamlanması gereken kategori koşulları ekrana gelir.', finish: 'Ürünler sepete alınır; hem kategori koşulları sağlanır hem bütçe tam tutturulur. Tek doğru sepet turu tamamlar.', age: 'Küçük yaşta az ürün ve düz fiyat; büyük yaşta daha geniş sepet, kategori sınırı ve kupon indirimi eklenir.' },
  'rota-ustalari': { setup: 'Başlangıç, hedef, dönebilen yol taşları, anahtar, kapı, enerji ve tuzaklar incelenir.', finish: 'İzin verilen taşlar döndürülüp kesintisiz rota kurulur. Hamle sınırı içinde hedefe varmak bölümü tamamlar.', age: 'Küçük yaşta 5×5 tahta ve tek dönen taş; büyük yaşta 8×8 tahta ve dört dönen taş bulunur.' },
  'denge-atolyesi': { setup: 'Taban, kullanılacak parçalar ve varsa rüzgâr ya da hareketli platform koşulu gösterilir.', finish: 'Parçalar ağırlık merkezini koruyacak sırayla yerleştirilir. Yapı sınama boyunca yıkılmazsa görev geçilir.', age: 'Küçük yaşta beş büyük parça ve geniş taban; büyük yaşta on bir parça, dar taban ve kırılgan parçalar vardır.' },
  'bahce-ustalari': { setup: 'Izgaradaki güneş, nem ve su kaynaklarıyla bitkilerin ihtiyaç kartları birlikte incelenir.', finish: 'Bitkiler doğru hücrelere yerleştirilip su planlanır. Tüm ihtiyaçlar karşılanırsa görev geçilir; tozlaştırıcı komşuluğu bonus verir.', age: 'Küçük yaşta 3×3 bahçe ve dört bitki; büyük yaşta 6×6 bahçe, on bitki ve sıkı kaynak sınırı kullanılır.' },
  'isik-laboratuvari': { setup: 'Işık kaynağı, hedef, engeller ve oyunculara dağıtılan ayna, prizma ya da filtre kontrolleri ortak ekranda gösterilir.', finish: 'Oyuncular araçlarını birlikte ayarlayıp doğru renk ve açıdaki ışığı hedefe ulaştırır. Çözüm, görsel tekrar oynatmayla açıklanır.', age: '10–12 profilinde az araç ve görünür ışın izi; 13–16 profilinde renk karışımı, daha çok yansıma ve sınırlı hamle bulunur.' },
  'robot-kodlama': { setup: 'İş birliği ya da takım yarışı seçilir; her oyuncu komut dizisini kendi telefonunda hazırlar, harita ortak ekranda kalır.', finish: 'Diziler eşzamanlı çalıştırılır. Robotlar hedefe ulaştığında görev biter; hatalı programlar ceza vermeden düzenlenip yeniden denenir.', age: '10–12 profilinde ileri ve dönüş blokları; 13–16 profilinde tekrar, renk koşulu ve eşzamanlı robot etkileşimi kullanılır.' },
};

const CONTENT_GRADES: ContentGrade[] = [
  { id: '5', label: '5. sınıf', topics: 116, questions: 2500, subjects: [
    { id: 'fen-bilimleri', label: 'Fen Bilimleri', topics: 28, questions: 500 },
    { id: 'ingilizce', label: 'İngilizce', topics: 24, questions: 500 },
    { id: 'matematik', label: 'Matematik', topics: 23, questions: 500 },
    { id: 'sosyal-bilgiler', label: 'Sosyal Bilgiler', topics: 19, questions: 500 },
    { id: 'turkce', label: 'Türkçe', topics: 22, questions: 500 },
  ] },
  { id: '6', label: '6. sınıf', topics: 168, questions: 3500, subjects: [
    { id: 'bilisim-teknolojileri', label: 'Bilişim Teknolojileri ve Yazılım', topics: 25, questions: 500 },
    { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi', topics: 18, questions: 500 },
    { id: 'fen-bilimleri', label: 'Fen Bilimleri', topics: 36, questions: 500 },
    { id: 'ingilizce', label: 'İngilizce', topics: 19, questions: 500 },
    { id: 'matematik', label: 'Matematik', topics: 24, questions: 500 },
    { id: 'sosyal-bilgiler', label: 'Sosyal Bilgiler', topics: 18, questions: 500 },
    { id: 'turkce', label: 'Türkçe', topics: 28, questions: 500 },
  ] },
  { id: '7', label: '7. sınıf', topics: 408, questions: 2808, subjects: [
    { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi', topics: 17, questions: 136 },
    { id: 'ingilizce', label: 'İngilizce', topics: 192, questions: 1536 },
    { id: 'matematik', label: 'Matematik', topics: 30, questions: 500 },
    { id: 'sosyal-bilgiler', label: 'Sosyal Bilgiler', topics: 17, questions: 136 },
    { id: 'turkce', label: 'Türkçe', topics: 152, questions: 500 },
  ] },
  { id: '8', label: '8. sınıf', topics: 455, questions: 2916, subjects: [
    { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi', topics: 19, questions: 152 },
    { id: 'fen-bilimleri', label: 'Fen Bilimleri', topics: 36, questions: 296 },
    { id: 'ingilizce', label: 'İngilizce', topics: 192, questions: 1536 },
    { id: 'inkilap-tarihi', label: 'T.C. İnkılap Tarihi ve Atatürkçülük', topics: 15, questions: 120 },
    { id: 'matematik', label: 'Matematik', topics: 23, questions: 184 },
    { id: 'turkce', label: 'Türkçe', topics: 170, questions: 628 },
  ] },
  { id: '9', label: '9. sınıf', topics: 356, questions: 3256, subjects: [
    { id: 'biyoloji', label: 'Biyoloji', topics: 14, questions: 112 },
    { id: 'cografya', label: 'Coğrafya', topics: 19, questions: 152 },
    { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi', topics: 20, questions: 160 },
    { id: 'fizik', label: 'Fizik', topics: 24, questions: 192 },
    { id: 'ingilizce', label: 'İngilizce', topics: 192, questions: 1536 },
    { id: 'matematik', label: 'Matematik', topics: 20, questions: 500 },
    { id: 'tarih', label: 'Tarih', topics: 13, questions: 104 },
    { id: 'edebiyat', label: 'Türk Dili ve Edebiyatı', topics: 54, questions: 500 },
  ] },
  { id: '10', label: '10. sınıf', topics: 203, questions: 5000, subjects: [
    { id: 'biyoloji', label: 'Biyoloji', topics: 19, questions: 500 },
    { id: 'cografya', label: 'Coğrafya', topics: 20, questions: 500 },
    { id: 'din-kulturu', label: 'Din Kültürü ve Ahlak Bilgisi', topics: 20, questions: 500 },
    { id: 'felsefe', label: 'Felsefe', topics: 20, questions: 500 },
    { id: 'fizik', label: 'Fizik', topics: 22, questions: 500 },
    { id: 'ingilizce', label: 'İngilizce', topics: 20, questions: 500 },
    { id: 'kimya', label: 'Kimya', topics: 21, questions: 500 },
    { id: 'matematik', label: 'Matematik', topics: 21, questions: 500 },
    { id: 'tarih', label: 'Tarih', topics: 20, questions: 500 },
    { id: 'edebiyat', label: 'Türk Dili ve Edebiyatı', topics: 20, questions: 500 },
  ] },
];

function ContentSummaryNumbers() {
  const [totals, setTotals] = useState({ countries: 5, subjects: 300, questions: 150732 });

  useEffect(() => {
    let active = true;
    fetch('/icerik/catalog-v1.json')
      .then((response) => {
        if (!response.ok) throw new Error(`İçerik kataloğu: ${response.status}`);
        return response.json() as Promise<PublishedContentCatalog>;
      })
      .then((catalog) => {
        if (active && catalog.totals) {
          setTotals({
            countries: catalog.totals.countries,
            subjects: catalog.totals.subjects,
            questions: catalog.totals.questions,
          });
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <div className="contentNumbers">
      <p><strong>{totals.countries.toLocaleString('tr-TR')}</strong><span>ülke</span></p>
      <p><strong>{totals.subjects.toLocaleString('tr-TR')}</strong><span>hazır ders paketi</span></p>
      <p><strong>{totals.questions.toLocaleString('tr-TR')}</strong><span>soru</span></p>
    </div>
  );
}

function ContentLibraryPreview() {
  const [catalog, setCatalog] = useState<PublishedContentCatalog | null>(null);
  const [countryId, setCountryId] = useState('turkiye');
  const [gradeId, setGradeId] = useState('6-sinif');
  const [subjectId, setSubjectId] = useState('all');

  useEffect(() => {
    let active = true;
    fetch('/icerik/catalog-v1.json')
      .then((response) => {
        if (!response.ok) throw new Error(`İçerik kataloğu: ${response.status}`);
        return response.json() as Promise<PublishedContentCatalog>;
      })
      .then((value) => { if (active) setCatalog(value); })
      .catch(() => { if (active) setCatalog(null); });
    return () => { active = false; };
  }, []);

  const fallbackGrades: PublishedContentGrade[] = CONTENT_GRADES.map((item) => ({
    country_slug: 'turkiye', country: 'Türkiye', grade_slug: `${item.id}-sinif`, grade: Number(item.id),
    notes: item.topics, questions: item.questions, download_url: '/content/',
  }));
  const fallbackSubjects: PublishedContentSubject[] = CONTENT_GRADES.flatMap((item) => item.subjects.map((subject) => ({
    country_slug: 'turkiye', country: 'Türkiye', grade_slug: `${item.id}-sinif`,
    subject_slug: subject.id, subject: subject.label, notes: subject.topics,
    questions: subject.questions, download_url: '/content/',
  })));
  const grades = catalog?.grades ?? fallbackGrades;
  const subjects = catalog?.subjects ?? fallbackSubjects;
  const countries = Array.from(new Map(grades.map((item) => [item.country_slug, item.country])).entries());
  const countryGrades = grades.filter((item) => item.country_slug === countryId);
  const grade = countryGrades.find((item) => item.grade_slug === gradeId) ?? countryGrades[0] ?? grades[0];
  const gradeSubjects = subjects.filter((item) => item.country_slug === countryId && item.grade_slug === grade?.grade_slug);
  const subject = gradeSubjects.find((item) => item.subject_slug === subjectId);
  const result = subject ?? {
    subject: 'Tüm dersler', notes: grade?.notes ?? 0, questions: grade?.questions ?? 0,
    download_url: grade?.download_url ?? '/content/',
  };
  const gradeLabel = typeof grade?.grade === 'number' ? `${grade.grade}. sınıf` : '11–12. sınıf seçmeli';

  return (
    <div className="libraryPreview">
      <div className="librarySelectors">
        <label>Ülke<select value={countryId} aria-label="Ülke" onChange={(event) => { const next = event.target.value; const first = grades.find((item) => item.country_slug === next); setCountryId(next); setGradeId(first?.grade_slug ?? ''); setSubjectId('all'); }}>{countries.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Sınıf<select value={grade?.grade_slug ?? ''} aria-label="Sınıf" onChange={(event) => { setGradeId(event.target.value); setSubjectId('all'); }}>{countryGrades.map((item) => <option key={item.grade_slug} value={item.grade_slug}>{typeof item.grade === 'number' ? `${item.grade}. sınıf` : '11–12. sınıf seçmeli'}</option>)}</select></label>
        <label>Ders<select value={subjectId} aria-label="Ders" onChange={(event) => setSubjectId(event.target.value)}><option value="all">Tüm dersler</option>{gradeSubjects.map((item) => <option key={item.subject_slug} value={item.subject_slug}>{item.subject}</option>)}</select></label>
      </div>
      <article className="libraryResult" aria-live="polite">
        <span>{grade?.country ?? 'Türkiye'} · {gradeLabel}</span>
        <strong>{result.subject}</strong>
        <p><b>{result.notes.toLocaleString('tr-TR')}</b> konu anlatımı <i>·</i> <b>{result.questions.toLocaleString('tr-TR')}</b> soru</p>
        <small>Codex öz-denetimli · Makine doğrulamalı güvenli kapsam</small>
      </article>
      <a className="textLink" href={result.download_url} target="_blank" rel="noreferrer">Seçili paketi indirin <span>↓</span></a>
      <a className="textLink" href="https://www.alika.tr/content/" target="_blank" rel="noreferrer">Canlı içerik kütüphanesini açın <span>↗</span></a>
    </div>
  );
}

function AMascot({ className = '' }: { className?: string }) {
  return (
    <span className={`aMascot ${className}`} aria-hidden="true">
      <span className="aShadow" />
      <span className="aArm aArmLeft"><i className="aHand" /></span>
      <span className="aArm aArmRight"><i className="aHand" /></span>
      <span className="aLeg aLegLeft"><i className="aFoot" /></span>
      <span className="aLeg aLegRight"><i className="aFoot" /></span>
      <span className="aGlyph">A</span>
      <span className="aFace">
        <i className="aEye aEyeLeft" />
        <i className="aEye aEyeRight" />
        <i className="aSmile" />
      </span>
    </span>
  );
}

function StatusStamp({ status }: { status?: PageStatus }) {
  if (!status) return null;
  const tone = status === 'Bugün kullanılabilir' ? 'ready' : status === 'Geliştiriliyor' ? 'building' : 'planned';
  return <span className={`statusStamp ${tone}`}>{status}</span>;
}

function VideoGuideCard({ video, language }: { video: GuideVideo; language: GuideLanguage }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="videoCard platformVideoCard">
      <div className={`videoFrame ${playing ? 'playing' : ''}`}>
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            <img className="videoPoster" src={video.poster} alt={`${video.title} video kapağı`} loading="lazy" decoding="async" />
            <button className="videoGate" type="button" onClick={() => setPlaying(true)} aria-label={`${video.title} — ${language.copy.playLabel}`}>
              <span lang={language.youtubeLocale}><b aria-hidden="true">▶</b> {language.copy.playLabel}</span>
            </button>
          </>
        )}
        <span>{video.duration}</span>
      </div>
      <div className="videoCardCopy">
        <small>{video.eyebrow}</small>
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" lang={language.youtubeLocale}>{language.copy.youtubeLabel} ↗</a>
      </div>
    </article>
  );
}

function LocalizedVideoLibrary({
  initialLanguageCode = 'tr',
  platform = 'windows',
}: {
  initialLanguageCode?: GuideLanguageCode;
  platform?: GuidePlatform;
}) {
  const [languageCode, setLanguageCode] = useState<GuideLanguageCode>(initialLanguageCode);
  const series = GUIDE_SERIES_BY_PLATFORM[platform];
  const language = series.languages.find((item) => item.code === languageCode) ?? series.languages[0];
  const videos = getPublishedGuideVideos(language);
  const copy = language.copy;
  const sectionTitleId = `${platform}-video-title`;
  const tabPanelId = `${platform}-video-language-panel`;

  return (
    <section className="platformVideoSection" aria-labelledby={sectionTitleId} data-guide-platform={platform}>
      <div className="platformVideoHeading">
        <div lang={language.youtubeLocale}><small>{copy.sectionEyebrow}</small><h3 id={sectionTitleId}>{copy.sectionTitle}</h3></div>
        <a href="https://www.youtube.com/@AliKaApp" target="_blank" rel="noreferrer" lang={language.youtubeLocale}>{copy.channelLabel} ↗</a>
      </div>
      <p className="platformVideoLead" lang={language.youtubeLocale}>{copy.sectionLead}</p>
      <div className="videoLanguageTabs" role="tablist" aria-label="Rehber video dili">
        {series.languages.map((item) => {
          const count = getPublishedGuideVideos(item).length;
          const selected = item.code === language.code;
          return (
            <button
              id={`${platform}-video-language-${item.code}`}
              key={item.code}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={tabPanelId}
              className={selected ? 'active' : ''}
              onClick={() => setLanguageCode(item.code)}
            >
              <span lang={item.youtubeLocale}>{item.nativeName}</span>
              <small lang={item.youtubeLocale}>{count > 0 ? item.copy.videoCountLabel(count) : item.copy.preparingLabel}</small>
            </button>
          );
        })}
      </div>
      <div
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`${platform}-video-language-${language.code}`}
        className="videoLanguagePanel"
      >
        <div className="videoLanguageStatus">
          <span aria-hidden="true">{language.code.toUpperCase()}</span>
          <p lang={language.youtubeLocale}><b>{language.nativeName}</b><small>{videos.length > 0 ? copy.publishedLabel : copy.preparingLabel}</small></p>
          {language.playlistId && videos.length > 0 ? (
            <a href={`https://www.youtube.com/playlist?list=${language.playlistId}`} target="_blank" rel="noreferrer" lang={language.youtubeLocale}>{copy.playlistLabel} ↗</a>
          ) : null}
        </div>
        {videos.length > 0 ? (
          <>
            <div className="videoGuideGroups" lang={language.youtubeLocale}>
              {series.groupOrder.map((group) => {
                const groupVideos = videos.filter((video) => video.group === group);
                if (groupVideos.length === 0) return null;
                return (
                  <section className="videoGuideGroup" key={group} aria-labelledby={`${platform}-video-group-${language.code}-${group}`}>
                    <h4 id={`${platform}-video-group-${language.code}-${group}`}>{copy.groupLabels[group]}</h4>
                    <div className="videoLibrary platformVideoLibrary">{groupVideos.map((video) => <VideoGuideCard key={`${language.code}-${video.id}`} video={video} language={language} />)}</div>
                  </section>
                );
              })}
            </div>
            <p className="youtubeFootnote" lang={language.youtubeLocale}><span>{copy.privacyLabel}</span><span>{copy.totalLabel(videos.length, getVideoLibraryDuration(videos))}</span></p>
          </>
        ) : (
          <div className="videoLanguageEmpty" lang={language.youtubeLocale}>
            <span aria-hidden="true">{language.code.toUpperCase()}</span>
            <div><h4>{copy.emptyTitle}</h4><p>{copy.emptyDescription}</p></div>
            <a href="https://www.youtube.com/@AliKaApp" target="_blank" rel="noreferrer">{copy.youtubeLabel} ↗</a>
          </div>
        )}
      </div>
    </section>
  );
}

function GameCard({ game, index }: { game: GameInfo; index: number }) {
  const details = GAME_DETAILS[game.id];

  return (
    <article className={`gameCard tone-${game.tone}`}>
      <div className="gameCover">
        <img src={`/games/cards/${game.coverId ?? game.id}.webp`} alt={`${game.title} geliştirme önizleme görseli`} loading="lazy" decoding="async" />
        <span aria-hidden="true">{game.mark}</span><i /><i />
        <small>{String(index + 1).padStart(2, '0')}</small>
      </div>
      <div className="gameCardBody">
        <div className="gameMeta"><span>{game.category}</span><i>{game.players}</i><i>{game.duration}</i></div>
        <h3>{game.title}</h3>
        <p>{game.summary}</p>
        <section className="gameHow" aria-label={`${game.title} nasıl oynanır?`}>
          <h4>Hedef oyun akışı</h4>
          <ol>{game.steps.map((step, stepIndex) => <li key={step}><b>{stepIndex + 1}</b><span>{step}</span></li>)}</ol>
          <div className="gameRuleGrid">
            <p><b>Kurulum</b><span>{details.setup}</span></p>
            <p><b>Tur nasıl biter?</b><span>{details.finish}</span></p>
            <p><b>Zorluk profili</b><span>{details.age}</span></p>
          </div>
        </section>
        <section className="gameDownloads preview" aria-label={`${game.title} yayın durumu`}>
          <div><strong>İndirme kapalı</strong><small>Türkçe ilk sürüm · 10–16 yaş</small></div>
          <span className="gameDownloadGate">İnsan onayı ve premium motor kabulü bekleniyor</span>
        </section>
      </div>
    </article>
  );
}

function localizedStatus(status: PageStatus | undefined, copy: LocaleCopy) {
  if (status === 'Bugün kullanılabilir') return copy.status_today;
  if (status === 'Geliştiriliyor') return copy.status_dev;
  if (status === 'Planlandı') return copy.status_plan;
  return '';
}

function localizedHighlights(page: BookPage, copy: LocaleCopy): string[] {
  switch (page.kind) {
    case 'contents': return copy.pill;
    case 'method':
    case 'difference':
    case 'day-story':
    case 'planning':
    case 'routine': return [copy.approach_title, ...copy.pill];
    case 'platforms':
    case 'android-mobile':
    case 'android-tv':
    case 'learning':
    case 'evidence': return [copy.proof_title, copy.proof_body, copy.status_today];
    case 'age-intro':
    case 'age-band': return copy.age_labels;
    case 'family':
    case 'ecosystem-actions':
    case 'games-intro':
    case 'games-group': return copy.eco_items;
    case 'trust': return copy.trust_items;
    case 'status': return [copy.status_today, copy.status_dev, copy.status_plan];
    case 'content':
    case 'content-catalog': return [copy.content_title, copy.content_body, copy.learn_more];
    case 'feedback': return [copy.pages.contact[1], copy.support, 'alika.destek@gmail.com'];
    case 'closing': return [copy.final_body, copy.privacy, copy.support];
  }
}

function localizedEvidenceImage(page: BookPage) {
  if (page.kind === 'platforms') return '/screens/platform/windows-panel.png';
  if (page.kind === 'android-mobile') return '/screens/platform/android-parent.webp';
  if (page.kind === 'android-tv') return '/screens/platform/tv-live-home.webp';
  if (page.kind === 'learning' || page.kind === 'evidence') return '/screens/platform/android-quiz.webp';
  if (page.kind === 'family' || page.kind === 'ecosystem-actions') return '/screens/windows-family.jpg';
  if (page.kind === 'games-intro' || page.kind === 'games-group') return '/games/alika-game-night.webp';
  return '';
}

function LocalizedPageContent({ page, language, copy }: { page: BookPage; language: SiteLanguage; copy: LocaleCopy }) {
  const highlights = localizedHighlights(page, copy);
  const evidenceImage = localizedEvidenceImage(page);
  const status = localizedStatus(page.status, copy);
  const isOpening = page.kind === 'contents';
  const isClosing = page.kind === 'closing';
  const isFeedback = page.kind === 'feedback';
  const isContent = page.kind === 'content' || page.kind === 'content-catalog';

  return (
    <div className={`localizedBookPage localized-${page.kind}`} lang={language}>
      <div className="pageTopline"><p className="folio">{page.chapter}</p>{status && <span className="statusStamp ready">{status}</span>}</div>
      {isOpening ? <h1 tabIndex={-1}>{page.title}</h1> : <h2 tabIndex={-1}>{page.title}</h2>}
      <p className="pageLead">{page.summary}</p>

      {evidenceImage && (
        <figure className="localizedEvidence">
          <img src={evidenceImage} alt={page.title} loading="lazy" decoding="async" />
          <figcaption>{copy.proof_kicker} · {copy.proof_title}</figcaption>
        </figure>
      )}

      <div className="localizedHighlights" aria-label={page.title}>
        {highlights.slice(0, 5).map((item, index) => <p key={`${page.id}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></p>)}
      </div>

      {page.kind === 'platforms' && <LocalizedVideoLibrary initialLanguageCode={language} />}
      {isContent && <a className="textLink localizedAction" href={`${language === 'tr' ? '' : `/${language}`}/content/`}>{copy.learn_more} <span>→</span></a>}
      {isFeedback && <a className="feedbackMail localizedAction" href="mailto:alika.destek@gmail.com"><small>{copy.support}</small><strong>alika.destek@gmail.com</strong><span>↗</span></a>}
      {isClosing && (
        <div className="closingActions localizedClosingActions">
          <a className="primaryCta" href={microsoftStoreUrl(language)} target="_blank" rel="noreferrer">{copy.get} <span>↗</span></a>
          <a className="supportLink" href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a>
        </div>
      )}
    </div>
  );
}

function PageContent({ page, onNavigate, language, copy }: { page: BookPage; onNavigate: (index: number) => void; language: SiteLanguage; copy: LocaleCopy }) {
  if (language !== 'tr') return <LocalizedPageContent page={page} language={language} copy={copy} />;
  switch (page.kind) {
    case 'contents':
      return (
        <div className="openingPage">
          <p className="folio">01 / AliKa’nın ailelere sözü</p>
          <div className="openingQuestion">
            <span aria-hidden="true">?</span>
            <h1 className="openingSlogan" tabIndex={-1}>
              Çocuğunuz ekrandan <em>uzaklaşmıyor mu?</em>
              <strong>Bırakın ekran, onu <mark>öğrenmeye</mark> yakınlaştırsın.</strong>
            </h1>
          </div>
          <div className="openingPromise" aria-label="AliKa’nın üç odağı"><span>Plan</span><i>•</i><span>Öğrenme</span><i>•</i><span>Aile zamanı</span></div>
          <a className="openingContact" href="mailto:alika.destek@gmail.com">
            <b>Birlikte geliştirelim.</b>
            <span>Hataları, geliştirme fikirlerinizi ve eleştirilerinizi bize bildirin.</span>
            <strong>alika.destek@gmail.com <i aria-hidden="true">↗</i></strong>
          </a>
        </div>
      );
    case 'method':
      return (
        <div className="productStory rewardStory">
          <p className="folio">02 / AliKa nedir?</p>
          <p className="questionKicker">Temel farkımız</p>
          <h2 tabIndex={-1}>Soru çöz,<br /><mark className="timeMark">süre kazan.</mark></h2>
          <p className="pageLead"><strong>AliKa, ekran süresini yalnızca kesmez.</strong> Çocuğa emek vererek yeniden kazanabileceği, sınırları ebeveyn tarafından belirlenen bir yol sunar.</p>
          <div className="rewardFlow" aria-label="Soru çözerek süre kazanma akışı">
            <article><b>1</b><div><strong>Süre biter</strong><span>Çocuk, günlük toplam ekran süresinin tamamlandığını açıkça görür.</span></div></article>
            <i aria-hidden="true">→</i>
            <article><b>2</b><div><strong>Soruyu çözer</strong><span>“Soru çöz, süre kazan” düğmesiyle dört seçenekli bir soru açar.</span></div></article>
            <i aria-hidden="true">→</i>
            <article><b>3</b><div><strong>Doğru cevap verir</strong><span>Ebeveynin belirlediği dakika toplam süreye eklenir.</span></div></article>
          </div>
          <section className="rewardSafety" aria-label="Süre kazanma güvenlik sınırları">
            <div><strong>Yanlış cevap ceza değildir.</strong><span>Süre azalmaz; soru daha sonra yeniden karşısına çıkabilir.</span></div>
            <div><strong>Günlük tavanı ebeveyn belirler.</strong><span>Kaç dakika ve kaç soru kazanılabileceği sınırlıdır.</span></div>
            <div><strong>Uyku kuralı korunur.</strong><span>Kazanılan süre gece, uygulama engeli veya ebeveyn kilidini aşmaz.</span></div>
          </section>
          <p className="plainReceipt"><strong>Kısacası:</strong> Ekran, pazarlık konusu olmaktan çıkar; öğrenme ve sorumlulukla ilişkilenen görünür bir plana dönüşür.</p>
        </div>
      );
    case 'difference':
      return (
        <div className="differenceStory">
          <p className="folio">03 / AliKa’nın farkı</p>
          <p className="questionKicker">Yalnız kontrol değil, katılım</p>
          <h2 className="compactTitle" tabIndex={-1}>Çocuk yalnızca kurala uyan taraf değildir.</h2>
          <p className="pageLead">Klasik ekran kontrolü çoğunlukla süreyi sayar, uygulamayı engeller ve ebeveyne rapor verir. AliKa bu temel araçların yanına çocuğun anlayacağı bir plan ve öğrenerek ilerleme yolu ekler.</p>
          <div className="approachCompare" aria-label="Klasik ekran kontrolü ve AliKa yaklaşımı karşılaştırması">
            <div className="compareHead"><span>Klasik yaklaşım</span><span>AliKa yaklaşımı</span></div>
            <article><p>Süre biter ve ekran kapanır.</p><p>Süre biter; uygunsa çocuk soru çözerek sınırlı ek süre kazanabilir.</p></article>
            <article><p>Kural çoğu zaman yalnız ebeveyn ekranındadır.</p><p>Çocuk kalan süresini ve sıradaki adımı kendi ekranında görür.</p></article>
            <article><p>Rapor geçmişte ne olduğunu anlatır.</p><p>Plan, görev ve öğrenme araçları bugünün akışını da düzenler.</p></article>
            <article><p>Çocuk yalnızca kısıtlanan taraftır.</p><p>Çocuk soru çözer, görev tamamlar ve aile planına etkin biçimde katılır.</p></article>
          </div>
          <section className="differenceSummary">
            <strong>AliKa’nın amacı daha sert bir kilit değildir.</strong>
            <span>Daha az tartışma, daha anlaşılır sınırlar ve ekran süresini öğrenmeye yaklaştıran bir aile düzenidir.</span>
          </section>
        </div>
      );
    case 'day-story':
      return (
        <div className="dayStory">
          <p className="folio">04 / Bir gün nasıl işler?</p>
          <h2 className="compactTitle" tabIndex={-1}>AliKa’yı bir örnekle anlatalım.</h2>
          <p className="pageLead">Aşağıdaki akış bir ceza sistemi değil; ailece önceden konuşulan planın gün içinde görünür kalmasıdır.</p>
          <ol className="dayTimeline">
            <li><b>Sabah</b><div><strong>Ebeveyn planı belirler.</strong><span>Günlük toplam süreyi, uygulama kurallarını, uyku saatini ve soru ödülünü seçer.</span></div></li>
            <li><b>Gün içinde</b><div><strong>Çocuk ne kadar süresi kaldığını görür.</strong><span>Köşe sayacı ve çocuk ekranı, kuralı son anda çıkan bir sürpriz olmaktan çıkarır.</span></div></li>
            <li><b>Süre bitince</b><div><strong>Uygunsa “Soru çöz, süre kazan” açılır.</strong><span>Çocuk bir soruyu çözer. Doğru cevap, belirlenen dakikayı günlük toplam süreye ekler.</span></div></li>
            <li><b>Akşam</b><div><strong>Uyku saati yine korunur.</strong><span>Kazanılmış dakika uyku kuralını geçemez; aile düzeni ödül nedeniyle bozulmaz.</span></div></li>
            <li><b>Ebeveyn ekranında</b><div><strong>Sonuç anlaşılır biçimde görünür.</strong><span>Kullanım, çözülen sorular, görevler ve verilen ek süre aynı günlük resmin parçasıdır.</span></div></li>
          </ol>
          <div className="dayOutcome"><span>Çocuk için</span><strong>“Ekran kapandı” yerine “Ne yapabileceğimi biliyorum.”</strong></div>
        </div>
      );
    case 'platforms':
      return (
        <div className="platformProgram platformWindows">
          <div className="pageTopline"><p className="folio">Nasıl çalışır? / Windows</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Bilgisayarda ebeveyn paneli + çocuk deneyimi</p>
          <h2 className="compactTitle" tabIndex={-1}>Bütün aile düzeni<br />tek panelde.</h2>
          <p className="pageLead">Windows uygulaması günlük süreyi, uygulama ve site kurallarını, uyku düzenini, öğrenme araçlarını ve raporları aynı yerde toplar. Çocuk kalan süresini görür; ebeveyn kuralları önceden belirler.</p>
          <ol className="platformSteps" aria-label="Windows kullanım akışı">
            <li><b>1</b><span><strong>Kuralları belirleyin</strong>Günlük süre, uyku, uygulama ve site sınırları.</span></li>
            <li><b>2</b><span><strong>Çocuk planı görsün</strong>Kalan süre, görev ve soru çözerek süre kazanma.</span></li>
            <li><b>3</b><span><strong>Sonucu izleyin</strong>Haftalık kullanım, soru sonucu ve olay geçmişi.</span></li>
          </ol>
          <div className="realScreenGrid desktopScreens" aria-label="Gerçek AliKa Windows ekranları">
            <a className="realScreen featured" href="/screens/platform/windows-panel.png" target="_blank" rel="noreferrer"><img src="/screens/platform/windows-panel.png" alt="AliKa Windows ebeveyn ana paneli" loading="lazy" decoding="async" /><span><b>Ana panel</b><small>Bugün, cihazlar ve hızlı işlemler</small></span></a>
            <a className="realScreen" href="/screens/platform/windows-rules.png" target="_blank" rel="noreferrer"><img src="/screens/platform/windows-rules.png" alt="AliKa Windows zamanlama ve uygulama kuralları ekranı" loading="lazy" decoding="async" /><span><b>Kurallar</b><small>Süre, uyku, uygulama ve web</small></span></a>
            <a className="realScreen" href="/screens/platform/windows-reports.png" target="_blank" rel="noreferrer"><img src="/screens/platform/windows-reports.png" alt="AliKa Windows haftalık rapor ekranı" loading="lazy" decoding="async" /><span><b>Raporlar</b><small>Haftalık, saatlik ve soru sonuçları</small></span></a>
          </div>
          <LocalizedVideoLibrary initialLanguageCode={language} platform="windows" />
          <p className="realEvidenceReceipt"><b>Gerçek ürün ekranları</b><span>Görseller çalışan Windows uygulamasından alınmıştır; tasarım maketi değildir.</span></p>
        </div>
      );
    case 'android-mobile':
      return (
        <div className="platformProgram platformMobile">
          <div className="pageTopline"><p className="folio">Nasıl çalışır? / Telefon + tablet</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">İki rol, birbirini tamamlayan iki görünüm</p>
          <h2 className="compactTitle" tabIndex={-1}>Ebeveyn yönetir,<br />çocuk yolunu görür.</h2>
          <p className="pageLead">Kapalı alfa Android uygulaması ebeveyn ve çocuk rolüne göre farklılaşır. Ebeveyn süre, uygulama, uyku ve görevleri yönetir; çocuk kalan süresini, çalışmalarını ve kazanabileceği adımı açıkça görür.</p>
          <div className="roleLedger" aria-label="Android uygulamasındaki roller">
            <article><b>Ebeveyn ekranı</b><span>Günlük durumu görür, kuralları düzenler, görevleri onaylar ve aile cihazlarını yönetir.</span></article>
            <article><b>Çocuk ekranı</b><span>Kalan süreyi izler, kütüphaneyi açar, soru çözer ve tamamladığı görevi bildirir.</span></article>
          </div>
          <div className="realScreenGrid phoneScreens" aria-label="Gerçek AliKa Android ekranları">
            <a className="realScreen" href="/screens/platform/android-parent.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/android-parent.webp" alt="AliKa Android ebeveyn ana paneli" loading="lazy" decoding="async" /><span><b>Ebeveyn paneli</b><small>Zaman, uygulama ve raporlar</small></span></a>
            <a className="realScreen featured" href="/screens/platform/android-child.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/android-child.webp" alt="AliKa Android çocuk kalan süre ekranı" loading="lazy" decoding="async" /><span><b>Çocuk ana ekranı</b><small>Kalan süre ve öğrenme yolu</small></span></a>
            <a className="realScreen" href="/screens/platform/android-quiz.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/android-quiz.webp" alt="AliKa Android soru çözme ekranı" loading="lazy" decoding="async" /><span><b>Soru çöz</b><small>İlerleme, seri ve kontrollü süre</small></span></a>
          </div>
          <div className="platformFeatureBand"><p><b>Planla</b><span>Süre ve uyku</span></p><i>→</i><p><b>Öğren</b><span>Konu ve soru</span></p><i>→</i><p><b>Takip et</b><span>İlerleme ve görev</span></p></div>
          <LocalizedVideoLibrary initialLanguageCode={language} platform="android" />
          <p className="realEvidenceReceipt"><b>Kapalı alfa cihaz kanıtı</b><span>Görseller fiziksel Android telefondaki geliştirme sürümünden alınmıştır; henüz genel mağaza indirmesi değildir.</span></p>
        </div>
      );
    case 'android-tv':
      return (
        <div className="platformProgram platformTv">
          <div className="pageTopline"><p className="folio">Nasıl çalışır? / Android TV</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Ortak bilgi TV’de, kişisel cevap telefonda</p>
          <h2 className="compactTitle" tabIndex={-1}>TV, ailenin ortak<br />oyun ekranı olur.</h2>
          <p className="pageLead">Geliştirme sürümündeki AliKa TV; oyunları, ortak soruları ve aile panosunu uzaktan okunabilen büyük bir arayüzde gösterir. Telefon kumandası ve kişisel cevap akışları kapalı alfa kapsamında sınanır.</p>
          <ol className="platformSteps tvSteps" aria-label="Android TV kullanım akışı">
            <li><b>1</b><span><strong>TV’yi eşleştir</strong>TV’nin gösterdiği kod aile telefonundan onaylanır.</span></li>
            <li><b>2</b><span><strong>Oyunu seç</strong>TV’de ortak bilgi, telefonda kişisel seçim açılır.</span></li>
            <li><b>3</b><span><strong>Ailece katıl</strong>Skor ve tur TV’de; cevaplar oyuncunun telefonunda kalır.</span></li>
          </ol>
          <div className="realScreenGrid tvScreens" aria-label="Grundig Android TV üzerindeki gerçek AliKa TV ekranları">
            <a className="realScreen featured" href="/screens/platform/tv-live-home.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/tv-live-home.webp" alt="Grundig Android TV üzerinde çalışan AliKa TV oyun kütüphanesi" loading="lazy" decoding="async" /><span><b>Oyun kütüphanesi</b><small>Ders yarışması ve indirilebilir aile oyunları</small></span></a>
            <a className="realScreen" href="/screens/platform/tv-live-family.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/tv-live-family.webp" alt="Grundig Android TV üzerinde çalışan AliKa aile panosu" loading="lazy" decoding="async" /><span><b>Aile panosu</b><small>Kullanım, doğru cevap, seri ve rozetler</small></span></a>
            <a className="realScreen" href="/screens/platform/tv-live-settings.webp" target="_blank" rel="noreferrer"><img src="/screens/platform/tv-live-settings.webp" alt="Grundig Android TV üzerinde çalışan AliKa TV ayarları" loading="lazy" decoding="async" /><span><b>TV ayarları</b><small>Ebeveyn telefonu, dil, yaş ve yerel çalışma</small></span></a>
          </div>
          <section className="tvTruth"><b>Kapalı alfa durumu</b><span>AliKa TV fiziksel Android TV’de sınanıyor; oyun kütüphanesi ve çoklu telefon deneyimi geliştirilmeye devam ediyor. Henüz genel mağaza indirmesi değildir.</span></section>
          <p className="realEvidenceReceipt"><b>Fiziksel TV test kanıtı</b><span>Bu üç görüntü fiziksel Grundig Android UHD TV’deki geliştirme sürümünden alınmıştır; tasarım maketi değildir.</span></p>
        </div>
      );
    case 'learning':
      return (
        <div className="learningStory">
          <div className="pageTopline"><p className="folio">Öğrenme / Nasıl işler?</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Çocuk için açık ve adım adım</p>
          <h2 className="compactTitle" tabIndex={-1}>Öğrenme, ekran süresinin karşısında değil içinde.</h2>
          <p className="pageLead">Çocuk önce kısa konu anlatımını görür, sonra soruyu çözer. Doğru cevaplar ilerlemeyi gösterir ve ebeveyn izin verdiyse ek süre kazandırır.</p>

          <div className="learningJourney" aria-label="AliKa öğrenme akışı">
            <article><b>01</b><div><strong>İçeriği seç</strong><span>Ülke, sınıf, ders ve konuya göre hazırlanan içerik kütüphanesinden doğru çalışma açılır.</span></div></article>
            <article><b>02</b><div><strong>Konuyu öğren</strong><span>Kısa anlatım ve gerektiğinde görsel açıklama, sorudan önce temel bilgiyi hatırlatır.</span></div></article>
            <article><b>03</b><div><strong>Soruyu çöz</strong><span>Soru bankası akışında seçenekler değerlendirilir; çocuk yalnız izleyen değil, karar veren taraftır.</span></div></article>
            <article><b>04</b><div><strong>Sonucu gör</strong><span>Doğru cevap, ilerlemeye yazılır; ödül açıksa belirlenen dakika günlük süreye eklenir.</span></div></article>
          </div>

          <section className="learningRewardCallout"><b>Doğru cevap</b><span aria-hidden="true">→</span><b>Görünür ilerleme</b><span aria-hidden="true">→</span><strong>Sınırlı ek süre</strong><small>Yalnız ebeveyn açtıysa ve günlük tavan dolmadıysa</small></section>

          <section className="learningOutcome" aria-label="Öğrenme deneyiminin aileye katkısı">
            <p><b>Çocuk için</b><span>Net hedef, küçük adımlar ve görünür ilerleme.</span></p>
            <p><b>Ebeveyn için</b><span>“Dersini yaptın mı?” yerine görülebilen çalışma sonucu.</span></p>
            <p><b>Aile için</b><span>Öğrenme, ekran pazarlığının değil günlük planın parçası olur.</span></p>
          </section>
          <p className="learningReceipt"><strong>Önemli:</strong> Yanlış cevap süre eksiltmez. Gece ve uygulama kuralları kazanılan süreyle aşılmaz.</p>
        </div>
      );
    case 'evidence':
      return (
        <>
          <div className="pageTopline"><p className="folio">Ürün kanıtı</p><StatusStamp status={page.status} /></div>
          <h2 className="compactTitle" tabIndex={-1}>Gerçek ekranda gerçek akış.</h2>
          <div className="phoneEvidence">
            <figure className="phoneCard phoneMain"><img src="/screens/android-quiz.webp" alt="AliKa Android soru ekranı" loading="lazy" decoding="async" /><figcaption>Soru çöz</figcaption></figure>
            <figure className="phoneCard phoneSide"><img src="/screens/android-reports.webp" alt="AliKa Android ilerleme raporu" loading="lazy" decoding="async" /><figcaption>İlerlemeni gör</figcaption></figure>
          </div>
          <p className="evidenceLabel">Gerçek AliKa Android ekranları · Tasarım önizlemesi değildir</p>
        </>
      );
    case 'age-intro':
      return (
        <div className="ageIntro">
          <div className="pageTopline"><p className="folio">Yaş grupları / Genel bakış</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Her yaşa aynı ekranı göstermiyoruz</p>
          <h2 className="compactTitle" tabIndex={-1}>Aynı AliKa,<br /><mark>yaşa göre farklı anlatım.</mark></h2>
          <p className="pageLead">Beş yaşındaki bir çocukla on yedi yaşındaki bir gencin dili, dikkat süresi ve motivasyonu aynı değildir. AliKa; metin yoğunluğunu, maskotu, kutlama dozunu ve ilerleme görünümünü yaş grubuna göre düzenler.</p>
          <div className="ageChoiceGrid" aria-label="AliKa yaş grupları">
            {AGE_BANDS.map((band) => (
              <button className={`ageChoice age-${band.tone}`} key={band.id} type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === band.id))}>
                <span>{band.range}<small>yaş</small></span>
                <div><strong>{band.mode}</strong><p>{band.eyebrow}</p></div>
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
          <section className="ageCoreRule">
            <b>Yaş grubu neyi değiştirir?</b>
            <p><span>Dil ve görünüm</span><span>Maskot ve kutlama dozu</span><span>Bilgi yoğunluğu</span><span>Mola ve soru önerisi</span></p>
          </section>
          <div className="ageImportant"><strong>Önemli ayrım</strong><span>Yaş grubu sunum biçimini değiştirir; öğrenme seviyesi ayrı belirlenir. Örneğin 15 yaşındaki bir başlangıç öğrencisi, yaşına saygılı bir görünümde temel düzey içerik çalışabilir.</span></div>
          <p className="ageSafetyNote"><b>Güvenlik değişmez:</b> Yaş seçimi günlük süreyi, uyku saatini veya uygulama engelini kendiliğinden gevşetmez. Hazır profil yalnız öneridir; ebeveyn onaylamadan kural olmaz.</p>
        </div>
      );
    case 'age-band': {
      const band = AGE_BANDS.find((item) => item.id === page.id) ?? AGE_BANDS[0];
      return (
        <div className={`ageBandPage age-${band.tone}`}>
          <div className="pageTopline"><p className="folio">Yaş grupları / {band.range} yaş</p><StatusStamp status={page.status} /></div>
          <div className="ageHero">
            <div className="ageSeal"><strong>{band.range}</strong><span>yaş</span></div>
            <div><p>{band.mode}</p><h2 className="compactTitle" tabIndex={-1}>{band.headline}</h2><span>{band.eyebrow}</span></div>
          </div>
          <p className="agePurpose"><b>Bu yaş için amaç</b><span>{band.purpose}</span></p>
          <div className="ageDetailGrid">
            <article><i aria-hidden="true">◉</i><div><strong>Çocuk ne görür?</strong><span>{band.childView}</span></div></article>
            <article><i aria-hidden="true">✎</i><div><strong>Öğrenme nasıl sunulur?</strong><span>{band.learning}</span></div></article>
            <article><i aria-hidden="true">⌂</i><div><strong>Ebeveynin rolü</strong><span>{band.parentRole}</span></div></article>
            <article><i aria-hidden="true">✦</i><div><strong>Motivasyon ve ödül</strong><span>{band.motivation}</span></div></article>
          </div>
          <div className="ageRhythm"><span>Önerilen çalışma ritmi</span><strong>{band.rhythm}</strong><small>Bu değerler hazır profil önerisidir; aile kendi düzenine göre değiştirir.</small></div>
          <p className="ageBandReceipt"><b>Her yaşta aynı ilke:</b> Yanlış cevap ceza değildir. Ekran süresi ödülü açıksa, sınırları ve günlük tavanı ebeveyn belirler.</p>
        </div>
      );
    }
    case 'planning':
      return (
        <div className="planningStory">
          <div className="pageTopline"><p className="folio">Planlama / Kurallar</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Kuralı önce konuşun, gün içinde görün</p>
          <h2 className="compactTitle" tabIndex={-1}>Çocuk ne zaman duracağını önceden bilir.</h2>
          <p className="pageLead">Ebeveyn günlük sınırları belirler. AliKa kalan süreyi ve sıradaki adımı çocuğun ekranında gösterir. Böylece kural, son anda söylenen bir yasak olmaz.</p>

          <div className="planningGrid" aria-label="AliKa ile planlanabilen alanlar">
            <article><b>01</b><div><strong>Günlük ekran süresi</strong><span>O gün kullanılabilecek toplam süre görünür olur; kalan süre takip edilir.</span></div></article>
            <article><b>02</b><div><strong>Uygulama kuralları</strong><span>Hangi uygulamanın ne zaman kullanılacağı aile kararına göre düzenlenir.</span></div></article>
            <article><b>03</b><div><strong>Uyku ve dinlenme</strong><span>Gece düzeni, ek süre verilse bile önceliğini koruyan ayrı bir sınırdır.</span></div></article>
            <article><b>04</b><div><strong>Öğrenme ve görevler</strong><span>Soru çözme, kitap okuma ve aile görevleri günün planına eklenebilir.</span></div></article>
          </div>

          <section className="dayPlan" aria-label="Örnek günlük AliKa planı">
            <div><small>Örnek günlük akış</small><strong>Plan değişebilir; sıra görünür kalır.</strong></div>
            <ol><li><b>1</b><span>Okul ve dinlenme</span></li><li><b>2</b><span>Konu + soru</span></li><li><b>3</b><span>Serbest ekran</span></li><li><b>4</b><span>Uyku düzeni</span></li></ol>
          </section>

          <div className="planResult"><p><b>Çocuk bilir</b><span>Ne kadar süresi kaldığını ve sonraki adımı.</span></p><p><b>Ebeveyn yönetir</b><span>Kuralı, görevi ve gerektiğinde ek süreyi.</span></p><p><b>Aile konuşur</b><span>Ceza anını değil, önceden belirlenen planı.</span></p></div>
        </div>
      );
    case 'routine':
      return (
        <div className="routineStory">
          <div className="pageTopline"><p className="folio">Planlama / Ebeveyn görünümü</p><StatusStamp status={page.status} /></div>
          <h2 className="compactTitle" tabIndex={-1}>Bugün ne olduğunu tek ekrandan görün.</h2>
          <p className="pageLead">Kalan süre, tamamlanan görev, bekleyen onay ve verilen ek süre aynı yerde görünür. Gerektiğinde planı değiştirebilirsiniz; değişiklik çocuğa açıkça gösterilir.</p>
          <div className="routineLayout">
            <figure className="singlePhone"><img src="/screens/android-parent.webp" alt="AliKa ebeveyn bugünkü durum ekranı" loading="lazy" decoding="async" /><figcaption><span>Gerçek ürün ekranı</span> Ebeveyn · Bugün</figcaption></figure>
            <div className="routineActions" aria-label="Ebeveynin günlük planlama araçları">
              <p><b>Kalan süreyi gör</b><span>Çocuğun gün içindeki durumunu tek bakışta anlayın.</span></p>
              <p><b>Görevi onaylayın</b><span>Çocuk tamamladığını bildirir; ödül yalnız ebeveyn onayıyla verilir.</span></p>
              <p><b>Süre hediye edin</b><span>Gerektiğinde 5, 15, 30 veya 60 dakika ekleyin; uyku kuralı değişmez.</span></p>
            </div>
          </div>
          <div className="routinePrinciple"><strong>AliKa’nın yaklaşımı:</strong><span>Anlık yasak yerine açık kural; sınırsız ödül yerine ebeveyn onayı; gizli takip yerine ortak görünürlük.</span></div>
        </div>
      );
    case 'family':
      return (
        <div className="ecosystemStory">
          <div className="pageTopline"><p className="folio">AliKa Ekosistemi / Cihazlar</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Aynı ev · ortak ve anlaşılır plan</p>
          <h2 className="compactTitle" tabIndex={-1}>Her cihazın görevi bellidir.</h2>
          <p className="pageLead">Ebeveyn telefonu planlama ve onay ekranıdır. Çocuğun bilgisayarı veya telefonu planı uygular. TV ya da Windows ortak ekranı aile oyunlarını gösterir.</p>

          <div className="ecosystemMap" aria-label="AliKa cihaz rolleri">
            <article><i aria-hidden="true">▯</i><div><small>Ebeveyn telefonu</small><strong>Planlar ve onaylar</strong><span>Durumu görür, kural yollar, görevi onaylar ve süre hediye eder.</span></div></article>
            <b aria-hidden="true"><span>ev ağı</span>⇄</b>
            <article><i aria-hidden="true">▰</i><div><small>Çocuk bilgisayarı</small><strong>Uygular ve geri bildirir</strong><span>Planı gösterir, öğrenme akışını açar ve tamamlanan görevi bildirir.</span></div></article>
          </div>

          <section className="ecosystemQuickActions" aria-label="AliKa Ekosistemi ile yapılabilenler">
            <p><b>Cihaz durumu</b><span>Çevrim içi mi görün.</span></p>
            <p><b>Kural ve kilit</b><span>Gönderin, açın, kapatın.</span></p>
            <p><b>Görev ve süre</b><span>Atayın, onaylayın, ödüllendirin.</span></p>
            <p><b>Ortak oyun</b><span>Telefonlardan aynı soruya katılın.</span></p>
          </section>

          <figure className="ecosystemEvidence"><img src="/screens/windows-family.jpg" alt="AliKa Windows aile cihazları ekranı" loading="lazy" decoding="async" /><figcaption><span>Gerçek ürün ekranı</span> Windows · Aile cihazları</figcaption></figure>
          <p className="ecosystemPrivacy"><strong>Nasıl bağlanırlar?</strong><span>Cihazlar aynı ev ağında şifreli biçimde haberleşir. Bulut hesabı gerekmez; çevrimdışı cihaz açıkça gösterilir.</span></p>
        </div>
      );
    case 'ecosystem-actions':
      return (
        <div className="ecosystemActionsStory">
          <div className="pageTopline"><p className="folio">AliKa Ekosistemi / Neler yapılabilir?</p><span className="mixedStatus">Windows hazır · ekosistem geliştiriliyor</span></div>
          <h2 className="compactTitle" tabIndex={-1}>AliKa Ekosistemi ile neler yapabilirsiniz?</h2>
          <p className="pageLead">Windows sürümü bugün Microsoft Store’da kullanılabilir. Telefon, Android TV, ortak ekran ve aile oyunu deneyimleri ise aşağıda açıkça geliştirme aşamasında gösterilir.</p>

          <div className="ecosystemLedger" aria-label="AliKa ekosistemi özellik durumu">
            <article><StatusStamp status="Geliştiriliyor" /><div><strong>Cihazları görün ve yönetin</strong><span>Telefon ve Windows bilgisayarın çevrim içi durumunu görme ve kuralları gönderme akışı kapalı alfa kapsamında geliştiriliyor.</span></div></article>
            <article><StatusStamp status="Geliştiriliyor" /><div><strong>Görev, mesaj ve süre paylaşın</strong><span>Gerçek yaşam görevi, aile mesajı ve ebeveyn onaylı ödül akışları ekosistem dağıtımına hazırlanıyor.</span></div></article>
            <article><StatusStamp status="Geliştiriliyor" /><div><strong>Birlikte öğrenin ve oynayın</strong><span>Telefonların ortak ekrandaki soru oyununa katıldığı aile deneyimi kapalı alfa kapsamında geliştiriliyor.</span></div></article>
            <article><StatusStamp status="Geliştiriliyor" /><div><strong>Android TV’yi ortak ekran olarak kullanın</strong><span>TV oyun kitaplığı, Aile Panosu, Ayarlar ve çoklu telefon deneyimi genel dağıtımdan önce geliştiriliyor.</span></div></article>
          </div>

          <section className="ecosystemVision"><AMascot className="aOnPage" /><div><small>Tek ürün değil, büyüyen aile sistemi</small><strong>Windows bugün hazır · telefon ve ortak ekran ekosistemi hazırlanıyor.</strong><span>Yaşa göre dil ve yönlendirme sadeleşir; çocuk büyüdükçe maskot geri çekilir, sorumluluk görünür kalır.</span></div></section>
        </div>
      );
    case 'games-intro':
      return (
        <div className="gamesIntro">
          <div className="pageTopline"><p className="folio">Oyunlar / AliKa oyun kitaplığı</p><StatusStamp status={page.status} /></div>
          <div className="gamesHero">
            <img src="/games/alika-game-night.webp" alt="Aynı masa etrafında telefon ve tabletlerle eğitim oyunları oynayan aile" loading="lazy" decoding="async" />
            <div><small>Aynı masa · farklı yetenekler</small><h2 tabIndex={-1}>Altı premium aile oyunu geliştiriliyor.</h2><p>Telefonlar oyuncuların kumandası, Windows ise ilk ortak oyun alanı olacak; Android TV fiziksel kabul kapısından sonra açılacak.</p></div>
          </div>
          <div className="gameStats" aria-label="Hedef oyun kataloğu özeti"><p><strong>6</strong><span>premium oyun</span></p><p><strong>TR</strong><span>ilk sürüm</span></p><p><strong>10–16</strong><span>hedef yaş</span></p></div>
          <div className="gameShelf" aria-label="Oyun kategorileri">
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-bilgi'))}><b>?</b><span><strong>Bilgi & kelime</strong><small>2 oyun · Kısa ve sosyal turlar</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-yaraticilik'))}><b>✎</b><span><strong>Aile Sahnesi</strong><small>1 oyun · 3 belirgin mod</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-aile'))}><b>⌂</b><span><strong>Kaçış gecesi</strong><small>1 oyun · Ortak çözüm</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-stem'))}><b>&lt;/&gt;</b><span><strong>Işık & kodlama</strong><small>2 oyun · Görsel problem çözme</small></span></button>
          </div>
          <p className="gameSourceNote"><strong>Bugün çalışan Windows ortak ekran soru oyunu ayrıdır.</strong> Bu altı premium deneyim geliştirme hedefidir; insan içerik onayı, oyun motoru kabulü ve gerçek cihaz testleri tamamlanmadan indirilemez.</p>
        </div>
      );
    case 'games-group': {
      const group = GAME_GROUPS[page.id];
      const games = group.ids.map((id) => GAMES.find((game) => game.id === id)).filter((game): game is GameInfo => Boolean(game));
      return (
        <div className="gamesGroup">
          <div className="gamesGroupHeading"><div><p className="folio">Oyun kitaplığı / {group.kicker}</p><h2 className="compactTitle" tabIndex={-1}>{group.title}</h2><p>{group.description}</p></div><span>{games.length}<small>oyun</small></span></div>
          <div className="gameCatalog">
            {games.map((game, index) => <GameCard key={game.id} game={game} index={index} />)}
          </div>
          <p className="gameCatalogFoot">Bu sayfadaki akışlar tasarım hedefidir; bitmiş oynanış veya indirilebilir ürün değildir. Yayına yalnız insan onaylı içerik ve gerçek cihaz kabulünden sonra açılır.</p>
        </div>
      );
    }
    case 'trust':
      return (
        <>
          <p className="folio">Güven / Veriler nerede kalır?</p>
          <h2 tabIndex={-1}>Aile verileri evinizde kalır.</h2>
          <p className="pageLead">AliKa’nın temel işlevleri bulut hesabı olmadan çalışır. Kullanım bilgileri cihazda tutulur; aile cihazları aynı ev ağı içinde iletişim kurar.</p>
          <dl className="privacyReceipt">
            <div><dt>Aile verisi</dt><dd>Cihazda</dd></div>
            <div><dt>Cihaz iletişimi</dt><dd>Yalnız ev ağında</dd></div>
            <div><dt>Bulut hesabı</dt><dd>Gerekmez</dd></div>
            <div><dt>Reklam ve izleyici</dt><dd>Yok</dd></div>
          </dl>
          <p className="privacyPlain"><strong>Basit anlatımıyla:</strong> Reklam profili oluşturmayız, aile verisini bir bulut hesabına taşımayı zorunlu tutmayız ve gizli izleme yaklaşımı kullanmayız.</p>
          <a className="textLink" href="https://www.alika.tr/privacy/" target="_blank" rel="noreferrer">Ayrıntılı gizlilik metnini okuyun <span>↗</span></a>
        </>
      );
    case 'status':
      return (
        <>
          <p className="folio">Ürün durumu · 27 Ağustos 2026</p>
          <h2 className="compactTitle" tabIndex={-1}>Hazır olanla hazırlananı karıştırmıyoruz.</h2>
          <p className="pageLead">Bir özelliğin çalışıyor, geliştiriliyor veya planlanıyor olması açıkça yazılır. Böylece bugün ne kullanabileceğinizi bilirsiniz.</p>
          <div className="statusLedger">
            {FIELD_ROWS.map((row, index) => <article key={row.title}><b>0{index + 1}</b><div><StatusStamp status={row.state} /><h3>{row.title}</h3><p>{row.detail}</p></div></article>)}
          </div>
        </>
      );
    case 'content':
      return (
        <>
          <p className="folio">Hazır içerik / Ders kütüphanesi</p>
          <h2 tabIndex={-1}>Çocuğun çalışacağı içerik hazır.</h2>
          <p className="pageLead">Ülkeyi, sınıfı ve dersi seçin. Hazırlanan konu anlatımlarını ve soru paketlerini tek yerde görün.</p>
          <ContentSummaryNumbers />
          <button className="contentExploreButton" type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'icerik-katalogu'))}>
            <span><small>Örnek veri ekranı</small><strong>Ülke, sınıf ve ders seçin</strong></span>
            <b aria-hidden="true">→</b>
          </button>
          <a className="textLink" href="https://www.alika.tr/content/" target="_blank" rel="noreferrer">Hazır içerikleri inceleyin <span>↗</span></a>
        </>
      );
    case 'content-catalog':
      return (
        <>
          <p className="folio">Kütüphanede arama</p>
          <h2 className="compactTitle" tabIndex={-1}>Ülke, sınıf ve ders seçin.</h2>
          <p className="pageLead">Aşağıdaki üç alandan seçim yapın. Kaç konu anlatımı ve kaç soru bulunduğunu hemen görün.</p>
          <ContentLibraryPreview />
        </>
      );
    case 'feedback':
      return (
        <div className="feedbackPage">
          <p className="folio">Bize yazın / AliKa’yı birlikte geliştirelim</p>
          <span className="feedbackSymbol" aria-hidden="true">✎</span>
          <h2 tabIndex={-1}>Bize neyin iyi, neyin eksik olduğunu söyleyin.</h2>
          <p className="feedbackLead">Bir hata gördüyseniz, geliştirme fikriniz varsa veya bir bölümü anlaşılır bulmadıysanız doğrudan bize yazın.</p>
          <a className="feedbackMail" href="mailto:alika.destek@gmail.com">
            <small>Doğrudan iletişim</small>
            <strong>alika.destek@gmail.com</strong>
            <span>Mesaj gönderin ↗</span>
          </a>
          <p className="feedbackNote">Her geri bildirim, bir sonraki yaprağı daha iyi yazmamıza yardımcı olur.</p>
        </div>
      );
    case 'closing':
      return (
        <>
          <p className="folio">Arka kapak / Sizin sıranız</p>
          <h2 tabIndex={-1}>Ekran süresini birlikte yönetin.</h2>
          <p className="pageLead">Kuralları önceden belirleyin, çocuğun kalan süreyi görmesini sağlayın ve doğru cevapları kontrollü ek süreye dönüştürün.</p>
          <div className="closingActions">
            <a className="primaryCta" href={microsoftStoreUrl('tr')} target="_blank" rel="noreferrer" aria-label="AliKa’yı Microsoft Store’da aç">Microsoft Store’dan edinin <span>↗</span></a>
            <a className="textLink" href="/rehber/">Türkçe ebeveyn rehberlerini okuyun <span>→</span></a>
            <a className="supportLink" href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a>
          </div>
          <p className="storeScopeNote">Bu Microsoft Store satın alımı yalnız Windows sürümünü kapsar; Android ve Android TV bu satın alıma dahil değildir.</p>
          <div className="closingMark"><img src="/brand/alika-logo.png" alt="AliKa logosu" width="74" height="52" /><p>Ekranı kapatmak için değil,<br /><strong>zamanı daha iyi kullanmak için.</strong></p></div>
        </>
      );
  }
}

function normalizePage(index: number) {
  return Math.max(0, Math.min(index, BOOK_PAGES.length - 1));
}

function pageIndexFromHash(hash: string) {
  const id = hash.replace(/^#/, '');
  const directPage = BOOK_PAGES.findIndex((page) => page.id === id);
  if (directPage >= 0) return directPage;
  return CHAPTERS.find((chapter) => chapter.id === id)?.start;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, select, input, textarea, iframe, [contenteditable="true"], .chapterTabs'));
}

export default function BookExperience() {
  const language = resolveSiteLanguage();
  const copy = localeData[language] as LocaleCopy;
  const ui = BOOK_UI_COPY[language];
  const chapters = useMemo(() => localizedChapters(language, copy), [copy, language]);
  const pages = useMemo(() => localizedPages(language, copy, chapters), [chapters, copy, language]);
  const activeLanguage = SITE_LANGUAGES.find((item) => item.code === language) ?? SITE_LANGUAGES[0];
  const [phase, setPhase] = useState<BookPhase>('closed');
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [reducedMotion, setReducedMotion] = useState(false);
  const initialTarget = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const turnLock = useRef(false);
  const focusTarget = useRef<HTMLDivElement | null>(null);
  const chapterTabsRef = useRef<HTMLElement | null>(null);
  const [scrollInfo, setScrollInfo] = useState({ scrollable: false, progress: 0 });

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = copy.seo_title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', copy.seo_description);
  }, [copy.seo_description, copy.seo_title, language]);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);
    return () => motionQuery.removeEventListener('change', syncMotion);
  }, []);

  useEffect(() => {
    initialTarget.current = pageIndexFromHash(window.location.hash) ?? 0;
  }, []);

  const currentPage = pages[pageIndex];
  const activeChapter = useMemo(() => [...chapters].reverse().find((chapter) => pageIndex >= chapter.start) ?? chapters[0], [chapters, pageIndex]);
  const activeChapterIndex = chapters.findIndex((chapter) => chapter.id === activeChapter.id);
  const chapterEnd = chapters[activeChapterIndex + 1]?.start ?? pages.length;
  const chapterPages = pages.slice(activeChapter.start, chapterEnd);
  const lastStart = pages.length - 1;
  const step = 1;

  const writeHash = useCallback((index: number, replace = false) => {
    const targetChapter = [...chapters].reverse().find((chapter) => index >= chapter.start) ?? chapters[0];
    const hash = index === targetChapter.start ? targetChapter.id : pages[index].id;
    const url = `${window.location.pathname}${window.location.search}#${hash}`;
    if (replace) window.history.replaceState({ page: index }, '', url);
    else window.history.pushState({ page: index }, '', url);
  }, [chapters, pages]);

  const focusCurrentPage = useCallback(() => {
    window.requestAnimationFrame(() => {
      const page = focusTarget.current?.querySelector<HTMLElement>('.activeBookPage');
      if (page) {
        page.scrollTop = 0;
        setScrollInfo({ scrollable: page.scrollHeight > page.clientHeight + 2, progress: 0 });
      }
      const heading = focusTarget.current?.querySelector<HTMLElement>('h1, h2');
      heading?.focus({ preventScroll: true });
    });
  }, []);

  const updateScrollInfo = useCallback((page: HTMLElement) => {
    const maximum = Math.max(0, page.scrollHeight - page.clientHeight);
    setScrollInfo({ scrollable: maximum > 2, progress: maximum > 0 ? Math.min(1, page.scrollTop / maximum) : 0 });
  }, []);

  const scrollActivePage = useCallback((direction: 1 | -1) => {
    const page = focusTarget.current?.querySelector<HTMLElement>('.activeBookPage');
    if (!page) return;
    const distance = Math.max(180, page.clientHeight * .72);
    const maximum = Math.max(0, page.scrollHeight - page.clientHeight);
    page.scrollTop = Math.max(0, Math.min(maximum, page.scrollTop + direction * distance));
    updateScrollInfo(page);
  }, [updateScrollInfo]);

  const turnTo = useCallback((requested: number, pushHistory = true) => {
    if (phase !== 'reading' || turnLock.current) return;
    const target = normalizePage(requested);
    if (target === pageIndex) return;
    turnLock.current = true;
    setDirection(target > pageIndex ? 'forward' : 'backward');
    setPhase('flipping');
    const half = reducedMotion ? 15 : 270;
    const full = reducedMotion ? 35 : 620;
    window.setTimeout(() => {
      setPageIndex(target);
      if (pushHistory) writeHash(target, false);
    }, half);
    window.setTimeout(() => {
      turnLock.current = false;
      setPhase('reading');
      focusCurrentPage();
    }, full);
  }, [focusCurrentPage, pageIndex, phase, reducedMotion, writeHash]);

  const openBook = useCallback(() => {
    if (phase !== 'closed') return;
    setPhase('morphing');
    const morphTime = reducedMotion ? 20 : 780;
    const openTime = reducedMotion ? 45 : 1500;
    window.setTimeout(() => setPhase('opening'), morphTime);
    window.setTimeout(() => {
      const target = normalizePage(initialTarget.current);
      setPageIndex(target);
      setPhase('reading');
      writeHash(target, true);
      focusCurrentPage();
    }, openTime);
  }, [focusCurrentPage, phase, reducedMotion, writeHash]);

  useEffect(() => {
    const onHistory = () => {
      const target = pageIndexFromHash(window.location.hash);
      if (typeof target !== 'number') return;
      initialTarget.current = target;
      if (phase === 'reading') turnTo(target, false);
    };
    window.addEventListener('popstate', onHistory);
    window.addEventListener('hashchange', onHistory);
    return () => {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('hashchange', onHistory);
    };
  }, [phase, turnTo]);

  useEffect(() => {
    if (phase !== 'reading') return;
    const frame = window.requestAnimationFrame(() => {
      const historyTarget = pageIndexFromHash(window.location.hash);
      if (typeof historyTarget === 'number' && historyTarget !== pageIndex) {
        turnTo(historyTarget, false);
        return;
      }
      const page = focusTarget.current?.querySelector<HTMLElement>('.activeBookPage');
      if (page) updateScrollInfo(page);
      const tabs = chapterTabsRef.current;
      const activeTab = tabs?.querySelector<HTMLElement>('button.active');
      if (tabs && activeTab && tabs.scrollWidth > tabs.clientWidth) {
        const left = activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2;
        tabs.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageIndex, phase, reducedMotion, turnTo, updateScrollInfo]);

  useEffect(() => {
    if (phase !== 'reading' || typeof ResizeObserver === 'undefined') return;
    const page = focusTarget.current?.querySelector<HTMLElement>('.activeBookPage');
    if (!page) return;
    const observer = new ResizeObserver(() => updateScrollInfo(page));
    observer.observe(page);
    Array.from(page.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [pageIndex, phase, updateScrollInfo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      if (phase === 'closed' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        openBook();
        return;
      }
      if (phase !== 'reading') return;
      const page = focusTarget.current?.querySelector<HTMLElement>('.activeBookPage');
      if (event.key === 'PageDown' && page && page.scrollTop + page.clientHeight < page.scrollHeight - 2) {
        event.preventDefault();
        scrollActivePage(1);
        return;
      }
      if (event.key === 'PageUp' && page && page.scrollTop > 2) {
        event.preventDefault();
        scrollActivePage(-1);
        return;
      }
      if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); turnTo(pageIndex + step); }
      if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); turnTo(pageIndex - step); }
      if (event.key === 'Home') { event.preventDefault(); turnTo(0); }
      if (event.key === 'End') { event.preventDefault(); turnTo(lastStart); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lastStart, openBook, pageIndex, phase, scrollActivePage, step, turnTo]);

  const handleTouchStart = (event: TouchEvent) => {
    if (isInteractiveTarget(event.target)) { touchStart.current = null; return; }
    const point = event.changedTouches[0];
    touchStart.current = point ? { x: point.clientX, y: point.clientY } : null;
  };
  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStart.current === null || phase !== 'reading') return;
    const point = event.changedTouches[0];
    const distanceX = (point?.clientX ?? touchStart.current.x) - touchStart.current.x;
    const distanceY = (point?.clientY ?? touchStart.current.y) - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(distanceX) < 48 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) return;
    turnTo(distanceX < 0 ? pageIndex + step : pageIndex - step);
  };

  const guideTextByChapter: Record<string, string> = {
    baslangic: 'Köşeden devam edin.',
    'alika-nedir': 'AliKa’nın farkını keşfedin.',
    'nasil-calisir': 'Platformunuzu seçin.',
    ogrenme: 'Öğrenme yolunu izleyin.',
    'yas-gruplari': 'Yaşa uygun deneyimi keşfedin.',
    planlama: 'Günün planını görün.',
    aile: 'Ailece aynı sayfadayız.',
    oyunlar: 'Oyun kitaplığını açın.',
    guven: 'Güven makbuzunu okuyun.',
    'hazir-icerik': 'Hazır içerikleri keşfedin.',
    iletisim: 'Bize yazın; birlikte geliştirelim.',
  };
  const guideText = language === 'tr' ? guideTextByChapter[activeChapter.id] : currentPage.summary;
  const showGuide = phase === 'reading' && pageIndex === activeChapter.start;
  const showScrollCue = phase === 'reading' && scrollInfo.scrollable && scrollInfo.progress < .97;

  return (
    <main className={`bookStage phase-${phase}`}>
      <div className="ambientGrain" aria-hidden="true" />
      <div className="workspaceStillLife" aria-hidden="true">
        <span className="deskNote"><i>AliKa</i><b>{copy.hero_kicker}</b><small>{copy.pill.join(' · ')}</small></span>
        <span className="deskPencil"><i /></span>
        <span className="ribbonTrail" />
      </div>
      <aside className="coverNotes" aria-label={copy.hero_alt} aria-hidden={phase !== 'closed'}>
        <article className="coverNote notePlan"><small>01</small><strong>{copy.pill[1]}</strong><span>{copy.approach_title}</span></article>
        <article className="coverNote noteLearn"><small>02</small><strong>{copy.pill[0]}</strong><span>{copy.hero_body}</span></article>
        <article className="coverNote noteBalance"><small>03</small><strong>{copy.pill[2]}</strong><span>{copy.final_body}</span></article>
        <article className="coverNote noteTrust"><small>✓</small><strong>{copy.trust_title}</strong><span>{copy.trust_items.slice(0, 3).join(' · ')}</span></article>
        <a className="coverNote noteStore" href={microsoftStoreUrl(language)} target="_blank" rel="noreferrer" tabIndex={phase === 'closed' ? 0 : -1}>
          <small>{copy.status_today}</small><strong>Windows 10/11</strong><span>{ui.trialLabel}</span><b>{copy.get} <i aria-hidden="true">↗</i></b>
        </a>
      </aside>
      <header className="readingHeader" aria-hidden={!['reading', 'flipping'].includes(phase)}>
        <a className="miniBrand" href="#baslangic" onClick={(event) => { event.preventDefault(); turnTo(0); }}><img src="/brand/alika-logo.png" alt="AliKa logosu" />AliKa</a>
        <p>{activeChapter.label}</p>
        <span>{String(pageIndex + 1).padStart(2, '0')} / {pages.length}</span>
      </header>
      <details className="bookLanguagePicker">
        <summary aria-label={`${activeLanguage.label} · Site language`}>
          <img src={activeLanguage.flag} alt={`${activeLanguage.label} dil seçeneği`} width="28" height="19" />
          <span>{activeLanguage.label}</span>
          <i aria-hidden="true">⌄</i>
        </summary>
        <nav className="bookLanguageMenu" aria-label="Language options">
          {SITE_LANGUAGES.map((option) => (
            <a key={option.code} href={`${option.href}#${currentPage.id}`} lang={option.code} aria-current={option.code === language ? 'page' : undefined}>
              <img src={option.flag} alt={`${option.label} dil seçeneği`} width="28" height="19" />
              <span>{option.label}</span>
              <b>{option.code.toUpperCase()}</b>
            </a>
          ))}
        </nav>
      </details>

      <section
        className={`bookScene direction-${direction}`}
        aria-label={ui.bookLabel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="backBoard" aria-hidden="true" />
        <div className="bookEdge bookEdgeBottom" aria-hidden="true"><i /><i /><i /></div>
        <div className="bookEdge bookEdgeRight" aria-hidden="true"><i /><i /><i /></div>
        <div className="headBand headBandTop" aria-hidden="true" />
        <div className="headBand headBandBottom" aria-hidden="true" />
        <div className="pageBlock" aria-hidden="true" />
        <div className="bookInterior" ref={focusTarget}>
          <article className="paperPage paperLeft activeBookPage" data-page={currentPage.id} aria-label={`${currentPage.chapter}: ${currentPage.title}`} onScroll={(event) => updateScrollInfo(event.currentTarget)}>
            {chapterPages.length > 1 && (
              <nav className={`chapterPageNav count-${chapterPages.length}`} aria-label={`${activeChapter.label} alt sayfaları`}>
                {chapterPages.map((chapterPage, index) => {
                  const target = activeChapter.start + index;
                  return <button key={chapterPage.id} type="button" className={target === pageIndex ? 'active' : ''} aria-current={target === pageIndex ? 'page' : undefined} onClick={() => turnTo(target)}><span>{index + 1}</span>{chapterPage.navLabel ?? chapterPage.title}</button>;
                })}
              </nav>
            )}
            <PageContent page={currentPage} onNavigate={turnTo} language={language} copy={copy} />
            <span className="pageNumber">{pageIndex + 1}</span>
          </article>
          <button
            className={`pageScrollCue ${showScrollCue ? 'visible' : ''}`}
            type="button"
            onClick={() => scrollActivePage(1)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              scrollActivePage(1);
            }}
            aria-label={ui.scrollDown}
            aria-hidden={!showScrollCue}
            tabIndex={showScrollCue ? 0 : -1}
          ><span><i style={{ width: `${Math.max(12, scrollInfo.progress * 100)}%` }} /></span><b>{ui.scrollDown}</b></button>
        </div>

        {phase === 'flipping' && <div className="turningSheet" aria-hidden="true"><div className="sheetFront"><span>{direction === 'forward' ? ui.nextSection : ui.previousSection}</span></div><div className="sheetBack" /></div>}

        <button className="bookCover" type="button" onClick={openBook} aria-label={ui.openBook} aria-hidden={['reading', 'flipping'].includes(phase)} tabIndex={phase === 'closed' ? 0 : -1} disabled={phase !== 'closed'}>
          <span className="coverRule coverRuleTop" />
          <span className="coverEyebrow">{ui.coverEyebrow}</span>
          <span className="coverHook" aria-hidden="true"><small>{ui.coverHookLead}</small><strong>{ui.coverHookReward}</strong></span>
          <img className="coverChildCharacter" src="/brand/alika-child-character-v2.png" alt="AliKa çocuk karakteri" width="530" height="1239" />
          <span className="morphMark">
            <span className="logoHalo" aria-hidden="true" />
            <img className="officialLogo" src="/brand/alika-logo.png" alt="AliKa" width="208" height="144" />
            <AMascot />
          </span>
          <span className="coverTitle">AliKa</span>
          <span className="coverStatement">{copy.approach_kicker}</span>
          <span className="coverSubtitle">{copy.meta}</span>
          <span className="openPrompt"><i aria-hidden="true">↗</i><b>{ui.openBook}</b><small>{ui.touchLogo}</small></span>
          <span className="coverRule coverRuleBottom" />
        </button>

        <nav className="chapterTabs" aria-label="Kitap bölümleri" ref={chapterTabsRef}>
          {chapters.map((chapter, index) => <button key={chapter.id} type="button" className={activeChapter.id === chapter.id ? 'active' : ''} onClick={() => turnTo(chapter.start)} disabled={phase !== 'reading'} style={{ '--tab-index': index } as CSSProperties}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}
        </nav>

        <div className={`bookGuide ${showGuide ? 'visible' : ''}`} aria-hidden="true"><AMascot className="aGuide" /><p>{guideText}</p></div>
      </section>

      <nav className="bookControls" aria-label={ui.bookLabel}>
        <button type="button" onClick={() => turnTo(pageIndex - step)} disabled={phase !== 'reading' || pageIndex === 0} aria-label={ui.previous}>← <span>{ui.previous}</span></button>
        <p aria-live="polite">{phase === 'closed' ? ui.openBook : phase === 'flipping' ? (direction === 'forward' ? ui.nextSection : ui.previousSection) : `${currentPage.chapter} · ${currentPage.title}`}</p>
        <button type="button" onClick={() => turnTo(pageIndex + step)} disabled={phase !== 'reading' || pageIndex >= lastStart} aria-label={ui.next}><span>{ui.next}</span> →</button>
      </nav>

      <section className="seoOutline" aria-label="AliKa ürün kitabı metin özeti">
        {pages.map((page) => <article key={page.id}><h2>{page.title}</h2><p>{page.summary}</p></article>)}
      </section>
    </main>
  );
}
