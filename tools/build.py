from __future__ import annotations

import html
import json
import os
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
    "tr": ("Ülke", "Sınıf", "Tüm dersleri indir", "Dersi indir", "konu anlatımı", "soru", "Codex öz-denetimli · Makine doğrulamalı", "{}. sınıf", "ZIP'i çıkarmayın. AliKa'da İçerik ekle'yi açıp sınıf ZIP dosyasını doğrudan seçin veya ZIP'i hazır klasöre koyup Hazır klasörü tara'yı kullanın."),
    "en": ("Country", "Grade", "Download all subjects", "Download subject", "lessons", "questions", "Codex self-audited · Machine validated", "Grade {}", "Do not extract the ZIP. Select the class ZIP directly from Add content in AliKa, or place it in the prepared folder and scan it."),
    "de": ("Land", "Klasse", "Alle Fächer herunterladen", "Fach herunterladen", "Lektionen", "Fragen", "Codex-Selbstprüfung · Maschinell validiert", "Klasse {}", "ZIP nicht entpacken. Wählen Sie die Klassen-ZIP direkt über Inhalte hinzufügen in AliKa oder legen Sie sie im vorbereiteten Ordner ab und starten Sie den Scan."),
    "es": ("País", "Curso", "Descargar todas las asignaturas", "Descargar asignatura", "lecciones", "preguntas", "Autoauditoría de Codex · Validación automática", "Curso {}", "No extraiga el ZIP. Seleccione directamente el ZIP del curso en Añadir contenido de AliKa o colóquelo en la carpeta preparada y analícela."),
    "fr": ("Pays", "Niveau", "Télécharger toutes les matières", "Télécharger la matière", "leçons", "questions", "Auto-audit Codex · Validation automatique", "Niveau {}", "Ne décompressez pas le ZIP. Sélectionnez-le directement dans Ajouter du contenu d’AliKa ou placez-le dans le dossier préparé puis lancez l’analyse."),
    "pt": ("País", "Ano", "Transferir todas as disciplinas", "Transferir disciplina", "lições", "perguntas", "Autoauditoria Codex · Validação automática", "Ano {}", "Não extraia o ZIP. Selecione o ZIP do ano diretamente em Adicionar conteúdo no AliKa ou coloque-o na pasta preparada e faça a leitura."),
    "ru": ("Страна", "Класс", "Скачать все предметы", "Скачать предмет", "уроков", "вопросов", "Самопроверка Codex · Машинная валидация", "Класс {}", "Не распаковывайте ZIP. Выберите архив класса через Добавить материалы в AliKa или поместите его в подготовленную папку и запустите сканирование."),
    "ja": ("国", "学年", "全教科をダウンロード", "教科をダウンロード", "レッスン", "問題", "Codex自己監査済み・機械検証済み", "{}年生", "ZIPは展開せず、AliKaの「コンテンツを追加」から学年ZIPを直接選ぶか、準備済みフォルダーに置いてスキャンしてください。"),
    "ko": ("국가", "학년", "모든 과목 다운로드", "과목 다운로드", "수업", "문제", "Codex 자체 감사 · 자동 검증", "{}학년", "ZIP을 풀지 마세요. AliKa의 콘텐츠 추가에서 학년 ZIP을 직접 선택하거나 준비 폴더에 넣고 스캔하세요."),
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
        "video": "windows-soru-coz",
        "video_label": "Soru çöz, ek süre kazan · 0:33",
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
                "Beklenmeyen bir engel veya lisans sorunu görürseniz reklam ya da geniş tanıtım yapmadan önce alika.destek@gmail.com adresine bildirin.",
            )),
        ),
    },
    {
        "slug": "soru-cozerek-ekran-suresi-kazanma",
        "campaign_id": "site_rehber_soru_coz_tr",
        "android_note": (
            "Soru çözerek süre kazanma Android telefon ve tablette de aynı kuralla çalışır: ebeveyn bir dakika için gereken doğru cevap sayısını ve günlük kazanım tavanını belirler, yanlış cevap süre kazandırmaz. Sorular tek tek ya da CSV, TXT ve Excel dosyasıyla eklenebilir.",
            "Bu rehberdeki ayrıntılar Windows sürümünden alınmıştır; Android’de ekranlar ve bazı ayrıntılar farklı olabilir. Android aile aboneliği Google Play’de 14 gün ücretsiz denemeyle başlar; Windows satın alımı Android’i kapsamaz.",
        ),
        "title": "Soru Çözerek Ekran Süresi Kazanma: AliKa Nasıl Çalışır?",
        "description": "Çocuğun soru çözerek kontrollü ek süre kazanmasını; soru bankası, ödül oranı ve günlük tavan ayarlarıyla adım adım öğrenin.",
        "video": "windows-soru-coz",
        "video_label": "Soru çöz, ek süre kazan · 0:33",
        "lede": (
            "Ekran süresini yalnızca kesmek yerine bir kısmını öğrenmeyle ilişkilendirmek mümkün. "
            "AliKa’da çocuk, ebeveynin eklediği soru bankasından sorular çözer; doğru cevaplar "
            "ebeveynin belirlediği orana göre kontrollü ek süreye dönüşür."
        ),
        "sections": (
            ("Sorular nereden gelir?", (
                "Sorular yalnız ebeveynin ekleyip kullanıma açtığı bankadan gelir. Hazır ödev veya otomatik olarak çocuğa gönderilen sınırsız içerik iddiası yoktur.",
                "Soruları tek tek ekleyebilir veya CSV/XLSX soru bankası içe aktarabilirsiniz. PDF ve EPUB dosyaları ise Kütüphane belgesi olarak kullanılır; soru bankasıyla aynı şey değildir.",
            )),
            ("Kaç doğru cevap kaç dakika kazandırır?", (
                "Ödül oranını ebeveyn belirler. Bir videoda görülen “iki doğru, bir dakika” yalnız örnek ayardır; ürünün değişmez kuralı değildir.",
                "Başlangıçta küçük bir ödül oranı seçin ve çocuğun soruyu okuyarak mı, rastgele mi ilerlediğini gözleyin.",
            )),
            ("Günlük kazanım tavanı neden önemlidir?", (
                "Doğru cevaplar sınırsız süre üretmez. Çocuğun bir günde kazanabileceği en yüksek ek süreyi ebeveyn belirler.",
                "Bu tavan, öğrenme akışının ailece konuşulan toplam ekran düzenini bozmasını önler.",
            )),
            ("Çocuk soru ekranında ne görür?", (
                "Çocuk soruyu, seçenekleri, ilerlemeyi ve varsa açıklamayı görür. Kazanılan süre, günlük üst sınırla birlikte görünür tutulur.",
                "İlk turda çocuğun yanında olun; düğmelerin, açıklamanın ve süre kazanımının doğru anlaşıldığını kontrol edin.",
            )),
            ("Yanlış cevap ve tekrar akışı nasıl çalışır?", (
                "Yanlış cevap ek süre kazandırmaz. Doğru seçenek ve varsa açıklama gösterilir. Aynı soru hemen yeniden gelmez; araya en az iki farklı soru girer.",
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
            "Android aile aboneliği Google Play üzerinden alınır; abonelik ve dağıtım Google Play’in kendi hizmetidir. Windows satın alımı Android’i kapsamaz.",
        ),
        "title": "Bulut Hesabı Olmadan Ebeveyn Kontrolü Nasıl Çalışır?",
        "description": "AliKa’nın cihazda kalan verilerle, reklamsız ve zorunlu bulut hesabı olmadan nasıl çalıştığını; yerel aile ağının sınırlarını öğrenin.",
        "lede": (
            "Bir ebeveyn kontrolü uygulamasında yalnız “ne yapıyor?” değil, “veri nereye gidiyor?” sorusu da önemlidir. "
            "AliKa’nın temel kullanım kayıtları cihazda tutulur; reklam, üçüncü taraf analitik ve zorunlu AliKa bulut hesabı bulunmaz."
        ),
        "sections": (
            ("Hangi kayıtlar cihazda tutulur?", (
                "Ekran süresi kuralları, uygulama kullanım süreleri, öğrenme sonuçları ve raporlar cihazda işlenir. Ebeveyn paneli toplanan kayıtları görünür kılar.",
                "AliKa’nın kendi bulut eşitleme hizmeti veya ürün kullanım telemetrisi yoktur.",
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
)

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
    nav_slugs = ("how-it-works", "ecosystem", "features", "age-groups", "content")
    nav = "".join(
        f'<a href="{page_href(lang, item)}">{esc(label)}</a>'
        for item, label in zip(nav_slugs, c["nav"])
    )
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
        <a class="button button-small" href="{page_href(lang, 'downloads')}">{esc(c["get"])}</a>
      </div>
    </header>
    """


def footer(locales: dict[str, dict], lang: str) -> str:
    c = locales[lang]
    return f"""
    <footer class="site-footer">
      <div class="footer-brand">
        <img src="/assets/brand/alika-logo.png" width="52" height="52" alt="">
        <div><strong>AliKa</strong><span>{esc(c["final_body"])}</span></div>
      </div>
      <div class="footer-links">
        <a href="{page_href(lang, 'roadmap')}">{esc(c["pages"]["roadmap"][0])}</a>
        <a href="{page_href(lang, 'contact')}">{esc(c["support"])}</a>
        <a href="/privacy/">{esc(c["privacy"])}</a>
        <a href="/eula/">{esc(c["eula"])}</a>
      </div>
      <p>© 2026 ErenKa Software · <a href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a></p>
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




def guide_document(locales: dict[str, dict], title: str, description: str, canonical: str, body: str, lang: str = "tr") -> str:
    article_schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "mainEntityOfPage": canonical,
        "inLanguage": "en-GB" if lang == "en" else "tr-TR",
        "author": {"@type": "Organization", "name": "ErenKa Software"},
        "publisher": {"@type": "Organization", "name": "ErenKa Software"},
        "dateModified": "2026-08-28",
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
        for guide in GUIDES
    )
    return f"""
    <main id="main" class="guide-main">
      <header class="guide-index-hero">
        <p class="eyebrow">Windows 10/11 · Dijital ebeveynlik</p>
        <h1>Ekran süresi için açık, uygulanabilir rehberler.</h1>
        <p>Kuralları önceden konuşmak, öğrenme akışını sınırlı tutmak ve verinin nereye gittiğini bilmek için hazırlanmış Türkçe kaynaklar.</p>
      </header>
      <section class="article-grid" aria-label="Türkçe ebeveyn rehberleri">{cards}</section>
      <aside class="guide-disclosure"><strong>Açıklık notu:</strong> Bu rehberler AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. AliKa Windows ve Android için ücretli bir uygulamadır. Windows sürümü Microsoft Store’da 7 günlük deneme ve ₺80 fiyatla, Android aile aboneliği Google Play’de 14 günlük denemeyle sunulur.</aside>
    </main>
    """


def guide_article_body(guide: dict) -> str:
    sections = "".join(
        f'<section><h2>{esc(heading)}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in paragraphs)}</section>'
        for heading, paragraphs in guide["sections"]
    )
    # Video dosyası sitede durur ve sayfada oynar; tıklanana kadar yalnız kapak görseli yüklenir.
    video = f'/videos/kurulum/{guide["video"]}' if guide.get("video") else ""
    video_aside = (
        f'<aside class="guide-video"><div><strong>Gerçek ürün akışını izleyin</strong><span>{esc(guide["video_label"])}</span></div>'
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
    store_button = f'<a class="button" href="{microsoft_store_url("tr", guide.get("campaign_id"))}" target="_blank" rel="noopener noreferrer">Microsoft Store’da 7 günlük denemeyi açın</a>'
    if android_note:
        eyebrow = "Windows ve Android · AliKa ebeveyn rehberi"
        disclosure = "AliKa Windows ve Android için ücretli bir uygulamadır."
        play_href = esc(play_store_url("tr", guide["campaign_id"], "rehber"))
        cta = (
            '<section class="guide-cta"><h2>Windows’ta ya da Android’de deneyin.</h2>'
            '<p>Windows sürümünü Microsoft Store’da 7 gün ücretsiz deneyebilirsiniz; deneme sonrası fiyat ₺80’dir. '
            'Android aile aboneliği Google Play’de 14 gün ücretsiz denemeyle başlar.</p>'
            f'<div class="button-row">{store_button}<a class="button" href="{play_href}" target="_blank" rel="noopener noreferrer">Google Play’de açın</a></div></section>'
        )
    else:
        eyebrow = "Windows 10/11 · AliKa ebeveyn rehberi"
        disclosure = "AliKa ücretli bir Windows uygulamasıdır."
        cta = (
            '<section class="guide-cta"><h2>Windows bilgisayarınızda birlikte deneyin.</h2>'
            '<p>AliKa’yı Windows 10/11 için 7 gün ücretsiz deneyebilir, ilk kuralı ve çocuk ekranını kontrol edebilirsiniz. Deneme sonrası fiyat ₺80’dir.</p>'
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
          <p class="guide-disclosure"><strong>Açıklık notu:</strong> Bu içerik AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. {disclosure}</p>
        </header>
        {sections}
        {android_section}
        {video_aside}
        {cta}
      </article>
    </main>
    """


def uk_guide_body() -> str:
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="/en/">AliKa</a><span>›</span><a href="/en/uk-windows-screen-time/">UK Windows guide</a></nav>
        <header>
          <p class="eyebrow">Windows 10/11 · Family screen-time guide</p>
          <h1>Setting a clear screen-time routine on a Windows family PC</h1>
          <p class="guide-lede">A useful screen-time routine starts with an agreed plan: what the limit is, when it applies, and what a child will see when it is reached.</p>
          <p class="guide-disclosure"><strong>Disclosure:</strong> This guide is published by ErenKa Software, the developer of AliKa. AliKa is a Windows application; this is not a substitute for a family conversation or for Microsoft&apos;s own product guidance.</p>
        </header>
        <section><h2>Start with the family rule</h2><p>Agree the daily allowance, bedtime period and any difference between school days and weekends before turning on a limit. Keep the first week simple, then review whether everyone understood the rule.</p><p>Explain what will happen at the limit and how an exception can be discussed. A rule that is visible and predictable is easier to use than one that appears without warning.</p></section>
        <section><h2>Where Microsoft Family Safety fits</h2><p>Microsoft Family Safety can be a sensible starting point for families who use a Microsoft family group. Its available options can include screen-time scheduling, app and game limits, and web or search filtering; availability depends on the account, device and browser you use.</p><p>Check Microsoft&apos;s current help before relying on a setting, particularly for web filtering and cross-device behaviour. AliKa does not claim to replace Microsoft Family Safety; families can choose the built-in tools that suit them.</p></section>
        <section><h2>What AliKa is designed to do</h2><p>AliKa is for Windows 10 and Windows 11 family PCs. It helps a parent make an agreed rule visible on the child&apos;s screen, including the remaining time and the next step when a limit applies.</p><p>Its approach is consent-based and local-first: it is not designed for secret monitoring. Talk through what information is shown, what is not collected for this guide, and how a child can raise a concern about a rule.</p></section>
        <section><h2>Keep learning rewards bounded</h2><p>If your family chooses to use AliKa&apos;s question flow, a parent sets the question bank, the reward rule and the daily cap. A correct answer can earn a limited amount of extra time only within that family rule.</p><p>Use a small cap at first. The aim is not to promise better learning outcomes or unlimited access, but to make the next step understandable within the routine you have agreed.</p></section>
        <section><h2>A short first-week check</h2><p>Confirm that the schedule works at the intended time, the child can understand the remaining-time display, and the bedtime period fits your household. Change one setting at a time after discussing it together.</p></section>
        <section class="guide-cta"><h2>Review the Windows setup together.</h2><p>AliKa is for Windows 10 and Windows 11. The Microsoft Store page is a product page; it does not ask for a child&apos;s data to read this guide.</p><a class="button" href="{microsoft_store_url('en', UK_CAMPAIGN_ID)}" target="_blank" rel="noopener noreferrer">View AliKa for Windows in Microsoft Store</a></section>
      </article>
    </main>
    """


def uk_landing_body() -> str:
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <header>
          <p class="eyebrow">UK preparation page · Windows 10/11</p>
          <h1>Make the screen-time plan clear before the screen turns off.</h1>
          <p class="guide-lede">AliKa is a Windows family tool for making parent-agreed limits and next steps visible. This UK page is a preparation draft, not a request for child information.</p>
        </header>
        <section><h2>For a Windows family PC</h2><p>AliKa is designed for Windows 10 and Windows 11. Set up the routine with the parent and child present, so the limit, bedtime rule and any exception process can be understood together.</p></section>
        <section><h2>Use the tools that fit your household</h2><p>Microsoft Family Safety offers built-in family options that may suit your needs. AliKa is not presented as a replacement for it; the guide explains how a visible, consent-based and local-first AliKa routine can sit alongside the tools your family chooses.</p></section>
        <section><h2>Campaign measurement, without child data</h2><p>If this page is approved for community sharing, the campaign records only aggregated page visits and Store-click counts for its campaign link. It does not ask for child profiles, browsing histories, installation logs or personal contact details.</p></section>
        <section class="guide-cta"><h2>Read the practical guide first.</h2><p>Review the steps and Windows requirements before deciding whether AliKa is right for your household.</p><a class="button" href="/en/guides/windows-child-screen-time/">Read the UK Windows screen-time guide</a><p><a class="text-link" href="{microsoft_store_url('en', UK_CAMPAIGN_ID)}" target="_blank" rel="noopener noreferrer">Open AliKa in Microsoft Store ↗</a></p></section>
        <aside class="guide-disclosure"><strong>Publication status:</strong> Prepared for review. Community moderation, local-language and product/legal claim review remain required before any external sharing.</aside>
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
          <h3>{row['subject_count']} {esc(scope[4])} · {row['notes']} {esc(labels[4])} · {row['questions']} {esc(labels[5])}</h3>
          <p>{esc(labels[6])}</p></div>
        <a class="button direct-download" href="{esc(row['download_url'])}" download
           data-direct-download>{esc(labels[2])}</a>
      </article>""" for row in catalog["grades"])
    subject_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country_code'])} · {esc(labels[7].format(row['grade']))}</small>
        <h3>{esc(row['subject'])}</h3>
        <p>{row['notes']} {esc(labels[4])} · {row['questions']} {esc(labels[5])}<br>{esc(labels[6])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download>{esc(labels[3])}</a>
      </article>""" for row in catalog["subjects"])
    question_bank_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country'])} · {esc(labels[7].format(row['grade']))}</small>
        <h3>{esc(row['title'])}</h3>
        <p><strong>{row['questions']:,}</strong> {esc(bank_labels[3])}<br>{esc(bank_labels[1])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download>{esc(bank_labels[2])}</a>
      </article>""" for row in catalog.get("question_banks", []))
    question_bank_section = f"""
      <section class="question-bank-section" data-content-collection>
        <div class="question-bank-heading">
          <p class="eyebrow">2.000</p>
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
      <p class="honesty-note">{esc(catalog['quality_disclosure'])} · <a href="{esc(catalog['source_repository'])}">GitHub</a></p>
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
              <a href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a>
            </footer>
          </div>
        </div>
      </section>
    </main>
    """


def redirect_document(lang: str, slug: str) -> str:
    target = page_href(lang, slug)
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
            "Windows 10/11 ekran süresi, öğrenerek süre kazanma ve bulutsuz ebeveyn kontrolü için uygulanabilir Türkçe rehberler.",
            guide_index_url,
            guide_index_body(),
        ),
    )
    for guide in GUIDES:
        canonical = f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/"
        write_page(
            DIST / GUIDE_BASE / guide["slug"] / "index.html",
            guide_document(locales, guide["title"], guide["description"], canonical, guide_article_body(guide)),
        )

    uk_guide_url = f"{BASE_URL}/{UK_GUIDE_PATH}/"
    write_page(DIST / UK_GUIDE_PATH / "index.html", guide_document(locales, "Windows child screen time: a clear family routine", "A practical UK guide to agreeing screen-time rules on a Windows 10 or Windows 11 family PC, with Microsoft Family Safety context and AliKa's visible, local-first approach.", uk_guide_url, uk_guide_body(), "en"))
    uk_landing_url = f"{BASE_URL}/{UK_LANDING_PATH}/"
    write_page(DIST / UK_LANDING_PATH / "index.html", guide_document(locales, "AliKa for UK Windows family screen time", "A preparation page for a clear, consent-based screen-time routine on Windows 10 and Windows 11 family PCs.", uk_landing_url, uk_landing_body(), "en"))

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

    urls = [f"{BASE_URL}/"]
    for lang in LANGS:
        urls.append(f"{BASE_URL}{href(lang)}")
        urls.append(f"{BASE_URL}{href(lang, 'content')}")
    urls.extend((f"{BASE_URL}/privacy/", f"{BASE_URL}/eula/", guide_index_url))
    urls.extend(f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/" for guide in GUIDES)
    urls.extend((uk_guide_url, uk_landing_url))
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
