'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import {
  GUIDE_LANGUAGES,
  GUIDE_VIDEO_GROUP_ORDER,
  getPublishedGuideVideos,
  type GuideLanguage,
  type GuideLanguageCode,
  type GuideVideo,
} from './data/video-guides';

type BookPhase = 'closed' | 'morphing' | 'opening' | 'reading' | 'flipping';
type PageKind = 'contents' | 'method' | 'difference' | 'day-story' | 'platforms' | 'android-mobile' | 'android-tv' | 'learning' | 'evidence' | 'age-intro' | 'age-band' | 'planning' | 'routine' | 'family' | 'ecosystem-actions' | 'games-intro' | 'games-group' | 'trust' | 'status' | 'content' | 'content-catalog' | 'feedback' | 'closing';
type PageStatus = 'Bugün kullanılabilir' | 'Geliştiriliyor' | 'Planlandı';

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

interface GameInfo {
  id: string;
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


const MICROSOFT_STORE_URL = 'https://apps.microsoft.com/detail/9N3P9F5ZKR5S';

const BOOK_PAGES: BookPage[] = [
  { id: 'baslangic', chapter: 'Başlangıç', kind: 'contents', title: 'Bırakın ekran, onu öğrenmeye yakınlaştırsın.', summary: 'AliKa’nın ailelere sözü.' },
  { id: 'neden-alika', chapter: 'AliKa nedir?', kind: 'method', navLabel: 'Soru çöz, süre kazan', title: 'Çocuk soru çözerek ekran süresi kazanır.', summary: 'AliKa’nın temel farkı: doğru cevapları güvenli ve sınırlı ek süreye dönüştüren öğrenme akışı.' },
  { id: 'alika-farki', chapter: 'AliKa nedir?', kind: 'difference', navLabel: 'Farkımız', title: 'Yalnızca engellemez; çocuğa bir sonraki adımı gösterir.', summary: 'Klasik ekran sınırlama yaklaşımı ile AliKa’nın plan, öğrenme ve katılım yaklaşımının farkı.' },
  { id: 'bir-gun-alika', chapter: 'AliKa nedir?', kind: 'day-story', navLabel: 'Bir gün nasıl işler?', title: 'AliKa ile sıradan bir gün nasıl ilerler?', summary: 'Ebeveynin kuralı belirlemesinden çocuğun soru çözerek süre kazanmasına uzanan örnek günlük akış.' },
  { id: 'windows', chapter: 'Nasıl çalışır?', kind: 'platforms', navLabel: 'Windows', title: 'Windows’ta bütün aile düzeni tek panelde.', summary: 'Gerçek Windows ekranlarıyla süre, kural, rapor ve öğrenme araçları.', status: 'Bugün kullanılabilir' },
  { id: 'android-mobil', chapter: 'Nasıl çalışır?', kind: 'android-mobile', navLabel: 'Telefon / tablet', title: 'Ebeveyn yönetir, çocuk ne yapacağını görür.', summary: 'Gerçek Android ekranlarıyla ebeveyn paneli, çocuk görünümü ve soru çözme.', status: 'Bugün kullanılabilir' },
  { id: 'android-tv', chapter: 'Nasıl çalışır?', kind: 'android-tv', navLabel: 'Android TV', title: 'TV, ailenin ortak ekranına dönüşür.', summary: 'Ortak ekran kurulumu, aile cihazları ve telefonla katılımın gerçek ürün kanıtları.', status: 'Bugün kullanılabilir' },
  { id: 'ogrenme', chapter: 'Öğrenme', kind: 'learning', navLabel: 'Nasıl işler?', title: 'Öğrenme ekran süresinin içine girer.', summary: 'Konu anlatımı, soru çözme, ilerleme ve kontrollü süre kazanma akışı.', status: 'Bugün kullanılabilir' },
  { id: 'urun-kaniti', chapter: 'Öğrenme', kind: 'evidence', navLabel: 'Ürün ekranları', title: 'Çocuğun gördüğü gerçek ekranlar.', summary: 'Soru çözme ve ilerleme görünümünün gerçek ürün ekranları.', status: 'Bugün kullanılabilir' },
  { id: 'yas-gruplari', chapter: 'Yaş grupları', kind: 'age-intro', navLabel: 'Genel bakış', title: 'Aynı AliKa, yaşa göre farklı anlatım.', summary: 'Dört yaş grubunda dil, görünüm, motivasyon ve ebeveyn rolünün nasıl değiştiği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-5-7', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '5–7 yaş', title: 'Önce güven, sonra merak.', summary: 'Büyük görseller, tek adımlı yönlendirme ve şefkatli geri bildirim.', status: 'Bugün kullanılabilir' },
  { id: 'yas-8-11', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '8–11 yaş', title: 'Merakı alışkanlığa dönüştür.', summary: 'Kısa açıklamalar, görünür ilerleme ve dengeli maskot desteği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-12-14', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '12–14 yaş', title: 'Hedefini gör, ilerlemeni yönet.', summary: 'Daha sade görünüm, haftalık hedefler ve öz yönetim desteği.', status: 'Bugün kullanılabilir' },
  { id: 'yas-15-18', chapter: 'Yaş grupları', kind: 'age-band', navLabel: '15–18 yaş', title: 'Sade, ciddi ve veri odaklı.', summary: 'Maskotsuz, sonuç odaklı ve gencin alanına saygılı deneyim.', status: 'Bugün kullanılabilir' },
  { id: 'planlama', chapter: 'Planlama', kind: 'planning', navLabel: 'Kurallar', title: 'Çocuk ne zaman duracağını önceden bilir.', summary: 'Süre, uygulama, uyku ve görev kurallarının anlaşılır günlük planı.', status: 'Bugün kullanılabilir' },
  { id: 'gunluk-duzen', chapter: 'Planlama', kind: 'routine', navLabel: 'Ebeveyn görünümü', title: 'Bugün ne olduğunu tek ekrandan görün.', summary: 'Kalan süre, görev onayı ve süre hediyesinin ebeveyn görünümü.', status: 'Bugün kullanılabilir' },
  { id: 'aile', chapter: 'AliKa Ekosistemi', kind: 'family', navLabel: 'Cihazlar', title: 'Her cihazın görevi bellidir.', summary: 'Ebeveyn telefonu, çocuk cihazı ve ortak ekranın birlikte çalışması.', status: 'Bugün kullanılabilir' },
  { id: 'ekosistem-olanaklari', chapter: 'AliKa Ekosistemi', kind: 'ecosystem-actions', navLabel: 'Neler yapılabilir?', title: 'Bir cihazdan fazlası: ailece yapılabilenler.', summary: 'Bugün çalışan cihaz yönetimi, görev, öğrenme ve ortak oyun özellikleri; geliştirilen Android TV deneyimi.' },
  { id: 'oyunlar', chapter: 'Oyunlar', kind: 'games-intro', navLabel: 'Oyun kitaplığı', title: '20 oyun, tek ortak ekran.', summary: 'AliKa içerik deposundaki 20 aile oyununun yaşa uyarlanan kitaplığı.', status: 'Geliştiriliyor' },
  { id: 'oyunlar-bilgi', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Bilgi & kelime', title: 'Bilgi ve kelime oyunları.', summary: 'Bilgi Yarışması, Ülke–Başkent Hafızası, Çarkıfelek, Tabu ve Kelime Avı.' },
  { id: 'oyunlar-yaraticilik', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Sahne & hikâye', title: 'Sahne, çizim ve hikâye oyunları.', summary: 'Bu Kim, Sessiz Sinema, Çiz ve Bil, Hikâye Macerası ve Ritim Sahnesi.' },
  { id: 'oyunlar-aile', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'Aile gecesi', title: 'Ailece oynanan oyunlar.', summary: 'Yalancı, Aile Kaçış Gecesi, İsim Şehir, Kelime Bahçesi ve Renkli Pazar.' },
  { id: 'oyunlar-stem', chapter: 'Oyunlar', kind: 'games-group', navLabel: 'STEM & strateji', title: 'STEM ve strateji oyunları.', summary: 'Rota Ustaları, Denge Atölyesi, Bahçe Ustaları, Işık Laboratuvarı ve Robot Kodlama Arenası.' },
  { id: 'guven', chapter: 'Güven', kind: 'trust', navLabel: 'Yerel çalışma', title: 'Veri dışarı çıkmaz.', summary: 'Bulut hesabı, reklam ve izleyici gerektirmeyen yerel çalışma.' },
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
  { state: 'Bugün kullanılabilir', title: 'Windows, Android ve Android TV temeli', detail: 'Ekran kuralları, soru çözerek süre kazanma, görevler, raporlar ve TV’de ortak ekran çalışıyor.' },
  { state: 'Bugün kullanılabilir', title: 'Telefonlarla ortak soru oyunu', detail: 'Aile üyeleri Windows ortak ekranındaki soruya telefonlarından katılabiliyor; cevap, açıklama ve skor birlikte görünüyor.' },
  { state: 'Geliştiriliyor', title: 'TV oyun kitaplığı ve çoklu telefon deneyimi', detail: 'Android TV’de çalışan oyun, aile panosu ve ayarların kapsamı genişletiliyor; kumanda ve çoklu oyuncu akışı iyileştiriliyor.' },
];

const GAMES: GameInfo[] = [
  { id: 'bilgi-yarismasi', title: 'Bilgi Yarışması', category: 'Bilgi', players: '2–8 oyuncu', duration: '10–20 dk', mark: '?', tone: 'cyan', summary: 'Yaşa göre uyarlanan, dokuz dilde hazırlanmış hızlı soru turu.', steps: ['Yaş grubunu, dili ve tur uzunluğunu seçin.', 'Soruyu ortak ekranda okuyup cevabınızı cihazınızdan verin.', 'Doğru cevapları ve kısa açıklamayı birlikte değerlendirin.'] },
  { id: 'ulke-baskent', title: 'Ülke–Başkent Hafızası', category: 'Hafıza', players: '1–6 oyuncu', duration: '8–15 dk', mark: '⌁', tone: 'green', summary: '100 ülke–başkent çiftiyle görsel eşleştirme oyunu.', steps: ['Tur için 2–12 ülke–başkent çifti belirleyin.', 'Sıranızda iki kart açın ve doğru çifti bulmaya çalışın.', 'Eşleşen kartları alın; en çok çifti bulan kazanır.'] },
  { id: 'carkifelek', title: 'Çarkıfelek', category: 'Kelime', players: '2–8 oyuncu', duration: '10–20 dk', mark: '◒', tone: 'amber', summary: 'Kategori ve ipucundan gizli kelimeyi bulan aile bulmacası.', steps: ['Kategori ile ipucunu okuyun; gizli harflere bakın.', 'Çarkı çevirip harf söyleyin veya kelimeyi tahmin edin.', 'Cevap cihazda gizli kalır; doğru bilen puanı alır.'] },
  { id: 'tabu', title: 'Tabu', category: 'Anlatım', players: '4–10 oyuncu', duration: '15–25 dk', mark: '!', tone: 'coral', summary: 'Hedef kelimeyi dört yasak sözcüğü kullanmadan anlatın.', steps: ['Takımlara ayrılın ve anlatıcı ilk kartı açsın.', 'Hedefi, karttaki dört yasak kelimeyi söylemeden anlatın.', 'Süre bitmeden bilinen her kart için bir puan kazanın.'] },
  { id: 'kelime-avi', title: 'Kelime Avı', category: 'Kelime', players: '1–6 oyuncu', duration: '8–15 dk', mark: 'Aa', tone: 'violet', summary: 'Karışık harfleri düzenleyip doğru kelimeye ulaşın.', steps: ['Karışık harfleri ve varsa kategori ipucunu inceleyin.', 'Harfleri doğru sıraya taşıyarak kelimeyi oluşturun.', 'Takılırsanız yaşa göre ilk harf ipucunu kullanın.'] },

  { id: 'bu-kim', title: 'Bu Kim?', category: 'Tahmin', players: '2–8 oyuncu', duration: '10–20 dk', mark: '◉', tone: 'cyan', summary: 'İpuçları açıldıkça kişiyi en erken tahmin etmeye çalışın.', steps: ['Kaynaklı kişi kartını açın; ilk ipucunu dinleyin.', 'Her ipucundan sonra tahmininizi cihazınızdan verin.', 'Daha az ipucuyla doğru bilen daha yüksek puan alır.'] },
  { id: 'sessiz-sinema', title: 'Sessiz Sinema', category: 'Hareket', players: '4–12 oyuncu', duration: '15–30 dk', mark: '☆', tone: 'coral', summary: 'Güvenli hareket kartlarını konuşmadan canlandırın.', steps: ['Takım, hızlı tur, aile veya oyuncu zinciri modunu seçin.', 'Karttaki eylemi konuşmadan ve güvenli biçimde canlandırın.', 'Süre içinde doğru tahmin edilen her kartı puanlayın.'] },
  { id: 'ciz-ve-bil', title: 'Çiz ve Bil', category: 'Çizim', players: '3–10 oyuncu', duration: '15–25 dk', mark: '✎', tone: 'amber', summary: '200 sahneyi çizerek anlatan yaratıcı tahmin oyunu.', steps: ['Çizer gizli sahne kartını yalnız kendi cihazında görür.', 'Yazı ve konuşma olmadan verilen sahneyi çizer.', 'Takım süre dolmadan tahmin eder; küçük yaşta şekil ipucu açılır.'] },
  { id: 'hikaye-macerasi', title: 'Hikâye Macerası', category: 'Hikâye', players: '1–8 oyuncu', duration: '15–30 dk', mark: '✦', tone: 'violet', summary: 'Karakter, yer, nesne ve sürprizlerle ortak hikâye kurun.', steps: ['Anlatıcı, aile zinciri veya 60 saniye modunu seçin.', 'Karakter, yer, nesne ve görev kartlarını açın.', 'Sırayla anlatın; sürpriz kartını hikâyenin ortasında ekleyin.'] },
  { id: 'ritim-sahnesi', title: 'Ritim Sahnesi', category: 'Ritim', players: '1–8 oyuncu', duration: '8–20 dk', mark: '♪', tone: 'green', summary: 'Telifli müzik kullanmadan özgün ritimleri birlikte tekrar edin.', steps: ['Yaşa uygun 8–24 adımlı ritim dizisini açın.', 'Ekrandaki vuruşları el, masa veya seçilen sesle tekrar edin.', 'Doğru tempo ve vurguyla tamamlanan turu ilerletin.'] },

  { id: 'yalanci', title: 'Yalancı', category: 'Akıl yürütme', players: '3–10 oyuncu', duration: '12–20 dk', mark: '≠', tone: 'coral', summary: 'Üç ifadeden yanlış olanı seçip nedenini açıklayın.', steps: ['İki doğru ve bir yanlış ifadeyi ortak ekranda okuyun.', 'Herkes yanlış olduğunu düşündüğü ifadeyi gizlice seçsin.', 'Seçimleri açın; doğru açıklamayla puanı paylaşın.'] },
  { id: 'aile-kacis', title: 'Aile Kaçış Gecesi', category: 'İş birliği', players: '2–8 oyuncu', duration: '20–40 dk', mark: '⌂', tone: 'violet', summary: 'Tek çözümlü ipuçlarını farklı aile rolleriyle birlikte çözün.', steps: ['İpucu kâşifi, desen çözücü, anahtar koruyucu gibi rolleri bölüşün.', 'Her oyuncunun gördüğü parçaları konuşarak birleştirin.', 'Sembol kodunu bulup kasayı açın; isterseniz zamanlayıcı kullanın.'] },
  { id: 'isim-sehir', title: 'İsim Şehir', category: 'Kelime', players: '2–10 oyuncu', duration: '10–25 dk', mark: 'ABC', tone: 'cyan', summary: 'Harf ve kategori turuyla klasik aile oyununu ortak ekrana taşır.', steps: ['Harf seçin; isim ve şehirle başlayan kategori listesini açın.', 'Süre içinde cevapları kendi cihazınıza yazın.', 'Ortak cevapları çıkarın; tartışmalı cevapları aile oylasın.'] },
  { id: 'kelime-bahcesi', title: 'Kelime Bahçesi', category: 'Kelime', players: '1–6 oyuncu', duration: '8–15 dk', mark: '❀', tone: 'green', summary: 'Korkutucu kayıp görseli olmadan kelimeyi buldukça bahçeyi büyütün.', steps: ['Gizli kelimenin harf sayısını ve kategori ipucunu görün.', 'Sırayla harf seçin; doğru harflerde bahçe çiçek açsın.', 'Haklar bitmeden kelimeyi tamamlayın; küçük yaşta ek ipucu alın.'] },
  { id: 'renkli-pazar', title: 'Renkli Pazar', category: 'Bütçe', players: '1–6 oyuncu', duration: '10–20 dk', mark: '★', tone: 'amber', summary: 'Yıldız paralarla tam bütçeyi kuran eğlenceli alışveriş bulmacası.', steps: ['Bütçeyi, ürünleri ve varsa kategori koşulunu inceleyin.', 'Ürünleri sepete taşıyıp toplamı yıldız paraya eşitleyin.', 'İleri yaşta kupon ve koşulları doğru sırada kullanın.'] },

  { id: 'rota-ustalari', title: 'Rota Ustaları', category: 'Labirent', players: '1–6 oyuncu', duration: '10–20 dk', mark: '↝', tone: 'cyan', summary: 'Dönen taşlarla anahtar, kapı ve enerji dolu çözülebilir rotalar kurun.', steps: ['Başlangıç ile hedefi, engelleri ve özel taşları inceleyin.', 'İzin verilen yol taşlarını çevirerek kesintisiz rota oluşturun.', 'Anahtarı toplayıp tuzaklardan kaçınarak hedefe ulaşın.'] },
  { id: 'denge-atolyesi', title: 'Denge Atölyesi', category: 'Fizik', players: '1–6 oyuncu', duration: '10–20 dk', mark: '△', tone: 'coral', summary: 'Parçaları fizik kurallarına göre yerleştirip dengede tutun.', steps: ['Tabanı ve kullanmanız gereken parçaları inceleyin.', 'Parçaları ağırlık merkezini koruyacak sırayla yerleştirin.', 'Yapıyı rüzgâr veya hareketli platform sınavında ayakta tutun.'] },
  { id: 'bahce-ustalari', title: 'Bahçe Ustaları', category: 'Planlama', players: '1–6 oyuncu', duration: '12–25 dk', mark: '♧', tone: 'green', summary: 'Güneş, nem ve su kaynağına göre verimli bahçe planlayın.', steps: ['Izgarayı, bitkilerin güneş ve nem ihtiyaçlarını okuyun.', 'Bitkileri yerleştirip sınırlı suyu doğru hücrelere yönlendirin.', 'Tozlaştırıcı komşuluklarından bonus alarak planı tamamlayın.'] },
  { id: 'isik-laboratuvari', title: 'Işık Laboratuvarı', category: 'Optik', players: '1–6 oyuncu', duration: '10–20 dk', mark: '◇', tone: 'violet', summary: 'Aynaları ve renk filtrelerini çevirerek ışığı kristale ulaştırın.', steps: ['Işık kaynağını, hedef kristali ve engelleri bulun.', 'Aynaları çevirip gerekiyorsa renk filtrelerini yerleştirin.', 'Kesintisiz doğru renkli ışığı hedef kristale ulaştırın.'] },
  { id: 'robot-kodlama', title: 'Robot Kodlama Arenası', category: 'Kodlama', players: '1–6 oyuncu', duration: '10–25 dk', mark: '</>', tone: 'amber', summary: 'İleri, sağ ve sol komutlarıyla robotu enerji çekirdeğine götürün.', steps: ['Robot, hedef ve engelleri okuyup komut dizisini planlayın.', 'İleri, sağ ve sol bloklarını doğru sıraya yerleştirin.', 'Programı çalıştırın; ileri yaşta tekrar ve renk koşullarını ekleyin.'] },
];

const GAME_GROUPS: Record<string, { kicker: string; title: string; description: string; ids: string[] }> = {
  'oyunlar-bilgi': { kicker: 'Bilgi & kelime', title: 'Düşün, hatırla, doğru kelimeyi bul.', description: 'Hızlı turlar; yaşa göre ipucu, süre ve zorlukla birlikte büyür.', ids: ['bilgi-yarismasi', 'ulke-baskent', 'carkifelek', 'tabu', 'kelime-avi'] },
  'oyunlar-yaraticilik': { kicker: 'Sahne & hikâye', title: 'Anlat, çiz, canlandır.', description: 'Tek bir doğru performans yok; aile aynı fikri farklı yollarla ifade eder.', ids: ['bu-kim', 'sessiz-sinema', 'ciz-ve-bil', 'hikaye-macerasi', 'ritim-sahnesi'] },
  'oyunlar-aile': { kicker: 'Aile gecesi', title: 'Aynı masada, aynı takımda.', description: 'Rekabet kadar konuşmayı ve birlikte karar vermeyi de ödüllendirir.', ids: ['yalanci', 'aile-kacis', 'isim-sehir', 'kelime-bahcesi', 'renkli-pazar'] },
  'oyunlar-stem': { kicker: 'STEM & strateji', title: 'Deneyerek çöz, yeniden kur.', description: 'Labirentten optiğe, bütçeden kodlamaya uzanan çözülebilir görevler.', ids: ['rota-ustalari', 'denge-atolyesi', 'bahce-ustalari', 'isik-laboratuvari', 'robot-kodlama'] },
};

const GAME_REPO_SLUGS: Record<string, string> = {
  'bilgi-yarismasi': 'trivia', 'ulke-baskent': 'memory', carkifelek: 'word-wheel', tabu: 'taboo', 'kelime-avi': 'word-hunt',
  'bu-kim': 'who-is-it', 'sessiz-sinema': 'charades', 'ciz-ve-bil': 'draw-guess', 'hikaye-macerasi': 'story-adventure', 'ritim-sahnesi': 'rhythm-stage',
  yalanci: 'liar', 'aile-kacis': 'family-escape-night', 'isim-sehir': 'name-city', 'kelime-bahcesi': 'word-garden', 'renkli-pazar': 'colorful-market',
  'rota-ustalari': 'route-masters', 'denge-atolyesi': 'balance-workshop', 'bahce-ustalari': 'garden-masters', 'isik-laboratuvari': 'light-laboratory', 'robot-kodlama': 'robot-coding-arena',
};

const GAME_DETAILS: Record<string, { setup: string; finish: string; age: string }> = {
  'bilgi-yarismasi': { setup: 'Dil, yaş bandı, oyuncular ve turdaki soru sayısı seçilir. Sistem 200 soruluk uygun havuzdan turu hazırlar.', finish: 'Herkes kendi cihazından cevap verir. Doğru cevap bir puandır; eşitlikte en hızlı doğru cevap öne geçer.', age: '5–7 yaşta kısa soru ve geniş cevap alanı; 15–18 yaşta daha ayrıntılı bilgi ve daha kısa cevap süresi kullanılır.' },
  'ulke-baskent': { setup: '100 ülke–başkent çiftinden tur için 2–12 çift seçilir, kartlar kapanıp karıştırılır.', finish: 'Oyuncu iki kart açar. Eşleşirse çifti alıp yeniden oynar; kartlar bitince en çok çifti toplayan kazanır.', age: 'Küçük yaşta az kart ve daha uzun inceleme; büyük yaşta daha fazla çift ve kısa hatırlama süresi kullanılır.' },
  carkifelek: { setup: 'Kategori ve ipucu ortak ekranda görünür; 200 kelimelik havuzdan seçilen yanıt yalnız oyuncu cihazında gizli kalır.', finish: 'Sıradaki oyuncu çarkı çevirir, harf söyler veya kelimeyi çözer. Doğru harfler açılır; kelimeyi bulan tur puanını alır.', age: 'Yaş büyüdükçe kelime uzar, ipucu azalır ve kapalı harf sayısı artar.' },
  tabu: { setup: 'İki takım kurulur; anlatıcı hedef kelimeyi ve dört yasak sözcüğü yalnız kendi cihazında görür.', finish: 'Yasak sözcük kullanmadan anlatılan her doğru kart puandır. Yasak sözcük, pas veya süre sonu kartı geçersiz kılar.', age: 'Küçük yaşta gündelik sözcükler ve uzun süre; büyük yaşta soyut kavramlar ve daha sıkı süre kullanılır.' },
  'kelime-avi': { setup: 'Sistem 200 bulmacalık yaş ve dil havuzundan karışık harfleri, kategoriyi ve varsa yanıltıcı harfleri seçer.', finish: 'Harfler doğru sıraya taşınır. Kelime tamamlanınca yeni bulmaca açılır; süre içinde en çok kelimeyi çözen kazanır.', age: '5–7 yaşta ilk harf ipucu ve uzun süre; ileri yaşlarda daha uzun kelime ve yanıltıcı harfler bulunur.' },
  'bu-kim': { setup: '200 kaynaklı kişi arasından bir kart seçilir; kişinin adı cevap açılana kadar ortak ekranda gösterilmez.', finish: 'İpuçları sırayla açılır ve her ipucundan sonra tahmin alınır. Daha erken doğru tahmin daha yüksek puan getirir.', age: 'Küçük yaşta tanınabilir roller ve açık ipuçları; büyük yaşta tarih, bilim ve kültürden daha dolaylı ipuçları kullanılır.' },
  'sessiz-sinema': { setup: 'Klasik takım, beş kartlık hızlı tur, ortak aile veya oyuncu zinciri modu seçilir; anlatıcı kartı gizlice görür.', finish: 'Konuşmadan yapılan canlandırmayı süre içinde bilen takım puanı alır. Güvenli olmayan hareketler pas geçilebilir.', age: 'Yaşa göre hareket karmaşıklığı, tur süresi ve güvenli pas hakkı otomatik değişir.' },
  'ciz-ve-bil': { setup: 'Çizer, 200 sahneden seçilen kartı yalnız cihazında görür; kâğıt, tahta veya ekrandaki çizim alanı hazırlanır.', finish: 'Yazı ve konuşma olmadan çizilen sahneyi takım tahmin eder. Doğru tahmin puan; art arda başarı seri bonusudur.', age: 'Küçük yaşta şekil ipucu ve iki kat süre; büyük yaşta özel çizim koşulları ve daha zor sahneler açılır.' },
  'hikaye-macerasi': { setup: 'Tek anlatıcı, aile zinciri, 60 saniyelik hızlı tur veya geç sürpriz modu seçilir; beş hikâye kartı açılır.', finish: 'Karakter, mekân, eşya, görev ve sürpriz hikâyede anlamlı biçimde kullanılır. Aile tamamlanan hikâyeyi birlikte değerlendirir.', age: 'Küçük yaşta tek cümlelik yönlendirme; büyük yaşta tutarlılık, süre ve beklenmedik sürpriz koşulları artar.' },
  'ritim-sahnesi': { setup: 'Özgün ritim dizisi, tempo ve kullanılacak el/masa sesi seçilir; telifli şarkı veya ses kaydı kullanılmaz.', finish: 'Ekrandaki vuruş dizisi dinlenip aynı sırada tekrar edilir. Doğru zamanlama seriyi uzatır; hata aynı bölümü yeniden açar.', age: '5–7 yaşta yavaş sekiz adım ve tek ses; ileri yaşlarda 24 adım, iki ses, aksan ve salınım bulunur.' },
  yalanci: { setup: 'Karttaki üç ifade ortak ekranda okunur: ikisi doğru, biri yanlıştır. Her oyuncu seçimini gizlice yapar.', finish: 'Seçimler aynı anda açılır. Yanlış ifadeyi bulan puan alır; açıklama ekranı doğru bilgiyi ailece konuşmaya açar.', age: 'Küçük yaşta somut ve kısa ifadeler; büyük yaşta neden–sonuç kurmayı gerektiren daha yakın seçenekler kullanılır.' },
  'aile-kacis': { setup: 'İpucu kâşifi, desen çözücü, anahtar koruyucu ve kasa uzmanı rolleri paylaşılır; zamanlayıcı isteğe bağlıdır.', finish: 'Herkes yalnız kendisindeki ipucunu anlatarak ortak sembol kodunu oluşturur. Doğru kod kasayı açar ve macerayı bitirir.', age: 'Küçük yaşta daha açık desen ve ipucu paylaşımı; büyük yaşta çok aşamalı bağlantılar ve daha az yönlendirme vardır.' },
  'isim-sehir': { setup: 'Tur harfi seçilir. İsim ve şehir her zaman bulunur; yaşa göre hayvan, bitki, eşya gibi kategoriler eklenir.', finish: 'Süre sonunda cevaplar açılır. Ortak cevaplar elenir, benzersiz geçerli cevaplar puan alır; itirazları aile oylar.', age: 'Yaş büyüdükçe kategori sayısı artar ve yazma süresi kısalır; dilin özgün harf sistemi korunur.' },
  'kelime-bahcesi': { setup: '200 kelimelik havuzdan kategoriye uygun gizli kelime seçilir; harf yerleri ve deneme hakkı gösterilir.', finish: 'Doğru harfler kelimeyi açarken bahçe çiçeklenir. Haklar bitmeden kelime tamamlanırsa bahçe turu kazanılır.', age: 'Küçük yaşta daha fazla deneme ve ipucu vardır; darağacı, ip veya korkutucu kayıp görseli hiçbir yaşta kullanılmaz.' },
  'renkli-pazar': { setup: 'Yıldız para bütçesi, ürün rafı ve tamamlanması gereken kategori koşulları ekrana gelir.', finish: 'Ürünler sepete alınır; hem kategori koşulları sağlanır hem bütçe tam tutturulur. Tek doğru sepet turu tamamlar.', age: 'Küçük yaşta az ürün ve düz fiyat; büyük yaşta daha geniş sepet, kategori sınırı ve kupon indirimi eklenir.' },
  'rota-ustalari': { setup: 'Başlangıç, hedef, dönebilen yol taşları, anahtar, kapı, enerji ve tuzaklar incelenir.', finish: 'İzin verilen taşlar döndürülüp kesintisiz rota kurulur. Hamle sınırı içinde hedefe varmak bölümü tamamlar.', age: 'Küçük yaşta 5×5 tahta ve tek dönen taş; büyük yaşta 8×8 tahta ve dört dönen taş bulunur.' },
  'denge-atolyesi': { setup: 'Taban, kullanılacak parçalar ve varsa rüzgâr ya da hareketli platform koşulu gösterilir.', finish: 'Parçalar ağırlık merkezini koruyacak sırayla yerleştirilir. Yapı sınama boyunca yıkılmazsa görev geçilir.', age: 'Küçük yaşta beş büyük parça ve geniş taban; büyük yaşta on bir parça, dar taban ve kırılgan parçalar vardır.' },
  'bahce-ustalari': { setup: 'Izgaradaki güneş, nem ve su kaynaklarıyla bitkilerin ihtiyaç kartları birlikte incelenir.', finish: 'Bitkiler doğru hücrelere yerleştirilip su planlanır. Tüm ihtiyaçlar karşılanırsa görev geçilir; tozlaştırıcı komşuluğu bonus verir.', age: 'Küçük yaşta 3×3 bahçe ve dört bitki; büyük yaşta 6×6 bahçe, on bitki ve sıkı kaynak sınırı kullanılır.' },
  'isik-laboratuvari': { setup: 'Işık kaynağı, hedef kristal, engeller, dönebilen aynalar ve renk filtreleri tahtada gösterilir.', finish: 'Aynalar ve filtreler çevrilerek doğru renkli, kesintisiz ışık yolu kristale ulaştırılır. Doğru yol görevi tamamlar.', age: 'Küçük yaşta 5×5 tabla ve tek ayna; büyük yaşta 8×8 tabla, dört ayna ve üç renk filtresi bulunur.' },
  'robot-kodlama': { setup: 'Robotun başlangıcı, enerji çekirdeği ve engeller incelenir; komut blokları program alanına hazırlanır.', finish: 'İleri, sağ ve sol blokları sıralanıp program çalıştırılır. Robot hedefe çarpmadan ulaşırsa görev tamamlanır.', age: 'Küçük yaşta kısa düz komut dizileri; büyük yaşta tekrar blokları, renk koşulları, büyük tahta ve daha çok engel vardır.' },
};

const GAME_AGE_PACKS = [
  { id: 'young', label: '5–7' }, { id: 'mid', label: '8–11' }, { id: 'teen', label: '12–14' }, { id: 'senior', label: '15–18' },
] as const;

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

function ContentLibraryPreview() {
  const [gradeId, setGradeId] = useState('6');
  const [subjectId, setSubjectId] = useState('all');
  const grade = CONTENT_GRADES.find((item) => item.id === gradeId) ?? CONTENT_GRADES[1];
  const subject = grade.subjects.find((item) => item.id === subjectId);
  const result = subject ?? { label: 'Tüm dersler', topics: grade.topics, questions: grade.questions };

  return (
    <div className="libraryPreview">
      <div className="librarySelectors">
        <label>Ülke<select defaultValue="turkiye" aria-label="Ülke"><option value="turkiye">Türkiye</option></select></label>
        <label>Sınıf<select value={gradeId} aria-label="Sınıf" onChange={(event) => { setGradeId(event.target.value); setSubjectId('all'); }}>{CONTENT_GRADES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Ders<select value={subjectId} aria-label="Ders" onChange={(event) => setSubjectId(event.target.value)}><option value="all">Tüm dersler</option>{grade.subjects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <article className="libraryResult" aria-live="polite">
        <span>Türkiye · {grade.label}</span>
        <strong>{result.label}</strong>
        <p><b>{result.topics.toLocaleString('tr-TR')}</b> konu anlatımı <i>·</i> <b>{result.questions.toLocaleString('tr-TR')}</b> soru</p>
        <small>Otomatik kontrollerden geçti · İnsan içerik incelemesi bekliyor</small>
      </article>
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
            <img className="videoPoster" src={video.poster} alt="" loading="lazy" decoding="async" />
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

function LocalizedVideoLibrary() {
  const [languageCode, setLanguageCode] = useState<GuideLanguageCode>('tr');
  const language = GUIDE_LANGUAGES.find((item) => item.code === languageCode) ?? GUIDE_LANGUAGES[0];
  const videos = getPublishedGuideVideos(language);
  const copy = language.copy;

  return (
    <section className="platformVideoSection" aria-labelledby="windows-video-title">
      <div className="platformVideoHeading">
        <div lang={language.youtubeLocale}><small>{copy.sectionEyebrow}</small><h3 id="windows-video-title">{copy.sectionTitle}</h3></div>
        <a href="https://www.youtube.com/@AliKaApp" target="_blank" rel="noreferrer" lang={language.youtubeLocale}>{copy.channelLabel} ↗</a>
      </div>
      <p className="platformVideoLead" lang={language.youtubeLocale}>{copy.sectionLead}</p>
      <div className="videoLanguageTabs" role="tablist" aria-label="Rehber video dili">
        {GUIDE_LANGUAGES.map((item) => {
          const count = getPublishedGuideVideos(item).length;
          const selected = item.code === language.code;
          return (
            <button
              id={`video-language-${item.code}`}
              key={item.code}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="video-language-panel"
              className={selected ? 'active' : ''}
              onClick={() => setLanguageCode(item.code)}
            >
              <span lang={item.youtubeLocale}>{item.nativeName}</span>
              <small lang={item.youtubeLocale}>{count > 0 ? `${count} video` : item.copy.preparingLabel}</small>
            </button>
          );
        })}
      </div>
      <div
        id="video-language-panel"
        role="tabpanel"
        aria-labelledby={`video-language-${language.code}`}
        className="videoLanguagePanel"
      >
        <div className="videoLanguageStatus">
          <span aria-hidden="true">{language.code.toUpperCase()}</span>
          <p lang={language.youtubeLocale}><b>{language.nativeName}</b><small>{videos.length > 0 ? copy.publishedLabel : copy.preparingLabel}</small></p>
        </div>
        {videos.length > 0 ? (
          <>
            <div className="videoGuideGroups" lang={language.youtubeLocale}>
              {GUIDE_VIDEO_GROUP_ORDER.map((group) => {
                const groupVideos = videos.filter((video) => video.group === group);
                if (groupVideos.length === 0) return null;
                return (
                  <section className="videoGuideGroup" key={group} aria-labelledby={`video-group-${language.code}-${group}`}>
                    <h4 id={`video-group-${language.code}-${group}`}>{copy.groupLabels[group]}</h4>
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
  const repoSlug = GAME_REPO_SLUGS[game.id];

  return (
    <article className={`gameCard tone-${game.tone}`}>
      <div className="gameCover">
        <img src={`/games/cards/${game.id}.webp`} alt={`${game.title} oyununun oynanışını gösteren görsel`} loading="lazy" decoding="async" />
        <span aria-hidden="true">{game.mark}</span><i /><i />
        <small>{String(index + 1).padStart(2, '0')}</small>
      </div>
      <div className="gameCardBody">
        <div className="gameMeta"><span>{game.category}</span><i>{game.players}</i><i>{game.duration}</i></div>
        <h3>{game.title}</h3>
        <p>{game.summary}</p>
        <section className="gameHow" aria-label={`${game.title} nasıl oynanır?`}>
          <h4>Nasıl oynanır?</h4>
          <ol>{game.steps.map((step, stepIndex) => <li key={step}><b>{stepIndex + 1}</b><span>{step}</span></li>)}</ol>
          <div className="gameRuleGrid">
            <p><b>Kurulum</b><span>{details.setup}</span></p>
            <p><b>Tur nasıl biter?</b><span>{details.finish}</span></p>
            <p><b>Yaşa göre değişir</b><span>{details.age}</span></p>
          </div>
        </section>
        <section className="gameDownloads" aria-label={`${game.title} Türkçe paketleri`}>
          <div><strong>Türkçe oyun paketini indir</strong><small>.alika-game · yalnız veri</small></div>
          <div>{GAME_AGE_PACKS.map((pack) => <a key={pack.id} href={`https://raw.githubusercontent.com/chizyo43-debug/alika-icerik/main/games/${repoSlug}/dist/tr/${pack.id}.alika-game`} target="_blank" rel="noreferrer" download={`${repoSlug}-tr-${pack.id}.alika-game`} aria-label={`${game.title}, ${pack.label} yaş Türkçe paketini indir`}><span>{pack.label}</span><small>yaş</small><b aria-hidden="true">↓</b></a>)}</div>
        </section>
      </div>
    </article>
  );
}

function PageContent({ page, onNavigate }: { page: BookPage; onNavigate: (index: number) => void }) {
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
          <LocalizedVideoLibrary />
          <p className="realEvidenceReceipt"><b>Gerçek ürün ekranları</b><span>Görseller çalışan Windows uygulamasından alınmıştır; tasarım maketi değildir.</span></p>
        </div>
      );
    case 'android-mobile':
      return (
        <div className="platformProgram platformMobile">
          <div className="pageTopline"><p className="folio">Nasıl çalışır? / Telefon + tablet</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">İki rol, birbirini tamamlayan iki görünüm</p>
          <h2 className="compactTitle" tabIndex={-1}>Ebeveyn yönetir,<br />çocuk yolunu görür.</h2>
          <p className="pageLead">Aynı Android uygulaması ebeveyn ve çocuk rolüne göre farklılaşır. Ebeveyn süre, uygulama, uyku ve görevleri yönetir; çocuk kalan süresini, çalışmalarını ve kazanabileceği adımı açıkça görür.</p>
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
          <p className="realEvidenceReceipt"><b>Gerçek cihaz kanıtı</b><span>Görseller fiziksel Android telefondaki çalışan AliKa uygulamasından alınmıştır.</span></p>
        </div>
      );
    case 'android-tv':
      return (
        <div className="platformProgram platformTv">
          <div className="pageTopline"><p className="folio">Nasıl çalışır? / Android TV</p><StatusStamp status={page.status} /></div>
          <p className="questionKicker">Ortak bilgi TV’de, kişisel cevap telefonda</p>
          <h2 className="compactTitle" tabIndex={-1}>TV, ailenin ortak<br />oyun ekranı olur.</h2>
          <p className="pageLead">AliKa TV; oyunları, ortak soruları ve aile panosunu uzaktan okunabilen büyük bir arayüzde gösterir. Telefonlar oyuncu kumandası olur; gizli cevap ve seçimler kişisel ekranda kalır.</p>
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
          <section className="tvTruth"><b>Bugünkü durum</b><span>AliKa TV; D-pad ile kullanılan oyunlar, Aile Panosu ve Ayarlar bölümleriyle gerçek Grundig Android TV’de çalışıyor. Oyun kütüphanesi ve çoklu telefon kumandası deneyimi geliştirilmeye devam ediyor.</span></section>
          <p className="realEvidenceReceipt"><b>Canlı Grundig TV kanıtı</b><span>Bu üç görüntü Tailscale üzerinden bağlanılan fiziksel Grundig Android UHD TV’den doğrudan alınmıştır; tasarım maketi değildir.</span></p>
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
          <div className="pageTopline"><p className="folio">AliKa Ekosistemi / Neler yapılabilir?</p><span className="mixedStatus">Hazır + geliştiriliyor</span></div>
          <h2 className="compactTitle" tabIndex={-1}>AliKa Ekosistemi ile neler yapabilirsiniz?</h2>
          <p className="pageLead">Bir cihazdan verdiğiniz aile kararını diğer cihazda görünür hâle getirebilirsiniz. Aşağıda bugün çalışanlarla hazırlanmakta olanlar ayrı gösterilir.</p>

          <div className="ecosystemLedger" aria-label="AliKa ekosistemi özellik durumu">
            <article><StatusStamp status="Bugün kullanılabilir" /><div><strong>Cihazları görün ve yönetin</strong><span>Telefon ve Windows bilgisayarın çevrim içi durumunu görün; kuralları gönderin, gerektiğinde kilitleyin veya açın.</span></div></article>
            <article><StatusStamp status="Bugün kullanılabilir" /><div><strong>Görev, mesaj ve süre paylaşın</strong><span>Gerçek yaşam görevi atayın, aile mesajı gönderin; ebeveyn onayından sonra süre veya ALTIN ödülü verin.</span></div></article>
            <article><StatusStamp status="Bugün kullanılabilir" /><div><strong>Birlikte öğrenin ve oynayın</strong><span>Telefonlar Windows ortak ekranındaki soru oyununa katılır; cevap, açıklama ve skor ailece görünür.</span></div></article>
            <article><StatusStamp status="Bugün kullanılabilir" /><div><strong>Android TV’yi ortak ekran olarak kullanın</strong><span>TV’de oyun kütüphanesini, Aile Panosu’nu ve Ayarlar’ı kumandayla açın; geliştirilmekte olan çoklu telefon deneyimini mevcut özelliklerden ayrı görün.</span></div></article>
          </div>

          <section className="ecosystemVision"><AMascot className="aOnPage" /><div><small>Tek ürün değil, büyüyen aile sistemi</small><strong>Telefon planlar · PC uygular · ortak ekran aileyi buluşturur.</strong><span>Yaşa göre dil ve yönlendirme sadeleşir; çocuk büyüdükçe maskot geri çekilir, sorumluluk görünür kalır.</span></div></section>
        </div>
      );
    case 'games-intro':
      return (
        <div className="gamesIntro">
          <div className="pageTopline"><p className="folio">Oyunlar / AliKa oyun kitaplığı</p><StatusStamp status={page.status} /></div>
          <div className="gamesHero">
            <img src="/games/alika-game-night.webp" alt="Aynı masa etrafında telefon ve tabletlerle eğitim oyunları oynayan aile" loading="lazy" decoding="async" />
            <div><small>Aynı masa · farklı yetenekler</small><h2 tabIndex={-1}>20 oyun, tek ortak ekran.</h2><p>Telefonlar oyuncuların kumandası, Windows veya TV ise ailenin ortak oyun alanı olur.</p></div>
          </div>
          <div className="gameStats" aria-label="Oyun kataloğu özeti"><p><strong>20</strong><span>oyun ailesi</span></p><p><strong>9</strong><span>dil paketi</span></p><p><strong>4</strong><span>yaş grubu</span></p></div>
          <div className="gameShelf" aria-label="Oyun kategorileri">
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-bilgi'))}><b>?</b><span><strong>Bilgi & kelime</strong><small>5 oyun · Hafıza ve anlatım</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-yaraticilik'))}><b>✎</b><span><strong>Sahne & hikâye</strong><small>5 oyun · Yaratıcılık ve ritim</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-aile'))}><b>⌂</b><span><strong>Aile gecesi</strong><small>5 oyun · Birlikte karar</small></span></button>
            <button type="button" onClick={() => onNavigate(BOOK_PAGES.findIndex((item) => item.id === 'oyunlar-stem'))}><b>&lt;/&gt;</b><span><strong>STEM & strateji</strong><small>5 oyun · Tasarım ve kodlama</small></span></button>
          </div>
          <p className="gameSourceNote"><strong>Oyun dosyaları hazır.</strong> Uygulamada kullanılabilirlik oyuna göre değişebilir. Son insan incelemesini bekleyen içerikler depoda açıkça belirtilir. <a href="https://github.com/chizyo43-debug/alika-icerik/tree/main/games" target="_blank" rel="noreferrer">Oyun dosyalarını görün ↗</a></p>
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
          <p className="gameCatalogFoot">Her oyun, ortak ekrandaki yönlendirme ve oyuncu cihazındaki gizli cevaplarla ailece oynanacak biçimde tasarlanmıştır.</p>
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
          <div className="contentNumbers">
            <p><strong>6</strong><span>sınıf düzeyi</span></p>
            <p><strong>41</strong><span>ders paketi</span></p>
            <p><strong>19.980</strong><span>soru</span></p>
          </div>
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
            <a className="primaryCta" href={MICROSOFT_STORE_URL} target="_blank" rel="noreferrer" aria-label="AliKa’yı Microsoft Store’da aç">Microsoft Store’dan edinin <span>↗</span></a>
            <a className="supportLink" href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a>
          </div>
          <div className="closingMark"><img src="/brand/alika-logo.png" alt="" width="74" height="52" /><p>Ekranı kapatmak için değil,<br /><strong>zamanı daha iyi kullanmak için.</strong></p></div>
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
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);
    return () => motionQuery.removeEventListener('change', syncMotion);
  }, []);

  useEffect(() => {
    initialTarget.current = pageIndexFromHash(window.location.hash) ?? 0;
  }, []);

  const currentPage = BOOK_PAGES[pageIndex];
  const activeChapter = useMemo(() => [...CHAPTERS].reverse().find((chapter) => pageIndex >= chapter.start) ?? CHAPTERS[0], [pageIndex]);
  const activeChapterIndex = CHAPTERS.findIndex((chapter) => chapter.id === activeChapter.id);
  const chapterEnd = CHAPTERS[activeChapterIndex + 1]?.start ?? BOOK_PAGES.length;
  const chapterPages = BOOK_PAGES.slice(activeChapter.start, chapterEnd);
  const lastStart = BOOK_PAGES.length - 1;
  const step = 1;

  const writeHash = useCallback((index: number, replace = false) => {
    const targetChapter = [...CHAPTERS].reverse().find((chapter) => index >= chapter.start) ?? CHAPTERS[0];
    const hash = index === targetChapter.start ? targetChapter.id : BOOK_PAGES[index].id;
    const url = `${window.location.pathname}${window.location.search}#${hash}`;
    if (replace) window.history.replaceState({ page: index }, '', url);
    else window.history.pushState({ page: index }, '', url);
  }, []);

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
  const guideText = guideTextByChapter[activeChapter.id];
  const showGuide = phase === 'reading' && pageIndex === activeChapter.start;
  const showScrollCue = phase === 'reading' && scrollInfo.scrollable && scrollInfo.progress < .97;

  return (
    <main className={`bookStage phase-${phase}`}>
      <div className="ambientGrain" aria-hidden="true" />
      <div className="workspaceStillLife" aria-hidden="true">
        <span className="deskNote"><i>AliKa</i><b>Aile çalışma kitabı</b><small>Plan · Öğrenme · Birlikte zaman</small></span>
        <span className="deskPencil"><i /></span>
        <span className="ribbonTrail" />
      </div>
      <header className="readingHeader" aria-hidden={!['reading', 'flipping'].includes(phase)}>
        <a className="miniBrand" href="#baslangic" onClick={(event) => { event.preventDefault(); turnTo(0); }}><img src="/brand/alika-logo.png" alt="" />AliKa</a>
        <p>{activeChapter.label}</p>
        <span>{String(pageIndex + 1).padStart(2, '0')} / {BOOK_PAGES.length}</span>
      </header>

      <section
        className={`bookScene direction-${direction}`}
        aria-label="AliKa etkileşimli ürün kitabı"
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
            <PageContent page={currentPage} onNavigate={turnTo} />
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
            aria-label="Kitap sayfasında aşağı kaydır"
            aria-hidden={!showScrollCue}
            tabIndex={showScrollCue ? 0 : -1}
          ><span><i style={{ width: `${Math.max(12, scrollInfo.progress * 100)}%` }} /></span><b>Aşağı kaydır</b></button>
        </div>

        {phase === 'flipping' && <div className="turningSheet" aria-hidden="true"><div className="sheetFront"><span>{direction === 'forward' ? 'Sonraki bölüm' : 'Önceki bölüm'}</span></div><div className="sheetBack" /></div>}

        <button className="bookCover" type="button" onClick={openBook} aria-label="AliKa ürün kitabını aç" aria-hidden={['reading', 'flipping'].includes(phase)} tabIndex={phase === 'closed' ? 0 : -1} disabled={phase !== 'closed'}>
          <span className="coverRule coverRuleTop" />
          <span className="coverEyebrow">Aile için dijital denge</span>
          <span className="morphMark">
            <span className="logoHalo" aria-hidden="true" />
            <img className="officialLogo" src="/brand/alika-logo.png" alt="AliKa" width="208" height="144" />
            <AMascot />
          </span>
          <span className="coverTitle">AliKa</span>
          <span className="coverSubtitle">Ekranı öğrenmeye, planı aile zamanına dönüştüren ekosistem.</span>
          <span className="openPrompt"><i aria-hidden="true">↗</i><b>Kitabı aç</b><small>Logo üzerine dokunun</small></span>
          <span className="coverRule coverRuleBottom" />
        </button>

        <nav className="chapterTabs" aria-label="Kitap bölümleri" ref={chapterTabsRef}>
          {CHAPTERS.map((chapter, index) => <button key={chapter.id} type="button" className={activeChapter.id === chapter.id ? 'active' : ''} onClick={() => turnTo(chapter.start)} disabled={phase !== 'reading'} style={{ '--tab-index': index } as CSSProperties}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}
        </nav>

        <div className={`bookGuide ${showGuide ? 'visible' : ''}`} aria-hidden="true"><AMascot className="aGuide" /><p>{guideText}</p></div>
      </section>

      <nav className="bookControls" aria-label="Sayfa kontrolleri">
        <button type="button" onClick={() => turnTo(pageIndex - step)} disabled={phase !== 'reading' || pageIndex === 0} aria-label="Önceki sayfa">← <span>Önceki</span></button>
        <p aria-live="polite">{phase === 'closed' ? 'Kapak' : phase === 'flipping' ? 'Sayfa çevriliyor' : `${currentPage.chapter} · ${currentPage.title}`}</p>
        <button type="button" onClick={() => turnTo(pageIndex + step)} disabled={phase !== 'reading' || pageIndex >= lastStart} aria-label="Sonraki sayfa"><span>Sonraki</span> →</button>
      </nav>

      <section className="seoOutline" aria-label="AliKa ürün kitabı metin özeti">
        {BOOK_PAGES.map((page) => <article key={page.id}><h2>{page.title}</h2><p>{page.summary}</p></article>)}
      </section>
    </main>
  );
}
