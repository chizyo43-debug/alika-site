from __future__ import annotations

import html
import json
import os
import re
import shutil
import stat
from pathlib import Path
from urllib.parse import quote

from content_catalog import build_content_catalog


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / "dist"
PUBLIC = ROOT / "public"
# Paylaşım görseli: üzerindeki yazı Türkçe; alt metin sayfanın dilinde.
OG_IMAGE_ALT = {
    "tr": "AliKa logosu, “Kısıtlamıyoruz. Planlıyoruz.” sloganı ve gülümseyen AliKa maskotu. Windows ve Android; Microsoft Store ve Google Play.",
    "en": "AliKa logo, the Turkish slogan “We don’t restrict. We plan.” and the smiling AliKa mascot. Windows and Android; Microsoft Store and Google Play.",
}
BASE_URL = "https://www.alika.tr"
LANGS = ("tr", "en", "de", "es", "fr", "pt", "ru", "ja", "ko")
LANGUAGE_FLAGS = {
    "tr": "🇹🇷", "en": "🇬🇧", "de": "🇩🇪", "es": "🇪🇸", "fr": "🇫🇷",
    "pt": "🇵🇹", "ru": "🇷🇺", "ja": "🇯🇵", "ko": "🇰🇷",
}
CONTENT_LIBRARY_LABELS = {
    "tr": ("Ülke", "Sınıf", "Tüm dersleri indir", "Dersi indir", "konu anlatımı", "soru", "Yapay zekâ ile hazırlandı · Otomatik kontrol edildi", "{}. sınıf", "ZIP'i çıkarmayın. AliKa'da İçerik ekle'yi açıp sınıf ZIP dosyasını doğrudan seçin veya ZIP'i hazır klasöre koyup Hazır klasörü tara'yı kullanın."),
    "en": ("Country", "Grade", "Download all subjects", "Download subject", "lessons", "questions", "Prepared with AI · Automatically checked", "Grade {}", "Do not extract the ZIP. Select the class ZIP directly from Add content in AliKa, or place it in the prepared folder and scan it."),
    "de": ("Land", "Klasse", "Alle Fächer herunterladen", "Fach herunterladen", "Lektionen", "Fragen", "Mit KI erstellt · Automatisch geprüft", "Klasse {}", "ZIP nicht entpacken. Wählen Sie die Klassen-ZIP direkt über Inhalte hinzufügen in AliKa oder legen Sie sie im vorbereiteten Ordner ab und starten Sie den Scan."),
    "es": ("País", "Curso", "Descargar todas las asignaturas", "Descargar asignatura", "lecciones", "preguntas", "Preparado con IA · Revisado automáticamente", "Curso {}", "No extraiga el ZIP. Seleccione directamente el ZIP del curso en Añadir contenido de AliKa o colóquelo en la carpeta preparada y analícela."),
    "fr": ("Pays", "Niveau", "Télécharger toutes les matières", "Télécharger la matière", "leçons", "questions", "Préparé avec l’IA · Vérifié automatiquement", "Niveau {}", "Ne décompressez pas le ZIP. Sélectionnez-le directement dans Ajouter du contenu d’AliKa ou placez-le dans le dossier préparé puis lancez l’analyse."),
    "pt": ("País", "Ano", "Transferir todas as disciplinas", "Transferir disciplina", "lições", "perguntas", "Preparado com IA · Verificado automaticamente", "Ano {}", "Não extraia o ZIP. Selecione o ZIP do ano diretamente em Adicionar conteúdo no AliKa ou coloque-o na pasta preparada e faça a leitura."),
    "ru": ("Страна", "Класс", "Скачать все предметы", "Скачать предмет", "уроков", "вопросов", "Подготовлено с помощью ИИ · Проверено автоматически", "Класс {}", "Не распаковывайте ZIP. Выберите архив класса через Добавить материалы в AliKa или поместите его в подготовленную папку и запустите сканирование."),
    "ja": ("国", "学年", "全教科をダウンロード", "教科をダウンロード", "レッスン", "問題", "AIで作成・自動チェック済み", "{}年生", "ZIPは展開せず、AliKaの「コンテンツを追加」から学年ZIPを直接選ぶか、準備済みフォルダーに置いてスキャンしてください。"),
    "ko": ("국가", "학년", "모든 과목 다운로드", "과목 다운로드", "수업", "문제", "AI로 작성 · 자동 검사 완료", "{}학년", "ZIP을 풀지 마세요. AliKa의 콘텐츠 추가에서 학년 ZIP을 직접 선택하거나 준비 폴더에 넣고 스캔하세요."),
}
QUESTION_BANK_LABELS = {
    "tr": ("Sınıf başına karma soru bankaları", "Her sınıfın yayımlanabilir bütün derslerini kapsayan, ders paketlerinden soru kopyalamadan ayrıca üretilmiş tam 2.000 soruluk bankalar.", "Soru bankasını indir", "benzersiz soru"),
    "en": ("Mixed question banks by grade", "Exactly 2,000 separately authored questions covering every publishable subject in each grade, without copying subject-package questions.", "Download question bank", "unique questions"),
    "de": ("Gemischte Fragenbanken je Klasse", "Genau 2.000 separat erstellte Fragen zu allen veröffentlichten Fächern jeder Klasse, ohne Fragen aus Fachpaketen zu kopieren.", "Fragenbank herunterladen", "einzigartige Fragen"),
    "es": ("Bancos mixtos por curso", "Exactamente 2.000 preguntas creadas por separado para todas las asignaturas publicadas de cada curso, sin copiar los paquetes de asignaturas.", "Descargar banco de preguntas", "preguntas únicas"),
    "fr": ("Banques mixtes par classe", "Exactement 2 000 questions créées séparément pour toutes les matières publiées de chaque classe, sans copier les packs de matière.", "Télécharger la banque", "questions uniques"),
    "pt": ("Bancos mistos por ano", "Exatamente 2.000 perguntas criadas separadamente para todas as disciplinas publicadas de cada ano, sem copiar os pacotes de disciplinas.", "Transferir banco de perguntas", "perguntas únicas"),
    "ru": ("Смешанные банки по классам", "Ровно 2 000 отдельно созданных вопросов по всем опубликованным предметам каждого класса, без копирования заданий из предметных пакетов.", "Скачать банк вопросов", "уникальных вопросов"),
    "ja": ("学年別・教科横断問題バンク", "各学年の公開対象全教科を網羅する独自作成の2,000問です。教科パッケージの問題は複製していません。", "問題バンクをダウンロード", "独自問題"),
    "ko": ("학년별 혼합 문제은행", "각 학년의 공개 가능한 모든 과목을 다루는 별도 제작 2,000문항이며, 과목 패키지의 문항을 복사하지 않습니다.", "문제은행 다운로드", "고유 문항"),
}
# Sitede yayımlanan kapsam (tools/content_catalog.py PUBLISHED_GRADES ile aynı): hazır / plan aşamasında / ders sözcüğü.
CONTENT_SCOPE_LABELS = {
    "tr": ("Şu an hazır:", "Türkiye ortaokul müfredatı (5–8. sınıf) için konu anlatımları, sorular ve sınıf başına soru bankası.", "Plan aşamasında:", "İlkokul ve lise sınıfları ile diğer ülkelerin müfredatları.", "ders"),
    "en": ("Available now:", "Topic explanations, questions and a question bank per grade for the Turkish middle-school curriculum (grades 5–8, in Turkish).", "In the planning stage:", "Primary and high-school grades and other countries’ curricula.", "subjects"),
    "de": ("Jetzt verfügbar:", "Themenerklärungen, Fragen und eine Fragenbank pro Klasse für den türkischen Lehrplan der Mittelstufe (Klassen 5–8, auf Türkisch).", "In Planung:", "Grundschul- und Oberstufenklassen sowie Lehrpläne anderer Länder.", "Fächer"),
    "es": ("Disponible ahora:", "Explicaciones de temas, preguntas y un banco de preguntas por curso del plan de estudios turco de secundaria inferior (5.º a 8.º curso, en turco).", "En fase de planificación:", "Cursos de primaria y bachillerato y planes de estudios de otros países.", "asignaturas"),
    "fr": ("Disponible maintenant :", "Explications de cours, questions et une banque de questions par classe pour le programme turc du collège (classes 5 à 8, en turc).", "En phase de planification :", "Le primaire, le lycée et les programmes d’autres pays.", "matières"),
    "pt": ("Disponível agora:", "Explicações de temas, perguntas e um banco de perguntas por ano para o currículo turco do 5.º ao 8.º ano (em turco).", "Em fase de planeamento:", "O 1.º ciclo, o ensino secundário e os currículos de outros países.", "disciplinas"),
    "ru": ("Сейчас доступно:", "Объяснения тем, вопросы и банк вопросов для каждого класса по турецкой программе средней школы (5–8 классы, на турецком языке).", "На этапе планирования:", "Начальная и старшая школа и программы других стран.", "предметов"),
    "ja": ("現在提供中：", "トルコの中学校課程（5〜8年生、トルコ語）の単元解説、問題、学年別問題バンク。", "計画段階：", "小学校・高校の学年と、ほかの国のカリキュラム。", "教科"),
    "ko": ("현재 제공:", "튀르키예 중학교 과정(5~8학년, 튀르키예어)의 단원 설명, 문제, 학년별 문제은행.", "계획 단계:", "초등학교·고등학교 학년과 다른 나라 교육과정.", "과목"),
}
# İçerik sayfasının altındaki kalite notu (her dilde; katalog JSON alanı makine içindir).
CONTENT_QUALITY_NOTES = {
    "tr": "İçerik yapay zekâ ile hazırlandı ve otomatik kontrollerden geçti; insan incelemesinden geçtiği iddia edilmez. Hata görürseniz bize yazın.",
    "en": "Content was prepared with AI and passed automated checks; it is not claimed to be human-reviewed. If you spot a mistake, tell us.",
    "de": "Die Inhalte wurden mit KI erstellt und automatisch geprüft; eine menschliche Prüfung wird nicht behauptet. Fehler gefunden? Schreiben Sie uns.",
    "es": "El contenido se preparó con IA y pasó comprobaciones automáticas; no se afirma que lo haya revisado una persona. Si ve un error, escríbanos.",
    "fr": "Les contenus ont été préparés avec l’IA et vérifiés automatiquement ; aucune relecture humaine n’est revendiquée. Une erreur ? Écrivez-nous.",
    "pt": "O conteúdo foi preparado com IA e passou por verificações automáticas; não se afirma revisão humana. Encontrou um erro? Escreva-nos.",
    "ru": "Материалы подготовлены с помощью ИИ и прошли автоматическую проверку; проверка человеком не заявляется. Нашли ошибку? Напишите нам.",
    "ja": "教材はAIで作成し、自動チェックを通過しています。人による確認済みとはしていません。誤りを見つけたらお知らせください。",
    "ko": "콘텐츠는 AI로 작성되었고 자동 검사를 통과했습니다. 사람이 검토했다고 주장하지 않습니다. 오류를 발견하면 알려주세요.",
}
THOUSANDS_SEPARATORS = {"tr": ".", "de": ".", "es": ".", "pt": ".", "fr": "\u202f", "ru": "\u00a0"}
CONTENT_BOOK_LABELS = {
    "tr": ("AliKa kitabına dön", "Hazır içerik defteri", "Ülke", "Sınıf paketi", "Ders paketi", "Hata, geliştirme fikri veya eleştiriniz mi var? Bize yazın."),
    "en": ("Back to the AliKa book", "Ready content ledger", "Countries", "Grade packs", "Subject packs", "Found an issue or have an idea? Tell us."),
    "de": ("Zurück zum AliKa-Buch", "Heft mit fertigen Inhalten", "Länder", "Klassenpakete", "Fachpakete", "Fehler oder Idee? Schreiben Sie uns."),
    "es": ("Volver al libro de AliKa", "Cuaderno de contenido preparado", "Países", "Paquetes por curso", "Paquetes por asignatura", "¿Ha encontrado un error o tiene una idea? Escríbanos."),
    "fr": ("Retour au livre AliKa", "Cahier de contenus prêts", "Pays", "Packs par niveau", "Packs par matière", "Une erreur ou une idée ? Écrivez-nous."),
    "pt": ("Voltar ao livro AliKa", "Caderno de conteúdos prontos", "Países", "Pacotes por ano", "Pacotes por disciplina", "Encontrou um erro ou tem uma ideia? Escreva-nos."),
    "ru": ("Вернуться к книге AliKa", "Каталог готовых материалов", "Страны", "Пакеты классов", "Пакеты предметов", "Нашли ошибку или есть идея? Напишите нам."),
    "ja": ("AliKaブックに戻る", "すぐ使える教材ノート", "国", "学年パック", "教科パック", "不具合や改善案がありましたらお知らせください。"),
    "ko": ("AliKa 책으로 돌아가기", "준비된 콘텐츠 노트", "국가", "학년 패키지", "과목 패키지", "오류나 개선 아이디어가 있나요? 알려주세요."),
}
MICROSOFT_STORE_BASE_URL = "https://apps.microsoft.com/detail/9N3P9F5ZKR5S"
PLAY_STORE_BASE_URL = "https://play.google.com/store/apps/details?id=com.alika.parental"
STORE_MARKETS = {
    "tr": {"cid": "site_home_tr", "price": "80.00", "currency": "TRY"},
    "ja": {"cid": "site_home_ja", "price": "230", "currency": "JPY"},
    "ko": {"cid": "site_home_ko", "price": "2500", "currency": "KRW"},
}
# Alt sayfaların menüsü ve altlığı yeni ana sayfanın dil dosyalarından okunur (src/home/i18n/{lang}.ts).
HOME_I18N = SRC / "home" / "i18n"
# Ana sayfadaki GUIDE_PATHS ile aynı: yalnız gerçekten var olan rehberler.
GUIDE_LINKS = {"tr": "/rehber/", "en": "/en/guides/windows-child-screen-time/"}
# Yasal metinler: Türkçe sayfalar Türkçe sürüme, diğer diller İngilizceye bağlanır.
LEGAL_TR = {"gizlilik": "gizlilik", "kullanim-kosullari": "kullanim-kosullari"}
GUIDE_BASE = "rehber"
UK_GUIDE_PATH = "en/guides/windows-child-screen-time"
UK_LANDING_PATH = "en/uk-windows-screen-time"
UK_CAMPAIGN_ID = "community_guide_windows_uk_v1"
# Eski alt sayfalar yeni ana sayfanın bölümlerine yönlenir; yalnız içerik kataloğu ayrı sayfa kalır.
REDIRECT_ANCHORS = {
    "how-it-works": "nasil",
    "ecosystem": "platformlar",
    "features": "ozellikler",
    "age-groups": "yas",
    "updates": "platformlar",
    "roadmap": "plan",
    "downloads": "platformlar",
    "contact": "iletisim",
}

GUIDES = (
    {
        "slug": "windows-cocuk-ekran-suresi-nasil-yonetilir",
        "title": "Windows'ta Çocuk Ekran Süresi Nasıl Yönetilir?",
        "description": "Windows 10 ve 11'de çocuk ekran süresi için aile kuralı oluşturun; Microsoft Family Safety seçeneklerini ve AliKa'nın görünür, yerel-öncelikli akışını karşılaştırın.",
        "video": "windows-ebeveyn-paneli",
        "video_label": "AliKa Windows ebeveyn paneli · 2:36",
        "campaign_id": "organic_guide_windows_tr",
        "lede": (
            "Windows'ta ekran süresi yönetimi yalnız bir süre sayısı girmek değildir. "
            "Aile kuralının önceden konuşulması, çocuğun kuralı görebilmesi ve istisnaların açıkça açıklanmasıyla daha anlaşılır bir düzen kurulabilir."
        ),
        "sections": (
            ("Önce aile kuralını yazın", (
                "Başlangıç için günlük toplam süreyi, uyku saatini ve okul günü ile hafta sonu arasındaki farkı birlikte belirleyin. Kuralın amacı ceza vermek değil, bilgisayar kullanımına herkesin anlayacağı bir çerçeve koymaktır.",
                "İlk hafta tek bir toplam süre ve tek bir uyku aralığıyla başlayın. Kuralı değiştireceğiniz zamanı da baştan söyleyin; böylece çocuk, değişikliğin gizlice yapıldığını düşünmez.",
            )),
            ("Microsoft Family Safety ile neler yapılabilir?", (
                "Microsoft Family Safety, Microsoft aile grubunda ekran süresi, uygulama ve oyun sınırları ile web ve arama filtreleri gibi yerleşik seçenekler sunar. Microsoft hesabı, aile grubu ve seçtiğiniz özelliğe göre desteklenen cihaz veya tarayıcı gerekebilir.",
                "Yerleşik araç sizin aile düzeninize uygunsa onu kullanmak makul bir başlangıçtır. Ayarları çocukla gözden geçirin; özellikle web filtresi ve uygulama sınırlarının hangi cihazlarda geçerli olduğunu Microsoft'un güncel yardım sayfalarından doğrulayın.",
            )),
            ("AliKa hangi ihtiyaca odaklanır?", (
                "AliKa, Microsoft'un yerleşik çözümünün yerine geçme iddiasında değildir. Windows 10/11'de ebeveynin belirlediği kuralları çocuk ekranında görünür kılmaya, kontrolü rızaya dayalı ve açık tutmaya odaklanır.",
                "Temel kullanım kayıtları cihazda işlenir; yaklaşım yerel-önceliklidir. Aile kuralını kurmadan önce çocuğa hangi bilginin görüleceğini, neyin görülmeyeceğini ve itirazını nasıl dile getirebileceğini anlatın.",
            )),
            ("Süre sınırı ile öğrenme akışını ayırın", (
                "AliKa'da ebeveyn günlük süreyi, uygulama veya web kurallarını kendi aile düzenine göre belirler. Süre bittiğinde çocuk, uygulanmış kuralı ve sonraki adımı görünür biçimde görür; gizli izleme yaklaşımı kullanılmaz.",
                "İsterseniz ebeveynin onayladığı soru bankasında bir akış tanımlanabilir: çocuk soruyu yanıtlar; yanlış yanıtta konu anlatımı veya açıklama gösterilir, soru daha sonra tekrar gelir ve doğru yanıtlar ebeveynin belirlediği kurala göre kontrollü ek süreye dönüşür. Günlük kazanım sınırını da ebeveyn belirler.",
            )),
            ("İlk hafta için kısa kontrol listesi", (
                "İlk kuralın doğru saatte çalıştığını, çocuk ekranındaki kalan sürenin anlaşılır olduğunu ve uyku aralığının aile düzenine uyduğunu kontrol edin. Beklenmeyen bir engel görürseniz önce kuralı birlikte inceleyin.",
                "Bir haftanın sonunda yalnız süre toplamına bakmak yerine, kuralın anlaşılır olup olmadığını yetişkin ve çocuk açısından konuşun. Gerekirse tek bir ayarı değiştirip yeniden deneyin.",
            )),
        ),
    },
    {
        "slug": "windows-11-cocuk-ekran-suresi",
        "campaign_id": "site_rehber_windows11_tr",
        "title": "Windows 11’de Çocuk Ekran Süresi Nasıl Sınırlandırılır?",
        "description": "Windows 11’de günlük süre, uygulama ve web sitesi limitlerini görünür kurallarla ayarlayın. AliKa ebeveyn panelini adım adım inceleyin.",
        "video": "windows-ilk-kurulum",
        "video_label": "AliKa Windows ilk kurulum · 1:35",
        "lede": (
            "Ekran süresi tartışması çoğu zaman “şimdi kapat” cümlesi söylendiğinde başlar. "
            "Daha sakin bir düzen için sınırın önceden belirlenmesi, çocuğun kalan süreyi görebilmesi "
            "ve kilidin nedenini açıkça anlaması gerekir."
        ),
        "sections": (
            ("Windows 11’de önce aile kuralını netleştirin", (
                "Uygulamayı açmadan önce günlük toplam süreyi, uyku aralığını ve hangi uygulamaların ayrıca sınırlandırılacağını çocukla konuşun. AliKa gizli izleme için değil, önceden bilinen aile kurallarını görünür kılmak için tasarlanmıştır.",
                "İlk hafta çok sayıda kural yerine tek bir günlük limit ve bir uyku aralığıyla başlayın. Çocuğun kalan süreyi ve kuralın nedenini anlayıp anlamadığını gözleyin.",
            )),
            ("Günlük ve haftalık ekran süresi nasıl ayarlanır?", (
                "Ebeveyn panelinde her çocuk için günlük toplam dakika belirlenebilir. Haftanın yedi gününe ayrı süre yazılabilir; 0 değeri sınır olmadığı anlamına gelir.",
                "Hafta içi ve hafta sonu düzeniniz farklıysa günleri tek tek ayarlayın. Değişikliği kaydettikten sonra çocuk ekranında kalan sürenin doğru göründüğünü kontrol edin.",
            )),
            ("Uygulama limiti ile tam engel arasındaki fark", (
                "Bir uygulamaya günlük dakika vermek, o uygulamayı tamamen engellemekten farklıdır. Limit dolunca kullanım durur; tam engelde uygulama izin verilene kadar açılamaz.",
                "Önce süre limitiyle başlayın. Tam engeli yalnız aile kuralınız gerçekten bunu gerektiriyorsa kullanın ve nedenini çocuğa açıkça anlatın.",
            )),
            ("Web sitesi süre limiti ve web filtresi aynı şey değildir", (
                "Site süre limiti belirli bir alan adına günlük dakika verir. Süre dolduğunda alan adı gün sonuna kadar engellenir. Web filtresi ise kalıcı engel listesi ve güvenli arama kurallarını yönetir.",
                "Windows, web kuralının uygulanması için yönetici onayı isteyebilir. Yalnız ihtiyacınız olan özelliği açın; gereksiz filtre eklemeyin.",
            )),
            ("Uyku saatini ve geçici ebeveyn iznini ayarlama", (
                "Uyku aralığı gece yarısını geçebilir. Örneğin 21.00–07.00 aralığı tek kural olarak tanımlanabilir.",
                "İstisnai bir durumda geçici izin verirseniz bunun günlük aile kuralını kalıcı olarak değiştirmediğini çocuğa söyleyin.",
            )),
            ("Çocuk süre dolduğunda ne görür?", (
                "AliKa süre dolduğunda görünür bir kilit ekranı gösterir. Çocuk hangi kuralın uygulandığını ve sonraki adımın ne olduğunu görür; engel gizlice çalışmaz.",
                "Kilit metnini ilk kurulumda birlikte inceleyin. Çocuğun ne zaman yeniden kullanabileceğini kendi cümlesiyle anlatabilmesi iyi bir açıklık kontrolüdür.",
            )),
            ("İlk 7 günde kontrol edilmesi gerekenler", (
                "Kurulumun tamamlandığını, ilk kuralın doğru saatte çalıştığını, çocuk ekranındaki kalan sürenin anlaşılır olduğunu ve uyku aralığının aile düzeninize uyduğunu kontrol edin.",
                "Beklenmeyen bir engel veya lisans sorunu görürseniz destek@alika.tr adresine bildirin.",
            )),
        ),
    },
    {
        "slug": "soru-cozerek-ekran-suresi-kazanma",
        "campaign_id": "site_rehber_soru_coz_tr",
        "android_note": (
            "Soru çözerek süre kazanma Android telefon ve tablette de aynı kuralla çalışır: ebeveyn bir dakika için gereken doğru cevap sayısını ve günlük kazanım tavanını belirler, yanlış cevap süre kazandırmaz; ebeveyn isterse belirli sayıda yanlışta süreden düşüm de uygulanır. Sorular tek tek ya da CSV, TXT ve Excel dosyasıyla eklenebilir.",
            "Bu rehberdeki ayrıntılar Windows sürümünden alınmıştır; Android’de ekranlar ve bazı ayrıntılar farklı olabilir. Android aile aboneliği Google Play’de 14 gün ücretsiz denemeyle başlar; Windows satın alımı Android’i kapsamaz.",
        ),
        "title": "Soru Çözerek Ekran Süresi Kazanma: AliKa Nasıl Çalışır?",
        "description": "Çocuğun soru çözerek kontrollü ek süre kazanmasını; soru bankası, ödül oranı ve günlük tavan ayarlarıyla adım adım öğrenin.",
        "video": "alika-reklam",
        "video_label": "Bilgisayarda da, telefonda da · 0:44",
        "lede": (
            "Ekran süresini yalnızca kesmek yerine bir kısmını öğrenmeyle ilişkilendirmek mümkün. "
            "AliKa’da çocuk, ebeveynin eklediği soru bankasından sorular çözer; doğru cevaplar "
            "ebeveynin belirlediği orana göre kontrollü ek süreye dönüşür."
        ),
        "sections": (
            ("Sorular nereden gelir?", (
                "Sorular ebeveynin ekleyip kullanıma açtığı bankadan gelir. Ebeveyn isterse ayrıca otomatik matematik sorularını açabilir; bu seçenek başlangıçta kapalıdır. Hazır ödev veya çocuğa kendiliğinden gönderilen sınırsız içerik iddiası yoktur.",
                "Soruları tek tek ekleyebilir veya CSV/XLSX soru bankası içe aktarabilirsiniz. Türkiye ortaokul (5–8. sınıf) için hazır konu anlatımı ve soru paketleri alika.tr’deki Hazır içerik sayfasındadır; bunlar da ancak ebeveyn içe aktarınca kullanılır. PDF ve EPUB dosyaları ise Kütüphane belgesi olarak kullanılır; soru bankasıyla aynı şey değildir.",
            )),
            ("Kaç doğru cevap kaç dakika kazandırır?", (
                "Ödül oranını ebeveyn belirler. Bir videoda görülen “iki doğru, bir dakika” yalnız örnek ayardır; ürünün değişmez kuralı değildir.",
                "Başlangıçta küçük bir ödül oranı seçin ve çocuğun soruyu okuyarak mı, rastgele mi ilerlediğini gözleyin.",
            )),
            ("Günlük kazanım tavanı neden önemlidir?", (
                "Doğru cevaplar sınırsız süre üretmez. Çocuğun bir günde kazanabileceği en yüksek ek süreyi ebeveyn belirler; isterse günlük soru sayısına da üst sınır koyar.",
                "Bu tavan, öğrenme akışının ailece konuşulan toplam ekran düzenini bozmasını önler.",
            )),
            ("Çocuk soru ekranında ne görür?", (
                "Çocuk soruyu, seçenekleri, ilerlemeyi ve varsa açıklamayı görür. Kazanılan süre, günlük üst sınırla birlikte görünür tutulur.",
                "İlk turda çocuğun yanında olun; düğmelerin, açıklamanın ve süre kazanımının doğru anlaşıldığını kontrol edin.",
            )),
            ("Yanlış cevap ve tekrar akışı nasıl çalışır?", (
                "Yanlış cevap ek süre kazandırmaz. Doğru seçenek ve varsa açıklama gösterilir. Aynı soru hemen yeniden gelmez; araya en az iki farklı soru girer.",
                "Ebeveyn, belirli sayıda yanlış cevapta süreden dakika düşülmesini de ayarlayabilir. Bu düşüm yeni kurulumda açık gelir; değerlerini değiştirebilir ya da 0 yazarak kapatabilirsiniz. Çocuğa bu kuralı ilk turdan önce söyleyin.",
                "Üç yanlış üst üste olduğunda 30 saniyelik bekleme uygulanır. Amaç rastgele işaretleme yerine açıklamayı okuyarak ilerlemektir.",
            )),
            ("Kazanılan süre ve sonuçlar nereden izlenir?", (
                "Ebeveyn panelinde soru sonuçları, ders ve konu gelişimi ile kazanılan süre birlikte incelenebilir. Yeterli örnek bulunmayan konular güçlü ya da zayıf diye etiketlenmez.",
                "Tek bir oturuma dayanarak başarı yorumu yapmayın; düzenli ve yeterli örnek birikmesini bekleyin.",
            )),
            ("Sağlıklı bir başlangıç ayarı örneği", (
                "Kısa bir soru bankası, düşük ödül oranı ve küçük bir günlük kazanım tavanıyla başlayın. Bir hafta sonra hem doğru cevapları hem ekran düzenini birlikte değerlendirin.",
                "Amaç daha çok ekran süresi dağıtmak değil, çocuğa sınır içinde anlamlı bir sonraki adım sunmaktır.",
            )),
        ),
    },
    {
        "slug": "bulutsuz-ebeveyn-kontrolu",
        "campaign_id": "site_rehber_bulutsuz_tr",
        "android_note": (
            "Android’de de kurallar cihazda saklanır; web hesabına veya tarayıcı paneline giriş yapılmaz. Android web filtresi cihazdaki yerel VPN ile alan adı düzeyinde çalışır; sayfa içeriğini buluta gönderen bir tünel değildir.",
            "Android aile aboneliği Google Play üzerinden alınır; abonelik ve dağıtım Google Play’in kendi hizmetidir. Bir aboneliğin 10 cihazda geçerli olması için AliKa sınırlı bir lisans hizmeti kullanır: rastgele aile ve cihaz kimliği, cihaz rolü ve abonelik durumu doğrulanır. Çocuk içeriği, kullanım geçmişi, mesajlar ve ziyaret edilen alan adları bu hizmete gönderilmez. Windows satın alımı Android’i kapsamaz.",
        ),
        "title": "Bulut Hesabı Olmadan Ebeveyn Kontrolü Nasıl Çalışır?",
        "description": "AliKa’nın cihazda kalan verilerle, reklamsız ve zorunlu bulut hesabı olmadan nasıl çalıştığını; yerel aile ağının sınırlarını öğrenin.",
        "video": "ev-agi",
        "video_label": "AliKa ev ağı · 3:43",
        "video_note": "Videodaki Android TV bölümü geliştirme aşamasındadır.",
        "lede": (
            "Bir ebeveyn kontrolü uygulamasında yalnız “ne yapıyor?” değil, “veri nereye gidiyor?” sorusu da önemlidir. "
            "AliKa’nın temel kullanım kayıtları cihazda tutulur; reklam, üçüncü taraf analitik ve zorunlu AliKa bulut hesabı bulunmaz."
        ),
        "sections": (
            ("Hangi kayıtlar cihazda tutulur?", (
                "Ekran süresi kuralları, uygulama kullanım süreleri, öğrenme sonuçları ve raporlar cihazda işlenir. Ebeveyn paneli toplanan kayıtları görünür kılar.",
                "AliKa’nın kendi bulut eşitleme hizmeti veya ürün kullanım telemetrisi yoktur. Android’deki tek istisna, aile aboneliğini doğrulayan ve yalnız lisans bilgisi işleyen sınırlı hizmettir; ayrıntısı Gizlilik Politikası’ndadır.",
            )),
            ("AliKa neyi görür, neyi görmez?", (
                "Ürün, ebeveynin belirlediği kuralları uygulamak ve raporlamak için gereken yerel bilgiyi işler. Gizli takip, reklam profili veya üçüncü taraf pazarlama amacıyla veri toplamaz.",
                "Çocuk profili ve gerçek gezinme geçmişi tanıtım, ölçüm veya reklam dosyalarına taşınmamalıdır.",
            )),
            ("Tarayıcı geçmişi ile görünür sekme kaydı arasındaki fark", (
                "AliKa tarayıcının geçmiş dosyasını okumaz. Uygulama çalışırken önde olan sekmenin başlığına ilişkin görünürlük sunabilir; bu, geçmiş arşivini içe aktarmak değildir.",
                "Web görünürlüğünün sınırını çocuğa anlatın ve yalnız sahibi olduğunuz ya da velisi olduğunuz cihazlarda kullanın.",
            )),
            ("Reklam, telemetri ve zorunlu hesap neden yok?", (
                "Yerel öncelikli tasarım, aile kuralları ve kullanım kayıtları için AliKa hesabı açmayı zorunlu kılmaz. Uygulamada reklam ağı veya üçüncü taraf analitik SDK’sı bulunmaz.",
                "Microsoft Store lisansı ve dağıtımı işletim sisteminin kendi hizmetleridir; “internete hiçbir zaman ihtiyaç duymaz” iddiası bu nedenle doğru değildir.",
                "Ebeveyn panelindeki “Hata raporu gönder” düğmesi arka planda bir şey göndermez: cihazda bir dosya hazırlar ve ebeveynin kendi e-posta uygulamasını açar. Rapor, yalnız ebeveyn o e-postayı gönderirse ulaşır.",
            )),
            ("Yerel aile ağı nasıl açılır?", (
                "Aile Ağı başlangıçta kapalıdır. Ebeveyn özelliği açıkça etkinleştirip cihazları geçici QR kodla eşleştirir.",
                "Yalnız desteklenen veriler, onaylanan yerel ağda eşleştirilmiş cihazlar arasında şifreli biçimde taşınır; bu aktarım AliKa’ya ait bir bulut sunucusundan geçmez.",
            )),
            ("Aynı Wi-Fi ve açık eşleştirme neden gereklidir?", (
                "Yerel ağ modeli cihazların aynı ev ağına bağlı olmasını ve ebeveynin eşleştirmeyi bilerek başlatmasını gerektirir.",
                "Cihaz çevrimdışıysa durum açıkça gösterilir; gizli veya internet üzerinden sınırsız erişim kurulmaz.",
            )),
            ("Bulutsuz yapının gerçek sınırları", (
                "AliKa internet üzerinden ev dışından takip veya uzaktan komut hizmeti değildir. Cihazların aynı yerel ağda olmadığı senaryolarda Aile Ağı iletişimi beklenmemelidir.",
                "İsteğe bağlı haricî yapay zekâ akışında AliKa yalnız istem hazırlar. Kullanıcı bunu kendi seçtiği hizmete gönderirse o hizmetin hesabı ve gizlilik koşulları geçerlidir.",
            )),
            ("Kurulumdan önce ebeveyn gizlilik kontrol listesi", (
                "Çocuğu bilgilendirin, rıza ekranını birlikte okuyun, yalnız gereken kuralları açın, Aile Ağı’nı kullanmıyorsanız kapalı bırakın ve raporlara erişimi ebeveyn PIN’iyle koruyun.",
                "Gerçek çocuk verisini destek mesajına, tanıtım görseline veya haricî yapay zekâ istemine eklemeyin.",
            )),
        ),
    },
    {
        "slug": "ailece-ekran-suresi-plani",
        "campaign_id": "site_rehber_ekran_plani_tr",
        "platform": "both",
        "title": "Ailece Ekran Süresi Planı Nasıl Yapılır? Haftalık Düzen",
        "description": "Çocukla birlikte haftalık ekran planı kurun: okul günü ve hafta sonu süresi, ekranların kapanacağı saat, ekran dışı zaman ve haftalık gözden geçirme.",
        "video": "ilk-gun-ayarlari",
        "video_label": "AliKa ilk gün ayarları · 2:06",
        "lede": (
            "Ekran süresi planı, sürenin her akşam yeniden tartışılmaması için önceden ve birlikte yapılır. "
            "Okul günü ile hafta sonunu ayırın, ekranların kapanacağı saati sabitleyin ve planı haftada bir kısa bir konuşmayla gözden geçirin. "
            "Aşağıdaki tabloyu yazdırıp çocukla birlikte doldurabilirsiniz."
        ),
        "sections": (
            ("Planı sakin bir anda, birlikte kurun", (
                "Planı süre bittiği ya da tartışmanın başladığı anda değil, herkesin sakin olduğu bir zamanda konuşun. Çocuğa ekranı neler için kullandığını sorun: ödev, oyun, video, arkadaşlarla konuşma. Hangisinin onun için önemli olduğunu bilmek, kuralı daha anlaşılır kılar.",
                "Ortaokul çağındaki bir çocuk kendi önerisini getirebilir. Son kararı ebeveyn verse de çocuğun önerisini dinlemek, planın uygulanmasını kolaylaştırır. Kararlaştırdığınız her kuralı tek cümleyle yazın.",
            )),
            ("Okul günü ile hafta sonunu ayırın", (
                "Okul günlerinde ödev, uyku ve okul sonrası etkinlikler zamanı zaten daraltır; hafta sonu daha esnek olabilir. İki ayrı günlük toplam belirlemek, çoğu aile için tek bir sayıdan daha gerçekçidir.",
                "İlk hafta, bugünkü kullanıma yakın ve uygulanabilir bir süreyle başlayın. Bir anda büyük bir düşüş yapmak yerine haftalık gözden geçirmede küçük adımlarla ilerleyin. Ödev için kullanılan bilgisayar süresinin günlük toplama dahil olup olmadığını da baştan kararlaştırın.",
            )),
            ("Ekranların kapanacağı saati sabitleyin", (
                "Toplam süre kadar önemli olan, ekranların akşam hangi saatte kapanacağıdır. Okul günleri için sabit bir saat belirleyin; hafta sonu bu saat biraz daha geç olabilir.",
                "Yemek masası veya yatak odası gibi ekransız alanlar da plana yazılabilir. Bu kuralların ailedeki herkes için geçerli olması, çocuğun planı benimsemesini kolaylaştırır.",
            )),
            ("Ekran dışı zamanı da plana ekleyin", (
                "Plan yalnız sınırlardan oluşursa çocuk boşalan zamanı nasıl geçireceğini bilemeyebilir. Her güne kısa bir ekran dışı etkinlik yazın: spor, kitap, arkadaşlarla buluşma, evde küçük bir sorumluluk.",
                "Ekran dışı etkinlik ceza olarak değil, günün doğal bir parçası olarak sunulduğunda daha kolay sürdürülür.",
            )),
            ("İstisnaları baştan konuşun", (
                "Doğum günü, bayram, uzun bir okul projesi ya da hastalık günü gibi durumlar planı geçici olarak değiştirebilir. Bu durumlarda kimin karar vereceğini ve ek sürenin nasıl verileceğini önceden söyleyin.",
                "Tek seferlik bir izin, günlük kuralı kalıcı olarak değiştirmez. Bunu açıkça söylemek, ertesi gün aynı izni isteme tartışmasını azaltır.",
            )),
            ("Haftada bir kısa gözden geçirme", (
                "Haftada bir gün, örneğin pazar akşamı, on dakikalık bir konuşmayla planın nasıl gittiğini değerlendirin. Neyin işlediğini, neyin zorlandığını birlikte konuşun.",
                "Her hafta yalnız bir şeyi değiştirin. Aynı anda birçok kuralı değiştirmek, hangisinin işe yaradığını görmeyi zorlaştırır.",
            )),
            ("Sık yapılan hatalar", (
                "Kuralı tartışmanın ortasında koymak, aynı anda çok sayıda kural başlatmak, kuralı çocuğa söylemeden değiştirmek ve planı yazmadan yalnız sözlü bırakmak en sık karşılaşılan sorunlardır.",
                "Ekran süresini sürekli ödül ya da ceza aracı olarak kullanmak da planın amacını belirsizleştirebilir. Planın amacı, günün düzenini önceden belli etmektir.",
            )),
        ),
        "printable": {
            "title": "Haftalık aile ekran planı",
            "note": "Yazdırın, çocukla birlikte doldurun ve görünür bir yere asın.",
            "columns": ("Gün", "Ekran süresi", "Ekranlar kapanır", "Ekran dışı plan"),
            "rows": tuple((day, "", "", "") for day in ("Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar")),
        },
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü, kararlaştırdığınız planı Windows bilgisayarda ve Android telefonda uygular. Haftanın her günü için ayrı süre ve uyku saati girilebilir; çocuk kalan süresini ekranında görür, süre dolduğunda hangi kuralın uygulandığını bilir.",
            "İsterseniz çocuk, sizin eklediğiniz sorulardan çözerek kontrollü ek süre kazanabilir; kaç doğru cevabın bir dakika ettiğini ve günlük üst sınırı siz belirlersiniz. AliKa hesabı açmanız gerekmez.",
        )),
    },
    {
        "slug": "android-cocuk-ekran-suresi",
        "campaign_id": "site_rehber_android_tr",
        "platform": "android",
        "title": "Android Telefonda Çocuğun Ekran Süresi Nasıl Planlanır?",
        "description": "Android telefon ve tablette çocuk ekran süresini planlayın: günlük süre, uygulama sınırı, uyku saati, web filtresi, izinler ve ilk hafta kontrolleri.",
        "video": "android-ilk-kurulum",
        "video_label": "AliKa Android ilk kurulum · 1:40",
        "lede": (
            "Android telefonda ekran süresi planı üç adımda kurulur: telefonun kimin olduğunu belirlemek, günlük süreyi ve uyku saatini ayarlamak, ardından kuralı çocukla birlikte denemek. "
            "Ayarları çocuğun telefonunda, onun bilgisiyle yapın. "
            "Bu rehber genel adımları ve AliKa’nın Android’deki akışını anlatır."
        ),
        "sections": (
            ("Kurmadan önce: telefon kimin, kural ne?", (
                "Önce telefonun kime ait olduğunu netleştirin: yalnız çocuğun kullandığı bir telefon mu, ebeveynle ortak kullanılan bir telefon mu? Ortak telefonda ebeveynin kendi kullanımının nasıl sayılacağını baştan düşünmek gerekir.",
                "Sonra çocukla üç şeyi konuşun: günlük toplam süre, ekranların kapanacağı saat ve ayrıca sınırlanacak uygulamalar. Bu kararlar telefona girilmeden önce yazılı olursa kurulum çok daha hızlı biter.",
            )),
            ("Günlük süre, uygulama sınırı ve uyku saati", (
                "Günlük toplam süre bütün uygulamaları kapsar. Uygulama sınırı ise belirli bir oyun ya da video uygulamasına ayrıca dakika verir. Uyku saati, belirlediğiniz aralıkta telefonu kilitler.",
                "İlk hafta tek bir günlük toplam ve tek bir uyku aralığıyla başlayın. Okul günü ve hafta sonu için farklı süre gerekiyorsa haftalık planı sonra ekleyin.",
            )),
            ("Web filtresi ve güvenli arama", (
                "Web filtresi, engellediğiniz siteleri kapatır ve Google, YouTube ve Bing’de güvenli aramayı zorlar. Android bu özellik için bir kez VPN izni ister; AliKa’da filtreleme telefonun içinde yapılır, gezinme verisi dışarı gönderilmez.",
                "Filtreyi açtıktan sonra çocuğun ödev için kullandığı siteleri birlikte deneyin. Beklenmedik bir engel görürseniz filtre ayarını birlikte gözden geçirin.",
            )),
            ("Android izinleri neden istenir?", (
                "Ekran süresini ölçmek için kullanım erişimi, korumanın çalıştığını göstermek için bildirim, web filtresi için VPN izni gerekir. İzinleri ebeveyn olarak siz verirsiniz; Android ayarlarından her zaman geri alınabilir.",
                "AliKa’da Ayar bekçisi isteğe bağlıdır ve başlangıçta kapalıdır. Açarsanız AliKa kaldırılmak ya da durdurulmak istendiğinde ebeveyn PIN’i sorar. Bu izni vermemek diğer özellikleri kullanmanıza engel olmaz.",
            )),
            ("Soru çözerek ek süre (isteğe bağlı)", (
                "Çocuk, sizin eklediğiniz sorulardan çözerek kontrollü ek süre kazanabilir. Kaç doğru cevabın bir dakika ettiğini, günlük kazanım tavanını ve günlük soru sınırını siz seçersiniz; yanlış cevap süre kazandırmaz.",
                "Ayrıntılar “Soru çözerek ekran süresi kazanma” rehberindedir. Türkiye ortaokul (5–8. sınıf) için hazır konu anlatımı ve soru paketleri alika.tr’deki Hazır içerik sayfasındadır.",
            )),
            ("Birden fazla telefon ve tablet", (
                "Bir AliKa aile aboneliği, ebeveyn telefonu dahil en fazla 10 eşleştirilmiş Android aile cihazında kullanılır. Cihazlar aynı Wi-Fi ağındayken eşleştirilir; eşleştirmeyi kurulumdan sonra da yapabilirsiniz.",
                "Ebeveyn telefonu ebeveyn olarak kurulduğunda çocuk için süre ve soru kuralları o telefonda uygulanmaz. Windows satın alımı Android aboneliğini kapsamaz.",
            )),
            ("İlk hafta kontrol listesi", (
                "Çocuğun ekranında kalan sürenin doğru göründüğünü, uyku saatinin beklenen saatte başladığını, koruma bildiriminin göründüğünü ve web filtresinin ödev sitelerini engellemediğini kontrol edin.",
                "Ebeveyn PIN’ini çocuğun göremeyeceği bir anda girin; kurtarma kodunu telefondan ayrı, güvenli bir yerde saklayın.",
            )),
            ("Sık yapılan hatalar", (
                "İzinleri yarım bırakmak, ilk gün çok sıkı sınırlarla başlamak, kuralı çocuğa söylemeden açmak ve kurtarma kodunu kaybetmek en sık karşılaşılan sorunlardır.",
                "Ayarı çocuğun haberi olmadan değiştirmek de güveni zedeleyebilir. Değişikliği yapmadan önce kısaca söylemek yeterlidir.",
            )),
        ),
    },
    {
        "slug": "ara-tatil-ekran-suresi-plani",
        "campaign_id": "site_rehber_ara_tatil_tr",
        "platform": "both",
        "title": "Ara Tatilde Ekran Süresi Nasıl Planlanır? 9 Günlük Plan",
        "description": "16–20 Kasım ara tatili için hafta sonlarıyla 9 günlük ekran planı: günlük süre, uyku saati, ekran dışı etkinlik ve okula dönüş. Yazdırılabilir tablo.",
        "video": "ilk-gun-ayarlari",
        "video_label": "AliKa ilk gün ayarları · 2:06",
        "lede": (
            "Ara tatil okul düzenini bozar ama ekran süresinin sınırsız olması gerekmez. "
            "Tatil başlamadan günlük bir süre, sabit bir uyku saati ve her gün için bir ekran dışı plan belirleyin; son iki günü okul düzenine dönüşe ayırın. "
            "Aşağıdaki 9 günlük tabloyu yazdırıp çocukla birlikte doldurabilirsiniz."
        ),
        "sections": (
            ("Ara tatil ne zaman?", (
                "MEB’in 2026–2027 çalışma takvimine göre birinci dönem ara tatili 16–20 Kasım 2026 tarihleri arasındadır. Hafta sonlarıyla birlikte tatil 14 Kasım Cumartesi’den 22 Kasım Pazar’a kadar dokuz gün sürer; dersler 23 Kasım Pazartesi yeniden başlar.",
                "Okulunuzun duyurusu farklıysa tabloyu kendi takviminize göre düzenleyin.",
            )),
            ("Tatilden önce kısa bir aile konuşması", (
                "Tatil başlamadan çocuğa tatilde neler yapmak istediğini sorun. Ödevleri, okunacak kitapları ve evden uzak geçecek günleri (ziyaret, yolculuk) birlikte takvime yazın.",
                "Tatildeki ekran süresinin okul günlerinden farklı olup olmayacağını bu konuşmada kararlaştırın. Önceden konuşulan bir kural, tatilin ortasında yeni bir tartışma başlatmaz.",
            )),
            ("Tatil günü için gerçekçi bir süre", (
                "Tatilde ekran süresi okul gününden biraz fazla olabilir; önemli olan bunun önceden belli olmasıdır. Günlük bir toplam ve sabit bir ekran kapanış saati, dokuz günün tamamı için yeterli bir çerçevedir.",
                "Uyku saatini tatil boyunca çok kaydırmamak, okula dönüşü kolaylaştırır.",
            )),
            ("Her güne bir ekran dışı plan", (
                "Tablodaki her güne bir ekran dışı etkinlik yazın: park, kütüphane, müze, akraba ziyareti, birlikte yemek yapmak, kutu oyunu, spor ya da kitap. Büyük planlar gerekmez; günde bir küçük etkinlik yeterlidir.",
                "Etkinliği çocukla birlikte seçmek, onun plana sahip çıkmasını sağlar.",
            )),
            ("Kısa ve düzenli tekrar zamanı", (
                "Tatil, okulda işlenen konuları kısa bloklarla tekrar etmek için de uygundur. Örneğin günde 20–30 dakikalık bir tekrar ya da okuma zamanı, günün geri kalanını rahat bırakır.",
                "Türkiye ortaokul (5–8. sınıf) için konu anlatımı ve soru paketleri alika.tr’deki Hazır içerik sayfasındadır.",
            )),
            ("Son iki gün: okula dönüş", (
                "21–22 Kasım hafta sonunu okul düzenine dönüşe ayırın. Uyku ve ekran kapanış saatini okul günlerindeki saate geri çekin; okul çantasını ve ödevleri pazar akşamından önce birlikte kontrol edin.",
            )),
            ("Sık yapılan hatalar", (
                "Tatil boyunca hiç kural koymayıp son gün birden sıkı bir düzene dönmek, uyku saatini her gün biraz daha geciktirmek ve bütün günü ekranın etrafında planlamak en sık görülen sorunlardır.",
            )),
        ),
        "printable": {
            "title": "Ara tatil 9 günlük ekran planı",
            "note": "14–22 Kasım 2026 · Yazdırın, çocukla birlikte doldurun.",
            "columns": ("Gün", "Ekran süresi", "Ekranlar kapanır", "Ekran dışı plan", "Tekrar / okuma"),
            "rows": (
                ("Cumartesi 14 Kasım", "", "", "", ""),
                ("Pazar 15 Kasım", "", "", "", ""),
                ("Pazartesi 16 Kasım", "", "", "", ""),
                ("Salı 17 Kasım", "", "", "", ""),
                ("Çarşamba 18 Kasım", "", "", "", ""),
                ("Perşembe 19 Kasım", "", "", "", ""),
                ("Cuma 20 Kasım", "", "", "", ""),
                ("Cumartesi 21 Kasım · dönüş hazırlığı", "", "", "", ""),
                ("Pazar 22 Kasım · dönüş hazırlığı", "", "", "", ""),
            ),
        },
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü bu planı Windows bilgisayarda ve Android telefonda uygulayabilir. Günlere göre ayrı süre ve uyku saati girilebilir; Windows’ta okul ve tatil günleri için ayrı takvim profili de tanımlanabilir.",
            "Çocuk kalan süresini ekranında görür. İsterseniz sizin eklediğiniz sorulardan çözerek, sizin belirlediğiniz günlük üst sınır içinde ek süre kazanabilir.",
        )),
    },
)

# "draft": True işaretli rehberler yalnız ALIKA_DRAFTS=1 ile derlenir (yayın öncesi önizleme).
SHOW_DRAFTS = os.environ.get("ALIKA_DRAFTS") == "1"
PUBLISHED_GUIDES = tuple(guide for guide in GUIDES if SHOW_DRAFTS or not guide.get("draft"))
# Rehberlerin görünen ve yapılandırılmış son güncelleme tarihi.
GUIDE_UPDATED = ("2026-10-17", "17 Ekim 2026")
SCHOOL_KIT_PDF = "aile-ekran-plani-veli-notu.pdf"

ACCESS_LABELS = {
    "tr": ("İçeriğe geç", "Menü", "Geç", "Ortak ekran", "Hazır", "Yanıt gizli"),
    "en": ("Skip to content", "Menu", "Skip", "Shared screen", "Ready", "Answer hidden"),
    "de": ("Zum Inhalt", "Menü", "Überspringen", "Gemeinsamer Bildschirm", "Bereit", "Antwort verborgen"),
    "es": ("Ir al contenido", "Menú", "Saltar", "Pantalla compartida", "Listo", "Respuesta oculta"),
    "fr": ("Aller au contenu", "Menu", "Passer", "Écran partagé", "Prêt", "Réponse masquée"),
    "pt": ("Ir para o conteúdo", "Menu", "Pular", "Tela compartilhada", "Pronto", "Resposta oculta"),
    "ru": ("К содержанию", "Меню", "Пропустить", "Общий экран", "Готово", "Ответ скрыт"),
    "ja": ("本文へ", "メニュー", "スキップ", "共有画面", "準備完了", "回答は非表示"),
    "ko": ("본문으로", "메뉴", "건너뛰기", "공유 화면", "준비됨", "답변 숨김"),
}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def href(lang: str, slug: str = "") -> str:
    prefix = "" if lang == "tr" else f"/{lang}"
    return f"{prefix}/{slug + '/' if slug else ''}"


def page_href(lang: str, slug: str) -> str:
    anchor = REDIRECT_ANCHORS.get(slug)
    return f"{href(lang)}#{anchor}" if anchor else href(lang, slug)


def locale_switch_path(target_lang: str, slug: str = "") -> str:
    return href(target_lang, slug)


def format_count(value: int, lang: str) -> str:
    return f"{value:,}".replace(",", THOUSANDS_SEPARATORS.get(lang, ","))


def legal_href(lang: str, kind: str) -> str:
    if lang == "tr":
        return "/gizlilik/" if kind == "privacy" else "/kullanim-kosullari/"
    return "/privacy/" if kind == "privacy" else "/eula/"


def content_href(lang: str) -> str:
    # Ana sayfadaki contentPath ile aynı: Türkçe katalog uygulamanın da açtığı /icerik/ adresinde.
    return "/icerik/" if lang == "tr" else href(lang, "content")


_HOME_COPY: dict[str, dict[str, dict[str, str]]] = {}


def home_copy(lang: str) -> dict[str, dict[str, str]]:
    """Ana sayfa dil dosyasından nav ve footer metinlerini okur."""
    if lang not in _HOME_COPY:
        source = (HOME_I18N / f"{lang}.ts").read_text(encoding="utf-8")
        pair = re.compile(r"(\w+): '((?:[^'\\]|\\.)*)'")
        nav_line = re.search(r"^  nav: \{(.*)\},$", source, re.M)
        footer_block = re.search(r"^  footer: \{\n(.*?)^  \},$", source, re.M | re.S)
        if not nav_line or not footer_block:
            raise ValueError(f"Home copy for {lang} has no nav/footer block")
        _HOME_COPY[lang] = {
            "nav": {key: value.replace("\\'", "'") for key, value in pair.findall(nav_line.group(1))},
            "footer": {key: value.replace("\\'", "'") for key, value in pair.findall(footer_block.group(1))},
        }
    return _HOME_COPY[lang]


def load_locales() -> dict[str, dict]:
    data = json.loads((SRC / "data" / "locales.json").read_text(encoding="utf-8"))
    missing = [lang for lang in LANGS if lang not in data]
    if missing:
        raise ValueError(f"Missing locales: {missing}")
    return data


def clear_readonly_and_retry(func, path, _error) -> None:
    os.chmod(path, stat.S_IWRITE)
    func(path)


def language_menu(locales: dict[str, dict], lang: str, slug: str = "") -> str:
    links = []
    for code in LANGS:
        current = ' aria-current="true"' if code == lang else ""
        links.append(
            f'<a href="{locale_switch_path(code, slug)}" lang="{code}"{current}>'
            f'<span aria-hidden="true">{LANGUAGE_FLAGS[code]}</span>'
            f'<span>{esc(locales[code]["name"])}</span></a>'
        )
    return "".join(links)


def header(locales: dict[str, dict], lang: str, slug: str = "") -> str:
    c = locales[lang]
    access = ACCESS_LABELS[lang]
    words = home_copy(lang)["nav"]
    home = href(lang)
    # Ana sayfanın üst menüsüyle aynı sıra; deneme düğmesi sağda.
    current = ' aria-current="page"'
    nav_items = (
        (f"{home}#ozellikler", words["features"], ""),
        (f"{home}#videolar", words["videos"], ""),
        (content_href(lang), words["content"], current if slug == "content" else ""),
        (f"{home}#plan", words["plan"], ""),
        (f"{home}#sss", words["faq"], ""),
    )
    nav = "".join(f'<a href="{link}"{attr}>{esc(label)}</a>' for link, label, attr in nav_items)
    # Telefonda sağdaki deneme düğmesi gizlenir; menüde görünür.
    nav += f'<a class="nav-offer" href="{home}#deneme">{esc(words["offer"])}</a>'
    return f"""
    <a class="skip-link" href="#main">{esc(access[0])}</a>
    <header class="site-header" data-header>
      <a class="brand" href="{href(lang)}" aria-label="AliKa home">
        <img src="/assets/brand/alika-logo.png" width="44" height="44" alt="">
        <span>AliKa</span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav" data-menu>
        <span></span><span></span><span></span><b>{esc(access[1])}</b>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Primary">
        {nav}
      </nav>
      <div class="header-actions">
        <details class="language-picker">
          <summary aria-label="Language"><span aria-hidden="true">{LANGUAGE_FLAGS[lang]}</span><span>{esc(c["name"])}</span></summary>
          <div class="language-list">{language_menu(locales, lang, slug)}</div>
        </details>
        <a class="button button-small" href="{href(lang)}#deneme">{esc(words["offer"])}</a>
      </div>
    </header>
    """


def footer(locales: dict[str, dict], lang: str) -> str:
    words = home_copy(lang)["footer"]
    home = href(lang)
    guide = GUIDE_LINKS.get(lang)
    guide_link = f'<a href="{guide}">{esc(words["guides"])}</a>' if guide else ""
    school_link = f'<a href="/okullar/">{esc(words["schools"])}</a>' if words.get("schools") else ""
    return f"""
    <footer class="site-footer">
      <div class="footer-brand">
        <img src="/assets/brand/alika-logo.png" width="52" height="52" alt="">
        <div><strong>AliKa</strong><span>{esc(words["tagline"])}</span></div>
      </div>
      <div class="footer-links">
        <a href="{home}#hakkimizda">{esc(words["about"])}</a>
        <a href="{home}#sss">{esc(words["faq"])}</a>
        {guide_link}
        {school_link}
        <a href="{content_href(lang)}">{esc(words["content"])}</a>
        <a href="{home}#iletisim">{esc(words["support"])}</a>
        <a href="{legal_href(lang, 'privacy')}">{esc(words["privacy"])}</a>
        <a href="{legal_href(lang, 'terms')}">{esc(words["terms"])}</a>
      </div>
      <p>© 2026 ErenKa Software · <a href="mailto:destek@alika.tr">destek@alika.tr</a></p>
    </footer>
    """


def store_market(lang: str) -> dict[str, str]:
    return STORE_MARKETS.get(lang, STORE_MARKETS["tr"])


def microsoft_store_url(lang: str, campaign_id: str | None = None) -> str:
    return f'{MICROSOFT_STORE_BASE_URL}?cid={campaign_id or store_market(lang)["cid"]}'


def play_store_url(lang: str, campaign_id: str, medium: str) -> str:
    """Play kampanyayı referrer içindeki utm_* değerlerinden okur (pazarlama planı Ek A)."""
    referrer = quote(f"utm_source=site&utm_medium={medium}&utm_campaign={campaign_id}", safe="")
    return f"{PLAY_STORE_BASE_URL}&hl={lang}&referrer={referrer}"


def document(locales: dict[str, dict], lang: str, title: str, description: str, body: str, slug: str = "") -> str:
    alternates = "\n".join(
        f'<link rel="alternate" hreflang="{code}" href="{BASE_URL}{href(code, slug)}">'
        for code in LANGS
    )
    canonical = f"{BASE_URL}{href(lang, slug)}"
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0A1631">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{canonical}">
  {alternates}
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="icon" href="/assets/brand/alika-logo.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AliKa">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
</head>
<body{' class="content-route"' if slug == "content" else ''}>
  {header(locales, lang, slug)}
  {body}
  {footer(locales, lang)}
  <script src="/assets/site.js" defer></script>
</body>
</html>
"""




def guide_document(locales: dict[str, dict], title: str, description: str, canonical: str, body: str, lang: str = "tr", schema_type: str = "Article") -> str:
    article_schema = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "headline": title,
        "description": description,
        "mainEntityOfPage": canonical,
        "inLanguage": "en-GB" if lang == "en" else "tr-TR",
        "author": {"@type": "Organization", "name": "ErenKa Software"},
        "publisher": {"@type": "Organization", "name": "ErenKa Software"},
        "dateModified": GUIDE_UPDATED[0],
    }
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0A1631">
  <title>{esc(title)} — AliKa</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{canonical}">
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="icon" href="/assets/brand/alika-logo.png">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="{'en_GB' if lang == 'en' else 'tr_TR'}">
  <meta property="og:site_name" content="AliKa">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{BASE_URL}/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{esc(OG_IMAGE_ALT['en' if lang == 'en' else 'tr'])}">
  <script type="application/ld+json">{json.dumps(article_schema, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
  {header(locales, lang)}
  {body}
  {footer(locales, lang)}
  <script src="/assets/site.js" defer></script>
</body>
</html>
"""


def guide_index_body() -> str:
    cards = "".join(
        f'<article class="article-card"><p class="eyebrow">AliKa rehberi</p><h2>{esc(guide["title"])}</h2>'
        f'<p>{esc(guide["description"])}</p><a class="text-link" href="/{GUIDE_BASE}/{guide["slug"]}/">Rehberi okuyun →</a></article>'
        for guide in PUBLISHED_GUIDES
    )
    return f"""
    <main id="main" class="guide-main">
      <header class="guide-index-hero">
        <p class="eyebrow">Windows ve Android · Dijital ebeveynlik</p>
        <h1>Ekran süresi için açık, uygulanabilir rehberler.</h1>
        <p>Kuralları önceden konuşmak, öğrenme akışını sınırlı tutmak ve verinin nereye gittiğini bilmek için hazırlanmış Türkçe kaynaklar.</p>
      </header>
      <section class="article-grid" aria-label="Türkçe ebeveyn rehberleri">{cards}</section>
      <p class="guide-links-note"><strong>Okullar ve rehber öğretmenler için:</strong> veli toplantısında dağıtılabilecek tek sayfalık not ve yazdırılabilir planlar <a href="/okullar/">Okullar sayfasında</a>.</p>
      <aside class="guide-disclosure"><strong>Açıklık notu:</strong> Bu rehberler AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. AliKa Windows ve Android için ücretli bir uygulamadır. Windows sürümü Microsoft Store’da 7 günlük denemeyle, Android aile aboneliği Google Play’de 14 günlük denemeyle sunulur; güncel fiyatı mağaza sayfası gösterir.</aside>
    </main>
    """


def guide_article_body(guide: dict) -> str:
    sections = "".join(
        f'<section><h2>{esc(heading)}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in paragraphs)}</section>'
        for heading, paragraphs in guide["sections"]
    )
    # Video dosyası sitede durur ve sayfada oynar; tıklanana kadar yalnız kapak görseli yüklenir.
    video = f'/videos/kurulum/{guide["video"]}' if guide.get("video") else ""
    video_note = f'<span>{esc(guide["video_note"])}</span>' if guide.get("video_note") else ""
    video_aside = (
        f'<aside class="guide-video"><div><strong>Gerçek ürün akışını izleyin</strong><span>{esc(guide["video_label"])}</span>{video_note}</div>'
        f'<video controls preload="none" playsinline poster="{video}.webp"><source src="{video}.mp4" type="video/mp4">'
        f'<track kind="captions" src="{video}.tr.vtt" srclang="tr" label="Türkçe"></video></aside>'
        if video else ""
    )
    # İki platformda geçerli rehber: Android notu ve Play düğmesi.
    android_note = guide.get("android_note")
    android_section = (
        f'<section><h2>Android telefon ve tablette</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in android_note)}</section>'
        if android_note else ""
    )
    printable = guide.get("printable")
    printable_section = ""
    if printable:
        head = "".join(f'<th scope="col">{esc(column)}</th>' for column in printable["columns"])
        rows = "".join(
            f'<tr><th scope="row">{esc(row[0])}</th>{"".join(f"<td>{esc(cell)}</td>" for cell in row[1:])}</tr>'
            for row in printable["rows"]
        )
        # Düğme yalnız tabloyu yazdırır (print-plan sınıfı); sayfanın geri kalanı baskıda gizlenir.
        printable_section = (
            f'<section class="guide-print" id="yazdir"><h2>{esc(printable["title"])}</h2><p>{esc(printable["note"])}</p>'
            f'<div class="guide-table"><table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>'
            '<button class="button guide-print-button" type="button" '
            'onclick="document.body.classList.add(\'print-plan\');window.print();document.body.classList.remove(\'print-plan\')">Planı yazdırın</button></section>'
        )
    product = guide.get("product")
    product_section = (
        f'<section><h2>{esc(product[0])}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in product[1])}</section>'
        if product else ""
    )
    platform = guide.get("platform", "both" if android_note else "windows")
    store_button = f'<a class="button" href="{microsoft_store_url("tr", guide.get("campaign_id"))}" target="_blank" rel="noopener noreferrer">Microsoft Store’da 7 günlük denemeyi açın</a>'
    if platform == "android":
        eyebrow = "Android telefon ve tablet · AliKa ebeveyn rehberi"
        disclosure = "AliKa Windows ve Android için ücretli bir uygulamadır; bu rehber Android sürümünü anlatır."
        play_href = esc(play_store_url("tr", guide["campaign_id"], "rehber"))
        cta = (
            '<section class="guide-cta"><h2>Android telefonunuzda deneyin.</h2>'
            '<p>AliKa’nın Android aile aboneliği Google Play’de 14 gün ücretsiz denemeyle başlar; deneme bitmeden iptal ederseniz ücret alınmaz. '
            'Bir abonelik 10 eşleştirilmiş aile cihazında geçerlidir. Güncel fiyatı mağaza sayfası gösterir.</p>'
            f'<div class="button-row"><a class="button" href="{play_href}" target="_blank" rel="noopener noreferrer">Google Play’de açın</a>{store_button}</div></section>'
        )
    elif platform == "both":
        eyebrow = "Windows ve Android · AliKa ebeveyn rehberi"
        disclosure = "AliKa Windows ve Android için ücretli bir uygulamadır."
        play_href = esc(play_store_url("tr", guide["campaign_id"], "rehber"))
        cta = (
            '<section class="guide-cta"><h2>Windows’ta ya da Android’de deneyin.</h2>'
            '<p>Windows sürümünü Microsoft Store’da 7 gün ücretsiz deneyebilirsiniz. '
            'Android aile aboneliği Google Play’de 14 gün ücretsiz denemeyle başlar.</p>'
            f'<div class="button-row">{store_button}<a class="button" href="{play_href}" target="_blank" rel="noopener noreferrer">Google Play’de açın</a></div></section>'
        )
    else:
        eyebrow = "Windows 10/11 · AliKa ebeveyn rehberi"
        disclosure = "AliKa Windows ve Android için ücretli bir uygulamadır; bu rehber Windows sürümünü anlatır."
        cta = (
            '<section class="guide-cta"><h2>Windows bilgisayarınızda birlikte deneyin.</h2>'
            '<p>AliKa’yı Windows 10/11 için 7 gün ücretsiz deneyebilir, ilk kuralı ve çocuk ekranını kontrol edebilirsiniz. Güncel fiyatı mağaza sayfası gösterir.</p>'
            f'{store_button}</section>'
        )
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <nav class="guide-breadcrumb" aria-label="Sayfa yolu"><a href="/">AliKa</a><span>›</span><a href="/{GUIDE_BASE}/">Rehberler</a></nav>
        <header>
          <p class="eyebrow">{eyebrow}</p>
          <h1>{esc(guide["title"])}</h1>
          <p class="guide-lede">{esc(guide["lede"])}</p>
          <p class="guide-updated">Son güncelleme: <time datetime="{GUIDE_UPDATED[0]}">{GUIDE_UPDATED[1]}</time></p>
          <p class="guide-disclosure"><strong>Açıklık notu:</strong> Bu içerik AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. {disclosure}</p>
        </header>
        {sections}
        {printable_section}
        {product_section}
        {android_section}
        {video_aside}
        {cta}
      </article>
    </main>
    """


def school_body() -> str:
    """Okullar ve rehber öğretmenler için kaynak sayfası (taslak)."""
    sections = (
        ("Okulda paylaşırken", (
            "Kaynakları okul yönetiminin bilgisi ve onayıyla, genel bir veli bilgilendirmesi olarak paylaşın. Notta satış ya da indirim teklifi yoktur; AliKa yalnızca isteyen aileler için bir seçenek olarak anılır.",
            "Bu kaynaklar için öğrencilerden veya velilerden hiçbir bilgi toplanmaz; form doldurmak ya da kayıt olmak gerekmez.",
        )),
        ("AliKa hakkında kısa bilgi", (
            "AliKa ebeveyn kontrolü, ailelerin ekran süresini önceden planlamasına yardımcı olan bir Windows ve Android uygulamasıdır. Kurallar çocuğun ekranında görünür; ebeveyn isterse çocuk, belirlenen sınır içinde soru çözerek ek süre kazanabilir.",
            "Türkiye ortaokul (5–8. sınıf) için konu anlatımı ve soru paketleri alika.tr’deki Hazır içerik sayfasındadır. Uygulama ücretlidir; deneme ve fiyat bilgisi mağaza sayfalarındadır.",
        )),
        ("İletişim", (
            "Kaynaklarla ilgili soru ve önerileriniz için destek@alika.tr adresine yazabilirsiniz.",
        )),
    )
    rendered = "".join(
        f'<section><h2>{esc(heading)}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in paragraphs)}</section>'
        for heading, paragraphs in sections
    )
    plans = "".join(
        f'<li><a href="/{GUIDE_BASE}/{guide["slug"]}/#yazdir">{esc(guide["printable"]["title"])}</a></li>'
        for guide in PUBLISHED_GUIDES if guide.get("printable")
    )
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <nav class="guide-breadcrumb" aria-label="Sayfa yolu"><a href="/">AliKa</a><span>›</span><span aria-current="page">Okullar</span></nav>
        <header>
          <p class="eyebrow">Ortaokul · Rehber öğretmenler ve sınıf öğretmenleri</p>
          <h1>Velilerle ekran planı konuşmak için yazdırılabilir kaynaklar.</h1>
          <p class="guide-lede">Veli toplantısında dağıtabileceğiniz tek sayfalık bilgilendirme notu ve ailelerin evde birlikte doldurduğu planlar. Kaynaklar bir uygulama gerektirmez; indirip çoğaltabilirsiniz.</p>
          <p class="guide-disclosure"><strong>Açıklık notu:</strong> Bu sayfa AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır.</p>
        </header>
        <section>
          <h2>Tek sayfalık veli notu</h2>
          <p>Not, ailece ekran planını beş adımda anlatır ve haftalık bir plan tablosu içerir. Okul ve sınıf adı için boş alan bırakılmıştır.</p>
          <div class="button-row"><a class="button" href="/okullar/{SCHOOL_KIT_PDF}" download>Veli notunu indirin (PDF)</a><a class="button" href="/okullar/veli-notu/">Yazdırılabilir sayfayı açın</a></div>
        </section>
        <section>
          <h2>Yazdırılabilir planlar</h2>
          <p>Aileler bu planları evde çocukla birlikte doldurur. Her plan ilgili rehberin içinde yazdırılabilir tablo olarak yer alır.</p>
          <ul class="guide-links">{plans}</ul>
        </section>
        {rendered}
      </article>
    </main>
    """


def school_kit_document() -> str:
    """Tek sayfalık (A4) veli bilgilendirme notu; okulda çoğaltılmak üzere."""
    steps = (
        ("Sakin bir anda konuşun.", "Çocuğunuza ekranı neler için kullandığını sorun; kuralları birlikte, tek cümleyle yazın."),
        ("Okul günü ile hafta sonunu ayırın.", "İki ayrı günlük süre, çoğu aile için tek bir sayıdan daha gerçekçidir."),
        ("Ekranların kapanacağı saati sabitleyin.", "Yemek masası gibi ekransız alanlar ailedeki herkes için geçerli olabilir."),
        ("Ekran dışı zamanı da yazın.", "Her güne küçük bir etkinlik: spor, kitap, arkadaşlar, evde bir sorumluluk."),
        ("Haftada bir 10 dakika gözden geçirin.", "Neyin işlediğini konuşun; her hafta yalnız bir şeyi değiştirin."),
    )
    step_items = "".join(f"<li><strong>{esc(title)}</strong> {esc(body)}</li>" for title, body in steps)
    days = ("Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar")
    rows = "".join(f'<tr><th scope="row">{day}</th><td></td><td></td><td></td></tr>' for day in days)
    checks = (
        "Kurallar yazıldı ve görünür bir yere asıldı.",
        "Çocuk kuralları kendi cümlesiyle anlatabiliyor.",
        "İstisnalar (bayram, proje, hastalık) konuşuldu.",
        "Haftalık gözden geçirme günü belirlendi.",
    )
    check_items = "".join(f"<li>{esc(item)}</li>" for item in checks)
    return f"""<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Ailece Ekran Planı — Veli Bilgilendirme Notu</title>
  <link rel="icon" href="/assets/brand/alika-logo.png">
  <style>
    @page {{ size: A4; margin: 14mm 15mm; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: #e9eef5; color: #15202b; font: 10.5pt/1.45 'Segoe UI', system-ui, sans-serif; }}
    .sheet {{ width: 210mm; min-height: 297mm; margin: 16px auto; padding: 14mm 15mm; background: #fff; box-shadow: 0 8px 30px rgba(10, 22, 49, .15); }}
    header {{ display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 3px solid #35d0e0; }}
    header img {{ width: 40px; height: 40px; }}
    h1 {{ margin: 0; color: #0a1631; font-size: 19pt; line-height: 1.1; }}
    header p {{ margin: 2px 0 0; color: #60708e; }}
    .fields {{ display: flex; gap: 24px; margin: 10px 0 6px; color: #60708e; }}
    .fields span {{ flex: 1; border-bottom: 1px solid #9aa7bd; padding-bottom: 2px; }}
    h2 {{ margin: 12px 0 5px; color: #0a1631; font-size: 12.5pt; }}
    p {{ margin: 4px 0; }}
    ol {{ margin: 4px 0; padding-left: 20px; }}
    ol li {{ margin: 3px 0; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 4px; }}
    th, td {{ border: 1px solid #9aa7bd; padding: 0 6px; height: 8.6mm; text-align: left; font-size: 10pt; }}
    thead th {{ height: auto; padding: 4px 6px; background: #e9f7f9; color: #0a1631; }}
    tbody th {{ width: 24%; font-weight: 600; }}
    ol.lines {{ margin: 2px 0 0; padding-left: 20px; }}
    ol.lines li {{ height: 8.5mm; border-bottom: 1px solid #9aa7bd; }}
    ul.checks {{ list-style: none; margin: 4px 0; padding: 0; columns: 2; column-gap: 18px; }}
    ul.checks li {{ margin: 3px 0; padding-left: 20px; position: relative; break-inside: avoid; }}
    ul.checks li::before {{ content: ''; position: absolute; left: 0; top: 3px; width: 11px; height: 11px; border: 1.5px solid #0a1631; border-radius: 2px; }}
    footer {{ margin-top: 12px; padding-top: 7px; border-top: 1px solid #c9d2e0; color: #4a5872; font-size: 8.8pt; }}
    footer strong {{ color: #0a1631; }}
    .print {{ display: block; width: 210mm; margin: 0 auto 24px; text-align: right; }}
    .print button {{ padding: 10px 18px; border: 0; border-radius: 999px; background: #0a1631; color: #fff; font: 600 11pt 'Segoe UI', sans-serif; cursor: pointer; }}
    @media screen and (max-width: 840px) {{ .sheet, .print {{ width: auto; margin: 8px; min-height: 0; padding: 18px 16px; }} }}
    @media print {{ body {{ background: #fff; }} .sheet {{ width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }} .print {{ display: none; }} }}
  </style>
</head>
<body>
  <main class="sheet">
    <header>
      <img src="/assets/brand/alika-logo.png" alt="">
      <div><h1>Ailece Ekran Planı</h1><p>Veli bilgilendirme notu · Ortaokul (5–8. sınıf)</p></div>
    </header>
    <div class="fields"><span>Okul:</span><span>Sınıf:</span></div>
    <p>Ekran süresi tartışmaları çoğu zaman süre bittiği anda başlar. Kural önceden, birlikte ve yazılı olarak belirlendiğinde her akşam yeniden pazarlık etmek gerekmez. Bu not evde uygulayabileceğiniz basit bir plan önerir; bunun için bir uygulama kullanmanız gerekmez.</p>
    <h2>5 adımda aile planı</h2>
    <ol>{step_items}</ol>
    <h2>Haftalık planımız</h2>
    <table>
      <thead><tr><th scope="col">Gün</th><th scope="col">Ekran süresi</th><th scope="col">Ekranlar kapanır</th><th scope="col">Ekran dışı plan</th></tr></thead>
      <tbody>{rows}</tbody>
    </table>
    <h2>Ailemizin kuralları</h2>
    <ol class="lines"><li></li><li></li><li></li></ol>
    <h2>İlk hafta kontrolü</h2>
    <ul class="checks">{check_items}</ul>
    <footer>
      <p><strong>Daha fazla rehber ve yazdırılabilir plan:</strong> alika.tr/rehber</p>
      <p>Bu not, AliKa ebeveyn kontrolü uygulamasının geliştiricisi ErenKa Software tarafından hazırlanmıştır. Planı uygulamak için bir uygulama gerekmez; uygulama kullanmak tamamen isteğe bağlıdır. İletişim: destek@alika.tr</p>
    </footer>
  </main>
  <p class="print"><button type="button" onclick="window.print()">Yazdır / PDF olarak kaydet</button></p>
</body>
</html>
"""


def uk_guide_body() -> str:
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/en/">AliKa</a><span>›</span><span aria-current="page">Windows screen-time guide</span></nav>
        <header>
          <p class="eyebrow">Windows 10/11 · Family screen-time guide</p>
          <h1>Setting a clear screen-time routine on a Windows family PC</h1>
          <p class="guide-lede">A useful screen-time routine starts with an agreed plan: what the limit is, when it applies, and what a child will see when it is reached.</p>
          <p class="guide-disclosure"><strong>Disclosure:</strong> This guide is published by ErenKa Software, the developer of AliKa. AliKa is available for Windows and Android; this guide covers the Windows version. It is not a substitute for a family conversation or for Microsoft&apos;s own product guidance.</p>
        </header>
        <section><h2>Start with the family rule</h2><p>Agree the daily allowance, bedtime period and any difference between school days and weekends before turning on a limit. Keep the first week simple, then review whether everyone understood the rule.</p><p>Explain what will happen at the limit and how an exception can be discussed. A rule that is visible and predictable is easier to use than one that appears without warning.</p></section>
        <section><h2>Where Microsoft Family Safety fits</h2><p>Microsoft Family Safety can be a sensible starting point for families who use a Microsoft family group. Its available options can include screen-time scheduling, app and game limits, and web or search filtering; availability depends on the account, device and browser you use.</p><p>Check Microsoft&apos;s current help before relying on a setting, particularly for web filtering and cross-device behaviour. AliKa does not claim to replace Microsoft Family Safety; families can choose the built-in tools that suit them.</p></section>
        <section><h2>What AliKa is designed to do</h2><p>This guide covers AliKa on Windows 10 and Windows 11 family PCs; an Android version is also available on Google Play. It helps a parent make an agreed rule visible on the child&apos;s screen, including the remaining time and the next step when a limit applies.</p><p>Its approach is consent-based and local-first: it is not designed for secret monitoring. Talk through what information is shown, what is not collected for this guide, and how a child can raise a concern about a rule.</p></section>
        <section><h2>Keep learning rewards bounded</h2><p>If your family chooses to use AliKa&apos;s question flow, a parent sets the question bank, the reward rule and the daily cap. A correct answer can earn a limited amount of extra time only within that family rule.</p><p>Use a small cap at first. The aim is not to promise better learning outcomes or unlimited access, but to make the next step understandable within the routine you have agreed.</p></section>
        <section><h2>A short first-week check</h2><p>Confirm that the schedule works at the intended time, the child can understand the remaining-time display, and the bedtime period fits your household. Change one setting at a time after discussing it together.</p></section>
        <section class="guide-cta"><h2>Review the Windows setup together.</h2><p>AliKa is for Windows 10 and Windows 11. The Microsoft Store page is a product page; it does not ask for a child&apos;s data to read this guide.</p><a class="button" href="{microsoft_store_url('en', UK_CAMPAIGN_ID)}" target="_blank" rel="noopener noreferrer">View AliKa for Windows in Microsoft Store</a></section>
      </article>
    </main>
    """


def content_library(catalog: dict, lang: str) -> str:
    labels = CONTENT_LIBRARY_LABELS[lang]
    bank_labels = QUESTION_BANK_LABELS[lang]
    scope = CONTENT_SCOPE_LABELS[lang]
    country_order = {
        "turkiye": 0,
        "japonya": 1,
        "kore": 2,
        "ingiltere": 3,
        "rusya": 4,
    }
    countries = sorted(
        {row["country_slug"]: row["country"] for row in catalog["grades"]}.items(),
        key=lambda item: (country_order.get(item[0], 99), item[1]),
    )
    grades = sorted(
        {(row["country_slug"], row["grade_slug"], row["grade"]) for row in catalog["grades"]},
        key=lambda item: (
            country_order.get(item[0], 99),
            float(item[2]) if isinstance(item[2], int) else 11.5,
            item[1],
        ),
    )
    country_options = "".join(f'<option value="{esc(slug)}">{esc(name)}</option>' for slug, name in countries)
    grade_options = "".join(
        f'<option value="{esc(grade_slug)}" data-country-option="{esc(country)}">{esc(labels[7].format(grade))}</option>'
        for country, grade_slug, grade in grades
    )
    grade_cards = "".join(f"""
      <article class="grade-download-card" data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <div><small>{esc(row['country'])} · {esc(labels[7].format(row['grade']))}</small>
          <h3>{row['subject_count']} {esc(scope[4])} · {format_count(row['notes'], lang)} {esc(labels[4])} · {format_count(row['questions'], lang)} {esc(labels[5])}</h3>
          <p>{esc(labels[6])}</p></div>
        <a class="button direct-download" href="{esc(row['download_url'])}" download
           data-direct-download>{esc(labels[2])}</a>
      </article>""" for row in catalog["grades"])
    subject_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country_code'])} · {esc(labels[7].format(row['grade']))}</small>
        <h3>{esc(row['subject'])}</h3>
        <p>{format_count(row['notes'], lang)} {esc(labels[4])} · {format_count(row['questions'], lang)} {esc(labels[5])}<br>{esc(labels[6])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download>{esc(labels[3])}</a>
      </article>""" for row in catalog["subjects"])
    question_bank_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country'])} · {esc(labels[7].format(row['grade']))}</small>
        <h3>{esc(row['title'])}</h3>
        <p><strong>{format_count(row['questions'], lang)}</strong> {esc(bank_labels[3])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download>{esc(bank_labels[2])}</a>
      </article>""" for row in catalog.get("question_banks", []))
    question_bank_section = f"""
      <section class="question-bank-section" data-content-collection>
        <div class="question-bank-heading">
          <p class="eyebrow">{format_count(2000, lang)}</p>
          <h2>{esc(bank_labels[0])}</h2>
          <p>{esc(bank_labels[1])}</p>
        </div>
        <div class="package-grid question-bank-grid">{question_bank_cards}</div>
      </section>""" if question_bank_cards else ""
    return f"""
      <div class="content-scope" data-content-scope>
        <p><strong>{esc(scope[0])}</strong> {esc(scope[1])}</p>
        <p class="content-scope-plan"><strong>{esc(scope[2])}</strong> {esc(scope[3])}</p>
      </div>
      <div class="content-filters" data-content-filters>
        <label>{esc(labels[0])}<select data-content-country>{country_options}</select></label>
        <label>{esc(labels[1])}<select data-content-grade>{grade_options}</select></label>
      </div>
      <p class="honesty-note">{esc(labels[8])}</p>
      <div class="grade-downloads">{grade_cards}</div>
      {question_bank_section}
      <div class="package-grid" data-content-grid>{subject_cards}</div>
      <p class="honesty-note">{esc(CONTENT_QUALITY_NOTES[lang])} · <a href="{esc(catalog['source_repository'])}">GitHub</a></p>
    """


def content_page(lang: str, c: dict, catalog: dict) -> str:
    title, desc = c["pages"]["content"]
    detail = content_library(catalog, lang)
    book_labels = CONTENT_BOOK_LABELS[lang]
    country_count = len({row["country_slug"] for row in catalog["grades"]})
    grade_count = len(catalog["grades"])
    subject_count = len(catalog["subjects"])
    return f"""
    <main id="main" class="content-library-main">
      <section class="content-library-stage">
        <div class="content-book-shell">
          <div class="content-book-paper">
            <a class="content-book-back" href="{href(lang)}"><span aria-hidden="true">←</span> {esc(book_labels[0])}</a>
            <header class="content-book-heading">
              <div>
                <p class="eyebrow">{esc(c["content_kicker"])}</p>
                <p class="content-book-overline">{esc(book_labels[1])}</p>
                <h1>{esc(title)}</h1>
                <p>{esc(desc)}</p>
              </div>
              <img src="/assets/brand/alika-logo.png" width="104" height="104" alt="AliKa">
            </header>
            <div class="content-book-stats" aria-label="{esc(c['content_body'])}">
              <span><strong>{country_count}</strong>{esc(book_labels[2])}</span>
              <span><strong>{grade_count}</strong>{esc(book_labels[3])}</span>
              <span><strong>{subject_count}</strong>{esc(book_labels[4])}</span>
            </div>
            <section class="content-book-catalog" aria-label="{esc(title)}">
              {detail}
            </section>
            <footer class="content-book-contact">
              <p>{esc(book_labels[5])}</p>
              <a href="mailto:destek@alika.tr">destek@alika.tr</a>
            </footer>
          </div>
        </div>
      </section>
    </main>
    """


def redirect_document(lang: str, slug: str) -> str:
    return redirect_to(lang, page_href(lang, slug))


def redirect_to(lang: str, target: str) -> str:
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>AliKa</title>
  <meta http-equiv="refresh" content="0; url={target}">
  <script>location.replace({json.dumps(target)});</script>
</head>
<body>
  <p><a href="{target}">AliKa</a></p>
</body>
</html>
"""


def not_found_document(locales: dict[str, dict]) -> str:
    """GitHub Pages bilinmeyen her adreste bunu gösterir; bağlantılar mutlak olmalı."""
    body = """
    <main id="main" class="guide-main">
      <article class="guide-article">
        <header>
          <p class="eyebrow">404</p>
          <h1>Bu sayfa bulunamadı.</h1>
          <p class="guide-lede">Adres değişmiş ya da yanlış yazılmış olabilir. Aşağıdaki bağlantılardan devam edebilirsiniz.</p>
          <p lang="en">Page not found. <a class="text-link" href="/en/">Go to the English home page →</a></p>
        </header>
        <section class="guide-cta">
          <h2>Nereye gitmek istersiniz?</h2>
          <div class="button-row"><a class="button" href="/">Ana sayfa</a><a class="button" href="/icerik/">Hazır içerik</a><a class="button" href="/rehber/">Rehberler</a></div>
        </section>
      </article>
    </main>
    """
    return f"""<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0A1631">
  <meta name="robots" content="noindex">
  <title>Sayfa bulunamadı — AliKa</title>
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="icon" href="/assets/brand/alika-logo.png">
</head>
<body>
  {header(locales, "tr")}
  {body}
  {footer(locales, "tr")}
  <script src="/assets/site.js" defer></script>
</body>
</html>
"""


def write_page(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def build() -> None:
    locales = load_locales()
    if DIST.exists():
        # Python 3.11 yerel geliştirme ortamıyla ve Pages'in 3.12 ortamıyla uyumlu.
        shutil.rmtree(DIST, onerror=clear_readonly_and_retry)
    DIST.mkdir(parents=True)

    shutil.copytree(PUBLIC, DIST / "assets")
    shutil.copy2(SRC / "styles" / "site.css", DIST / "assets" / "site.css")
    shutil.copy2(SRC / "scripts" / "site.js", DIST / "assets" / "site.js")
    shutil.copy2(ROOT / "CNAME", DIST / "CNAME")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    content_root = Path(os.environ.get("ALIKA_CONTENT_ROOT", ROOT / "_content"))
    catalog = build_content_catalog(content_root, DIST)

    # Dil ana sayfaları Vite ile derlenen yeni ana sayfadır (npm run build:home).
    for lang in LANGS:
        c = locales[lang]
        base = DIST if lang == "tr" else DIST / lang
        title, desc = c["pages"]["content"]
        write_page(base / "content" / "index.html", document(locales, lang, f"{title} — AliKa", desc, content_page(lang, c, catalog), "content"))
        for slug in REDIRECT_ANCHORS:
            write_page(base / slug / "index.html", redirect_document(lang, slug))

    guide_index_url = f"{BASE_URL}/{GUIDE_BASE}/"
    write_page(
        DIST / GUIDE_BASE / "index.html",
        guide_document(
            locales,
            "Türkçe Ebeveyn Rehberleri",
            "Windows ve Android’de ekran süresi, ailece plan, ara tatil, soru çözerek süre kazanma ve bulutsuz ebeveyn kontrolü için Türkçe rehberler.",
            guide_index_url,
            guide_index_body(),
        ),
    )
    for guide in PUBLISHED_GUIDES:
        canonical = f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/"
        write_page(
            DIST / GUIDE_BASE / guide["slug"] / "index.html",
            guide_document(locales, guide["title"], guide["description"], canonical, guide_article_body(guide)),
        )

    uk_guide_url = f"{BASE_URL}/{UK_GUIDE_PATH}/"
    write_page(DIST / UK_GUIDE_PATH / "index.html", guide_document(locales, "Windows child screen time: a clear family routine", "A practical UK guide to agreeing screen-time rules on a Windows 10 or Windows 11 family PC, with Microsoft Family Safety context and AliKa's visible, local-first approach.", uk_guide_url, uk_guide_body(), "en"))
    # İngiltere hazırlık sayfası yayından kalktı (iç taslak notları vardı); eski adres rehbere yönlenir.
    write_page(DIST / UK_LANDING_PATH / "index.html", redirect_to("en", f"/{UK_GUIDE_PATH}/"))

    school_url = f"{BASE_URL}/okullar/"
    write_page(
        DIST / "okullar" / "index.html",
        guide_document(
            locales,
            "Okullar ve Rehber Öğretmenler İçin Veli Kaynakları",
            "Ortaokul veli toplantıları için tek sayfalık ekran planı notu ve ailelerin evde birlikte doldurduğu yazdırılabilir planlar.",
            school_url,
            school_body(),
            schema_type="WebPage",
        ),
    )
    # Veli notu yazdırma sayfasıdır (noindex); PDF'i public/okullar/ altındadır.
    write_page(DIST / "okullar" / "veli-notu" / "index.html", school_kit_document())

    write_page(DIST / "404.html", not_found_document(locales))

    # Uygulamadaki sabit, Türkçe ve anlaşılır içerik adresi.
    (DIST / "icerik").mkdir(exist_ok=True)
    shutil.copy2(DIST / "content" / "index.html", DIST / "icerik" / "index.html")

    for name in ("privacy", "eula"):
        source = ROOT / "legal" / f"{name}.html"
        shutil.copy2(source, DIST / f"{name}.html")
        target = DIST / name
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target / "index.html")
    shutil.copy2(ROOT / "legal" / "privacy.html", DIST / "privacy-policy.html")
    for name in LEGAL_TR:
        target = DIST / name
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / "legal" / "tr" / f"{name}.html", target / "index.html")

    urls = [f"{BASE_URL}/"]
    for lang in LANGS:
        urls.append(f"{BASE_URL}{href(lang)}")
        urls.append(f"{BASE_URL}{href(lang, 'content')}")
    urls.extend((f"{BASE_URL}/privacy/", f"{BASE_URL}/eula/", guide_index_url))
    urls.extend(f"{BASE_URL}/{name}/" for name in LEGAL_TR)
    urls.extend(f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/" for guide in PUBLISHED_GUIDES)
    urls.append(school_url)
    urls.append(uk_guide_url)
    unique_urls = list(dict.fromkeys(urls))
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "".join(f"  <url><loc>{esc(url)}</loc></url>\n" for url in unique_urls)
    sitemap += "</urlset>\n"
    write_page(DIST / "sitemap.xml", sitemap)
    write_page(DIST / "robots.txt", f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n")

    generated = sum(1 for p in DIST.rglob("*") if p.is_file())
    print(f"Built {generated} files in {DIST}")


if __name__ == "__main__":
    build()
