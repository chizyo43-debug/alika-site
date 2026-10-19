import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { microsoftStoreUrl, playStoreUrl } from '../store-campaign';
import { contentPath, GUIDE_PATHS, homePath, LANG_NAMES, LANGS, legalPath, type Lang } from './i18n/langs';
import type { AudienceId, ControlFeature, FamilyFeature, HomeCopy, LearningFeature, PlanStatus, ScreenId, TvGame, VideoKey } from './i18n/types';

const SUPPORT_EMAIL = 'alika.destek@gmail.com';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem('alika-theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readStoredTheme();
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('alika-theme', theme);
    } catch {
      /* Tema tercihi kaydedilemezse sayfa yine çalışır. */
    }
  }, [theme]);

  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))];
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Maskotun arkasındaki yarım ton (halftone) halesi: AliKa mavisi noktalar, imlece hafifçe tepki verir. */
function HalftoneHalo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reduced = prefersReducedMotion();
    const pointer = { x: -9999, y: -9999 };
    let size = 0;
    let frame = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      size = rect.width;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    /* Renk döngüsü: beyaza yakın açık mavi → koyu AliKa mavisi → tekrar açık mavi (bir tur ~7 sn). */
    const LIGHT = [222, 238, 255];
    const DARK = [10, 62, 168];
    const CYCLE_MS = 7000;
    const dotColor = (time: number, distance: number) => {
      const phase = reduced ? Math.PI / 2 : (time / CYCLE_MS) * Math.PI * 2 - distance * 0.9;
      const mix = (1 - Math.cos(phase)) / 2;
      const channel = (i: number) => Math.round(LIGHT[i] + (DARK[i] - LIGHT[i]) * mix);
      return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, size, size);
      const center = size / 2;
      const radius = size / 2;
      const gap = Math.max(7, size / 62);
      for (let y = gap / 2; y < size; y += gap) {
        for (let x = gap / 2; x < size; x += gap) {
          const dx = x - center;
          const dy = y - center;
          const distance = Math.sqrt(dx * dx + dy * dy) / radius;
          if (distance > 1) continue;
          const wave = reduced ? 0 : Math.sin(time / 700 - distance * 10) * 0.26;
          const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / (size * 0.16));
          const base = Math.pow(1 - distance, 0.85);
          const dotRadius = Math.max(0, (base + wave * base + near * 0.7) * gap * 0.5);
          if (dotRadius < 0.35) continue;
          context.fillStyle = dotColor(time, distance);
          context.globalAlpha = 0.55 + base * 0.45;
          context.beginPath();
          context.arc(x, y, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      if (!running) return;
      draw(time);
      frame = window.requestAnimationFrame(loop);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduced) {
      draw(0);
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      frame = window.requestAnimationFrame(loop);
    }

    const themeObserver = new MutationObserver(() => reduced && draw(0));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="halo" aria-hidden="true" />;
}

type OrbitStatus = 'ready' | 'dev';

interface ScreenItem {
  id: ScreenId;
  platform: 'Windows' | 'Android';
  status: OrbitStatus;
  tone: string;
  side: 'left' | 'right';
  angle: number;
  icon: ReactNode;
  image: string;
  shape: 'wide' | 'phone';
  video?: VideoKey;
}

const iconProps = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS = {
  panel: <svg {...iconProps}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M13 9h4M13 13h4" /></svg>,
  rules: <svg {...iconProps}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9.5 2.5h5" /></svg>,
  quiz: <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4" /><circle cx="12" cy="16.9" r=".6" fill="currentColor" /></svg>,
  homework: <svg {...iconProps}><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /><path d="m14.5 16 1.3 1.3 2.4-2.6" /></svg>,
  child: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><circle cx="12" cy="10" r="2.4" /><path d="M9 15.5c.8-1.3 1.8-2 3-2s2.2.7 3 2" /></svg>,
  parent: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><path d="M12 7.5 9.5 8.6v2.2c0 1.8 1 3.3 2.5 3.9 1.5-.6 2.5-2.1 2.5-3.9V8.6Z" /></svg>,
  phoneQuiz: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><path d="M10.4 8.8a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1v.3" /><circle cx="12" cy="14.6" r=".5" fill="currentColor" /></svg>,
  shield: <svg {...iconProps}><path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.1 8.5 7.5 9.9 4.4-1.4 7.5-5.3 7.5-9.9V5.6Z" /><path d="m8.8 12 2.2 2.2 4.3-4.4" /></svg>,
  reward: <svg {...iconProps}><circle cx="12" cy="9" r="6" /><path d="m9 14.2-1.6 7 4.6-2.4 4.6 2.4-1.6-7" /><path d="M12 6.5v5M9.8 9h4.4" /></svg>,
};

/* Sol kavis Windows, sağ kavis Android. İki taraf aynı sırayla aynayı izler:
   ebeveyn paneli, kural, ortada soru çöz, koruma, çocuğun günü. Açılar yüzü ve gövdeyi boş bırakır.
   Ekran görüntüleri Türkçe arayüzdendir; yazılar dil dosyasından gelir. */
const SCREENS: ScreenItem[] = [
  { id: 'win-panel', platform: 'Windows', status: 'ready', tone: 'blue', side: 'left', angle: 215, icon: ICONS.panel, image: '/screens/platform/windows-panel-bugun.webp', shape: 'wide', video: 'winPanel' },
  { id: 'win-rules', platform: 'Windows', status: 'ready', tone: 'ink', side: 'left', angle: 197, icon: ICONS.rules, image: '/screens/platform/windows-kurallar.webp', shape: 'wide' },
  { id: 'win-quiz', platform: 'Windows', status: 'ready', tone: 'sun', side: 'left', angle: 180, icon: ICONS.quiz, image: '/screens/platform/windows-soru-coz.webp', shape: 'wide', video: 'ad' },
  { id: 'win-protect', platform: 'Windows', status: 'ready', tone: 'mint', side: 'left', angle: 163, icon: ICONS.shield, image: '/screens/platform/windows-guvenli-mod.webp', shape: 'wide', video: 'winSetup' },
  { id: 'win-homework', platform: 'Windows', status: 'ready', tone: 'violet', side: 'left', angle: 145, icon: ICONS.homework, image: '/screens/platform/windows-gorevler.webp', shape: 'wide' },
  { id: 'and-panel', platform: 'Android', status: 'ready', tone: 'blue', side: 'right', angle: -35, icon: ICONS.parent, image: '/screens/platform/android-panel.webp', shape: 'phone', video: 'andPanel' },
  { id: 'and-reward', platform: 'Android', status: 'ready', tone: 'ink', side: 'right', angle: -17, icon: ICONS.reward, image: '/screens/platform/android-odul-kurali.webp', shape: 'phone', video: 'quizShort' },
  { id: 'and-quiz', platform: 'Android', status: 'ready', tone: 'sun', side: 'right', angle: 0, icon: ICONS.phoneQuiz, image: '/screens/platform/android-soru-coz.webp', shape: 'phone', video: 'ad' },
  { id: 'and-protect', platform: 'Android', status: 'ready', tone: 'mint', side: 'right', angle: 17, icon: ICONS.shield, image: '/screens/platform/android-kurallar.webp', shape: 'phone', video: 'androidSetup' },
  { id: 'and-child', platform: 'Android', status: 'ready', tone: 'sky', side: 'right', angle: 35, icon: ICONS.child, image: '/screens/platform/android-cocuk-ana.webp', shape: 'phone' },
];

/* Video dosyası sitede durur; tıklanana kadar yalnız kapak görseli yüklenir, YouTube'a bağlanılmaz. */
function VideoPlayer({ source, lang, label }: { source: VideoSource; lang: Lang; label: string }) {
  const captionLabel = new Intl.DisplayNames([lang], { type: 'language' }).of('tr') ?? 'Türkçe';
  return (
    <video className={`videoPlayer${source.vertical ? ' vertical' : ''}`} controls autoPlay playsInline preload="none" poster={`${source.file}.webp`} aria-label={label}>
      <source src={`${source.file}.mp4`} type="video/mp4" />
      <track kind="captions" src={`${source.file}.tr.vtt`} srcLang="tr" label={captionLabel} />
    </video>
  );
}

function ScreenDialog({ screen, onClose, lang, t }: { screen: ScreenItem | null; onClose: () => void; lang: Lang; t: HomeCopy }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (screen && !dialog.open) dialog.showModal();
    if (!screen && dialog.open) dialog.close();
  }, [screen]);

  return (
    <dialog
      ref={dialogRef}
      className="screenDialog"
      aria-labelledby="screenDialogTitle"
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {/* Ekran değişince içerik yeniden kurulur; açık video kapanır. */}
      {screen && <ScreenContent key={screen.id} screen={screen} onClose={onClose} lang={lang} t={t} />}
    </dialog>
  );
}

function ScreenContent({ screen, onClose, lang, t }: { screen: ScreenItem; onClose: () => void; lang: Lang; t: HomeCopy }) {
  const [playing, setPlaying] = useState(false);
  const video = screen.video ? VIDEO_BY_KEY[screen.video] : null;
  /* Telefon ekranında videonun dikey eşi varsa o oynar. */
  const source = video ? videoSource(video, screen.shape === 'phone') : null;
  const text = t.screens[screen.id];

  return (
    <div className={`screenBody ${playing && source ? (source.vertical ? 'phone' : 'wide') : screen.shape}`}>
      <figure className="screenShot">
        {playing && video && source
          ? <VideoPlayer source={source} lang={lang} label={t.videos[video.key].title} />
          : <img src={screen.image} alt={t.a11y.screenAlt(text.label)} />}
      </figure>
      <div className="screenText">
        <span className="tag plain"><StatusDot status={screen.status} />{screen.platform}</span>
        <h2 id="screenDialogTitle">{text.label}</h2>
        <p>{text.body}</p>
        {t.dialog.note && <p className="screenNote">{t.dialog.note}</p>}
        <div className="screenActions">
          {video && !playing && (
            <button type="button" className="pill solid" onClick={() => setPlaying(true)}>
              {t.dialog.watch} <span className="mono">{video.duration}</span>
            </button>
          )}
          <button type="button" className="pill ghost" onClick={onClose}>{t.dialog.close}</button>
        </div>
      </div>
    </div>
  );
}

interface Platform {
  id: string;
  tone: string;
  tags: string[];
  status: OrbitStatus;
  title: string;
  body: string;
  image?: { src: string; alt: string; shape: 'wide' | 'phone' };
  /* Görseli olmayan kartta (geliştirilen TV) güncel oyun listesi gösterilir. */
  games?: { id: TvGame; name: string; body: string; kind: string }[];
  action?: { label: string; href: string; external?: boolean };
}

/* Oyun listesi Android TV kodundan (TvHomeScreen yerleşik oyunlar + TvGameCatalogClient katalog oyunları). */
const TV_GAMES: { id: TvGame; ready: boolean }[] = [
  { id: 'rally', ready: true },
  { id: 'station', ready: true },
  { id: 'wheel', ready: false },
  { id: 'nameCity', ready: false },
];

function platforms(t: HomeCopy, storeUrl: string, playUrl: string): Platform[] {
  const { windows, android, tv } = t.platforms;
  return [
    {
      id: 'windows', tone: 'p-windows', status: 'ready', tags: windows.tags,
      title: windows.title,
      body: windows.body,
      image: { src: '/screens/platform/windows-panel-bugun.webp', alt: windows.imageAlt, shape: 'wide' },
      action: { label: t.store.getStore, href: storeUrl, external: true },
    },
    {
      id: 'android', tone: 'p-android', status: 'ready', tags: android.tags,
      title: android.title,
      body: android.body,
      image: { src: '/screens/platform/android-cocuk-ana.webp', alt: android.imageAlt, shape: 'phone' },
      action: { label: t.store.getPlay, href: playUrl, external: true },
    },
    {
      id: 'tv', tone: 'p-tv', status: 'dev', tags: tv.tags,
      title: tv.title,
      body: tv.body,
      games: TV_GAMES.map((game) => ({ id: game.id, ...tv.games[game.id], kind: game.ready ? tv.ready : tv.download })),
    },
  ];
}

/* Kanaldaki güncel videoların (19.10.2026, Türkçe) aynı dosyaları sitede barındırılır ve sayfada oynar.
   `file` uzantısız yoldur: .mp4 video, .webp kapak, .tr.vtt Türkçe altyazı. Reklamın dikey eşi
   (`verticalFile`) telefon genişliğinde ve telefon ekranı penceresinde oynar; Shorts videosu yalnız dikeydir. */
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@AliKaApp';
interface VideoItem {
  key: VideoKey;
  platform: string;
  /* Oynatıcının gösterdiği süre (saniye aşağı yuvarlanır). */
  duration: string;
  file: string;
  store?: 'microsoft' | 'play';
  verticalFile?: string;
  vertical?: boolean;
}
interface VideoSource { file: string; vertical: boolean }
/* Videolar bölümündeki kartlar: önce iki ilk kurulum, sonra kullanım rehberleri. */
const VIDEOS: VideoItem[] = [
  { key: 'winSetup', platform: 'Windows', duration: '1:35', file: '/videos/kurulum/windows-ilk-kurulum', store: 'microsoft' },
  { key: 'androidSetup', platform: 'Android', duration: '1:40', file: '/videos/kurulum/android-ilk-kurulum', store: 'play' },
  { key: 'winPanel', platform: 'Windows', duration: '2:36', file: '/videos/kurulum/windows-ebeveyn-paneli' },
  { key: 'andPanel', platform: 'Android', duration: '2:19', file: '/videos/kurulum/android-ebeveyn-paneli' },
  { key: 'firstDay', platform: 'Android / Windows', duration: '2:06', file: '/videos/kurulum/ilk-gun-ayarlari' },
  { key: 'homeNetwork', platform: 'Android / Windows', duration: '3:43', file: '/videos/kurulum/ev-agi' },
];
/* Kartlarda olmayanlar: reklam açılıştaki tanıtım videosudur ve soru çözme ekranlarında oynar;
   kısa dikey video Android ödül kuralı ekranında oynar. */
const AD_VIDEO: VideoItem = { key: 'ad', platform: 'Windows / Android', duration: '0:44', file: '/videos/kurulum/alika-reklam', verticalFile: '/videos/kurulum/alika-reklam-dikey' };
const QUIZ_SHORT: VideoItem = { key: 'quizShort', platform: 'Android', duration: '0:22', file: '/videos/kurulum/ekran-suresinden-fazlasi', vertical: true };
const VIDEO_BY_KEY = Object.fromEntries([...VIDEOS, AD_VIDEO, QUIZ_SHORT].map((video) => [video.key, video])) as Record<VideoKey, VideoItem>;

function videoSource(video: VideoItem, preferVertical: boolean): VideoSource {
  if (preferVertical && video.verticalFile) return { file: video.verticalFile, vertical: true };
  return { file: video.file, vertical: video.vertical === true };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

const AGE_RANGES = ['5–7', '8–11', '12–14', '15–18'];

/* Kimler için kartlarından ilgili rehbere: yalnız yayımlanmış rehberler. */
const AUDIENCE_GUIDES: Partial<Record<Lang, Partial<Record<AudienceId, string>>>> = {
  tr: {
    kardes: '/rehber/windows-cocuk-ekran-suresi-nasil-yonetilir/',
    'ilk-telefon': '/rehber/android-cocuk-ekran-suresi/',
    sinav: '/rehber/soru-cozerek-ekran-suresi-kazanma/',
  },
};

/* Deneme ve satın alma kartları; Windows'tan gelen ziyaretçide Windows önce gelir. */
const OFFERS: { id: 'windows' | 'android'; platform: FeaturePlatform; store: StoreId }[] = [
  { id: 'android', platform: 'Android', store: 'play' },
  { id: 'windows', platform: 'Windows', store: 'microsoft' },
];

type FeaturePlatform = 'Windows' | 'Android';
const BOTH: FeaturePlatform[] = ['Windows', 'Android'];

/* Kimler için: kodda doğrulanan özelliklerle dört aile durumu. */
const AUDIENCES: { id: AudienceId; on: FeaturePlatform[] }[] = [
  { id: 'kardes', on: ['Windows'] },
  { id: 'ilk-telefon', on: ['Android'] },
  { id: 'sinav', on: BOTH },
  { id: 'paylasimli', on: ['Android'] },
];

/* Neler var: her madde yalnız gerçekten bulunduğu platformla etiketlenir. Kaynak: Store 1.2.11
   listelemesi (dürüstlük çiti) ve Android 0.3.10 arayüz metinleri. */
const CONTROL: { key: ControlFeature; on: FeaturePlatform[] }[] = [
  { key: 'dailyTime', on: BOTH },
  { key: 'appRules', on: BOTH },
  { key: 'webFilter', on: BOTH },
  { key: 'reports', on: BOTH },
  { key: 'tamperProof', on: ['Windows'] },
];
const LEARNING: { key: LearningFeature; on: FeaturePlatform[] }[] = [
  { key: 'quiz', on: BOTH },
  { key: 'content', on: BOTH },
  { key: 'figures', on: BOTH },
  { key: 'exam', on: BOTH },
  { key: 'notes', on: ['Windows'] },
];
const FAMILY: { key: FamilyFeature; on: FeaturePlatform[] }[] = [
  { key: 'tasks', on: BOTH },
  { key: 'network', on: BOTH },
  { key: 'messages', on: BOTH },
  { key: 'sharedPhone', on: ['Android'] },
];

function featureGroups(t: HomeCopy) {
  const { control, learning, family } = t.features;
  return [
    { id: 'kontrol', title: control.title, lead: control.lead, items: CONTROL.map((item) => ({ ...control.items[item.key], on: item.on })) },
    { id: 'ogrenme', title: learning.title, lead: learning.lead, items: LEARNING.map((item) => ({ ...learning.items[item.key], on: item.on })) },
    { id: 'aile', title: family.title, lead: family.lead, items: FAMILY.map((item) => ({ ...family.items[item.key], on: item.on })) },
  ];
}

function PlatformChips({ on }: { on: FeaturePlatform[] }) {
  return (
    <span className="featOn">
      {on.map((platform) => <span key={platform} className={`chip ${platform === 'Windows' ? 'win' : 'and'}`}>{platform}</span>)}
    </span>
  );
}

function StatusDot({ status }: { status: PlanStatus }) {
  return <i className={`dot ${status}`} aria-hidden="true" />;
}

const STORE_NAMES = { microsoft: 'Microsoft Store', play: 'Google Play' } as const;
type StoreId = keyof typeof STORE_NAMES;

const STORE_ICONS: Record<StoreId, ReactNode> = {
  microsoft: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" /></svg>,
  play: <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 2.8v18.4c0 .5.5.8.9.6l15.4-8.7c.5-.3.5-1 0-1.3L5.4 2.2c-.4-.2-.9.1-.9.6Z" fill="currentColor" /><path d="m4.8 2.4 10.4 10.4M4.8 21.6l10.4-10.4" stroke="var(--store-bg)" strokeWidth="1.4" /></svg>,
};

/* Ziyaretçinin cihazı yalnız hangi mağaza düğmesinin öne çıkacağını seçer; hiçbir yere gönderilmez. */
type Device = 'android' | 'windows' | 'apple' | 'other';

function detectDevice(): Device {
  const agent = navigator.userAgent;
  if (/Android/i.test(agent)) return 'android';
  if (/iPhone|iPad|iPod|Macintosh/i.test(agent)) return 'apple';
  if (/Windows/i.test(agent)) return 'windows';
  return 'other';
}

function StoreBadge({ store, href, note, big = false }: { store: StoreId; href: string; note: string; big?: boolean }) {
  return (
    <a className={`storeBtn${big ? ' big' : ''}`} href={href} target="_blank" rel="noopener">
      {STORE_ICONS[store]}
      <span className="storeText"><small>{note}</small>{STORE_NAMES[store]}</span>
    </a>
  );
}

interface CtaProps { device: Device; t: HomeCopy; storeUrl: string; playUrl: string }

/* Android'den gelen Google Play'i, Windows'tan gelen Microsoft Store'u önde görür; diğerleri ikisini birden.
   Gelir Android aile aboneliğinde olduğu için ikili gösterimde Google Play önce gelir. */
function HeroCta({ device, t, storeUrl, playUrl }: CtaProps) {
  const play = <StoreBadge store="play" href={playUrl} note={t.cta.trialPlay} big />;
  const store = <StoreBadge store="microsoft" href={storeUrl} note={t.cta.trialStore} big />;
  if (device === 'android' || device === 'windows') {
    const android = device === 'android';
    return (
      <div className="heroCta" id="hemen">
        {android ? play : store}
        <a className="textLink" href={android ? storeUrl : playUrl} target="_blank" rel="noopener">
          {android ? t.cta.alsoStore : t.cta.alsoPlay} <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }
  return (
    <div className="heroCta" id="hemen">
      <div className="heroBadges">{play}{store}</div>
      {device === 'apple' && <p className="heroApple">{t.cta.appleNote}</p>}
    </div>
  );
}

/* Telefonda açılıştaki düğme geçilince altta ince bir deneme çubuğu kalır; açılıştaki cümleyi
   örtmesin diye ondan önce çıkmaz. Deneme bölümü ya da altbilgi görününce çekilir. Geniş ekranda CSS ile gizlidir. */
function StickyCta({ device, t, storeUrl, playUrl }: CtaProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hemen');
    const watched = [hero, document.getElementById('deneme'), document.querySelector('.foot')]
      .filter((element): element is HTMLElement => element instanceof HTMLElement);
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      const passed = !hero || hero.getBoundingClientRect().bottom < 0;
      setShow(passed && visible.size === 0);
    });
    watched.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const primary = device === 'android'
    ? { href: playUrl, label: STORE_NAMES.play, note: t.cta.trialPlay, external: true }
    : device === 'windows'
      ? { href: storeUrl, label: STORE_NAMES.microsoft, note: t.cta.trialStore, external: true }
      : { href: '#deneme', label: t.cta.stickyChoose, note: t.cta.stickyBoth, external: false };

  return (
    <div className={`stickyCta${show ? ' show' : ''}`} inert={!show}>
      <img src="/brand/alika-logo.png" alt="" width="30" height="30" />
      <span className="stickyText"><strong>AliKa</strong><small>{primary.note}</small></span>
      <a className="pill solid" href={primary.href} {...(primary.external ? { target: '_blank', rel: 'noopener' } : {})}>
        {primary.label}{primary.external && <span aria-hidden="true"> ↗</span>}
      </a>
    </div>
  );
}

/* Platform kartları: geniş ekranda dikey kaydırma yatay kaydırmaya dönüşür, dar ekranda kaydırmalı şerit olur. */
function PlatformRail({ items, t }: { items: Platform[]; t: HomeCopy }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const pinned = window.matchMedia('(min-width: 861px)');
    let distance = 0;

    const measure = () => {
      if (!pinned.matches || prefersReducedMotion()) {
        section.style.height = '';
        track.style.transform = '';
        distance = 0;
        return;
      }
      distance = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
      section.style.height = `${distance + window.innerHeight}px`;
      update();
    };

    const update = () => {
      if (!distance) return;
      const top = section.getBoundingClientRect().top;
      const ratio = Math.min(1, Math.max(0, -top / distance));
      track.style.transform = `translate3d(${-ratio * distance}px,0,0)`;
      setProgress(ratio);
      setIndex(Math.min(items.length - 1, Math.round(ratio * (items.length - 1))));
    };

    const onTrackScroll = () => {
      if (distance) return;
      const max = track.scrollWidth - track.clientWidth;
      const ratio = max > 0 ? track.scrollLeft / max : 0;
      setProgress(ratio);
      setIndex(Math.min(items.length - 1, Math.round(ratio * (items.length - 1))));
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', update, { passive: true });
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    pinned.addEventListener('change', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', update);
      track.removeEventListener('scroll', onTrackScroll);
      pinned.removeEventListener('change', measure);
    };
  }, [items.length]);

  return (
    <section id="platformlar" ref={sectionRef} className="rail">
      <div className="railSticky">
        <div className="wrap railHead">
          <div>
            <h2>{t.rail.title}</h2>
            <p>{t.rail.lead}</p>
          </div>
          <div className="railMeta" aria-hidden="true">
            <span className="mono">{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
            <span className="railBar"><span style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} /></span>
          </div>
        </div>
        <div className="railViewport">
          <div className="railTrack" ref={trackRef}>
            {items.map((item, i) => (
              <article key={item.id} className={`pcard ${item.tone}`}>
                <div className="pcardText">
                  <div className="tags">
                    {item.tags.map((tag, n) => (
                      <span key={tag} className="tag">{n === 0 && <StatusDot status={item.status} />}{tag}</span>
                    ))}
                    <span className="mono pnum">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.action && (
                    <a className="pill light" href={item.action.href} {...(item.action.external ? { target: '_blank', rel: 'noopener' } : {})}>
                      {item.action.label} <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                {item.image && (
                  <figure className={`pcardShot ${item.image.shape}`}>
                    <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
                  </figure>
                )}
                {item.games && (
                  <ul className="pcardGames" aria-label={t.a11y.tvGames}>
                    {item.games.map((game) => (
                      <li key={game.id}>
                        <strong>{game.name}</strong>
                        <span>{game.body}</span>
                        <small className="mono">{game.kind}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CopyEmail({ t }: { t: HomeCopy }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${SUPPORT_EMAIL}`;
    }
  };
  return (
    <div className="mailRow">
      <a className="mail" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      <button type="button" className="pill ghost" onClick={copy} aria-live="polite">{copied ? t.contact.copied : t.contact.copy}</button>
    </div>
  );
}

/* Açılır liste dışarı tıklayınca ya da Esc ile kapanır. */
function useDismiss(ref: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    const close = (event: Event) => {
      const details = ref.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !details.contains(event.target as Node)) {
        details.open = false;
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [ref]);
}

/* Telefonda yazılı menü gizlenir; aynı bağlantılar bu açılır listede durur. */
function MobileMenu({ lang, t }: { lang: Lang; t: HomeCopy }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useDismiss(ref);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };
  const items: [string, string][] = [
    ['#ozellikler', t.nav.features],
    ['#videolar', t.nav.videos],
    [contentPath(lang), t.nav.content],
    ['#plan', t.nav.plan],
    ['#deneme', t.nav.offer],
    ['#sss', t.nav.faq],
    [legalPath(lang, 'privacy'), t.nav.privacy],
  ];

  return (
    <details className="mobMenu" ref={ref}>
      <summary className="iconBtn" aria-label={t.a11y.mainMenu}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </summary>
      <ul className="langList mobList">
        {items.map(([href, label]) => (
          <li key={href}>
            <a href={href} onClick={close}>{label}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* Dil seçici: her dil kendi ana sayfasına gider. */
function LanguagePicker({ lang, t }: { lang: Lang; t: HomeCopy }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useDismiss(ref);

  return (
    <details className="langPick" ref={ref}>
      <summary className="iconBtn langBtn" aria-label={`${t.a11y.language}: ${LANG_NAMES[lang]}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
        <span className="mono" aria-hidden="true">{lang.toUpperCase()}</span>
      </summary>
      <ul className="langList">
        {LANGS.map((code) => (
          <li key={code}>
            <a href={homePath(code)} hrefLang={code} lang={code} aria-current={code === lang ? 'page' : undefined}>
              <span className="mono">{code.toUpperCase()}</span>{LANG_NAMES[code]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function Home({ lang, t }: { lang: Lang; t: HomeCopy }) {
  const [theme, toggleTheme] = useTheme();
  const [openScreen, setOpenScreen] = useState<ScreenItem | null>(null);
  /* Aynı anda tek video oynar; başka karta tıklanınca önceki kapanır. Tanıtımdaki demo 'demo' adıyla ayrıdır. */
  const [playingVideo, setPlayingVideo] = useState<VideoKey | 'demo' | null>(null);
  const [device] = useState(detectDevice);
  const demoVideo = VIDEO_BY_KEY.ad;
  /* Telefonda tanıtım videosunun dikey eşi gösterilir. */
  const demoSource = videoSource(demoVideo, useMediaQuery('(max-width: 640px)'));
  const offers = device === 'windows' ? [...OFFERS].reverse() : OFFERS;
  const storeUrl = microsoftStoreUrl(lang);
  const playUrl = playStoreUrl(lang);
  const home = homePath(lang);
  const guides = GUIDE_PATHS[lang];

  return (
    <>
      <a className="skip" href="#icerik">{t.a11y.skip}</a>
      <header className="top">
        <a className="brand" href={home} aria-label={t.a11y.home}>
          <img src="/brand/alika-logo.png" alt="" width="34" height="34" />
          <span>AliKa</span>
        </a>
        <nav className="topNav" aria-label={t.a11y.mainMenu}>
          <a href="#ozellikler">{t.nav.features}</a>
          <a className="navLow" href="#videolar">{t.nav.videos}</a>
          <a href={contentPath(lang)}>{t.nav.content}</a>
          <a href="#plan">{t.nav.plan}</a>
          <a href="#deneme">{t.nav.offer}</a>
          <a href="#sss">{t.nav.faq}</a>
          <a className="navLow" href={legalPath(lang, 'privacy')}>{t.nav.privacy}</a>
          <LanguagePicker lang={lang} t={t} />
          <button type="button" className="iconBtn" onClick={toggleTheme} aria-label={theme === 'dark' ? t.a11y.toLight : t.a11y.toDark}>
            {theme === 'dark'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>}
          </button>
          <div className="storeBtns">
            <a className="storeBtn" href={storeUrl} target="_blank" rel="noopener" aria-label={t.a11y.storeAria}>
              {STORE_ICONS.microsoft}
              <span className="storeText"><small>{t.store.forWindows}</small>{STORE_NAMES.microsoft}</span>
            </a>
            <a className="storeBtn" href={playUrl} target="_blank" rel="noopener" aria-label={t.a11y.playAria}>
              {STORE_ICONS.play}
              <span className="storeText"><small>{t.store.forAndroid}</small>{STORE_NAMES.play}</span>
            </a>
          </div>
          <MobileMenu lang={lang} t={t} />
        </nav>
      </header>

      <main id="icerik">
        <section className="hero">
          <a className="corner c-tl" href="#nasil">{t.hero.how}</a>
          <a className="corner c-tr" href="#platformlar">{t.hero.platforms}</a>
          <a className="corner c-bl" href="#guven">{t.hero.trust}</a>
          <a className="corner c-br" href="#iletisim">{t.hero.contact}</a>

          <div className="stage">
            <div className="glow" aria-hidden="true" />
            <div className="ring" aria-hidden="true" />
            <HalftoneHalo />
            <div className="orbitPath" aria-hidden="true" />
            <img className="mascot" src="/brand/alika-maskot.webp" alt={t.hero.mascotAlt} width="470" height="1100" />
            <span className="sideTag left" aria-hidden="true">Windows</span>
            <span className="sideTag right" aria-hidden="true">Android</span>
            {SCREENS.map((screen, i) => (
              <button
                key={screen.id}
                type="button"
                className={`orbit ${screen.side}`}
                style={{ '--a': `${screen.angle}deg`, '--i': i } as CSSProperties}
                onClick={() => setOpenScreen(screen)}
                aria-label={t.a11y.openScreen(t.screens[screen.id].label, screen.platform)}
              >
                <span className={`tile t-${screen.tone}`}>{screen.icon}<StatusDot status={screen.status} /></span>
                <span className="orbitLabel" aria-hidden="true">{t.screens[screen.id].label}</span>
              </button>
            ))}
          </div>

          <h1 className="wordmark" aria-label="AliKa">
            <span aria-hidden="true">Ali</span>
            <span className="ka" aria-hidden="true"><span>K</span><span>a</span></span>
          </h1>
          <p className="tagline">{t.hero.tagline[0]} <em>{t.hero.tagline[1]}</em></p>
          <p className="pitch">{t.cta.pitch}</p>
          <HeroCta device={device} t={t} storeUrl={storeUrl} playUrl={playUrl} />
          <p className="heroNote">
            <StatusDot status="ready" />
            <span>{t.hero.live}</span>
            <span className="mono">{t.cta.trustLine}</span>
          </p>
          <a className="scrollCue" href="#tanitim" aria-label={t.a11y.scrollDown}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 9 7 7 7-7" /></svg>
          </a>
        </section>

        <section id="tanitim" className="intro wrap">
          <div className="introGrid">
            <div className="introText">
              <p className="eyebrow mono">{t.intro.eyebrow}</p>
              <p className="introLead">
                {t.intro.lead[0]}<mark>{t.intro.lead[1]}</mark>{t.intro.lead[2]}
              </p>
              <a className="textLink" href="#videolar">{t.intro.watchVideos} <span aria-hidden="true">→</span></a>
            </div>
            {/* Kısa tanıtım videosu açılışın hemen altında: bilgisayarda da, telefonda da. */}
            <figure className="demo video">
              {playingVideo === 'demo' ? (
                <span className={`videoThumb${demoSource.vertical ? ' vertical' : ''}`}>
                  <VideoPlayer source={demoSource} lang={lang} label={t.demo.title} />
                </span>
              ) : (
                <button
                  type="button"
                  className={`videoThumb${demoSource.vertical ? ' vertical' : ''}`}
                  onClick={() => setPlayingVideo('demo')}
                  aria-label={`${t.dialog.watch}: ${t.demo.title} (${demoVideo.duration})`}
                >
                  <img src={`${demoSource.file}.webp`} alt="" loading="lazy" decoding="async" />
                  <span className="mono videoTime">{demoVideo.duration}</span>
                  <span className="play" aria-hidden="true">▶</span>
                </button>
              )}
              <figcaption>
                <strong>{t.demo.title}</strong>
                <span>{t.demo.body}</span>
                {t.how.videoNote && <small>{t.how.videoNote}</small>}
              </figcaption>
            </figure>
          </div>
          <dl className="stats">
            {t.intro.stats.map((stat) => (
              <div key={stat.value}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>
            ))}
          </dl>
        </section>

        <PlatformRail items={platforms(t, storeUrl, playUrl)} t={t} />

        <section id="kimler" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.audiences.title}</h2>
              <p>{t.audiences.lead}</p>
            </div>
          </div>
          <div className="audiences">
            {AUDIENCES.map((item) => {
              const text = t.audiences.items[item.id];
              const guide = AUDIENCE_GUIDES[lang]?.[item.id];
              return (
                <article key={item.id} className={`audience u-${item.id}`}>
                  <PlatformChips on={item.on} />
                  <h3>{text.title}</h3>
                  <p>{text.body}</p>
                  <ul>
                    {text.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  {/* Her durumun bir sonraki adımı: o platformun mağazası, varsa ilgili rehber. */}
                  <div className="audienceCta">
                    {item.on.map((platform) => {
                      const store: StoreId = platform === 'Windows' ? 'microsoft' : 'play';
                      return (
                        <a
                          key={platform}
                          className="pill ghost small"
                          href={store === 'microsoft' ? storeUrl : playUrl}
                          target="_blank"
                          rel="noopener"
                          aria-label={`${text.title}: ${STORE_NAMES[store]}`}
                        >
                          {STORE_NAMES[store]} <span aria-hidden="true">↗</span>
                        </a>
                      );
                    })}
                    {guide && <a className="textLink" href={guide}>{t.audiences.guide} <span aria-hidden="true">→</span></a>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="ozellikler" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.features.title}</h2>
              <p>{t.features.lead}</p>
            </div>
          </div>
          <div className="features">
            {featureGroups(t).map((group) => (
              <article key={group.id} className={`featGroup f-${group.id}`}>
                <h3>{group.title}</h3>
                <p className="featLead">{group.lead}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <div className="featName">
                        <strong>{item.name}</strong>
                        <PlatformChips on={item.on} />
                      </div>
                      <span>{item.body}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="nasil" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.how.title}</h2>
              <p>{t.how.lead}</p>
            </div>
          </div>
          <ol className="steps">
            {t.how.steps.map((step, i) => (
              <li key={step.title}>
                <span className="stepNum" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="subHeadRow" id="videolar">
            <h3 className="subHead">{t.how.videos}</h3>
            <a className="textLink" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener">{t.how.channel}</a>
          </div>
          {t.how.videoNote && <p className="videoNote">{t.how.videoNote}</p>}
          <div className="installGrid">
            {VIDEOS.map((video) => (
              <article key={video.key} className="install">
                <div className="video">
                  {playingVideo === video.key ? (
                    <span className="videoThumb">
                      <VideoPlayer source={videoSource(video, false)} lang={lang} label={t.videos[video.key].title} />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="videoThumb"
                      onClick={() => setPlayingVideo(video.key)}
                      aria-label={`${t.dialog.watch}: ${t.videos[video.key].title} (${video.duration})`}
                    >
                      <img src={`${video.file}.webp`} alt="" loading="lazy" decoding="async" />
                      <span className="mono videoTime">{video.duration}</span>
                      <span className="play" aria-hidden="true">▶</span>
                    </button>
                  )}
                  <span className="mono videoEyebrow">{video.platform} · {video.store ? t.how.firstSetup : t.how.usage}</span>
                  <span className="videoTitle">{t.videos[video.key].title}</span>
                </div>
                <p>{t.videos[video.key].body}</p>
                {video.store && (
                  <a className="pill ghost" href={video.store === 'microsoft' ? storeUrl : playUrl} target="_blank" rel="noopener">
                    {video.store === 'microsoft' ? t.store.getStore : t.store.getPlay} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="yas" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.ages.title}</h2>
              <p>{t.ages.lead}</p>
            </div>
          </div>
          <div className="ages">
            {t.ages.items.map((age, i) => (
              <article key={AGE_RANGES[i]} className={`age a${i + 1}`}>
                <span className="ageRange">{AGE_RANGES[i]}<small>{t.ages.unit}</small></span>
                <h3>{age.title}</h3>
                <p>{age.body}</p>
              </article>
            ))}
          </div>
        </section>


        <section id="guven" className="trust">
          <div className="wrap trustInner">
            <p className="eyebrow mono">{t.trust.eyebrow}</p>
            <h2>{t.trust.title}</h2>
            <ul className="trustList">
              {t.trust.items.map((item) => (
                <li key={item.title}><strong>{item.title}</strong><span>{item.body}</span></li>
              ))}
            </ul>
            <a className="textLink onDark" href={legalPath(lang, 'privacy')}>{t.trust.privacyLink}</a>
          </div>
        </section>

        <section id="hakkimizda" className="section wrap about">
          <div className="aboutStory">
            <p className="eyebrow mono">{t.about.eyebrow}</p>
            <h2>{t.about.title}</h2>
            <div className="aboutText">
              {t.about.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <p className="aboutSign">{t.about.signature}</p>
          </div>
          <aside id="plan" className="aboutPlan" aria-labelledby="plan-title">
            <h3 id="plan-title">{t.about.planTitle}</h3>
            {t.about.plan.map((group) => (
              <div key={group.status} className={`planGroup plan-${group.status}`}>
                <p className="planLabel"><StatusDot status={group.status} />{group.label}</p>
                <ul>
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
            <a className="textLink" href={contentPath(lang)}>{t.about.contentLink} <span aria-hidden="true">→</span></a>
          </aside>
        </section>

        <section id="deneme" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.offer.title}</h2>
              <p>{t.offer.lead}</p>
            </div>
          </div>
          <div className="offers">
            {offers.map((offer) => {
              const copy = t.offer[offer.id];
              return (
                <article key={offer.id} className={`offer o-${offer.id}`}>
                  <PlatformChips on={[offer.platform]} />
                  <h3>{copy.title}</h3>
                  <p className="offerTrial">{copy.trial}</p>
                  <ul>
                    {copy.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <StoreBadge
                    store={offer.store}
                    href={offer.store === 'microsoft' ? storeUrl : playUrl}
                    note={offer.store === 'microsoft' ? t.cta.trialStore : t.cta.trialPlay}
                    big
                  />
                </article>
              );
            })}
          </div>
          <p className="offerNote">{t.offer.note}</p>
        </section>

        <section id="sss" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>{t.faq.title}</h2>
              <p>{t.faq.lead}</p>
            </div>
          </div>
          <div className="faq">
            {t.faq.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {t.guides && (
          <section id="rehberler" className="section wrap">
            <div className="sectionHead">
              <div>
                <h2>{t.guides.title}</h2>
                <p>{t.guides.lead}</p>
              </div>
              {guides && <a className="textLink" href={guides}>{t.guides.all} <span aria-hidden="true">→</span></a>}
            </div>
            <div className="guideCards">
              {t.guides.items.map((guide) => (
                <a key={guide.href} className="guideCard" href={guide.href}>
                  <strong>{guide.title}</strong>
                  <span>{guide.body}</span>
                  <span className="mono guideArrow" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section id="iletisim" className="contact wrap">
          <img className="peek" src="/brand/alika-maskot.webp" alt="" aria-hidden="true" loading="lazy" />
          <p className="eyebrow mono">{t.contact.eyebrow}</p>
          <h2>{t.contact.title}</h2>
          <p className="contactLead">{t.contact.lead}</p>
          <CopyEmail t={t} />
        </section>
      </main>

      <ScreenDialog screen={openScreen} onClose={() => setOpenScreen(null)} lang={lang} t={t} />

      <footer className="foot">
        <div className="wrap footGrid">
          <div className="footBrand">
            <a className="brand" href={home} aria-label={t.a11y.home}>
              <img src="/brand/alika-logo.png" alt="" width="34" height="34" />
              <span>AliKa</span>
            </a>
            <p>{t.footer.tagline}</p>
          </div>
          <nav className="footCols" aria-label={t.a11y.footerMenu}>
            <div>
              <h3>{t.footer.product}</h3>
              <a href="#platformlar">{t.footer.platforms}</a>
              <a href="#kimler">{t.footer.audiences}</a>
              <a href="#ozellikler">{t.footer.features}</a>
              <a href="#nasil">{t.footer.how}</a>
              <a href="#deneme">{t.nav.offer}</a>
              <a href="#hakkimizda">{t.footer.about}</a>
            </div>
            <div>
              <h3>{t.footer.download}</h3>
              <a href={storeUrl} target="_blank" rel="noopener">Microsoft Store</a>
              <a href={playUrl} target="_blank" rel="noopener">Google Play</a>
            </div>
            <div>
              <h3>{t.footer.support}</h3>
              <a href="#sss">{t.footer.faq}</a>
              {guides && <a href={guides}>{t.footer.guides}</a>}
              {t.footer.schools && <a href="/okullar/">{t.footer.schools}</a>}
              <a href={contentPath(lang)}>{t.footer.content}</a>
              <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener">{t.footer.channel}</a>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{t.footer.email}</a>
            </div>
            <div>
              <h3>{t.footer.legal}</h3>
              <a href={legalPath(lang, 'privacy')}>{t.footer.privacy}</a>
              <a href={legalPath(lang, 'terms')}>{t.footer.terms}</a>
            </div>
          </nav>
        </div>
        <div className="wrap footBottom">
          <span>© 2026 ErenKa Software</span>
          <span className="mono">alika.tr</span>
        </div>
      </footer>

      <StickyCta device={device} t={t} storeUrl={storeUrl} playUrl={playUrl} />
    </>
  );
}
