import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { GUIDE_LANGUAGES, getPublishedGuideVideos } from '../data/video-guides';
import { microsoftStoreUrl } from '../store-campaign';

const SUPPORT_EMAIL = 'alika.destek@gmail.com';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alika.parental&hl=tr';

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
  id: string;
  label: string;
  platform: string;
  status: OrbitStatus;
  tone: string;
  side: 'left' | 'right';
  angle: number;
  icon: ReactNode;
  image: string;
  shape: 'wide' | 'phone';
  body: string;
  videoKey?: string;
}

const iconProps = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS = {
  panel: <svg {...iconProps}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M13 9h4M13 13h4" /></svg>,
  rules: <svg {...iconProps}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9.5 2.5h5" /></svg>,
  quiz: <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4" /><circle cx="12" cy="16.9" r=".6" fill="currentColor" /></svg>,
  homework: <svg {...iconProps}><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /><path d="m14.5 16 1.3 1.3 2.4-2.6" /></svg>,
  reports: <svg {...iconProps}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  child: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><circle cx="12" cy="10" r="2.4" /><path d="M9 15.5c.8-1.3 1.8-2 3-2s2.2.7 3 2" /></svg>,
  parent: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><path d="M12 7.5 9.5 8.6v2.2c0 1.8 1 3.3 2.5 3.9 1.5-.6 2.5-2.1 2.5-3.9V8.6Z" /></svg>,
  phoneQuiz: <svg {...iconProps}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><path d="M10.4 8.8a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1v.3" /><circle cx="12" cy="14.6" r=".5" fill="currentColor" /></svg>,
  tv: <svg {...iconProps}><rect x="2.5" y="4.5" width="19" height="13" rx="2.5" /><path d="M8 21h8M12 17.5V21" /></svg>,
  games: <svg {...iconProps}><path d="M7 7h10a5 5 0 0 1 4.8 6.4l-1 3.4a2.4 2.4 0 0 1-4 1L14.5 16h-5l-2.3 1.8a2.4 2.4 0 0 1-4-1l-1-3.4A5 5 0 0 1 7 7Z" /><path d="M8 10.5v3M6.5 12h3" /><circle cx="16" cy="11" r=".8" fill="currentColor" /><circle cx="17.5" cy="13.2" r=".8" fill="currentColor" /></svg>,
};

/* Sol kavis: bugün kullanılabilen Windows ekranları. Sağ kavis: geliştirilen ekranlar. Açılar yüzü ve gövdeyi boş bırakır. */
const SCREENS: ScreenItem[] = [
  { id: 'panel', label: 'Ebeveyn paneli', platform: 'Windows', status: 'ready', tone: 'blue', side: 'left', angle: 215, icon: ICONS.panel, image: '/screens/platform/windows-panel.png', shape: 'wide', videoKey: 'windows-panel', body: 'Günün özeti tek ekranda: kalan süre, bekleyen görevler ve aile durumu.' },
  { id: 'rules', label: 'Kurallar', platform: 'Windows', status: 'ready', tone: 'ink', side: 'left', angle: 197, icon: ICONS.rules, image: '/screens/platform/windows-rules.png', shape: 'wide', videoKey: 'windows-child-rules', body: 'Günlük süre, uygulama sınırları, uyku saati ve görevler. Çocuk ne zaman duracağını önceden bilir.' },
  { id: 'quiz', label: 'Soru çöz, süre kazan', platform: 'Windows', status: 'ready', tone: 'sun', side: 'left', angle: 180, icon: ICONS.quiz, image: '/videos/tr/07-windows-child-question.jpg', shape: 'wide', videoKey: 'windows-child-question', body: 'Kaç doğru cevabın bir dakika ettiğini ve günlük üst sınırı siz belirlersiniz; çocuk kalan adımı ekranda görür.' },
  { id: 'homework', label: 'Görev, ödev, sınav', platform: 'Windows', status: 'ready', tone: 'mint', side: 'left', angle: 163, icon: ICONS.homework, image: '/videos/tr/08-windows-task-homework-exam.jpg', shape: 'wide', videoKey: 'windows-task-homework-exam', body: 'Görev, ödev ve sınavları oluşturun; tamamlananları panelden onaylayın.' },
  { id: 'reports', label: 'Raporlar', platform: 'Windows', status: 'ready', tone: 'violet', side: 'left', angle: 145, icon: ICONS.reports, image: '/screens/platform/windows-reports.png', shape: 'wide', videoKey: 'windows-reports', body: 'Kullanım ve öğrenme sonuçları haftalık olarak bir arada. Pazarlık yerine konuşma.' },
  { id: 'child', label: 'Çocuk ekranı', platform: 'Android · kapalı alfa', status: 'dev', tone: 'sky', side: 'right', angle: -35, icon: ICONS.child, image: '/screens/platform/android-child.webp', shape: 'phone', body: 'Çocuk kalan süresini ve sıradaki adımı telefonunda görür. Kapalı alfa ekranıdır.' },
  { id: 'parent', label: 'Ebeveyn telefonu', platform: 'Android · kapalı alfa', status: 'dev', tone: 'blue', side: 'right', angle: -17, icon: ICONS.parent, image: '/screens/platform/android-parent.webp', shape: 'phone', body: 'Ebeveyn kuralları ve süre hediyesini telefondan yönetir. Kapalı alfa ekranıdır.' },
  { id: 'phone-quiz', label: 'Telefonda soru', platform: 'Android · kapalı alfa', status: 'dev', tone: 'sun', side: 'right', angle: 0, icon: ICONS.phoneQuiz, image: '/screens/platform/android-quiz.webp', shape: 'phone', body: 'Soru çözerek süre kazanma akışının telefon sürümü. Kapalı alfa ekranıdır.' },
  { id: 'tv', label: 'Android TV', platform: 'Android TV · geliştiriliyor', status: 'dev', tone: 'night', side: 'right', angle: 17, icon: ICONS.tv, image: '/screens/platform/tv-live-home.webp', shape: 'wide', body: 'TV ailenin ortak ekranı olur; telefonlar oyunlara katılımcı olarak bağlanır. Geliştirme önizlemesidir.' },
  { id: 'games', label: 'Aile oyunları', platform: 'Ortak ekran · geliştiriliyor', status: 'dev', tone: 'coral', side: 'right', angle: 35, icon: ICONS.games, image: '/games/alika-game-night.webp', shape: 'wide', body: 'Altı özgün Türkçe aile oyunu: gençler ve yetişkinler aynı ekranda oynar.' },
];

function findGuideVideo(key: string) {
  const turkish = GUIDE_LANGUAGES.find((language) => language.code === 'tr' && language.platform === 'windows');
  return turkish ? getPublishedGuideVideos(turkish).find((video) => video.key === key) : undefined;
}

function ScreenDialog({ screen, onClose }: { screen: ScreenItem | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (screen && !dialog.open) dialog.showModal();
    if (!screen && dialog.open) dialog.close();
  }, [screen]);

  const video = screen?.videoKey ? findGuideVideo(screen.videoKey) : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="screenDialog"
      aria-labelledby="screenDialogTitle"
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {screen && (
        <div className={`screenBody ${screen.shape}`}>
          <figure className="screenShot">
            <img src={screen.image} alt={`${screen.label} ekranı`} />
          </figure>
          <div className="screenText">
            <span className="tag plain"><StatusDot status={screen.status} />{screen.platform}</span>
            <h2 id="screenDialogTitle">{screen.label}</h2>
            <p>{screen.body}</p>
            <div className="screenActions">
              {video && (
                <a className="pill solid" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener">
                  Videoyu izle <span className="mono">{video.duration}</span>
                </a>
              )}
              <button type="button" className="pill ghost" onClick={onClose}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

interface Platform {
  id: string;
  tone: string;
  tags: string[];
  status: OrbitStatus;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  shape: 'wide' | 'phone';
  action?: { label: string; href: string; external?: boolean };
}

function platforms(storeUrl: string): Platform[] {
  return [
    {
      id: 'windows', tone: 'p-windows', status: 'ready', tags: ['Bugün kullanılabilir', 'Windows 10/11', 'Microsoft Store'],
      title: 'AliKa Windows',
      body: 'Süre, uygulama, uyku ve görev kuralları tek panelde. Çocuk ne zaman duracağını önceden görür; soru çözerek kazandığı ek süre sizin koyduğunuz kurala bağlıdır. Raporlar ve isteğe bağlı şifreli aile ağı dahil.',
      image: '/screens/platform/windows-panel.png', imageAlt: 'AliKa Windows ebeveyn paneli', shape: 'wide',
      action: { label: 'Microsoft Store’da edin', href: storeUrl, external: true },
    },
    {
      id: 'android', tone: 'p-android', status: 'dev', tags: ['Geliştiriliyor', 'Kapalı alfa', 'Telefon / tablet'],
      title: 'AliKa Android',
      body: 'Ebeveyn yönetir, çocuk ne yapacağını görür. Kapalı alfadaki ekranlar: ebeveyn paneli, çocuk görünümü ve soru çözme. Hazır olduğunda burada duyuracağız.',
      image: '/screens/platform/android-child.webp', imageAlt: 'AliKa Android çocuk ekranı, kapalı alfa', shape: 'phone',
      action: { label: 'Haber almak için yazın', href: `mailto:${SUPPORT_EMAIL}?subject=AliKa%20Android` },
    },
    {
      id: 'tv', tone: 'p-tv', status: 'dev', tags: ['Geliştiriliyor', 'Android TV'],
      title: 'Ortak ekran',
      body: 'TV ailenin ortak ekranına dönüşür: aile cihazları bir arada görünür, telefonlar oyunlara katılımcı olarak bağlanır. Bu ekranlar geliştirme aşamasındaki önizlemedir.',
      image: '/screens/platform/tv-live-home.webp', imageAlt: 'AliKa Android TV ana ekran önizlemesi', shape: 'wide',
    },
    {
      id: 'oyunlar', tone: 'p-games', status: 'dev', tags: ['Geliştiriliyor', '10–16 yaş ve yetişkinler'],
      title: 'Aile oyunları',
      body: 'Altı özgün Türkçe aile oyunu: Kelime Çarkı, Bilgi Arenası, Aile Sahnesi, Aile Kaçış Gecesi, Işık Laboratuvarı ve Robot Kodlama Arenası. Gençlerle yetişkinler aynı ekranda oynar.',
      image: '/games/alika-game-night.webp', imageAlt: 'AliKa aile oyun gecesi görseli', shape: 'wide',
    },
  ];
}

const STEPS = [
  { title: 'Kuralı birlikte koyun', body: 'Günlük süreyi, uygulamaları, uyku saatini ve görevleri siz belirlersiniz.' },
  { title: 'Plan görünür olur', body: 'Çocuk kalan süresini ve ne zaman duracağını önceden görür. Sürpriz kesinti olmaz.' },
  { title: 'Soru çöz, süre kazan', body: 'Kaç doğru cevabın bir dakika ettiğini ve günlük üst sınırı siz seçersiniz. Ek süre bu sınırı aşmaz.' },
  { title: 'Haftayı konuşun', body: 'Raporlar kullanımı ve öğrenmeyi birlikte gösterir. Pazarlık yerine konuşma.' },
];

const AGES = [
  { range: '5–7', title: 'Önce güven, sonra merak.', body: 'Büyük görseller, tek adımlı yönlendirme ve şefkatli geri bildirim.' },
  { range: '8–11', title: 'Merakı alışkanlığa dönüştür.', body: 'Kısa açıklamalar, görünür ilerleme ve dengeli maskot desteği.' },
  { range: '12–14', title: 'Hedefini gör, ilerlemeni yönet.', body: 'Daha sade görünüm, haftalık hedefler ve öz yönetim desteği.' },
  { range: '15–18', title: 'Sade, ciddi ve veri odaklı.', body: 'Maskotsuz, sonuç odaklı ve gencin alanına saygılı deneyim.' },
];

function StatusDot({ status }: { status: OrbitStatus }) {
  return <i className={`dot ${status}`} aria-hidden="true" />;
}

/* Platform kartları: geniş ekranda dikey kaydırma yatay kaydırmaya dönüşür, dar ekranda kaydırmalı şerit olur. */
function PlatformRail({ items }: { items: Platform[] }) {
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
            <h2>Platformlar</h2>
            <p>Windows bugün hazır. Telefon, TV ve aile oyunları geliştiriliyor.</p>
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
                    {item.tags.map((tag, t) => (
                      <span key={tag} className="tag">{t === 0 && <StatusDot status={item.status} />}{tag}</span>
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
                <figure className={`pcardShot ${item.shape}`}>
                  <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Guides() {
  const turkish = GUIDE_LANGUAGES.find((language) => language.code === 'tr' && language.platform === 'windows');
  const videos = turkish ? getPublishedGuideVideos(turkish) : [];
  const [showAll, setShowAll] = useState(false);
  if (!videos.length) return null;
  const visible = showAll ? videos : videos.slice(0, 6);

  return (
    <section id="rehberler" className="section wrap">
      <div className="sectionHead">
        <div>
          <h2>Video rehberler</h2>
          <p>Kurulumdan raporlara, AliKa Windows’u adım adım gösteren {videos.length} kısa video.</p>
        </div>
        {videos.length > 6 && (
          <button type="button" className="textLink" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
            {showAll ? 'Daha az göster' : `${videos.length} videonun hepsini göster`}
          </button>
        )}
      </div>
      <div className="videoGrid">
        {visible.map((video) => (
          <a key={video.key} className="video" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener">
            <span className="videoThumb">
              <img src={video.poster} alt="" loading="lazy" decoding="async" />
              <span className="mono videoTime">{video.duration}</span>
              <span className="play" aria-hidden="true">▶</span>
            </span>
            <span className="videoTitle">{video.title}</span>
            <span className="mono videoEyebrow">{video.eyebrow}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function CopyEmail() {
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
      <button type="button" className="pill ghost" onClick={copy} aria-live="polite">{copied ? 'Kopyalandı' : 'Kopyala'}</button>
    </div>
  );
}

export default function Home() {
  const [theme, toggleTheme] = useTheme();
  const [openScreen, setOpenScreen] = useState<ScreenItem | null>(null);
  const storeUrl = microsoftStoreUrl('tr');
  const videoCount = (() => {
    const turkish = GUIDE_LANGUAGES.find((language) => language.code === 'tr' && language.platform === 'windows');
    return turkish ? getPublishedGuideVideos(turkish).length : 0;
  })();

  return (
    <>
      <a className="skip" href="#icerik">İçeriğe geç</a>
      <header className="top">
        <a className="brand" href="/" aria-label="AliKa ana sayfa">
          <img src="/brand/alika-logo.png" alt="" width="34" height="34" />
          <span>AliKa</span>
        </a>
        <nav className="topNav" aria-label="Ana menü">
          <a href="#rehberler">Rehberler</a>
          <a href="/privacy/">Gizlilik</a>
          <button type="button" className="iconBtn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}>
            {theme === 'dark'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>}
          </button>
          <div className="storeBtns">
            <a className="storeBtn" href={storeUrl} target="_blank" rel="noopener" aria-label="Microsoft Store’dan indir (Windows)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" /></svg>
              <span className="storeText"><small>Windows için</small>Microsoft Store</span>
            </a>
            <a className="storeBtn" href={PLAY_STORE_URL} target="_blank" rel="noopener" aria-label="Google Play’den indir (Android)">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 2.8v18.4c0 .5.5.8.9.6l15.4-8.7c.5-.3.5-1 0-1.3L5.4 2.2c-.4-.2-.9.1-.9.6Z" fill="currentColor" /><path d="m4.8 2.4 10.4 10.4M4.8 21.6l10.4-10.4" stroke="var(--store-bg)" strokeWidth="1.4" /></svg>
              <span className="storeText"><small>Android için</small>Google Play</span>
            </a>
          </div>
        </nav>
      </header>

      <main id="icerik">
        <section className="hero">
          <a className="corner c-tl" href="#nasil">Nasıl çalışır</a>
          <a className="corner c-tr" href="#platformlar">Platformlar</a>
          <a className="corner c-bl" href="#guven">Güven</a>
          <a className="corner c-br" href="#iletisim">İletişim</a>

          <div className="stage">
            <div className="glow" aria-hidden="true" />
            <div className="ring" aria-hidden="true" />
            <HalftoneHalo />
            <div className="orbitPath" aria-hidden="true" />
            <img className="mascot" src="/brand/alika-maskot.webp" alt="AliKa maskotu: siyah-beyaz ceketli, sarı tişörtlü gülümseyen çocuk" width="470" height="1100" />
            {SCREENS.map((screen, i) => (
              <button
                key={screen.id}
                type="button"
                className={`orbit ${screen.side}`}
                style={{ '--a': `${screen.angle}deg`, '--i': i } as CSSProperties}
                onClick={() => setOpenScreen(screen)}
                aria-label={`${screen.label}: ekran görüntüsünü aç (${screen.platform})`}
              >
                <span className={`tile t-${screen.tone}`}>{screen.icon}<StatusDot status={screen.status} /></span>
                <span className="orbitLabel" aria-hidden="true">{screen.label}</span>
              </button>
            ))}
          </div>

          <h1 className="wordmark" aria-label="AliKa">
            <span aria-hidden="true">Ali</span>
            <span className="ka" aria-hidden="true"><span>K</span><span>a</span></span>
          </h1>
          <p className="tagline">Kısıtlamıyoruz. <em>Planlıyoruz.</em></p>
          <a className="eventPill" href={storeUrl} target="_blank" rel="noopener">
            <StatusDot status="ready" />
            <span>Windows 10/11 · Microsoft Store’da</span>
            <span className="mono">7 gün ücretsiz</span>
          </a>
          <a className="scrollCue" href="#tanitim" aria-label="Aşağı kaydır">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 9 7 7 7-7" /></svg>
          </a>
        </section>

        <section id="tanitim" className="intro wrap">
          <p className="eyebrow mono">Ebeveyn kontrolü · Öğrenme · Aile zamanı</p>
          <p className="introLead">
            Çocuğunuz ekrandan uzaklaşmıyorsa, bırakın ekran onu öğrenmeye yaklaştırsın. AliKa ekran süresini
            sizin koyduğunuz kurallarla planlar; çocuk <mark>soru çözerek</mark>, sizin belirlediğiniz sınır içinde ek süre kazanır.
          </p>
          <div className="actions">
            <a className="pill solid" href={storeUrl} target="_blank" rel="noopener">Microsoft Store’da edin <span aria-hidden="true">↗</span></a>
            <a className="pill ghost" href="#rehberler">Rehberleri izle</a>
          </div>
          <dl className="stats">
            <div><dt>5–18</dt><dd>yaş için dört ayrı anlatım</dd></div>
            {videoCount > 0 && <div><dt>{videoCount}</dt><dd>Türkçe video rehber</dd></div>}
            <div><dt>0</dt><dd>reklam ve izleyici</dd></div>
            <div><dt>7 gün</dt><dd>ücretsiz deneme</dd></div>
          </dl>
        </section>

        <PlatformRail items={platforms(storeUrl)} />

        <section id="nasil" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>Nasıl çalışır?</h2>
              <p>Ebeveynin kuralından çocuğun kazandığı süreye, sıradan bir gün dört adımda.</p>
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="stepNum" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="yas" className="section wrap">
          <div className="sectionHead">
            <div>
              <h2>Aynı AliKa, yaşa göre farklı anlatım</h2>
              <p>Dil, görünüm, maskot ve kutlama dozu çocuğun yaşına göre değişir.</p>
            </div>
          </div>
          <div className="ages">
            {AGES.map((age, i) => (
              <article key={age.range} className={`age a${i + 1}`}>
                <span className="ageRange">{age.range}<small>yaş</small></span>
                <h3>{age.title}</h3>
                <p>{age.body}</p>
              </article>
            ))}
          </div>
        </section>

        <Guides />

        <section id="guven" className="trust">
          <div className="wrap trustInner">
            <p className="eyebrow mono">Güven</p>
            <h2>Ailenizin verisi, ailenizde kalır.</h2>
            <ul className="trustList">
              <li><strong>Reklam yok</strong><span>Çocuğunuzun ekranında satış yapılmaz.</span></li>
              <li><strong>İzleyici yok</strong><span>Ürün telemetrisi ve üçüncü taraf takip yok.</span></li>
              <li><strong>Bulut hesabı yok</strong><span>Temel veriler cihazda kalır. Aile cihazları arasında isteğe bağlı, şifreli ev ağı.</span></li>
            </ul>
            <a className="textLink onDark" href="/privacy/">Gizlilik politikasını okuyun →</a>
          </div>
        </section>

        <section id="iletisim" className="contact wrap">
          <img className="peek" src="/brand/alika-maskot.webp" alt="" aria-hidden="true" loading="lazy" />
          <p className="eyebrow mono">İletişim</p>
          <h2>Birlikte geliştirelim.</h2>
          <p className="contactLead">Hata bildirimi, geliştirme fikri ya da eleştiri için en hızlı yol e-posta.</p>
          <CopyEmail />
          <div className="links">
            <a href={storeUrl} target="_blank" rel="noopener"><span>Microsoft Store</span><small>AliKa Windows</small></a>
            <a href="#rehberler"><span>Video rehberler</span><small>Türkçe</small></a>
            <a href="/privacy/"><span>Gizlilik</span><small>/privacy</small></a>
            <a href="/eula/"><span>Kullanım koşulları</span><small>/eula</small></a>
          </div>
        </section>
      </main>

      <ScreenDialog screen={openScreen} onClose={() => setOpenScreen(null)} />

      <footer className="foot wrap">
        <span>© 2026 ErenKa Software</span>
        <span className="mono">alika.tr</span>
      </footer>
    </>
  );
}
