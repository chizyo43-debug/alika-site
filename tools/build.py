from __future__ import annotations

import html
import json
import os
import shutil
import stat
from pathlib import Path

from content_catalog import build_content_catalog


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / "dist"
PUBLIC = ROOT / "public"
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
STORE_MARKETS = {
    "tr": {"cid": "site_home_tr", "price": "80.00", "currency": "TRY"},
    "ja": {"cid": "site_home_ja", "price": "230", "currency": "JPY"},
    "ko": {"cid": "site_home_ko", "price": "2500", "currency": "KRW"},
}
GUIDE_BASE = "rehber"
SLUGS = (
    "how-it-works",
    "ecosystem",
    "features",
    "age-groups",
    "content",
    "updates",
    "roadmap",
    "downloads",
    "contact",
)

GUIDES = (
    {
        "slug": "windows-11-cocuk-ekran-suresi",
        "title": "Windows 11’de Çocuk Ekran Süresi Nasıl Sınırlandırılır?",
        "description": "Windows 11’de günlük süre, uygulama ve web sitesi limitlerini görünür kurallarla ayarlayın. AliKa ebeveyn panelini adım adım inceleyin.",
        "video": "https://youtu.be/sXvHkeOegIo",
        "video_label": "Çocuk ve kurallar video rehberini izleyin",
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
        "title": "Soru Çözerek Ekran Süresi Kazanma: AliKa Nasıl Çalışır?",
        "description": "Çocuğun soru çözerek kontrollü ek süre kazanmasını; soru bankası, ödül oranı ve günlük tavan ayarlarıyla adım adım öğrenin.",
        "video": "https://youtu.be/cMxuoJaG77E",
        "video_label": "Soru çözerek süre kazanma video rehberini izleyin",
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
        "title": "Bulut Hesabı Olmadan Ebeveyn Kontrolü Nasıl Çalışır?",
        "description": "AliKa’nın cihazda kalan verilerle, reklamsız ve zorunlu bulut hesabı olmadan nasıl çalıştığını; yerel aile ağının sınırlarını öğrenin.",
        "video": "https://youtu.be/cxzZrfLhJjE",
        "video_label": "Gizlilik ve yerel veri video rehberini izleyin",
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

SCREEN_LABELS = {
    "tr": ("Çocuk", "Ebeveyn", "Sorular", "Raporlar"),
    "en": ("Child", "Parent", "Questions", "Reports"),
    "de": ("Kind", "Eltern", "Aufgaben", "Berichte"),
    "es": ("Niño", "Familia", "Preguntas", "Informes"),
    "fr": ("Enfant", "Parent", "Questions", "Rapports"),
    "pt": ("Criança", "Família", "Questões", "Relatórios"),
    "ru": ("Ребёнок", "Родитель", "Задания", "Отчёты"),
    "ja": ("子ども", "保護者", "問題", "レポート"),
    "ko": ("자녀", "보호자", "문제", "리포트"),
}

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

GUIDE_LABELS = {
    "tr": ("Ekran ekran AliKa", "Her menünün nerede olduğunu, ne işe yaradığını ve nasıl kullanıldığını kısa örneklerle görün.", "Nerede?", "Ne işe yarar?", "Nasıl kullanılır?", "Kurallar", "Odam ve Vitrin", "Çalışan özelliği izle"),
    "en": ("AliKa, screen by screen", "See where every menu is, what it does and how to use it through short examples.", "Where?", "What does it do?", "How to use it?", "Rules", "Room & Showcase", "Watch the feature"),
    "de": ("AliKa, Bildschirm für Bildschirm", "Sehen Sie mit kurzen Beispielen, wo jedes Menü liegt, was es tut und wie es benutzt wird.", "Wo?", "Wozu dient es?", "Wie wird es benutzt?", "Regeln", "Zimmer & Schaufenster", "Funktion ansehen"),
    "es": ("AliKa, pantalla por pantalla", "Vea dónde está cada menú, para qué sirve y cómo se usa con ejemplos breves.", "¿Dónde?", "¿Para qué sirve?", "¿Cómo se usa?", "Reglas", "Habitación y escaparate", "Ver la función"),
    "fr": ("AliKa, écran par écran", "Découvrez où se trouve chaque menu, son rôle et son utilisation avec de courts exemples.", "Où ?", "À quoi sert-il ?", "Comment l’utiliser ?", "Règles", "Chambre et vitrine", "Voir la fonction"),
    "pt": ("AliKa, ecrã a ecrã", "Veja onde fica cada menu, para que serve e como usar através de exemplos curtos.", "Onde?", "Para que serve?", "Como usar?", "Regras", "Quarto e vitrine", "Ver a função"),
    "ru": ("AliKa, экран за экраном", "Узнайте, где находится каждое меню, зачем оно нужно и как им пользоваться.", "Где?", "Для чего?", "Как пользоваться?", "Правила", "Комната и витрина", "Посмотреть функцию"),
    "ja": ("画面ごとにわかるAliKa", "各メニューの場所、役割、使い方を短い例で確認できます。", "場所", "できること", "使い方", "ルール", "マイルームとショーケース", "機能を見る"),
    "ko": ("화면별로 보는 AliKa", "각 메뉴의 위치, 역할, 사용 방법을 짧은 예시로 확인하세요.", "위치", "기능", "사용 방법", "기능 규칙", "내 방과 쇼케이스", "기능 보기"),
}

HOW_TEXT = {
    "tr": (
        "Ana ekranda kalan süreyi görün; tek dokunuşla soru çözmeye veya Odam’a geçin.",
        "Ebeveyn PIN’iyle açın. Bugün özetinden kurallara, raporlara ve ayarlara ilerleyin.",
        "Günlük toplamı, uygulama limitini, gece saatini veya engeli seçip Kaydet’e basın.",
        "Haftalık, Sorular, Geçmiş ve Olaylar alt menülerinden yalnız ihtiyaç duyduğunuz ayrıntıyı açın.",
        "Bir cevap seçin. Doğru cevap ödül ilerlemesine eklenir; tanımlı eşik dolunca süre kazanılır.",
        "Kazanılan altınla kozmetik seçin; rozetleri ve seri ilerlemesini aynı alanda izleyin.",
    ),
    "en": (
        "See remaining time on Home; open Questions or My Room with one tap.",
        "Unlock with the parent PIN, then move from Today to Rules, Reports or Settings.",
        "Choose a daily total, app limit, night schedule or block, then press Save.",
        "Open only the detail you need under Weekly, Questions, History or Events.",
        "Choose an answer. Correct answers fill reward progress; the configured threshold grants time.",
        "Use earned gold for cosmetics and follow badges and streak progress in one place.",
    ),
    "de": (
        "Restzeit auf Start sehen; mit einem Tipp Aufgaben oder Zimmer öffnen.",
        "Mit der Eltern-PIN öffnen und von Heute zu Regeln, Berichten oder Einstellungen wechseln.",
        "Tageslimit, App-Limit, Nachtzeit oder Sperre wählen und Speichern drücken.",
        "Unter Woche, Aufgaben, Verlauf oder Ereignisse nur das benötigte Detail öffnen.",
        "Antwort wählen. Richtige Antworten füllen den Fortschritt; am festgelegten Ziel gibt es Zeit.",
        "Verdientes Gold für Kosmetik nutzen und Abzeichen sowie Serien gemeinsam verfolgen.",
    ),
    "es": (
        "Vea el tiempo restante en Inicio y abra Preguntas o Mi habitación con un toque.",
        "Abra con el PIN parental y pase de Hoy a Reglas, Informes o Ajustes.",
        "Elija total diario, límite de app, horario nocturno o bloqueo y pulse Guardar.",
        "Abra solo el detalle necesario en Semana, Preguntas, Historial o Eventos.",
        "Elija una respuesta. Los aciertos llenan el progreso y el umbral configurado concede tiempo.",
        "Use el oro ganado en cosméticos y siga insignias y rachas en un solo lugar.",
    ),
    "fr": (
        "Consultez le temps restant sur l’accueil puis ouvrez Questions ou Ma chambre.",
        "Ouvrez avec le PIN parent puis accédez à Aujourd’hui, Règles, Rapports ou Réglages.",
        "Choisissez total quotidien, limite d’app, horaire de nuit ou blocage puis enregistrez.",
        "Ouvrez seulement le détail utile dans Semaine, Questions, Historique ou Événements.",
        "Choisissez une réponse. Les bonnes réponses remplissent la progression puis accordent du temps.",
        "Utilisez l’or gagné pour les objets cosmétiques et suivez badges et séries.",
    ),
    "pt": (
        "Veja o tempo restante no início e abra Questões ou Meu quarto com um toque.",
        "Abra com o PIN dos pais e avance de Hoje para Regras, Relatórios ou Definições.",
        "Escolha total diário, limite de app, horário noturno ou bloqueio e guarde.",
        "Abra só o detalhe necessário em Semana, Questões, Histórico ou Eventos.",
        "Escolha uma resposta. As respostas certas enchem o progresso e concedem tempo no limite definido.",
        "Use o ouro ganho em cosméticos e acompanhe emblemas e séries no mesmo local.",
    ),
    "ru": (
        "На главном экране смотрите остаток времени и одним касанием открывайте задания или комнату.",
        "Откройте родительским PIN-кодом и перейдите из «Сегодня» в Правила, Отчёты или Настройки.",
        "Выберите общий лимит, лимит приложения, ночное время или блокировку и нажмите Сохранить.",
        "Открывайте нужное в разделах Неделя, Задания, История или События.",
        "Выберите ответ. Верные ответы заполняют прогресс, а заданный порог даёт время.",
        "Тратьте заработанное золото на оформление и следите за значками и сериями.",
    ),
    "ja": (
        "ホームで残り時間を確認し、ワンタップで問題またはマイルームを開きます。",
        "保護者PINで開き、今日からルール、レポート、設定へ進みます。",
        "1日の合計、アプリ制限、夜間時間、ブロックを選んで保存します。",
        "週間、問題、履歴、イベントから必要な詳細だけを開きます。",
        "答えを選びます。正解で進捗がたまり、設定した基準で時間を獲得します。",
        "獲得したゴールドでアイテムを選び、バッジと連続記録を確認します。",
    ),
    "ko": (
        "홈에서 남은 시간을 보고 한 번 눌러 문제 또는 내 방을 엽니다.",
        "보호자 PIN으로 열고 오늘에서 규칙, 리포트, 설정으로 이동합니다.",
        "일일 총량, 앱 제한, 야간 시간 또는 차단을 선택하고 저장합니다.",
        "주간, 문제, 기록, 이벤트에서 필요한 세부 정보만 엽니다.",
        "답을 고릅니다. 정답이 보상 진행도를 채우고 설정된 기준에서 시간을 얻습니다.",
        "획득한 골드로 꾸미기 아이템을 고르고 배지와 연속 기록을 확인합니다.",
    ),
}

DOWNLOAD_LABELS = {
    "tr": ("Pilot içerik paketini indir", "Türkiye 5. sınıf için üretim aşamasındaki içerik havuzu. Kalite incelemesi sürüyor; ZIP GitHub sayfası açılmadan doğrudan indirilir.", "Pilot paketi indir", "İndiriliyor…", "İndirme hazır", "Doğrudan indirme açılamadı; tekrar deneyin."),
    "en": ("Download the pilot content pack", "A work-in-progress Grade 5 content pool for Türkiye. Quality review continues; the ZIP downloads without opening GitHub.", "Download pilot pack", "Downloading…", "Download ready", "Direct download could not start. Please try again."),
    "de": ("Pilot-Inhaltspaket laden", "Inhalte für die 5. Klasse in der Türkei in laufender Qualitätsprüfung. Die ZIP-Datei wird direkt geladen.", "Pilotpaket laden", "Wird geladen…", "Download bereit", "Direkter Download konnte nicht starten."),
    "es": ("Descargar el paquete piloto", "Contenido de 5.º de Türkiye aún en revisión de calidad. El ZIP se descarga sin abrir GitHub.", "Descargar piloto", "Descargando…", "Descarga lista", "No se pudo iniciar la descarga directa."),
    "fr": ("Télécharger le pack pilote", "Contenus niveau 5 en Türkiye encore en contrôle qualité. Le ZIP se télécharge sans ouvrir GitHub.", "Télécharger le pilote", "Téléchargement…", "Téléchargement prêt", "Le téléchargement direct n’a pas démarré."),
    "pt": ("Transferir o pacote piloto", "Conteúdo do 5.º ano na Türkiye ainda em revisão de qualidade. O ZIP é transferido sem abrir o GitHub.", "Transferir piloto", "A transferir…", "Transferência pronta", "Não foi possível iniciar a transferência."),
    "ru": ("Скачать пилотный пакет", "Материалы для 5 класса Турции ещё проходят проверку качества. ZIP скачивается без открытия GitHub.", "Скачать пилот", "Загрузка…", "Файл готов", "Не удалось начать прямую загрузку."),
    "ja": ("パイロット教材をダウンロード", "トルコの小学5年生向け教材は品質確認中です。GitHubを開かずZIPを直接ダウンロードします。", "パイロット版をダウンロード", "ダウンロード中…", "準備完了", "直接ダウンロードを開始できませんでした。"),
    "ko": ("파일럿 콘텐츠 팩 다운로드", "튀르키예 5학년 콘텐츠는 아직 품질 검토 중입니다. GitHub을 열지 않고 ZIP을 바로 받습니다.", "파일럿 팩 다운로드", "다운로드 중…", "다운로드 준비됨", "직접 다운로드를 시작하지 못했습니다."),
}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def href(lang: str, slug: str = "") -> str:
    prefix = "" if lang == "tr" else f"/{lang}"
    return f"{prefix}/{slug + '/' if slug else ''}"


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
    nav_slugs = ("how-it-works", "ecosystem", "features", "age-groups", "content", "updates")
    nav = "".join(
        f'<a href="{href(lang, item)}">{esc(label)}</a>'
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
        <a class="button button-small" href="{href(lang, 'downloads')}">{esc(c["get"])}</a>
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
        <a href="{href(lang, 'roadmap')}">{esc(c["pages"]["roadmap"][0])}</a>
        <a href="{href(lang, 'contact')}">{esc(c["support"])}</a>
        <a href="/privacy/">{esc(c["privacy"])}</a>
        <a href="/eula/">{esc(c["eula"])}</a>
      </div>
      <p>© 2026 ErenKa Software · <a href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a></p>
    </footer>
    """


def store_market(lang: str) -> dict[str, str]:
    return STORE_MARKETS.get(lang, STORE_MARKETS["tr"])


def microsoft_store_url(lang: str) -> str:
    return f'{MICROSOFT_STORE_BASE_URL}?cid={store_market(lang)["cid"]}'


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
  {software_application_schema(description, lang) if slug in ("", "downloads") else ""}
</head>
<body{' class="content-route"' if slug == "content" else ''}>
  {header(locales, lang, slug)}
  {body}
  {footer(locales, lang)}
  <script src="/assets/site.js" defer></script>
  <script src="/assets/site-assistant-config.js" defer></script>
  <script src="/assets/site-assistant.js" defer></script>
</body>
</html>
"""


def software_application_schema(description: str, lang: str) -> str:
    market = store_market(lang)
    store_url = microsoft_store_url(lang)
    data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "AliKa Parental Control",
        "description": description,
        "applicationCategory": "UtilitiesApplication",
        "applicationSubCategory": "Parental control",
        "operatingSystem": "Windows 10, Windows 11",
        "softwareVersion": "1.1.68",
        "url": BASE_URL,
        "downloadUrl": store_url,
        "publisher": {"@type": "Organization", "name": "ErenKa Software"},
        "offers": {
            "@type": "Offer",
            "price": market["price"],
            "priceCurrency": market["currency"],
            "availability": "https://schema.org/InStock",
            "url": store_url,
        },
    }
    return f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False, separators=(",", ":"))}</script>'


def guide_document(locales: dict[str, dict], title: str, description: str, canonical: str, body: str) -> str:
    article_schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "mainEntityOfPage": canonical,
        "inLanguage": "tr-TR",
        "author": {"@type": "Organization", "name": "ErenKa Software"},
        "publisher": {"@type": "Organization", "name": "ErenKa Software"},
        "dateModified": "2026-08-28",
    }
    return f"""<!doctype html>
<html lang="tr">
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
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="AliKa">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{BASE_URL}/og.png">
  <script type="application/ld+json">{json.dumps(article_schema, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
  {header(locales, "tr")}
  {body}
  {footer(locales, "tr")}
  <script src="/assets/site.js" defer></script>
  <script src="/assets/site-assistant-config.js" defer></script>
  <script src="/assets/site-assistant.js" defer></script>
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
      <aside class="guide-disclosure"><strong>Açıklık notu:</strong> Bu rehberler AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. AliKa ücretli bir Windows uygulamasıdır; Microsoft Store’da 7 günlük deneme ve ₺80 fiyat gösterilir.</aside>
    </main>
    """


def guide_article_body(guide: dict) -> str:
    sections = "".join(
        f'<section><h2>{esc(heading)}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in paragraphs)}</section>'
        for heading, paragraphs in guide["sections"]
    )
    return f"""
    <main id="main" class="guide-main">
      <article class="guide-article">
        <nav class="guide-breadcrumb" aria-label="Sayfa yolu"><a href="/">AliKa</a><span>›</span><a href="/{GUIDE_BASE}/">Rehberler</a></nav>
        <header>
          <p class="eyebrow">Windows 10/11 · AliKa ebeveyn rehberi</p>
          <h1>{esc(guide["title"])}</h1>
          <p class="guide-lede">{esc(guide["lede"])}</p>
          <p class="guide-disclosure"><strong>Açıklık notu:</strong> Bu içerik AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. AliKa ücretli bir Windows uygulamasıdır.</p>
        </header>
        {sections}
        <aside class="guide-video"><div><strong>Gerçek ürün akışını izleyin</strong><span>Video yalnız bağlantıya tıkladığınızda YouTube’da açılır.</span></div><a href="{esc(guide["video"])}" target="_blank" rel="noopener noreferrer">{esc(guide["video_label"])} ↗</a></aside>
        <section class="guide-cta"><h2>Windows bilgisayarınızda birlikte deneyin.</h2><p>AliKa’yı 7 gün ücretsiz deneyebilir, ilk kuralı ve çocuk ekranını kontrol edebilirsiniz. Deneme sonrası fiyat ₺80’dir.</p><a class="button" href="{microsoft_store_url('tr')}" target="_blank" rel="noopener noreferrer">Microsoft Store’da açın</a></section>
      </article>
    </main>
    """


def screenshot_card(src: str, title: str, tab: str, active: bool = False) -> str:
    active_class = " is-active" if active else ""
    return (
        f'<figure class="screen-card{active_class}" data-screen-panel="{tab}">'
        f'<div class="phone-frame"><img src="/assets/screenshots/{src}" alt="{esc(title)}" loading="lazy"></div>'
        f'<figcaption>{esc(title)}</figcaption></figure>'
    )


def home(locales: dict[str, dict], lang: str) -> str:
    c = locales[lang]
    screen_labels = SCREEN_LABELS[lang]
    access = ACCESS_LABELS[lang]
    eco_cards = "".join(
        f'<button type="button" class="eco-choice{" is-active" if i == 0 else ""}" '
        f'data-eco-choice="{i}"><span>0{i + 1}</span>{esc(label)}</button>'
        for i, label in enumerate(c["eco_items"])
    )
    age_buttons = "".join(
        f'<button type="button" class="age-button{" is-active" if i == 0 else ""}" '
        f'data-age="{i}"><strong>{age}</strong><span>{esc(c["age_labels"][i])}</span></button>'
        for i, age in enumerate(("5–7", "8–11", "12–14", "15–18"))
    )
    trust = "".join(f"<li><span></span>{esc(item)}</li>" for item in c["trust_items"])
    pills = "".join(f"<li><span>0{i + 1}</span>{esc(item)}</li>" for i, item in enumerate(c["pill"]))
    return f"""
    <div class="intro" data-intro aria-hidden="true">
      <button type="button" data-intro-skip aria-label="{esc(access[2])}">{esc(access[2])}</button>
      <img src="/assets/brand/alika-logo.png" alt="" width="150" height="150">
      <span>AliKa</span>
    </div>
    <main id="main">
      <section class="hero section-dark">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <div class="hero-copy reveal">
          <p class="eyebrow">{esc(c["hero_kicker"])}</p>
          <h1>{esc(c["hero_title"])}</h1>
          <p class="lede">{esc(c["hero_body"])}</p>
          <div class="button-row">
            <a class="button" href="{href(lang, 'downloads')}">{esc(c["get"])}</a>
            <a class="button button-ghost" href="#ecosystem">{esc(c["hero_alt"])}</a>
          </div>
          <ul class="hero-pills">{pills}</ul>
        </div>
        <div class="hero-stage reveal" aria-label="AliKa product preview">
          <div class="stage-glow"></div>
          <div class="desktop-shell">
            <div class="desktop-top"><i></i><i></i><i></i><span>AliKa · {esc(screen_labels[1])}</span></div>
            <div class="desktop-body">
              <div class="mini-sidebar"><b>A</b><i></i><i></i><i></i><i></i></div>
              <div class="desktop-content">
                <p>{esc(c["status_today"])}</p><strong>42 min</strong>
                <div class="progress"><span></span></div>
                <div class="mini-grid"><i></i><i></i><i></i></div>
              </div>
            </div>
          </div>
          <div class="hero-phone">
            <img src="/assets/screenshots/android-home.png" alt="AliKa Android child home screen">
          </div>
          <div class="float-card float-question"><small>{esc(screen_labels[2])}</small><strong>8 / 10</strong><span>{esc(c["pill"][0])}</span></div>
          <div class="float-card float-plan"><small>{esc(c["pill"][1])}</small><strong>4</strong><span>{esc(c["status_plan"])}</span></div>
        </div>
      </section>

      <section class="method section-light">
        <div class="section-heading reveal">
          <p class="eyebrow">{esc(c["approach_kicker"])}</p>
          <h2>{esc(c["approach_title"])}</h2>
          <p>{esc(c["approach_body"])}</p>
        </div>
        <div class="method-grid reveal">
          <article><span>01</span><h3>{esc(c["pill"][2])}</h3><p>{esc(c["approach_body"])}</p></article>
          <article><span>02</span><h3>{esc(c["pill"][0])}</h3><p>{esc(c["proof_body"])}</p></article>
          <article><span>03</span><h3>{esc(c["pill"][1])}</h3><p>{esc(c["final_body"])}</p></article>
        </div>
      </section>

      <section class="proof section-snow">
        <div class="section-heading center reveal">
          <p class="eyebrow">{esc(c["proof_kicker"])}</p>
          <h2>{esc(c["proof_title"])}</h2>
          <p>{esc(c["proof_body"])}</p>
        </div>
        <div class="screen-tabs reveal" role="tablist" aria-label="Product screens">
          <button class="is-active" data-screen-tab="child">{esc(screen_labels[0])}</button>
          <button data-screen-tab="parent">{esc(screen_labels[1])}</button>
          <button data-screen-tab="quiz">{esc(screen_labels[2])}</button>
          <button data-screen-tab="reports">{esc(screen_labels[3])}</button>
        </div>
        <div class="screen-showcase reveal">
          {screenshot_card("android-home.png", "AliKa child experience", "child", True)}
          {screenshot_card("android-parent.png", "PIN-protected parent panel", "parent")}
          {screenshot_card("android-quiz.png", "Question experience", "quiz")}
          {screenshot_card("android-reports.png", "Progress and reports", "reports")}
          <div class="screen-copy">
            <span class="status status-today">{esc(c["status_today"])}</span>
            <h3>{esc(c["proof_title"])}</h3>
            <p>{esc(c["proof_body"])}</p>
            <a href="{href(lang, 'how-it-works')}">{esc(c["learn_more"])} <span>→</span></a>
          </div>
        </div>
      </section>

      <section class="ecosystem section-dark" id="ecosystem">
        <div class="section-heading reveal">
          <p class="eyebrow">{esc(c["ecosystem_kicker"])}</p>
          <h2>{esc(c["ecosystem_title"])}</h2>
          <p>{esc(c["ecosystem_body"])}</p>
        </div>
        <div class="eco-layout reveal">
          <div class="eco-choices">{eco_cards}</div>
          <div class="family-orbit" data-eco-stage>
            <div class="home-boundary"></div>
            <div class="eco-node node-tv"><small>{esc(access[3])}</small><strong>TV</strong><span>{esc(screen_labels[2])} 04</span></div>
            <div class="eco-node node-parent"><small>{esc(screen_labels[1])}</small><strong>A</strong><span>{esc(access[4])}</span></div>
            <div class="eco-node node-child"><small>{esc(screen_labels[0])}</small><strong>B</strong><span>{esc(access[5])}</span></div>
            <div class="eco-center"><img src="/assets/brand/alika-logo.png" alt="" width="72" height="72"><b data-eco-title>{esc(c["eco_items"][0])}</b></div>
          </div>
          <aside class="eco-note">
            <span class="status status-dev">{esc(c["status_dev"])}</span>
            <p>{esc(c["planned_note"])}</p>
            <a href="{href(lang, 'ecosystem')}">{esc(c["learn_more"])} <span>→</span></a>
          </aside>
        </div>
      </section>

      <section class="ages section-light">
        <div class="section-heading reveal">
          <p class="eyebrow">{esc(c["age_kicker"])}</p>
          <h2>{esc(c["age_title"])}</h2>
          <p>{esc(c["age_body"])}</p>
        </div>
        <div class="age-layout reveal">
          <div class="age-buttons">{age_buttons}</div>
          <div class="age-preview age-0" data-age-preview>
            <div class="age-mascot"><img src="/assets/brand/alika-logo.png" alt=""></div>
            <div class="age-copy"><small>5–7</small><strong data-age-label>{esc(c["age_labels"][0])}</strong><i></i><i></i><i></i></div>
          </div>
        </div>
      </section>

      <section class="trust section-snow">
        <div class="trust-card reveal">
          <div>
            <p class="eyebrow">{esc(c["trust_kicker"])}</p>
            <h2>{esc(c["trust_title"])}</h2>
            <p>{esc(c["trust_body"])}</p>
            <a href="/privacy/">{esc(c["privacy"])} <span>→</span></a>
          </div>
          <ul>{trust}</ul>
        </div>
      </section>

      <section class="content-hub section-light">
        <div class="section-heading reveal">
          <p class="eyebrow">{esc(c["content_kicker"])}</p>
          <h2>{esc(c["content_title"])}</h2>
          <p>{esc(c["content_body"])}</p>
        </div>
        <div class="package-grid reveal">
          <article><small>JP · 5</small><h3>算数</h3><p>23 anlatım · 500 soru</p><span>{esc(c["status_today"])}</span></article>
          <article><small>KR · 5</small><h3>수학</h3><p>23 anlatım · 500 soru</p><span>{esc(c["status_today"])}</span></article>
          <article class="package-cta"><h3>{esc(c["content_title"])}</h3><a href="{href(lang, 'content')}">{esc(c["learn_more"])} →</a></article>
        </div>
      </section>

      <section class="final-cta section-dark reveal">
        <img src="/assets/brand/alika-logo.png" width="86" height="86" alt="">
        <h2>{esc(c["final_title"])}</h2>
        <p>{esc(c["final_body"])}</p>
        <div class="button-row">
          <a class="button" href="{href(lang, 'downloads')}">{esc(c["get"])}</a>
          <a class="button button-ghost" href="{href(lang, 'features')}">{esc(c["learn_more"])}</a>
        </div>
      </section>
    </main>
    """


def status_cards(c: dict) -> str:
    return f"""
    <div class="status-grid">
      <article><span class="status status-today">{esc(c["status_today"])}</span><h3>{esc(c["pill"][0])} · {esc(c["pill"][1])}</h3><p>{esc(c["proof_body"])}</p></article>
      <article><span class="status status-dev">{esc(c["status_dev"])}</span><h3>{esc(c["ecosystem_title"])}</h3><p>{esc(c["ecosystem_body"])}</p></article>
      <article><span class="status status-plan">{esc(c["status_plan"])}</span><h3>{esc(c["eco_items"][0])}</h3><p>{esc(c["planned_note"])}</p></article>
    </div>
    """


def demo_markup(kind: str, c: dict, lang: str) -> str:
    labels = GUIDE_LABELS[lang]
    if kind == "home":
        body = f'<div class="demo-ring"><b>42</b><small>min</small></div><div class="demo-actions"><i></i><i></i></div>'
    elif kind == "parent":
        body = '<div class="demo-pin"><i></i><i></i><i></i><i></i></div><div class="demo-panels"><i></i><i></i><i></i></div>'
    elif kind == "rules":
        body = '<div class="demo-rule"><span><i></i></span><span><i></i></span><span><i></i></span></div><b class="demo-save">✓</b>'
    elif kind == "reports":
        body = '<div class="demo-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="demo-tabs"><i></i><i></i><i></i></div>'
    elif kind == "quiz":
        body = '<div class="demo-question"><b>8 × 4</b><span><i>24</i><i>32</i><i>36</i></span></div><div class="demo-reward">+5</div>'
    else:
        body = '<div class="demo-coins"><i></i><i></i><i></i></div><div class="demo-items"><i></i><i></i><i></i></div>'
    return f'<div class="mini-demo demo-{kind}" role="img" aria-label="{esc(labels[7])}">{body}</div>'


def guide_atlas(lang: str, c: dict) -> str:
    screen = SCREEN_LABELS[lang]
    labels = GUIDE_LABELS[lang]
    names = (screen[0], screen[1], labels[5], screen[3], screen[2], labels[6])
    paths = (
        f"AliKa › {screen[0]}",
        f"AliKa › {screen[1]}",
        f"{screen[1]} › {labels[5]}",
        f"{screen[1]} › {screen[3]}",
        f"{screen[0]} › {screen[2]}",
        f"{screen[0]} › {labels[6]}",
    )
    purposes = (
        c["hero_body"],
        c["trust_body"],
        c["approach_body"],
        c["proof_body"],
        c["final_body"],
        c["content_body"],
    )
    kinds = ("home", "parent", "rules", "reports", "quiz", "room")
    cards = []
    for i, (name, path, purpose, how, kind) in enumerate(zip(names, paths, purposes, HOW_TEXT[lang], kinds)):
        cards.append(f"""
        <article class="guide-card reveal">
          <div class="guide-copy">
            <span class="guide-number">0{i + 1}</span>
            <h3>{esc(name)}</h3>
            <dl>
              <div><dt>{esc(labels[2])}</dt><dd>{esc(path)}</dd></div>
              <div><dt>{esc(labels[3])}</dt><dd>{esc(purpose)}</dd></div>
              <div><dt>{esc(labels[4])}</dt><dd>{esc(how)}</dd></div>
            </dl>
          </div>
          {demo_markup(kind, c, lang)}
        </article>""")
    return f"""
    <div class="guide-heading">
      <p class="eyebrow">{esc(c["approach_kicker"])}</p>
      <h2>{esc(labels[0])}</h2>
      <p>{esc(labels[1])}</p>
    </div>
    <div class="guide-grid">{"".join(cards)}</div>
    """


def content_library(catalog: dict, lang: str) -> str:
    labels = CONTENT_LIBRARY_LABELS[lang]
    countries = sorted({row["country_slug"]: row["country"] for row in catalog["grades"]}.items())
    grades = sorted({(row["country_slug"], row["grade_slug"], row["grade"]) for row in catalog["grades"]})
    country_options = "".join(f'<option value="{esc(slug)}">{esc(name)}</option>' for slug, name in countries)
    grade_options = "".join(
        f'<option value="{esc(grade_slug)}" data-country-option="{esc(country)}">{esc(labels[7].format(grade))}</option>'
        for country, grade_slug, grade in grades
    )
    grade_cards = "".join(f"""
      <article class="grade-download-card" data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <div><small>{esc(row['country'])} · {esc(labels[7].format(row['grade']))}</small>
          <h3>{row['subject_count']} ders · {row['notes']} {esc(labels[4])} · {row['questions']} {esc(labels[5])}</h3>
          <p>{esc(labels[6])}</p></div>
        <a class="button direct-download" href="{esc(row['download_url'])}" download
           data-direct-download>{esc(labels[2])}</a>
      </article>""" for row in catalog["grades"])
    subject_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country_code'])} · {row['grade']}. sınıf</small>
        <h3>{esc(row['subject'])}</h3>
        <p>{row['notes']} {esc(labels[4])} · {row['questions']} {esc(labels[5])}<br>{esc(labels[6])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download>{esc(labels[3])}</a>
      </article>""" for row in catalog["subjects"])
    return f"""
      <div class="content-filters" data-content-filters>
        <label>{esc(labels[0])}<select data-content-country>{country_options}</select></label>
        <label>{esc(labels[1])}<select data-content-grade>{grade_options}</select></label>
      </div>
      <p class="honesty-note">{esc(labels[8])}</p>
      <div class="grade-downloads">{grade_cards}</div>
      <div class="package-grid" data-content-grid>{subject_cards}</div>
      <p class="honesty-note">{esc(catalog['quality_disclosure'])} · <a href="{esc(catalog['source_repository'])}">GitHub</a></p>
    """


def inner_content(lang: str, slug: str, c: dict, catalog: dict) -> str:
    title, desc = c["pages"][slug]
    if slug == "how-it-works":
        flow = "".join(
            f'<article><span>0{i + 1}</span><h3>{esc(label)}</h3><p>{esc(HOW_TEXT[lang][index])}</p></article>'
            for i, (label, index) in enumerate(zip((c["pill"][1], c["pill"][2], c["pill"][0], c["pages"]["updates"][0]), (1, 2, 4, 3)))
        )
        detail = f'{guide_atlas(lang, c)}<div class="section-divider"></div><div class="steps-grid">{flow}</div>'
    elif slug == "ecosystem":
        items = "".join(
            f'<article><span>0{i + 1}</span><h3>{esc(item)}</h3><p>{esc(c["ecosystem_body"])}</p><small>{esc(c["status_plan"])}</small></article>'
            for i, item in enumerate(c["eco_items"])
        )
        detail = f'<div class="experience-grid">{items}</div>{status_cards(c)}'
    elif slug == "age-groups":
        cards = "".join(
            f'<article><strong>{age}</strong><h3>{esc(label)}</h3><p>{esc(c["age_body"])}</p>'
            f'<ul><li>{esc(HOW_TEXT[lang][0])}</li><li>{esc(HOW_TEXT[lang][4 if i < 3 else 3])}</li></ul></article>'
            for i, (age, label) in enumerate(zip(("5–7", "8–11", "12–14", "15–18"), c["age_labels"]))
        )
        detail = f'<div class="age-detail-grid">{cards}</div>'
    elif slug == "content":
        detail = content_library(catalog, lang)
    elif slug == "features":
        detail = f'{guide_atlas(lang, c)}<div class="section-divider"></div>{status_cards(c)}'
    elif slug == "roadmap":
        detail = f'{status_cards(c)}<div class="roadmap-note"><h2>{esc(c["ecosystem_title"])}</h2><p>{esc(c["planned_note"])}</p></div>'
    elif slug == "updates":
        detail = f"""
        <div class="update-list">
          <article><time>2026-07</time><span class="status status-today">{esc(c["status_today"])}</span><h2>{esc(c["proof_title"])}</h2><p>{esc(c["proof_body"])}</p></article>
          <article><time>2026-07</time><span class="status status-today">{esc(c["status_today"])}</span><h2>{esc(GUIDE_LABELS[lang][6])}</h2><p>{esc(HOW_TEXT[lang][5])}</p></article>
          <article><time>2026-07</time><span class="status status-dev">{esc(c["status_dev"])}</span><h2>{esc(c["ecosystem_title"])}</h2><p>{esc(c["planned_note"])}</p></article>
        </div>"""
    elif slug == "downloads":
        store_scope = (
            "Bu Microsoft Store satın alımı yalnız Windows sürümünü kapsar; Android ve Android TV "
            "bu satın alıma dahil değildir."
            if lang == "tr"
            else c["planned_note"]
        )
        detail = f"""
        <div class="download-card">
          <div><span class="status status-today">Microsoft Store</span><h3>AliKa · Windows</h3><p>{esc(c["proof_body"])}</p></div>
          <a class="button" href="{microsoft_store_url(lang)}" target="_blank" rel="noopener noreferrer">{esc(c["get"])}</a>
        </div>
        <p class="honesty-note">{esc(store_scope)}</p>"""
    elif slug == "contact":
        detail = f"""
        <div class="contact-card"><span>{esc(c["support"])}</span><a href="mailto:alika.destek@gmail.com">alika.destek@gmail.com</a></div>
        <div class="faq-grid">
          <details><summary>{esc(c["trust_items"][3])}</summary><p>{esc(c["trust_body"])}</p></details>
          <details><summary>{esc(c["ecosystem_title"])}</summary><p>{esc(c["planned_note"])}</p></details>
          <details><summary>{esc(c["trust_title"])}</summary><p>{esc(c["trust_body"])}</p></details>
        </div>"""
    else:
        detail = f"""
        <div class="steps-grid">
          <article><span>01</span><h3>{esc(c["pill"][1])}</h3><p>{esc(c["approach_body"])}</p></article>
          <article><span>02</span><h3>{esc(c["pill"][0])}</h3><p>{esc(c["proof_body"])}</p></article>
          <article><span>03</span><h3>{esc(c["pill"][2])}</h3><p>{esc(c["final_body"])}</p></article>
        </div>"""
    if slug == "content":
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
    return f"""
    <main id="main" class="inner-main">
      <section class="inner-hero section-dark">
        <p class="eyebrow">AliKa · {esc(title)}</p>
        <h1>{esc(title)}</h1>
        <p>{esc(desc)}</p>
      </section>
      <section class="inner-content section-light">
        {detail}
      </section>
      <section class="inner-cta section-snow">
        <h2>{esc(c["final_title"])}</h2>
        <a class="button" href="{href(lang, 'downloads')}">{esc(c["get"])}</a>
      </section>
    </main>
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

    for lang in LANGS:
        c = locales[lang]
        home_path = DIST / "index.html" if lang == "tr" else DIST / lang / "index.html"
        write_page(home_path, document(locales, lang, f"AliKa — {c['hero_kicker']}", c["meta"], home(locales, lang)))
        for slug in SLUGS:
            title, desc = c["pages"][slug]
            path = DIST / slug / "index.html" if lang == "tr" else DIST / lang / slug / "index.html"
            write_page(path, document(locales, lang, f"{title} — AliKa", desc, inner_content(lang, slug, c, catalog), slug))

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
        urls.extend(f"{BASE_URL}{href(lang, slug)}" for slug in SLUGS)
    urls.extend((f"{BASE_URL}/privacy/", f"{BASE_URL}/eula/", guide_index_url))
    urls.extend(f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/" for guide in GUIDES)
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
