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
# Sayfa başlığı ve og:site_name sonundaki marka; Türkçe sayfalarda Türkçe marka adı.
BRAND_NAME = {"tr": "AliKa Ebeveyn Kontrolü", "en": "AliKa"}
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
    "tr": ("Ülke", "Sınıf", "Tüm dersleri indir", "Dersi indir", "konu anlatımı", "soru", "", "{}. sınıf", "ZIP'i çıkarmayın. AliKa'da İçerik ekle'yi açıp sınıf, ders ya da LGS ZIP dosyasını doğrudan seçin veya ZIP'i hazır klasöre koyup Hazır klasörü tara'yı kullanın."),
    "en": ("Country", "Grade", "Download all subjects", "Download subject", "lessons", "questions", "", "Grade {}", "Do not extract the ZIP. Select the grade, subject or LGS ZIP directly from Add content in AliKa, or place it in the prepared folder and scan it."),
    "de": ("Land", "Klasse", "Alle Fächer herunterladen", "Fach herunterladen", "Lektionen", "Fragen", "", "Klasse {}", "ZIP nicht entpacken. Wählen Sie die Klassen-, Fach- oder LGS-ZIP direkt über Inhalte hinzufügen in AliKa oder legen Sie sie im vorbereiteten Ordner ab und starten Sie den Scan."),
    "es": ("País", "Curso", "Descargar todas las asignaturas", "Descargar asignatura", "lecciones", "preguntas", "", "Curso {}", "No extraiga el ZIP. Seleccione directamente el ZIP del curso, de la asignatura o LGS en Añadir contenido de AliKa o colóquelo en la carpeta preparada y analícela."),
    "fr": ("Pays", "Niveau", "Télécharger toutes les matières", "Télécharger la matière", "leçons", "questions", "", "Niveau {}", "Ne décompressez pas le ZIP. Sélectionnez le ZIP du niveau, de la matière ou LGS directement dans Ajouter du contenu d’AliKa ou placez-le dans le dossier préparé puis lancez l’analyse."),
    "pt": ("País", "Ano", "Transferir todas as disciplinas", "Transferir disciplina", "lições", "perguntas", "", "Ano {}", "Não extraia o ZIP. Selecione o ZIP do ano, da disciplina ou LGS diretamente em Adicionar conteúdo no AliKa ou coloque-o na pasta preparada e faça a leitura."),
    "ru": ("Страна", "Класс", "Скачать все предметы", "Скачать предмет", "уроков", "вопросов", "", "Класс {}", "Не распаковывайте ZIP. Выберите архив класса, предмета или LGS через Добавить материалы в AliKa или поместите его в подготовленную папку и запустите сканирование."),
    "ja": ("国", "学年", "全教科をダウンロード", "教科をダウンロード", "レッスン", "問題", "", "{}年生", "ZIPは展開せず、AliKaの「コンテンツを追加」から学年・教科・LGSのZIPを直接選ぶか、準備済みフォルダーに置いてスキャンしてください。"),
    "ko": ("국가", "학년", "모든 과목 다운로드", "과목 다운로드", "수업", "문제", "", "{}학년", "ZIP을 풀지 마세요. AliKa의 콘텐츠 추가에서 학년·과목·LGS ZIP을 직접 선택하거나 준비 폴더에 넣고 스캔하세요."),
}
# İçerik sayfasındaki LGS, ilkokul ve oyun bölümleri. Oyun adları ana sayfadaki tv.games ile aynı;
# Windows menü yolu uygulamanın kendi metinleri (panel.tab_library › lib.section_games › lib.add_game).
CONTENT_SECTION_LABELS = {
    "tr": {
        "tr_name": "Türkçe",
        "lgs_video": "LGS deneme paketi tanıtımı",
        "howto_title": "İçerik nasıl eklenir?",
        "howto_body": "Ders, LGS, ilkokul ve oyun paketlerini indirip Windows ebeveyn panelinden AliKa’ya ekleme ve kullanıma açma adımları.",
        "video_lang": "",
        "packages": "Paketleri tek tek indir ({})",
        "requirements": "Ders ve LGS paketleri AliKa Windows 1.2.12 ve Android 0.3.11 ya da sonraki sürümlerini gerektirir.",
        "lgs_title": "LGS 2027 deneme paketi",
        "lgs_body": "Altı derste onar deneme formu. Ders paketlerinden ayrıdır; AliKa bu soruları yalnız LGS denemelerinde kullanır.",
        "lgs_download": "LGS paketini indir",
        "prep_title": "LGS 2028 hazırlık — 7. sınıf",
        "prep_body": "2028'de LGS'ye girecek 7. sınıflar için bağlam temelli sorular. Deneme paketi beş form içerir; AliKa her formu çocuğun işlediği konulara göre kısaltır. Ünite setleri her ünitenin sonunda çözülür ve konu anlatımıyla gelir.",
        "prep_exam": "Deneme (5 form)",
        "prep_units": "Ünite setleri",
        "prep_exam_download": "Deneme paketini indir",
        "prep_units_download": "Ünite setlerini indir",
        "prep_note": "AliKa Windows 1.2.15 ve sonrası gerekir; Android desteği bir sonraki sürümle gelecek. Ünite setleri deneme paketinin takvimiyle açılır, ikisini birlikte kurun. Sorular yapay zekâ ile üretildi ve denetlendi; insan incelemesi yapılmadı. LGS sorusu değildir.",
        "primary_title": "İlkokul görsel etkinlikleri",
        "primary_body": "Renkli şekil kartlarıyla {} görsel soru: benzerlik, «Sıradaki ne?», «Farklı olanı bul» ve «Tabloyu tamamla». Okuma gerektirmez.",
        "primary_note": "Ön sürüm: çocuklarla deneme henüz yapılmadı. AliKa Windows 1.2.12 ve sonrası gerekir; yayımlanmış Android sürümü bu kartları henüz göstermiyor.",
        "primary_download": "Etkinlik paketini indir",
        "age": "{}–{} yaş",
        "games_title": "Ortak ekran oyun paketleri",
        "games_body": "Çarkıfelek ve İsim Şehir için dokuz dilde, dört yaş grubunda ayrı paketler. Ortak ekranda oynanır; herkes kendi telefonundan katılır.",
        "games_install": "Windows’ta paketi Kütüphane › Oyunlar › Oyun ekle ile kurun (AliKa Windows 1.2.12 ve sonrası). Android TV bu paketleri uygulamanın içinden indirir.",
        "words": "{} bulmaca",
        "rounds": "{} tur",
        "other_langs": "Diğer diller",
        "word-wheel": ("Çarkıfelek", "İpucundan gizli kelimeyi bul; her yaş grubuna ayrı sürüm."),
        "name-city": ("İsim Şehir", "Klasik oyun ortak ekranda; her yaş grubuna ayrı sürüm."),
    },
    "en": {
        "tr_name": "Turkish",
        "lgs_video": "LGS practice exam pack introduction",
        "howto_title": "How do I add content?",
        "howto_body": "Steps for downloading subject, LGS, primary and game packs and adding and enabling them in the AliKa Windows parent panel.",
        "video_lang": "The video is in Turkish.",
        "packages": "Download packs one by one ({})",
        "requirements": "Subject and LGS packs need AliKa Windows 1.2.12 and Android 0.3.11 or later.",
        "lgs_title": "LGS 2027 practice exam pack",
        "lgs_body": "Ten practice forms in each of six subjects (in Turkish). Kept apart from the subject packs; AliKa uses these questions only in LGS practice exams.",
        "lgs_download": "Download LGS pack",
        "prep_title": "LGS 2028 preparation — Grade 7",
        "prep_body": "Context-based questions (in Turkish) for Grade 7 students who will sit the LGS in 2028. The practice pack has five forms; AliKa shortens each form to the topics the child has covered. Unit sets are solved at the end of each unit and come with a lesson.",
        "prep_exam": "Practice exam (5 forms)",
        "prep_units": "Unit sets",
        "prep_exam_download": "Download practice pack",
        "prep_units_download": "Download unit sets",
        "prep_note": "Needs AliKa Windows 1.2.15 or later; Android support comes with the next release. Unit sets open on the practice pack's calendar, so install both. Questions were generated and checked by AI; no human review. These are not official LGS questions.",
        "primary_title": "Primary visual activities",
        "primary_body": "{} visual questions with coloured shape cards: similarity, “What comes next?”, “Find the odd one out” and “Complete the grid”. No reading needed.",
        "primary_note": "Preview: not yet tried with children. Needs AliKa Windows 1.2.12 or later; the released Android version cannot show these cards yet.",
        "primary_download": "Download activity pack",
        "age": "Ages {}–{}",
        "games_title": "Shared-screen game packs",
        "games_body": "Separate packs for Word Wheel and Name, Place, Animal in nine languages and four age groups. Played on the shared screen; everyone joins from their own phone.",
        "games_install": "On Windows, install a pack via Library › Games › Add game (AliKa Windows 1.2.12 or later). Android TV downloads these packs inside the app.",
        "words": "{} puzzles",
        "rounds": "{} rounds",
        "other_langs": "Other languages",
        "word-wheel": ("Word Wheel", "Find the hidden word from the clue; a separate version for each age group."),
        "name-city": ("Name, Place, Animal", "The classic word game on the shared screen; a separate version for each age group."),
    },
    "de": {
        "tr_name": "Türkisch",
        "lgs_video": "Vorstellung des LGS-Probeprüfungspakets",
        "howto_title": "Wie füge ich Inhalte hinzu?",
        "howto_body": "Schritte zum Herunterladen von Fach-, LGS-, Grundschul- und Spielpaketen und zum Hinzufügen und Freigeben im AliKa-Elternpanel unter Windows.",
        "video_lang": "Das Video ist auf Türkisch.",
        "packages": "Pakete einzeln herunterladen ({})",
        "requirements": "Fach- und LGS-Pakete erfordern AliKa Windows 1.2.12 und Android 0.3.11 oder neuer.",
        "lgs_title": "LGS-2027-Probeprüfungspaket",
        "lgs_body": "Zehn Probeformen in jedem von sechs Fächern (auf Türkisch). Getrennt von den Fachpaketen; AliKa nutzt diese Fragen nur in LGS-Probeprüfungen.",
        "lgs_download": "LGS-Paket herunterladen",
        "prep_title": "LGS-2028-Vorbereitung — Klasse 7",
        "prep_body": "Kontextbasierte Fragen (auf Türkisch) für Siebtklässler, die 2028 die LGS schreiben. Das Probeprüfungspaket hat fünf Formen; AliKa kürzt jede Form auf die behandelten Themen. Die Einheitensets werden am Ende jeder Einheit gelöst und enthalten eine Lektion.",
        "prep_exam": "Probeprüfung (5 Formen)",
        "prep_units": "Einheitensets",
        "prep_exam_download": "Probeprüfungspaket herunterladen",
        "prep_units_download": "Einheitensets herunterladen",
        "prep_note": "Erfordert AliKa Windows 1.2.15 oder neuer; Android-Unterstützung folgt mit der nächsten Version. Die Einheitensets öffnen sich nach dem Kalender des Probeprüfungspakets – installieren Sie beide. Fragen von KI erstellt und geprüft; keine menschliche Prüfung. Keine offiziellen LGS-Fragen.",
        "primary_title": "Visuelle Übungen für die Grundschule",
        "primary_body": "{} visuelle Fragen mit farbigen Formkarten: Ähnlichkeit, „Was kommt als Nächstes?“, „Was passt nicht?“ und „Ergänze die Tabelle“. Lesen ist nicht nötig.",
        "primary_note": "Vorabversion: noch nicht mit Kindern erprobt. Erfordert AliKa Windows 1.2.12 oder neuer; die veröffentlichte Android-Version zeigt diese Karten noch nicht.",
        "primary_download": "Übungspaket herunterladen",
        "age": "{}–{} Jahre",
        "games_title": "Spielpakete für den gemeinsamen Bildschirm",
        "games_body": "Eigene Pakete für Worträtsel-Rad und Stadt, Land, Fluss in neun Sprachen und vier Altersgruppen. Gespielt wird auf dem gemeinsamen Bildschirm; alle machen mit dem eigenen Handy mit.",
        "games_install": "Unter Windows ein Paket über Bibliothek › Spiele › Spiel hinzufügen installieren (AliKa Windows 1.2.12 oder neuer). Android TV lädt diese Pakete in der App herunter.",
        "words": "{} Rätsel",
        "rounds": "{} Runden",
        "other_langs": "Weitere Sprachen",
        "word-wheel": ("Worträtsel-Rad", "Das verborgene Wort anhand des Hinweises finden; eine eigene Version für jede Altersgruppe."),
        "name-city": ("Stadt, Land, Fluss", "Der Klassiker auf dem gemeinsamen Bildschirm; eine eigene Version für jede Altersgruppe."),
    },
    "es": {
        "tr_name": "Turco",
        "lgs_video": "Presentación del paquete de exámenes LGS",
        "howto_title": "¿Cómo se añade contenido?",
        "howto_body": "Pasos para descargar paquetes de asignaturas, LGS, primaria y juegos, y añadirlos y activarlos en el panel de padres de AliKa en Windows.",
        "video_lang": "El vídeo está en turco.",
        "packages": "Descargar los paquetes uno a uno ({})",
        "requirements": "Los paquetes de asignatura y LGS requieren AliKa Windows 1.2.12 y Android 0.3.11 o posterior.",
        "lgs_title": "Paquete de exámenes de práctica LGS 2027",
        "lgs_body": "Diez modelos de examen en cada una de seis asignaturas (en turco). Separado de los paquetes de asignatura; AliKa usa estas preguntas solo en los exámenes de práctica LGS.",
        "lgs_download": "Descargar paquete LGS",
        "prep_title": "Preparación LGS 2028 — 7.º curso",
        "prep_body": "Preguntas basadas en contexto (en turco) para alumnos de 7.º que harán el LGS en 2028. El paquete de exámenes tiene cinco modelos; AliKa acorta cada modelo a los temas ya vistos. Los conjuntos de unidad se resuelven al final de cada unidad e incluyen una lección.",
        "prep_exam": "Exámenes de práctica (5 modelos)",
        "prep_units": "Conjuntos de unidad",
        "prep_exam_download": "Descargar paquete de exámenes",
        "prep_units_download": "Descargar conjuntos de unidad",
        "prep_note": "Requiere AliKa Windows 1.2.15 o posterior; la compatibilidad con Android llegará en la próxima versión. Los conjuntos de unidad se abren con el calendario del paquete de exámenes; instale ambos. Preguntas generadas y revisadas por IA, sin revisión humana. No son preguntas oficiales del LGS.",
        "primary_title": "Actividades visuales de primaria",
        "primary_body": "{} preguntas visuales con tarjetas de formas de colores: semejanza, «¿Qué sigue?», «Encuentra el diferente» y «Completa la tabla». No hace falta leer.",
        "primary_note": "Versión preliminar: aún sin prueba con niños. Requiere AliKa Windows 1.2.12 o posterior; la versión publicada de Android aún no muestra estas tarjetas.",
        "primary_download": "Descargar paquete de actividades",
        "age": "{}–{} años",
        "games_title": "Paquetes de juegos para la pantalla compartida",
        "games_body": "Paquetes separados de Ruleta de palabras y Stop (Basta) en nueve idiomas y cuatro grupos de edad. Se juega en la pantalla compartida; cada uno participa desde su móvil.",
        "games_install": "En Windows, instale un paquete en Biblioteca › Juegos › Añadir juego (AliKa Windows 1.2.12 o posterior). Android TV descarga estos paquetes dentro de la app.",
        "words": "{} acertijos",
        "rounds": "{} rondas",
        "other_langs": "Otros idiomas",
        "word-wheel": ("Ruleta de palabras", "Descubre la palabra oculta a partir de la pista; una versión distinta para cada edad."),
        "name-city": ("Stop (Basta)", "El juego clásico en la pantalla compartida; una versión distinta para cada edad."),
    },
    "fr": {
        "tr_name": "Turc",
        "lgs_video": "Présentation du pack d’examens blancs LGS",
        "howto_title": "Comment ajouter des contenus ?",
        "howto_body": "Les étapes pour télécharger les packs de matières, LGS, primaire et jeux, puis les ajouter et les activer dans le panneau parent AliKa sous Windows.",
        "video_lang": "La vidéo est en turc.",
        "packages": "Télécharger les packs un par un ({})",
        "requirements": "Les packs de matière et LGS nécessitent AliKa Windows 1.2.12 et Android 0.3.11 ou version ultérieure.",
        "lgs_title": "Pack d’examens blancs LGS 2027",
        "lgs_body": "Dix sujets d’entraînement dans chacune des six matières (en turc). Séparé des packs de matière ; AliKa utilise ces questions uniquement pour les examens blancs LGS.",
        "lgs_download": "Télécharger le pack LGS",
        "prep_title": "Préparation LGS 2028 — 7e année",
        "prep_body": "Questions en contexte (en turc) pour les élèves de 7e année qui passeront le LGS en 2028. Le pack d’examens blancs compte cinq sujets ; AliKa raccourcit chaque sujet aux thèmes déjà étudiés. Les séries d’unité se font en fin d’unité et sont accompagnées d’une leçon.",
        "prep_exam": "Examens blancs (5 sujets)",
        "prep_units": "Séries d’unité",
        "prep_exam_download": "Télécharger le pack d’examens",
        "prep_units_download": "Télécharger les séries d’unité",
        "prep_note": "Nécessite AliKa Windows 1.2.15 ou version ultérieure ; la prise en charge Android arrivera avec la prochaine version. Les séries d’unité s’ouvrent selon le calendrier du pack d’examens : installez les deux. Questions générées et vérifiées par IA, sans relecture humaine. Ce ne sont pas des questions officielles du LGS.",
        "primary_title": "Activités visuelles pour le primaire",
        "primary_body": "{} questions visuelles avec des cartes de formes colorées : ressemblance, « Et ensuite ? », « Trouve l’intrus » et « Complète le tableau ». Aucune lecture nécessaire.",
        "primary_note": "Préversion : pas encore testée avec des enfants. Nécessite AliKa Windows 1.2.12 ou version ultérieure ; la version Android publiée n’affiche pas encore ces cartes.",
        "primary_download": "Télécharger le pack d’activités",
        "age": "{}–{} ans",
        "games_title": "Packs de jeux pour l’écran commun",
        "games_body": "Des packs distincts pour Roue des mots et Petit bac, en neuf langues et quatre tranches d’âge. On joue sur l’écran commun ; chacun participe depuis son téléphone.",
        "games_install": "Sous Windows, installez un pack via Bibliothèque › Jeux › Ajouter un jeu (AliKa Windows 1.2.12 ou version ultérieure). Android TV télécharge ces packs dans l’application.",
        "words": "{} énigmes",
        "rounds": "{} manches",
        "other_langs": "Autres langues",
        "word-wheel": ("Roue des mots", "Trouve le mot caché grâce à l’indice ; une version pour chaque tranche d’âge."),
        "name-city": ("Petit bac", "Le jeu classique sur l’écran commun ; une version pour chaque tranche d’âge."),
    },
    "pt": {
        "tr_name": "Turco",
        "lgs_video": "Apresentação do pacote de simulados LGS",
        "howto_title": "Como adicionar conteúdo?",
        "howto_body": "Passos para baixar pacotes de matérias, LGS, anos iniciais e jogos, e adicioná-los e ativá-los no painel do responsável do AliKa no Windows.",
        "video_lang": "O vídeo está em turco.",
        "packages": "Transferir os pacotes um a um ({})",
        "requirements": "Os pacotes de disciplina e LGS exigem AliKa Windows 1.2.12 e Android 0.3.11 ou posterior.",
        "lgs_title": "Pacote de exames de treino LGS 2027",
        "lgs_body": "Dez provas de treino em cada uma de seis disciplinas (em turco). Separado dos pacotes de disciplina; o AliKa usa estas perguntas só nos exames de treino LGS.",
        "lgs_download": "Transferir pacote LGS",
        "prep_title": "Preparação LGS 2028 — 7.º ano",
        "prep_body": "Perguntas baseadas em contexto (em turco) para alunos do 7.º ano que farão o LGS em 2028. O pacote de exames tem cinco provas; o AliKa encurta cada prova aos temas já estudados. Os conjuntos de unidade resolvem-se no fim de cada unidade e trazem uma lição.",
        "prep_exam": "Exames de prática (5 provas)",
        "prep_units": "Conjuntos de unidade",
        "prep_exam_download": "Transferir pacote de exames",
        "prep_units_download": "Transferir conjuntos de unidade",
        "prep_note": "Requer AliKa Windows 1.2.15 ou posterior; o suporte para Android chega na próxima versão. Os conjuntos de unidade abrem segundo o calendário do pacote de exames; instale ambos. Perguntas geradas e verificadas por IA, sem revisão humana. Não são perguntas oficiais do LGS.",
        "primary_title": "Atividades visuais do 1.º ciclo",
        "primary_body": "{} perguntas visuais com cartões de formas coloridas: semelhança, «O que vem a seguir?», «Encontra o diferente» e «Completa a tabela». Não é preciso ler.",
        "primary_note": "Pré-visualização: ainda sem teste com crianças. Requer AliKa Windows 1.2.12 ou posterior; a versão Android publicada ainda não mostra estes cartões.",
        "primary_download": "Transferir pacote de atividades",
        "age": "{}–{} anos",
        "games_title": "Pacotes de jogos para o ecrã partilhado",
        "games_body": "Pacotes separados de Roda das palavras e Stop (Adedonha) em nove línguas e quatro faixas etárias. Joga-se no ecrã partilhado; cada um participa a partir do seu telemóvel.",
        "games_install": "No Windows, instale um pacote em Biblioteca › Jogos › Adicionar jogo (AliKa Windows 1.2.12 ou posterior). O Android TV transfere estes pacotes dentro da app.",
        "words": "{} enigmas",
        "rounds": "{} rondas",
        "other_langs": "Outras línguas",
        "word-wheel": ("Roda das palavras", "Descubra a palavra escondida pela dica; uma versão para cada faixa etária."),
        "name-city": ("Stop (Adedonha)", "O jogo clássico no ecrã partilhado; uma versão para cada faixa etária."),
    },
    "ru": {
        "tr_name": "Турецкий",
        "lgs_video": "Знакомство с пакетом пробных экзаменов LGS",
        "howto_title": "Как добавить материалы?",
        "howto_body": "Как скачать пакеты по предметам, LGS, для начальной школы и игр, затем добавить и включить их в родительской панели AliKa в Windows.",
        "video_lang": "Видео на турецком языке.",
        "packages": "Скачать пакеты по одному ({})",
        "requirements": "Для пакетов предметов и LGS нужны AliKa для Windows 1.2.12 и Android 0.3.11 или новее.",
        "lgs_title": "Пакет пробных экзаменов LGS 2027",
        "lgs_body": "По десять пробных вариантов по каждому из шести предметов (на турецком языке). Отделён от предметных пакетов; AliKa использует эти вопросы только в пробных экзаменах LGS.",
        "lgs_download": "Скачать пакет LGS",
        "prep_title": "Подготовка к LGS 2028 — 7 класс",
        "prep_body": "Контекстные задания (на турецком) для семиклассников, которые будут сдавать LGS в 2028 году. В пакете пробных экзаменов пять вариантов; AliKa сокращает каждый вариант до пройденных тем. Наборы по разделам решают в конце раздела, к ним прилагается урок.",
        "prep_exam": "Пробные экзамены (5 вариантов)",
        "prep_units": "Наборы по разделам",
        "prep_exam_download": "Скачать пробные экзамены",
        "prep_units_download": "Скачать наборы по разделам",
        "prep_note": "Нужна AliKa для Windows 1.2.15 или новее; поддержка Android появится в следующей версии. Наборы по разделам открываются по календарю пакета пробных экзаменов — установите оба. Задания созданы и проверены ИИ, без проверки человеком. Это не официальные задания LGS.",
        "primary_title": "Визуальные задания для начальной школы",
        "primary_body": "{} визуальных вопросов с цветными карточками фигур: сходство, «Что дальше?», «Найди лишнее» и «Заполни таблицу». Читать не нужно.",
        "primary_note": "Предварительная версия: ещё не опробована с детьми. Нужна AliKa для Windows 1.2.12 или новее; опубликованная версия для Android пока не показывает эти карточки.",
        "primary_download": "Скачать пакет заданий",
        "age": "{}–{} лет",
        "games_title": "Игровые пакеты для общего экрана",
        "games_body": "Отдельные пакеты игр «Колесо слов» и «Имя, город, животное» на девяти языках для четырёх возрастных групп. Играют на общем экране; каждый подключается со своего телефона.",
        "games_install": "В Windows установите пакет через Библиотека › Игры › Добавить игру (AliKa для Windows 1.2.12 или новее). Android TV скачивает эти пакеты внутри приложения.",
        "words": "{} загадок",
        "rounds": "{} раундов",
        "other_langs": "Другие языки",
        "word-wheel": ("Колесо слов", "Угадай скрытое слово по подсказке; своя версия для каждого возраста."),
        "name-city": ("Имя, город, животное", "Классическая игра на общем экране; своя версия для каждого возраста."),
    },
    "ja": {
        "tr_name": "トルコ語",
        "lgs_video": "LGS 模擬試験パックの紹介",
        "howto_title": "教材の追加方法",
        "howto_body": "教科・LGS・小学生向け・ゲームのパックをダウンロードし、AliKa の Windows 保護者パネルで追加して有効にする手順。",
        "video_lang": "動画はトルコ語です。",
        "packages": "パッケージを個別にダウンロード（{}）",
        "requirements": "教科パックとLGSパックには AliKa Windows 1.2.12 以降と Android 0.3.11 以降が必要です。",
        "lgs_title": "LGS 2027 模擬試験パック",
        "lgs_body": "6教科それぞれに10回分の模擬試験（トルコ語）。教科パックとは別で、AliKaはこれらの問題をLGS模擬試験でのみ使います。",
        "lgs_download": "LGSパックをダウンロード",
        "prep_title": "LGS 2028 対策 — 7年生",
        "prep_body": "2028年にLGSを受ける7年生向けの文脈型問題（トルコ語）。模試パックは5回分で、AliKaは子どもが学習済みの単元に合わせて各回を短くします。単元セットは各単元の終わりに解き、解説が付きます。",
        "prep_exam": "模試（5回分）",
        "prep_units": "単元セット",
        "prep_exam_download": "模試パックをダウンロード",
        "prep_units_download": "単元セットをダウンロード",
        "prep_note": "AliKa Windows 1.2.15以降が必要です。Androidは次のバージョンで対応予定です。単元セットは模試パックの学習カレンダーで開くため、両方を入れてください。問題はAIが作成・確認しており、人による確認はしていません。公式のLGS問題ではありません。",
        "primary_title": "小学生向けビジュアル課題",
        "primary_body": "色付きの図形カードを使った{}問のビジュアル問題：似ているもの、「次は何？」、「仲間はずれを探そう」、「表を完成させよう」。文字を読む必要はありません。",
        "primary_note": "プレビュー版：子どもとの試用はまだです。AliKa Windows 1.2.12 以降が必要です。公開中のAndroid版はまだこのカードを表示できません。",
        "primary_download": "課題パックをダウンロード",
        "age": "{}〜{}歳",
        "games_title": "共有画面用ゲームパック",
        "games_body": "ことばのルーレットと名前・都市・動物を、9言語・4つの年齢グループ別のパックで用意しています。共有画面で遊び、みんな自分のスマホから参加します。",
        "games_install": "Windowsでは ライブラリ › ゲーム › ゲームを追加 からパックをインストールします（AliKa Windows 1.2.12 以降）。Android TV はアプリ内でこれらのパックをダウンロードします。",
        "words": "{}問",
        "rounds": "{}ラウンド",
        "other_langs": "ほかの言語",
        "word-wheel": ("ことばのルーレット", "ヒントから隠れた言葉を当てよう。年齢グループごとに別バージョン。"),
        "name-city": ("名前・都市・動物", "おなじみの言葉遊びを共有画面で。年齢グループごとに別バージョン。"),
    },
    "ko": {
        "tr_name": "튀르키예어",
        "lgs_video": "LGS 모의고사 패키지 소개",
        "howto_title": "콘텐츠는 어떻게 추가하나요?",
        "howto_body": "과목·LGS·초등·게임 패키지를 내려받아 AliKa Windows 보호자 패널에서 추가하고 사용하도록 여는 단계.",
        "video_lang": "영상은 튀르키예어입니다.",
        "packages": "패키지 개별 다운로드 ({})",
        "requirements": "과목 및 LGS 패키지는 AliKa Windows 1.2.12 및 Android 0.3.11 이상이 필요합니다.",
        "lgs_title": "LGS 2027 모의고사 패키지",
        "lgs_body": "6개 과목마다 모의고사 10회분(튀르키예어). 과목 패키지와 별도이며, AliKa는 이 문항을 LGS 모의고사에서만 사용합니다.",
        "lgs_download": "LGS 패키지 다운로드",
        "prep_title": "LGS 2028 대비 — 7학년",
        "prep_body": "2028년에 LGS를 볼 7학년을 위한 맥락형 문제(튀르키예어). 모의고사 팩은 5회분이며, AliKa가 아이가 배운 단원에 맞춰 각 회를 줄입니다. 단원 세트는 각 단원이 끝날 때 풀며 설명이 함께 제공됩니다.",
        "prep_exam": "모의고사 (5회분)",
        "prep_units": "단원 세트",
        "prep_exam_download": "모의고사 팩 다운로드",
        "prep_units_download": "단원 세트 다운로드",
        "prep_note": "AliKa Windows 1.2.15 이상이 필요합니다. Android는 다음 버전에서 지원됩니다. 단원 세트는 모의고사 팩의 일정에 따라 열리므로 둘 다 설치하세요. 문제는 AI가 만들고 검토했으며 사람의 검토는 없었습니다. 공식 LGS 문제가 아닙니다.",
        "primary_title": "초등 시각 활동",
        "primary_body": "색깔 도형 카드로 된 시각 문항 {}개: 닮은 것 찾기, ‘다음은 무엇일까?’, ‘다른 하나 찾기’, ‘표 완성하기’. 글을 읽지 않아도 됩니다.",
        "primary_note": "미리보기: 아직 아이들과의 시험 사용을 거치지 않았습니다. AliKa Windows 1.2.12 이상이 필요하며, 출시된 Android 버전은 아직 이 카드를 표시하지 못합니다.",
        "primary_download": "활동 패키지 다운로드",
        "age": "{}~{}세",
        "games_title": "공유 화면 게임 패키지",
        "games_body": "낱말 돌림판과 이름·도시·동물을 9개 언어, 4개 연령대별 패키지로 제공합니다. 공유 화면에서 하고, 모두 자기 휴대폰으로 참여합니다.",
        "games_install": "Windows에서는 서재 › 게임 › 게임 추가로 패키지를 설치하세요(AliKa Windows 1.2.12 이상). Android TV는 앱 안에서 이 패키지를 내려받습니다.",
        "words": "{}문제",
        "rounds": "{}라운드",
        "other_langs": "다른 언어",
        "word-wheel": ("낱말 돌림판", "힌트로 숨은 낱말을 찾아보세요. 연령대별로 따로 준비된 버전."),
        "name-city": ("이름·도시·동물", "익숙한 낱말 게임을 공유 화면에서. 연령대별로 따로 준비된 버전."),
    },
}
LANGUAGE_NATIVE_NAMES = {
    "tr": "Türkçe", "en": "English", "de": "Deutsch", "es": "Español", "fr": "Français",
    "pt": "Português", "ru": "Русский", "ja": "日本語", "ko": "한국어",
}
# Sitede yayımlanan kapsam (tools/content_catalog.py PUBLISHED_GRADES ile aynı): hazır / plan aşamasında / ders sözcüğü.
CONTENT_SCOPE_LABELS = {
    "tr": ("Şu an hazır:", "Türkiye ortaokul müfredatı (5–8. sınıf) için konu anlatımları ve sorular, LGS 2027 deneme paketi, ilkokul (6–10 yaş) görsel etkinlikleri ve ortak ekran oyun paketleri.", "Plan aşamasında:", "İlkokul ve lise ders içerikleri ile diğer ülkelerin müfredatları.", "ders"),
    "en": ("Available now:", "Topic explanations and questions for the Turkish middle-school curriculum (grades 5–8, in Turkish), the LGS 2027 practice exam pack, primary visual activities (ages 6–10) and shared-screen game packs.", "In the planning stage:", "Primary and high-school subject content and other countries’ curricula.", "subjects"),
    "de": ("Jetzt verfügbar:", "Themenerklärungen und Fragen für den türkischen Lehrplan der Mittelstufe (Klassen 5–8, auf Türkisch), das LGS-2027-Probeprüfungspaket, visuelle Übungen für die Grundschule (6–10 Jahre) und Spielpakete für den gemeinsamen Bildschirm.", "In Planung:", "Fachinhalte für Grundschule und Oberstufe sowie Lehrpläne anderer Länder.", "Fächer"),
    "es": ("Disponible ahora:", "Explicaciones de temas y preguntas del plan de estudios turco de secundaria inferior (5.º a 8.º curso, en turco), el paquete de exámenes de práctica LGS 2027, actividades visuales de primaria (6–10 años) y paquetes de juegos para la pantalla compartida.", "En fase de planificación:", "Contenidos de asignaturas de primaria y bachillerato y planes de estudios de otros países.", "asignaturas"),
    "fr": ("Disponible maintenant :", "Explications de cours et questions pour le programme turc du collège (classes 5 à 8, en turc), le pack d’examens blancs LGS 2027, des activités visuelles pour le primaire (6–10 ans) et des packs de jeux pour l’écran commun.", "En phase de planification :", "Les contenus de matières du primaire et du lycée et les programmes d’autres pays.", "matières"),
    "pt": ("Disponível agora:", "Explicações de temas e perguntas do currículo turco do 5.º ao 8.º ano (em turco), o pacote de exames de treino LGS 2027, atividades visuais do 1.º ciclo (6–10 anos) e pacotes de jogos para o ecrã partilhado.", "Em fase de planeamento:", "Conteúdos de disciplinas do 1.º ciclo e do ensino secundário e os currículos de outros países.", "disciplinas"),
    "ru": ("Сейчас доступно:", "Объяснения тем и вопросы по турецкой программе средней школы (5–8 классы, на турецком языке), пакет пробных экзаменов LGS 2027, визуальные задания для начальной школы (6–10 лет) и игровые пакеты для общего экрана.", "На этапе планирования:", "Предметные материалы для начальной и старшей школы и программы других стран.", "предметов"),
    "ja": ("現在提供中：", "トルコの中学校課程（5〜8年生、トルコ語）の単元解説と問題、LGS 2027 模擬試験パック、小学生向けビジュアル課題（6〜10歳）、共有画面用ゲームパック。", "計画段階：", "小学校・高校の教科コンテンツと、ほかの国のカリキュラム。", "教科"),
    "ko": ("현재 제공:", "튀르키예 중학교 과정(5~8학년, 튀르키예어)의 단원 설명과 문제, LGS 2027 모의고사 패키지, 초등 시각 활동(6~10세), 공유 화면 게임 패키지.", "계획 단계:", "초등학교·고등학교 과목 콘텐츠와 다른 나라 교육과정.", "과목"),
}
THOUSANDS_SEPARATORS = {"tr": ".", "de": ".", "es": ".", "pt": ".", "fr": "\u202f", "ru": "\u00a0"}
CONTENT_BOOK_LABELS = {
    "tr": ("Ana sayfaya dön", "Hazır içerik defteri", "Ülke", "Sınıf paketi", "Ders paketi", "Hata, geliştirme fikri veya eleştiriniz mi var? Bize yazın."),
    "en": ("Back to the home page", "Ready content ledger", "Countries", "Grade packs", "Subject packs", "Found an issue or have an idea? Tell us."),
    "de": ("Zur Startseite", "Heft mit fertigen Inhalten", "Länder", "Klassenpakete", "Fachpakete", "Fehler oder Idee? Schreiben Sie uns."),
    "es": ("Volver a la página de inicio", "Cuaderno de contenido preparado", "Países", "Paquetes por curso", "Paquetes por asignatura", "¿Ha encontrado un error o tiene una idea? Escríbanos."),
    "fr": ("Retour à l’accueil", "Cahier de contenus prêts", "Pays", "Packs par niveau", "Packs par matière", "Une erreur ou une idée ? Écrivez-nous."),
    "pt": ("Voltar à página inicial", "Caderno de conteúdos prontos", "Países", "Pacotes por ano", "Pacotes por disciplina", "Encontrou um erro ou tem uma ideia? Escreva-nos."),
    "ru": ("На главную страницу", "Каталог готовых материалов", "Страны", "Пакеты классов", "Пакеты предметов", "Нашли ошибку или есть идея? Напишите нам."),
    "ja": ("ホームに戻る", "すぐ使える教材ノート", "国", "学年パック", "教科パック", "不具合や改善案がありましたらお知らせください。"),
    "ko": ("홈으로 돌아가기", "준비된 콘텐츠 노트", "국가", "학년 패키지", "과목 패키지", "오류나 개선 아이디어가 있나요? 알려주세요."),
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
# Sosyal medya hesapları: ana sayfa altlığı, ana sayfa JSON-LD sameAs ve tools/check.py ile aynı liste.
# Erişilebilir adlar dil dosyasındaki footer.social bloğundan okunur.
SOCIAL_PROFILES = json.loads((SRC / "data" / "social.json").read_text(encoding="utf-8"))["profiles"]
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
        # R1: metinler Resmî Gazete'den karşılaştırıldı (20 Ekim 2026), 21 Ekim 2026'da yayımlandı;
        # 31 Mart 2027 öncesi yeniden gözden geçirilir.
        "slug": "15-yas-alti-sosyal-medya-duzenlemesi",
        "updated": ("2026-10-21", "21 Ekim 2026"),
        "campaign_id": "site_rehber_15yas_tr",
        "platform": "both",
        "video": "15-yas-sosyal-medya",
        "video_heading": "Rehberin video özeti",
        "video_label": "1 Kasım’da ne değişiyor? Ebeveynler için 5 soru · 2:53",
        "video_short": "15-yas-bosalan-saatler",
        "video_short_label": "Boşalan saatleri planlayın · 0:19",
        "eyebrow": "Gündem · Ebeveynler için sade rehber",
        "title": "15 Yaş Altı Sosyal Medya Düzenlemesi: 1 Kasım’da Ne Değişiyor?",
        "description": "15 yaş altına sosyal medya düzenlemesi 1 Kasım 2026’da başlıyor. e-Devlet ile yaş doğrulama, 15–18 yaş hesapları, 31 Mart 2027 tarihi ve ailelerin yapabilecekleri.",
        "lede": (
            "1 Kasım 2026’dan itibaren Türkiye’den erişilebilen sosyal ağ sağlayıcıları, 15 yaşını doldurmamış çocuklara hizmet sunamayacak. "
            "15–18 yaş arasındaki çocukların hesapları ise daha korumalı ayarlarla çalışacak. "
            "Bu rehber, Resmî Gazete’de yayımlanan metinlerin ailelere dokunan kısmını sade bir dille özetler ve boşalan zaman için bir plan önerir. Hukuki danışmanlık değildir."
        ),
        "sections": (
            ("Düzenleme ne zaman başlıyor, dayanağı ne?", (
                "Dayanak, 1 Mayıs 2026 tarihli Resmî Gazete’de yayımlanan 7578 sayılı Kanun’dur. Bu Kanun, 5651 sayılı İnternet Kanunu’nun ek 4. maddesini değiştirdi; sosyal ağlarla ilgili hüküm yayımdan altı ay sonra yürürlüğe giriyor.",
                "Uygulamanın ayrıntıları, Cumhurbaşkanlığı Siber Güvenlik Başkanlığı’nın hazırladığı ve 10 Ekim 2026 tarihli Resmî Gazete’de yayımlanan yönetmelikte yer alıyor. Yönetmelik 1 Kasım 2026’da yürürlüğe giriyor ve Türkiye’den erişilebilen yurt içi ve yurt dışı kaynaklı sosyal ağ sağlayıcılarını kapsıyor.",
            )),
            ("15 yaş altı için ne değişiyor?", (
                "Sosyal ağ sağlayıcı, 15 yaşını doldurmamış çocuklara hizmet sunamaz. Yaş doğrulamasında 15 yaşını doldurmadığı görülen çocukların hesap açma talepleri reddedilir.",
                "Yayımlanan metinlerde ebeveyn izniyle hesap açmaya yönelik bir istisna yer almıyor. Kural, çocuğun ya da ailenin değil, platformun yükümlülüğü olarak yazılmıştır.",
            )),
            ("Mevcut hesaplar: 31 Mart 2027", (
                "1 Kasım’dan önce açılmış hesapların da 31 Mart 2027’ye kadar en az bir kez yaş doğrulamasından geçmesi gerekiyor. 15 yaşını doldurmadığı görülen çocukların mevcut hesapları, kullanıcıya bilgi verilerek kapatılır.",
                "Kapatılan hesaba ait veriler, itiraz yoksa gecikmeden; itiraz varsa süreç bittikten sonra silinir. Çocuğunuzun saklamak istediği fotoğraf, video ya da yazışmalar varsa bunları bu tarihten önce birlikte yedeklemeyi konuşabilirsiniz. Platformlar doğrulamayı bu tarihten önce de isteyebilir.",
            )),
            ("Yaş nasıl doğrulanacak?", (
                "Doğrulama e-Devlet Kapısı üzerinden yapılır. Kullanıcı e-Devlet’te kimliğini doğrulayarak bir yaş doğrulama belirteci oluşturur ve bunu ilgili platforma yükler. Belirteç yalnız 15 ve 18 yaş eşiklerinin geçilip geçilmediğini gösterir; ad, kullanıcı adı gibi kişisel bilgi taşımaz ve platform onu yaş doğrulaması dışında kullanamaz.",
                "İlk doğrulamadan sonra platform kendi yöntemlerini de kullanabilir. Bir hesabın yaş aralığına aykırı kullanıldığına dair makul şüphe olursa hesap askıya alınır ve yeniden belirteçle doğrulama istenir.",
                "e-Devlet şifrenizi kimseyle paylaşmayın. Yaş doğrulaması gerekçesiyle şifre, kimlik fotoğrafı ya da ödeme isteyen mesaj ve sitelere karşı dikkatli olun; doğrulamayı yalnız platformun kendi uygulamasından ve e-Devlet’in resmî adresinden yapın.",
            )),
            ("15–18 yaş: hesaplar nasıl değişiyor?", (
                "15 yaşını doldurmuş çocukların hesapları varsayılan olarak gizli olur ve herkese açık hale getirilemez. Takipçi ve takip edilen listelerini başkaları göremez. Çocuğa yalnız onun takip ettiği hesaplar mesaj gönderebilir; mesajın görüldü bilgisi karşı tarafa gitmez.",
                "Bu hesaplarda canlı yayın açılamaz. İçerikleri kaydırarak ya da kendiliğinden art arda sunan tasarımlar kullanılamaz. Çocuğun verileri davranışa göre kişiselleştirme, profilleme ya da kişiselleştirilmiş reklam için kullanılamaz; telefon rehberi gibi kişi listeleriyle eşleştirme yapılmaz ve çocuk hesabı başkalarına takip önerisi olarak gösterilmez.",
                "Yönetmelik ayrıca bağımlılık geliştirme etkisi doğurabilecek hizmetlerin bu yaş grubuna sunulamayacağını ve çocuğun profil fotoğrafı, paylaşımları ve görsellerinin başkalarınca ekran görüntüsü alınmasına karşı teknik önlem alınacağını söyler.",
            )),
            ("Platformların sunacağı ebeveyn kontrol araçları", (
                "Sosyal ağlar, anne, baba ya da vasi gibi çocuk hakkında karar verme yetkisi olan kişiler için ebeveyn kontrol araçları sunmak zorunda. Bu araçlar en az şunları içerir: hesap ve özellik ayarlarının yönetimi, satın alma ve ücretli üyelik için ebeveyn onayı ve harcama sınırı, kullanım süresinin izlenmesi ve sınırlanması, konum paylaşımının yönetimi.",
                "Araçlar Türkçe sunulur ve farklı cihazlarda çalışır. Etkinleştirildiğinde çocuğa açıkça bildirilir; çocuk, ebeveynin bilgisi ve güvenlik doğrulaması olmadan bunları kapatamaz. Yönetmelik, araçların çocuğun mahremiyetini orantısız biçimde ortadan kaldırmayacak, gözetimden çok iletişime dayanacak şekilde tasarlanmasını da ister.",
                "Bu araçları çocuğunuzla birlikte, ona ne göreceğinizi ve neyi görmeyeceğinizi anlatarak açın. Gizli değil, konuşulmuş bir kural daha kolay benimsenir.",
            )),
            ("Yanlış sonuç çıkarsa: başvuru ve itiraz", (
                "Platformlar; yaş doğrulama sonucuna, hesabın askıya alınmasına ya da kapatılmasına ve çocuklara yönelik tedbirlere karşı ücretsiz, Türkçe bir başvuru ve itiraz yolu kurmak zorunda. Başvurular tamamen otomatik sistemlerle sonuçlandırılamaz; bir insan incelemesi yapılır.",
                "İtiraz sürerken hesaba ait içerik ve kişisel veriler silinmez. Sonuca karşı Siber Güvenlik Başkanlığı’na şikâyet ve yargı yolu açıktır; platform bunları bildirimde belirtmek zorundadır.",
            )),
            ("Hangi uygulamalar kapsamda?", (
                "Yönetmelik uygulama adı saymaz. Sosyal ağ sağlayıcıyı, kullanıcıların sosyal etkileşim amacıyla metin, görüntü, ses ve konum gibi içerikleri oluşturmasına, görüntülemesine ya da paylaşmasına imkân sağlayan kişi veya kuruluşlar olarak tanımlar.",
                "Belirli bir uygulamanın nasıl etkileneceğini o uygulamanın kendi duyurularından takip edin. Aynı Kanun oyun platformlarına da derecelendirme ve ebeveyn kontrol araçları gibi ayrı yükümlülükler getiriyor; bu rehber onların ayrıntısına girmiyor.",
            )),
            ("1 Kasım’dan önce çocukla konuşun", (
                "Değişikliği çocuğunuz arkadaşlarından ya da bir bildirimden öğrenmeden önce siz anlatın. Bunun bir ceza olmadığını, kuralın bütün platformlar için geçerli olduğunu söyleyin.",
                "Sosyal medyayı ne için kullandığını sorun: arkadaşlarla konuşmak, video izlemek, bir hobiyi takip etmek. Hangisinin onun için önemli olduğunu bilmek, boşalan zamanı birlikte planlamayı kolaylaştırır. 15 yaşını dolduracak bir çocukla da yeni hesap ayarlarını birlikte gözden geçirin.",
            )),
            ("Boşalan zaman için ailece plan", (
                "Sosyal medyaya ayrılan süre bir anda boşalırsa çocuk bu zamanı başka ekranlarla doldurabilir. Okul günü ve hafta sonu için ayrı bir günlük ekran süresi, sabit bir ekran kapanış saati ve her güne bir ekran dışı etkinlik belirlemek iyi bir başlangıçtır.",
                "Haftalık planı yazdırılabilir tabloyla birlikte hazırlamak için “Ailece ekran süresi planı” rehberine, 16–20 Kasım ara tatili için “Ara tatil ekran süresi planı” rehberine bakabilirsiniz.",
            )),
        ),
        "related": (
            ("Ailece ekran süresi planı nasıl yapılır?", "ailece-ekran-suresi-plani"),
            ("Ara tatilde ekran süresi nasıl planlanır?", "ara-tatil-ekran-suresi-plani"),
            ("Android telefonda çocuğun ekran süresi nasıl planlanır?", "android-cocuk-ekran-suresi"),
        ),
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü sosyal medya hesaplarını yönetmez ve yaş doğrulaması yapmaz; bu iş platformlara aittir. AliKa, ailece kararlaştırdığınız ekran planını Windows bilgisayarda ve Android telefonda uygular: günlük süre, uyku saati, uygulama sınırı ve web filtresi.",
            "Çocuk kalan süresini ekranında görür ve süre dolduğunda hangi kuralın uygulandığını bilir. İsterseniz sizin eklediğiniz sorulardan çözerek, sizin belirlediğiniz günlük üst sınır içinde ek süre kazanabilir. AliKa hesabı açmanız gerekmez.",
        )),
        "sources": (
            ("7578 sayılı Kanun — Resmî Gazete, 1 Mayıs 2026, sayı 33240", "https://www.resmigazete.gov.tr/eskiler/2026/05/20260501-1.htm"),
            ("Sosyal Ağ Sağlayıcı Tarafından Çocuklara Özgü Ayrıştırılmış Hizmet Sunulmasına ve Yaş Doğrulamaya İlişkin Yönetmelik — Resmî Gazete, 10 Ekim 2026, sayı 33396", "https://www.resmigazete.gov.tr/eskiler/2026/10/20261010-15.pdf"),
        ),
    },
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
    {
        # R5: Google ve Güvenli İnternet sayfaları 21 Ekim 2026'da okundu, aynı gün yayımlandı;
        # Play menü adları değişirse yeniden gözden geçirilir.
        "slug": "cocuga-ilk-telefon",
        "updated": ("2026-10-21", "21 Ekim 2026"),
        "campaign_id": "site_rehber_ilk_telefon_tr",
        "platform": "android",
        "eyebrow": "İlk telefon · Ebeveynler için sade rehber",
        "title": "Çocuğa İlk Telefon: İlk Hafta Kuralları ve Kurulum Listesi",
        "description": "Çocuğa ilk telefonu vermeden önce kurulum listesi, ilk hafta kuralları, hesap yaş sınırları ve yazdırılabilir aile sözleşmesi. Android telefonlar için.",
        "video": "android-ilk-kurulum",
        "video_label": "AliKa Android ilk kurulum · 1:40",
        "lede": (
            "İlk telefon için herkese uyan tek bir yaş yok. Yaş kadar, çocuğun telefona ne için ihtiyaç duyduğu ve telefonun nasıl kurulduğu da önemlidir. "
            "Bu rehber, telefonu vermeden önce yapılacak kurulumu, ilk haftanın kurallarını ve çocukla yapılacak konuşmayı sırayla anlatır. "
            "Sonunda çocukla birlikte doldurabileceğiniz yazdırılabilir bir aile sözleşmesi var."
        ),
        "sections": (
            ("Kaç yaşında? Önce ihtiyacı konuşun", (
                "Karar verirken şu sorular yaştan daha çok yol gösterir: Telefon ne için gerekli: okul dönüşünde haber vermek mi, servis mi, arkadaşlarla konuşmak mı? Çocuk bir kuralı her gün hatırlatılmadan uygulayabiliyor mu? Canını sıkan bir şeyi size anlatıyor mu?",
                "İhtiyaç yalnız aramak ve mesajlaşmaksa, ilk aşamada az uygulamalı bir telefon yeterli olabilir. Uygulamaları ve süreyi, kurallar oturdukça birlikte artırırsınız.",
                "Bazı yaş sınırları telefonun değil, hesapların kuralıdır. Google’ın yardım sayfasına göre Türkiye’de kendi Google hesabını yönetmenin alt yaşı 13’tür; daha küçük çocuklar için hesabı ebeveyn Family Link ile açar ve yönetir. 1 Kasım 2026’dan itibaren sosyal ağlar 15 yaşını doldurmamış çocuklara hizmet sunamaz; ayrıntılar “15 yaş altı sosyal medya düzenlemesi” rehberindedir.",
            )),
            ("Vermeden önce: telefon kimin, hangi hesapla?", (
                "Telefonun ve hattın kimin adına olacağını, çocuğun hangi Google hesabını kullanacağını baştan belirleyin. Ebeveynin kendi hesabıyla kurulan bir telefonda çocuk sizin e-postalarınıza, fotoğraflarınıza ve ödeme yönteminize ulaşabilir; çocuğa ayrı bir hesap açmak daha temizdir.",
                "Hesabın kurtarma bilgilerini (telefon numarası, yedek e-posta) siz tutun. Çocuğun telefonuna banka kartı eklemeyin.",
            )),
            ("Kurulum listesi: telefon ve Google Play", (
                "Güncellemeler ve ekran kilidi: Telefonun yazılım güncellemelerini yapın. Ekran kilidini çocukla birlikte belirleyin; ilk telefonda sizin de bilmeniz konusunda anlaşın. Ekran kilidi, telefon kaybolursa içindekileri korur.",
                "Uygulama yaş sınırı: Play Store’da profil simgesi > Ayarlar > Aile > İçerik kısıtlamaları > Ebeveyn denetimlerine git yolundan çocuğun tahmin edemeyeceği bir PIN belirleyin ve uygulama ve oyunlar için yaş sınırını seçin. Family Link kullanıyorsanız aynı ayar Family Link’te Denetimler > Google Play bölümündedir.",
                "Google’ın notuna göre içerik kısıtlamaları, kısıtlanan içeriğin arama sonuçlarında ya da doğrudan bağlantıyla görünmesini engellemez. Bu yüzden yeni uygulamaları birlikte indirme kuralı yine gerekir.",
                "Satın alma doğrulaması: Play Store’da profil simgesi > Ödemeler ve abonelikler > Satın alma işlemlerini doğrulama yolundan “Her zaman” seçeneğini seçin. Doğrulamayı parmak izi ya da yüz tanımayla yaparsanız telefonda kayıtlı bütün biyometri verileri kullanılabilir; yani çocuğun parmak izi de satın almayı onaylayabilir.",
                "Az uygulamayla başlayın: İlk gün yalnız gerekenleri bırakın: telefon, mesaj, kamera ve okul için kullanılanlar. Diğerlerini ilk haftadan sonra birlikte değerlendirin.",
            )),
            ("Kurulum listesi: hat, internet ve kişiler", (
                "Hat ayarları: Hattı aldığınız operatöre, faturaya yansıyan mobil ödemelerin ve ek ücretli servislerin kapatılıp kapatılamayacağını sorun. Hazır kart ya da sınırlı bir tarife, ilk telefonda fatura sürprizlerini azaltır.",
                "Güvenli İnternet: BTK’nın Güvenli İnternet hizmeti internet servis sağlayıcıları tarafından ücretsiz sunulur ve program kurmayı gerektirmez. Çocuk profili yalnız izin verilen siteleri açar, sohbet ve sosyal medya sitelerine izin vermez. Aile profili zararlı içeriği engeller; isterseniz oyun, sohbet ve sosyal medya kategorilerini de kapatır.",
                "Profil SMS ile, telefonla, bayiden ya da internet üzerinden seçilir ve istendiğinde değiştirilebilir ya da kapatılabilir. Hizmetin çocuğun hattında ya da ev internetinizde nasıl açılacağını sağlayıcınıza sorun.",
                "Aile kişileri ve acil durum: Ebeveynlerin, yakın akrabaların ve gerekirse okulun numarasını rehbere kaydedin; 112’nin nasıl arandığını birlikte gösterin. Çoğu Android telefonda acil durum bilgileri bölümüne bir yakının numarası eklenebilir.",
                "Konum paylaşımı: Konumunu görecekseniz bunu çocuğa söyleyin; ne zaman ve neden bakacağınızı anlatın. Konuşulmuş bir kural, sonradan fark edilen bir ayardan daha kolay benimsenir.",
            )),
            ("İlk hafta kuralları", (
                "İlk hafta için az ve açık kural koyun, telefonla birlikte yazılı olarak verin. Aşağıdakiler iyi bir başlangıçtır; sayıları ve saatleri ailece belirleyin.",
                "Gece şarj yeri: Telefon geceyi yatak odasının dışında, kararlaştırdığınız bir yerde şarjda geçirir.",
                "Günlük süre: Okul günü için küçük bir günlük süreyle başlayın; hafta sonunu ayrıca konuşun.",
                "Ekranların kapanış saati: Yatmadan önce sabit bir saat belirleyin ve her gün aynı tutun.",
                "Ortak alan: İlk hafta telefonu evde ortak alanlarda kullanmayı deneyin.",
                "Yeni uygulama ve hesap: Yeni bir uygulama indirmeden ya da bir yerde hesap açmadan önce size sorulur.",
                "Her akşam kısa bir sohbet: Gün içinde neyi kullandığını, hoşuna giden ya da canını sıkan bir şey olup olmadığını konuşun. Sorgu değil, sohbet olsun.",
                "Hafta sonunda gözden geçirme: Yedinci gün kuralları birlikte gözden geçirin; işleyeni tutun, işlemeyeni değiştirin.",
            )),
            ("Sakin bir güvenlik konuşması", (
                "Korkutmadan, kısa ve somut konuşun. Tanımadığı biri fotoğraf, şifre, adres ya da para isterse cevap vermeden size göstermesini; bir mesaj, oyun ya da video canını sıkarsa telefonu size getirmesini isteyin.",
                "SMS ile gelen doğrulama kodlarının ve şifrelerin arkadaşlarla bile paylaşılmadığını, gönderilen bir fotoğrafın her zaman geri alınamayabileceğini anlatın.",
                "En önemli cümle şudur: “Bana anlattığın için ceza almayacaksın.” Telefonunun elinden alınacağını düşünen çocuk, yaşadığı sorunu saklayabilir.",
            )),
            ("Sık yapılan hatalar", (
                "Telefonu ebeveynin hesabıyla kurmak, ilk gün bütün uygulamaları açmak, kuralları sonradan ve söylemeden eklemek ve gece şarj yerini belirlememek en sık görülen sorunlardır.",
                "Kuralları ilk hafta sonunda gözden geçirme sözü vermek, çocuğun itirazını dinlemenin de bir yolunu açar.",
            )),
        ),
        "printable": {
            "title": "İlk telefon aile sözleşmesi",
            "note": "Yazdırın, çocukla birlikte doldurun ve ikiniz de imzalayın. İlk haftanın sonunda birlikte gözden geçirin.",
            "columns": ("Konu", "Bizim kuralımız"),
            "rows": (
                ("Telefon gece burada şarj olur", ""),
                ("Okul günü ekran süresi", ""),
                ("Hafta sonu ekran süresi", ""),
                ("Ekranlar şu saatte kapanır", ""),
                ("Telefonun kullanılmadığı yerler ve anlar", ""),
                ("Yeni uygulama ya da hesap için", ""),
                ("Mesajlaşma ve paylaşım", ""),
                ("Canımı sıkan bir şey olursa", ""),
                ("Kural bozulursa", ""),
                ("Gözden geçirme tarihi", ""),
                ("İmzalar", ""),
            ),
        },
        "related": (
            ("Android telefonda çocuğun ekran süresi nasıl planlanır?", "android-cocuk-ekran-suresi"),
            ("15 yaş altı sosyal medya düzenlemesi: 1 Kasım’da ne değişiyor?", "15-yas-alti-sosyal-medya-duzenlemesi"),
            ("Ailece ekran süresi planı nasıl yapılır?", "ailece-ekran-suresi-plani"),
        ),
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü ilk hafta kurallarının bir kısmını Android telefonda uygular: günlük süre, uygulama sınırı, uyku saati ve web filtresi. Web filtresi engellediğiniz siteleri kapatır ve Google, YouTube ve Bing’de güvenli aramayı zorlar; filtreleme telefonun içinde yapılır.",
            "Çocuk kalan süresini ekranında görür ve süre dolduğunda hangi kuralın uygulandığını bilir. İsterseniz sizin eklediğiniz sorulardan çözerek, sizin belirlediğiniz günlük üst sınır içinde ek süre kazanabilir; yanlış cevap süre kazandırmaz. AliKa hesabı açmanız gerekmez.",
        )),
        "sources": (
            ("Google Hesaplarında yaş şartları — Google Hesabı Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/accounts/answer/1350409?hl=tr"),
            ("Google Play’de içerik kısıtlamaları ayarlama — Google Play Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/googleplay/answer/1075738?hl=tr"),
            ("Google Play’de satın alma işlemlerini doğrulama — Google Play Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/googleplay/answer/1626831?hl=tr"),
            ("Güvenli İnternet Hizmeti — BTK Güvenli İnternet Merkezi, 21 Ekim 2026’da erişildi", "https://www.guvenlinet.org.tr/guvenli-internet-hizmeti"),
            ("Sosyal Ağ Sağlayıcı Tarafından Çocuklara Özgü Ayrıştırılmış Hizmet Sunulmasına ve Yaş Doğrulamaya İlişkin Yönetmelik — Resmî Gazete, 10 Ekim 2026, sayı 33396", "https://www.resmigazete.gov.tr/eskiler/2026/10/20261010-15.pdf"),
        ),
    },
    {
        # R6: Google ve Apple yardım sayfaları 21 Ekim 2026'da okundu, aynı gün yayımlandı;
        # Play, Dijital Denge ya da Apple menü adları değişirse yeniden gözden geçirilir.
        "slug": "cocuga-tablet-telefon-hediye",
        "updated": ("2026-10-21", "21 Ekim 2026"),
        "campaign_id": "site_rehber_hediye_cihaz_tr",
        "platform": "android",
        "eyebrow": "Yılbaşı hediyesi · Ebeveynler için sade rehber",
        "title": "Çocuğa Tablet ya da Telefon Hediye Etmeden Önce 5 Ayar",
        "description": "Çocuğa tablet ya da telefon hediye etmeden önce 5 ayar: hesap, güncelleme, yaş sınırı, satın alma doğrulaması, süre. Eski telefon ve iPad notu, kurulum listesi.",
        "video": "android-ilk-kurulum",
        "video_label": "AliKa Android ilk kurulum · 1:40",
        "lede": (
            "Yeni bir tablet ya da telefonun ayarlarını hediyeyi paketlemeden önce yapın; kuralları da hediye günü çocukla birlikte konuşun. "
            "Bu rehber Android telefon ve tabletler için beş ayarı sırayla anlatır. Kendi eski telefonunuzu verecekseniz ya da iPad hediye edecekseniz ayrı notlar var. "
            "Sonunda ayarları yaptıkça işaretleyebileceğiniz yazdırılabilir bir kurulum listesi bulunur."
        ),
        "sections": (
            ("Paketlemeden önce bir akşam ayırın", (
                "Kurulum, ilk yazılım güncellemeleriyle birlikte zaman alabilir. Cihazı şarj edin, ev Wi-Fi’ına bağlayın ve ayarları hediye gününden önce bitirin. Böylece çocuk hediyesini açtığında ilk saati ayar ekranlarında geçmez.",
                "Ayarları siz yapın, kuralları ise hediye günü çocukla birlikte konuşun. Hangi ayarın neden açık olduğunu bilen çocuk, kuralı daha kolay kabul eder.",
            )),
            ("1. Hesap: cihaz kimin, hangi hesapla?", (
                "Önce cihazın kime ait olacağını belirleyin: yalnız çocuğun kullanacağı bir tablet ya da telefon mu, ailenin ortak tableti mi? Ebeveynin hesabıyla açık bir cihazda çocuk sizin e-postalarınıza, fotoğraflarınıza ve ödeme yönteminize ulaşabilir; çocuğa ayrı bir hesap açmak daha temizdir.",
                "Google’ın yardım sayfasına göre Türkiye’de kendi Google hesabını yönetmenin alt yaşı 13’tür; daha küçük çocuklar için hesabı ebeveyn Family Link ile açar ve yönetir. Çocuğun zaten bir Google hesabı varsa Family Link ile bu hesaba da gözetim eklenebilir.",
                "Ortak bir aile tabletinde birden fazla kullanıcı tanımlanabiliyorsa çocuğa ayrı bir kullanıcı açın. Google Play’deki içerik kısıtlamaları her kullanıcı için ayrı belirlenebilir.",
            )),
            ("Kendi eski telefonunuzu veriyorsanız", (
                "Önce fotoğraflarınızı ve verilerinizi Google hesabınıza yedekleyin, sonra telefonu fabrika ayarlarına sıfırlayın. Google’a göre sıfırlama telefondaki bütün verileri siler; yüklü uygulamalar ve verileri de kaldırılır.",
                "Sıfırlamadan sonra telefonda daha önce kullanılan Google hesabının bilgileri istenebilir. Bu yüzden sıfırlamayı telefonu vermeden önce, hesap bilgileriniz yanınızdayken yapın; ardından telefonu çocuğun hesabıyla baştan kurun. Google, işlemin bir saat kadar sürebileceğini ve pilin en az %70 dolu olmasını öneriyor.",
            )),
            ("2. Güncellemeler ve ekran kilidi", (
                "Cihazın yazılım güncellemelerini hediyeden önce yapın; ilk açılıştaki güncellemeler uzun sürebilir.",
                "Kurulum sırasında geçici bir ekran kilidi koyun. Hediye günü yeni kilidi çocukla birlikte belirleyin ve sizin de bilmeniz konusunda anlaşın. Ekran kilidi, cihaz kaybolursa içindekileri korur.",
            )),
            ("3. Uygulama yaş sınırı", (
                "Play Store’da profil simgesi > Ayarlar > Aile > İçerik kısıtlamaları > Ebeveyn denetimlerine git yolundan çocuğun bilmeyeceği bir PIN belirleyin ve uygulama ve oyunlar için yaş sınırını seçin. Family Link kullanıyorsanız aynı ayar Family Link’te Denetimler > Google Play bölümündedir.",
                "Bu denetimler yalnız ayarlandıkları cihazda geçerlidir; çocuğun başka bir telefonu ya da tableti varsa adımları orada da tekrarlayın. PIN’i unutursanız Play Store’un verilerini temizlemeniz gerekir ve kısıtlamalar da sıfırlanır; seçtiğiniz ayarları bir yere not edin.",
                "Google’ın notuna göre içerik kısıtlamaları, kısıtlanan içeriğin arama sonuçlarında ya da doğrudan bağlantıyla görünmesini engellemez. Bu yüzden yeni uygulamaları birlikte indirme kuralı yine gerekir.",
            )),
            ("4. Satın alma doğrulaması", (
                "Play Store’da profil simgesi > Ödemeler ve abonelikler > Satın alma işlemlerini doğrulama yolundan “Her zaman” seçeneğinin seçili olduğunu kontrol edin. Google’a göre bu seçenek, Google Play faturalandırmasıyla yapılan uygulama içi satın almaları da kapsar.",
                "Doğrulamayı parmak izi ya da yüz tanımayla yaparsanız cihazda kayıtlı bütün biyometri verileri kullanılabilir; yani çocuğun parmak izi de satın almayı onaylayabilir. Çocuğun cihazına banka kartı eklemeyin.",
            )),
            ("5. Günlük süre ve uyku saati", (
                "Hediye günü ve tatil günleri için süre farklı olacaksa bunu baştan söyleyin. Okul günleri için küçük bir günlük süre ve sabit bir ekran kapanış saati belirleyin; sayıları ve saatleri ailece kararlaştırın.",
                "Android’de Ayarlar > Dijital Denge bölümünde uygulama zamanlayıcıları ve Uyku Vakti modu bulunur; menü adları üreticiye göre değişebilir. Dijital Denge, cihazı kullanan kişinin kendi süresini yönetmesi içindir. Google, çocuğun cihazını ebeveyn olarak Family Link ile yönetebileceğinizi belirtir.",
            )),
            ("iPad ya da iPhone hediye ediyorsanız", (
                "Apple cihazlarda ebeveyn denetimleri Aile Paylaşımı ile çalışır: çocuğun kendi Apple Hesabı olmalı ve aile grubunuzda yer almalıdır. Denetimleri kendi iPhone ya da iPad’inizde Ayarlar > Aile > çocuğunuzun adı yolundan yönetirsiniz.",
                "Buradaki İçerik ve Gizlilik Sınırlamaları bölümünden uygulama ve içerik için yaş derecelendirmesi seçilir. Uygulamalar ve Web Siteleri > Sınırlamalar > Satın Alma İzni bölümünde “Satın Alma Onayı Gerektir” açıkken çocuğun indirme ve satın alma istekleri onayınıza gelir.",
            )),
            ("Hediye günü: kurallar hediyeyle birlikte", (
                "Kuralları hediyeyle aynı gün, kısa ve yazılı olarak verin: cihaz gece nerede şarj olur, ekranlar kaçta kapanır, yeni bir uygulama indirmeden önce kime sorulur. Konuşulmuş bir kural, sonradan fark edilen bir ayardan daha kolay benimsenir.",
                "Bu çocuğun ilk telefonuysa “Çocuğa ilk telefon” rehberindeki ilk hafta kurallarını ve yazdırılabilir aile sözleşmesini kullanabilirsiniz.",
            )),
            ("Sık yapılan hatalar", (
                "Cihazı ebeveynin hesabıyla vermek, eski telefonu sıfırlamadan devretmek, satın alma doğrulamasını kontrol etmemek ve kuralları hediyeden günler sonra, söylemeden eklemek en sık görülen sorunlardır.",
            )),
        ),
        "printable": {
            "title": "Yeni cihaz kurulum listesi",
            "note": "Yazdırın, ayarları yaptıkça işaretleyin. Son iki satırı hediye günü çocukla birlikte tamamlayın.",
            "button": "Listeyi yazdırın",
            "columns": ("Ayar", "Nerede", "Tamam"),
            "rows": (
                ("Çocuğun hesabı (13 yaş altı için Family Link)", "Kurulum ekranı ya da Family Link", ""),
                ("Eski telefonsa: yedek ve fabrika ayarları", "Ayarlar", ""),
                ("Yazılım güncellemeleri", "Ayarlar", ""),
                ("Geçici ekran kilidi", "Ayarlar", ""),
                ("Uygulama yaş sınırı ve PIN", "Play Store > Ayarlar > Aile", ""),
                ("Satın alma doğrulaması: Her zaman", "Play Store > Ödemeler ve abonelikler", ""),
                ("Günlük süre ve uyku saati", "Dijital Denge, Family Link ya da ebeveyn kontrolü uygulaması", ""),
                ("Hediye günü: yeni ekran kilidi birlikte", "", ""),
                ("Hediye günü: kurallar yazılı", "", ""),
            ),
        },
        "related": (
            ("Çocuğa ilk telefon: ilk hafta kuralları ve kurulum listesi", "cocuga-ilk-telefon"),
            ("Android telefonda çocuğun ekran süresi nasıl planlanır?", "android-cocuk-ekran-suresi"),
            ("Ailece ekran süresi planı nasıl yapılır?", "ailece-ekran-suresi-plani"),
        ),
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü yeni Android telefon ya da tablette günlük süreyi, uygulama sınırlarını, uyku saatini ve web filtresini uygular. Çocuk kalan süresini ekranında görür; ayarları ebeveyn PIN’iyle siz değiştirirsiniz. AliKa hesabı açmanız gerekmez.",
            "Evde AliKa zaten kullanılıyorsa yeni cihaz aynı aile aboneliğine eklenebilir: bir abonelik, ebeveyn telefonu dahil en fazla 10 eşleştirilmiş Android aile cihazında kullanılır. AliKa iPhone ve iPad’de çalışmaz; bu cihazlarda Apple’ın ebeveyn denetimlerini kullanın.",
        )),
        "sources": (
            ("Google Hesaplarında yaş şartları — Google Hesabı Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/accounts/answer/1350409?hl=tr"),
            ("Çocuğunuzun Google Hesabı’nı Family Link ile yönetme — Google Aile Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/families/answer/7103262?hl=tr"),
            ("Android cihazınızı fabrika ayarlarına sıfırlama — Android Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/android/answer/6088915?hl=tr"),
            ("Google Play’de içerik kısıtlamaları ayarlama — Google Play Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/googleplay/answer/1075738?hl=tr"),
            ("Google Play’de satın almayı doğrulama — Google Play Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/googleplay/answer/1626831?hl=tr"),
            ("Dijital Denge ile Android telefonunuzda geçirdiğiniz zamanı yönetme — Android Yardım, 21 Ekim 2026’da erişildi", "https://support.google.com/android/answer/9346420?hl=tr"),
            ("Çocuğunuzun iPhone veya iPad’ini yönetmek için ebeveyn denetimlerini ayarlama — Apple Destek, 21 Ekim 2026’da erişildi", "https://support.apple.com/tr-tr/105121"),
            ("Satın Alma İzni ile çocuğunuzun içeriklerini onaylama — Apple Destek, 21 Ekim 2026’da erişildi", "https://support.apple.com/tr-tr/105055"),
        ),
    },
    {
        # R7: Microsoft yardım sayfaları 21 Ekim 2026'da okundu; AliKa profil davranışı
        # windows/profiles.py (çocuk başına veri takası) ile doğrulandı. Menü adları değişirse gözden geçirilir.
        "slug": "kardesler-bilgisayar-sirasi",
        "updated": ("2026-10-21", "21 Ekim 2026"),
        "campaign_id": "site_rehber_kardes_bilgisayar_tr",
        "eyebrow": "Ortak bilgisayar · Ebeveynler için sade rehber",
        "title": "Kardeşler Aynı Bilgisayarı Paylaşınca: Ayrı Süre, Ayrı Kural",
        "description": "Kardeşler aynı bilgisayarı paylaşınca her çocuğa ayrı Windows hesabı, kişiye bağlı süre ve yazılı sıra. Yaşa göre kural, sık hatalar, sıra çizelgesi.",
        "video": "windows-ebeveyn-paneli",
        "video_label": "AliKa Windows ebeveyn paneli · 2:36",
        "lede": (
            "Kardeşler aynı bilgisayarı kullanınca tartışma çoğu zaman süreden değil sıradan çıkar: kim önce oturdu, kimin süresi kimin yüzünden bitti. "
            "Bu rehber Windows 10 ve 11’de her çocuğa ayrı süre ve ayrı kural vermenin dört adımını anlatır. "
            "Sonunda çocuklarla birlikte doldurup bilgisayarın yanına asabileceğiniz yazdırılabilir bir haftalık sıra çizelgesi var."
        ),
        "sections": (
            ("Önce sorunu adlandırın", (
                "Tek hesap ve tek süre olduğunda önce oturan çocuk, kardeşinin süresini de harcamış olur. Ödevi olan çocuk bilgisayarı uzun tutar, küçük kardeş bekler; akşam “Ama o daha uzun oynadı” cümlesiyle biter.",
                "Hedef herkese aynı süreyi vermek değil, herkesin süresinin kendine ait olmasıdır. Çocuklarla oturup üç şeyi birlikte kararlaştırın: kimin ne kadar süresi var, sıra nasıl dönüyor, okul işi nereye giriyor.",
            )),
            ("1. Her çocuğa ayrı Windows hesabı", (
                "Microsoft’a göre bilgisayara birden çok hesap eklendiğinde her kullanıcının kendi ayarları, belgeleri ve uygulamaları olur. Bir kardeşin oyun kaydı, ödev dosyası ya da masaüstü düzeni böylece diğerininkine karışmaz.",
                "Çocuğu Microsoft aile grubunuza account.microsoft.com/family adresindeki “Aile üyesi ekle” seçeneğiyle, Üye rolünde ekleyin; Windows’ta aile ayarları Ayarlar > Hesaplar > Aile bölümündedir. Çocuğun Microsoft hesabı yoksa bu sırada açılabilir. Çocuk, ülkesindeki yasal yaşın altındaysa hesap için yetişkin onayı istenir.",
                "Çocuk bilgisayarda kendi Microsoft hesabıyla oturum açtığında bilgisayar aile grubunuzda görünür. Çocuğun hesabını standart kullanıcı olarak bırakın: Microsoft, çocuğun hesabı yönetici olursa aile özelliklerinin düzgün çalışmayabileceğini belirtiyor. Yönetici hesabı ve şifresi yalnız sizde kalsın.",
                "Windows’ta Microsoft hesabı olmayan yerel bir kullanıcı da eklenebilir. Bu, çocuğa ayrı bir masaüstü verir; ancak aşağıdaki Family Safety süre sınırları, aile grubunuza bağlı çocuk hesabı üzerinden çalışır.",
            )),
            ("2. Süreyi kişiye bağlayın, bilgisayara değil", (
                "Microsoft Family Safety’de ekran süresi sınırı her aile üyesi için ayrı ayarlanır: account.microsoft.com/family adresinde ya da Family Safety uygulamasında çocuğu seçer, Windows sekmesinde gün gün izin verilen saat aralıklarını ve toplam süreyi belirlersiniz. Aynı ayarı bütün günlere de uygulayabilirsiniz.",
                "Böylece bir çocuğun kullandığı süre kardeşinin süresinden düşmez. Belirli uygulama ve oyunlar için de çocuk başına günlük sınır konabilir; Microsoft’a göre bu süre sınırları web sitelerinde çalışmaz.",
            )),
            ("3. Sırayı yazın: kim, ne zaman", (
                "Ayrı süre tek başına yetmez; iki çocuk aynı saatte bilgisayar isterse tartışma yine çıkar. Hafta içi akşamları saat aralıklarına bölün ve her aralığın kime ait olduğunu yazın. Kimin önce başlayacağını günden güne değiştirin: örneğin tek günlerde biri, çift günlerde diğeri önce başlasın.",
                "Okul işini baştan konuşun: ödev için bilgisayar gerekiyorsa bu iş sıranın önüne geçer mi, kişisel süreden sayılır mı? Bunu bir kez kararlaştırıp çizelgeye yazmak, her akşam yeniden pazarlık etmekten kolaydır.",
                "Birlikte oynadıkları zaman için de bir kural koyun: ortak oyun ikisinin süresinden de düşebilir ya da çizelgede ayrı bir “birlikte” aralığı olabilir.",
            )),
            ("4. Yaşa göre farklı kural, herkese aynı açıklık", (
                "Kardeşlerin yaşı farklıysa kuralları da farklı olabilir: büyük çocuğun süresi daha uzun, ekran kapanış saati daha geç olabilir. Farkın nedenini açıkça söyleyin; “Sen de o yaşa gelince süren uzayacak” demek, “O büyük” demekten daha anlaşılırdır.",
                "Büyük kardeşi süre bekçisi yapmayın. Kuralı uygulamak ebeveynin işidir; kardeşin kardeşi gözetlemesi tartışmayı bilgisayardan kardeş ilişkisine taşır.",
            )),
            ("Sıra değişirken: oturumu kapatın", (
                "Sırası biten çocuk Başlat menüsündeki hesap simgesinden oturumunu kapatsın, sonraki çocuk kendi hesabıyla açsın. Böylece herkes kendi masaüstü ve kendi süresiyle başlar.",
                "Kendi yönetici hesabınızı açık bırakmayın. Ebeveyn hesabında çocuk sınırları yoktur ve aile ayarları oradan değiştirilebilir.",
            )),
            ("Haftada bir gözden geçirin", (
                "Hafta sonunda on dakika ayırın: sıra adil miydi, kimin süresi hep yetmedi, okul işi sırayı bozdu mu? Bir seferde tek bir kuralı değiştirin ve değişikliği çocukların hepsine birlikte söyleyin.",
            )),
            ("Sık yapılan hatalar", (
                "Bütün çocukları tek hesap ve tek süreyle kullandırmak, çocuğun hesabını yönetici yapmak, ebeveyn hesabını açık bırakmak, büyük kardeşi süre bekçisi yapmak ve bir çocuğun kuralını diğerlerine söylemeden değiştirmek en sık görülen sorunlardır.",
            )),
        ),
        "printable": {
            "title": "Haftalık bilgisayar sıra çizelgesi",
            "note": "Yazdırın, çocuklarla birlikte doldurun ve bilgisayarın yanına asın. Kimin önce başlayacağını günden güne değiştirin.",
            "button": "Çizelgeyi yazdırın",
            "columns": ("Gün", "1. sıra (ad, saat)", "2. sıra (ad, saat)", "Ekranlar kapanır"),
            "rows": (
                ("Pazartesi", "", "", ""),
                ("Salı", "", "", ""),
                ("Çarşamba", "", "", ""),
                ("Perşembe", "", "", ""),
                ("Cuma", "", "", ""),
                ("Cumartesi", "", "", ""),
                ("Pazar", "", "", ""),
            ),
        },
        "related": (
            ("Windows 11’de çocuk ekran süresi nasıl sınırlandırılır?", "windows-11-cocuk-ekran-suresi"),
            ("Ailece ekran süresi planı nasıl yapılır?", "ailece-ekran-suresi-plani"),
            ("Soru çözerek ekran süresi kazanma", "soru-cozerek-ekran-suresi-kazanma"),
        ),
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü Windows 10 ve 11’de her çocuğa ayrı profil açar: günlük süre, uygulama kuralları, yaş ayarı ve raporlar çocuk başına ayrı tutulur. Bir çocuğun kullandığı süre ya da soru çözerek kazandığı ek süre kardeşine geçmez.",
            "Sıra değiştiğinde etkin çocuğu ebeveyn panelinden siz değiştirirsiniz; panel ebeveyn PIN’iyle açılır ve anne ile baba ayrı PIN kullanabilir. Okul, tatil ve sınav haftası için takvimle farklı günlük süre tanımlanabilir. AliKa hesabı açmanız gerekmez.",
        )),
        "sources": (
            ("Windows’ta kullanıcı hesaplarını yönetme — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/windows/security/identity-signin/manage-user-accounts-in-windows"),
            ("Aile grubunuza kişi ekleme — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/family-safety/add-people-to-your-family-group"),
            ("Ebeveyn izni ve Microsoft çocuk hesapları — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/account-billing/ebeveyn-izni-ve-microsoft-%C3%A7ocuk-hesaplar%C4%B1-c6951746-8ee5-8461-0809-fbd755cd902e"),
            ("Bir cihazı Microsoft hesabına bağlama — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/family-safety/how-to-connect-a-device-to-a-microsoft-account"),
            ("Cihazlar arasında ekran süresi sınırlarını ayarlama — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/family-safety/set-screen-time-limits-across-devices"),
            ("Uygulama ve oyun sınırları ayarlama — Microsoft Destek, 21 Ekim 2026’da erişildi", "https://support.microsoft.com/tr-tr/family-safety/set-app-and-game-limits"),
        ),
    },
    {
        # R8: MEB 2026–2027 çalışma takvimi duyurusu 22 Ekim 2026'da okundu. AliKa takvim dönemleri
        # windows/locales (webpanel.cal_*) ile doğrulandı. Takvim değişirse tarihler ve tablo güncellenir.
        "slug": "yariyil-tatili-ekran-suresi",
        "updated": ("2026-10-22", "22 Ekim 2026"),
        "campaign_id": "site_rehber_yariyil_tr",
        "platform": "both",
        "eyebrow": "Karne ve yarıyıl · Ebeveynler için sade rehber",
        "title": "Yarıyıl Tatilinde Ekran Süresi: Karneye Ödül Yerine Plan",
        "description": "25 Ocak – 5 Şubat 2027 yarıyıl tatili için ekran planı: süreyi karne notuna bağlamadan günlük süre, uyku saati, ekran dışı plan ve 16 günlük tablo.",
        "video": "ilk-gun-ayarlari",
        "video_label": "AliKa ilk gün ayarları · 2:06",
        "lede": (
            "Karne günü “Bu tatil istediğin kadar oyna” demek kolaydır; zor olan, iki hafta sonra okul düzenine dönmektir. "
            "Bu rehber 25 Ocak – 5 Şubat 2027 yarıyıl tatili için ekran süresini karne notuna bağlamadan planlamayı anlatır. "
            "Sonunda çocukla birlikte doldurabileceğiniz 16 günlük yazdırılabilir bir tatil planı var."
        ),
        "sections": (
            ("Yarıyıl tatili ne zaman?", (
                "MEB’in 2026–2027 çalışma takvimine göre birinci dönem 22 Ocak 2027 Cuma günü, yani karne günü sona erer. Yarıyıl tatili 25 Ocak Pazartesi başlar, 5 Şubat Cuma biter; ikinci dönem 8 Şubat 2027 Pazartesi başlar.",
                "Hafta sonlarıyla birlikte tatil 23 Ocak Cumartesi’den 7 Şubat Pazar’a kadar 16 gün sürer. Okulunuzun ya da ilinizin duyurusu farklıysa tabloyu kendi takviminize göre düzenleyin.",
            )),
            ("Karne notunu ekran süresine bağlamayın", (
                "“Notların iyi, tatilde sınırsız” ya da “Notların düşük, tatilde ekran yok” kuralı kolay görünür ama tatili karneye göre başlatır. Ekran süresi ödül olunca ekran, tatilin en büyük ödülü gibi görünmeye başlar; notu düşük çocuk için tatil cezayla başlar, kardeşler arasında da karşılaştırma doğar.",
                "Karneyi ekran dışı bir şeyle kutlayın: birlikte geçirilen bir gün, çocuğun seçtiği bir yemek ya da uzun zamandır istediği bir etkinlik. Tatildeki ekran süresini ise karneden önce, notlardan bağımsız olarak konuşun.",
            )),
            ("Karne hediyesi telefon ya da tablet olacaksa", (
                "Cihazı karne gününden önce ayarlayın ve kuralları hediyeyle aynı gün konuşun. Hesap, yaş sınırı, satın alma doğrulaması ve günlük süre için “Çocuğa tablet ya da telefon hediye etmeden önce 5 ayar” rehberindeki listeyi kullanabilirsiniz.",
                "Hediyeyi nota bağlamamak burada da işe yarar: karneye bağlı verilen bir cihaz, sonraki karnede geri alınacakmış gibi algılanabilir. Cihazın kurallarını notlara değil, çocuğun yaşına ve aile düzeninize göre koyun.",
            )),
            ("Tatil için ayrı ama önceden belli bir süre", (
                "Tatil günlerinde ekran süresi okul gününden biraz fazla olabilir; önemli olan bunun tatilden önce belli olmasıdır. Günlük bir toplam ve sabit bir ekran kapanış saati, 16 günün tamamı için yeterli bir çerçevedir.",
                "Tatili iki haftaya bölmek de işe yarar: ilk hafta daha serbest, ikinci hafta okul düzenine biraz daha yakın. Uyku saatini tatil boyunca çok kaydırmamak, 8 Şubat sabahını kolaylaştırır.",
            )),
            ("Her güne bir ekran dışı plan", (
                "Tablodaki her güne bir ekran dışı etkinlik yazın: kütüphane, müze, akraba ziyareti, birlikte yemek yapmak, kutu oyunu, spor ya da kitap. Büyük planlar gerekmez; günde bir küçük etkinlik yeterlidir.",
                "Etkinlikleri çocukla birlikte seçin. İki haftalık tatilde bir ya da iki gün için daha büyük bir plan yapmak, örneğin bir gezi, tatilin geri kalanını da daha sakin geçirir.",
            )),
            ("Karnedeki zor derse kısa tekrar", (
                "Karne, hangi derste zorlanıldığını gösterir. O ders için günde kısa bir tekrar ya da okuma zamanı yazın; örneğin 20–30 dakika. Konuyu ve saati çocukla birlikte seçin; tekrar, düşük notun cezası gibi sunulmazsa daha kolay sürer.",
                "LGS’ye hazırlanan 8. sınıf öğrencisi için tatil, tekrar ve deneme için de bir fırsattır. Programı çocukla birlikte kurun ve dinlenme günlerini de tabloya yazın.",
            )),
            ("Son iki gün: ikinci döneme dönüş", (
                "6–7 Şubat hafta sonunu okul düzenine dönüşe ayırın. Uyku ve ekran kapanış saatini okul günlerindeki saate geri çekin; çantayı ve ödevleri pazar akşamından önce birlikte kontrol edin.",
            )),
            ("Sık yapılan hatalar", (
                "Ekran süresini karne notuna göre vermek ya da almak, kardeşlerin karnelerini karşılaştırmak, tatil boyunca hiç kural koymayıp son gün birden sıkı bir düzene dönmek ve uyku saatini her gün biraz daha geciktirmek en sık görülen sorunlardır.",
            )),
        ),
        "printable": {
            "title": "Yarıyıl tatili 16 günlük ekran planı",
            "note": "23 Ocak – 7 Şubat 2027 · Yazdırın, çocukla birlikte doldurun.",
            "columns": ("Gün", "Ekran süresi", "Ekranlar kapanır", "Ekran dışı plan", "Tekrar / okuma"),
            "rows": (
                ("Cumartesi 23 Ocak", "", "", "", ""),
                ("Pazar 24 Ocak", "", "", "", ""),
                ("Pazartesi 25 Ocak", "", "", "", ""),
                ("Salı 26 Ocak", "", "", "", ""),
                ("Çarşamba 27 Ocak", "", "", "", ""),
                ("Perşembe 28 Ocak", "", "", "", ""),
                ("Cuma 29 Ocak", "", "", "", ""),
                ("Cumartesi 30 Ocak", "", "", "", ""),
                ("Pazar 31 Ocak", "", "", "", ""),
                ("Pazartesi 1 Şubat", "", "", "", ""),
                ("Salı 2 Şubat", "", "", "", ""),
                ("Çarşamba 3 Şubat", "", "", "", ""),
                ("Perşembe 4 Şubat", "", "", "", ""),
                ("Cuma 5 Şubat", "", "", "", ""),
                ("Cumartesi 6 Şubat · dönüş hazırlığı", "", "", "", ""),
                ("Pazar 7 Şubat · dönüş hazırlığı", "", "", "", ""),
            ),
        },
        "related": (
            ("Ara tatilde ekran süresi nasıl planlanır?", "ara-tatil-ekran-suresi-plani"),
            ("Ailece ekran süresi planı nasıl yapılır?", "ailece-ekran-suresi-plani"),
            ("Çocuğa tablet ya da telefon hediye etmeden önce 5 ayar", "cocuga-tablet-telefon-hediye"),
        ),
        "product": ("Bu planı otomatik uygulamak isterseniz", (
            "AliKa ebeveyn kontrolü bu planı Windows bilgisayarda ve Android telefonda uygulayabilir. Haftanın günlerine göre ayrı süre ve uyku saati girilebilir. Windows’ta takvime yarıyıl tatilinin tarihlerini girip tatil için ayrı bir günlük süre tanımlayabilirsiniz; tarih aralığı bitince okul düzeniniz geri gelir.",
            "Çocuk kalan süresini ekranında görür. İsterseniz sizin eklediğiniz sorulardan çözerek, sizin belirlediğiniz günlük üst sınır içinde ek süre kazanabilir; bu süre karne notuna değil, tatildeki çalışmaya bağlıdır. Türkiye ortaokul (5–8. sınıf) için konu anlatımı ve soru paketleri alika.tr’deki Hazır içerik sayfasındadır.",
        )),
        "sources": (
            ("2026–2027 eğitim öğretim yılı takvimi açıklandı — Millî Eğitim Bakanlığı, 13 Haziran 2026; 22 Ekim 2026’da erişildi", "https://www.meb.gov.tr/2026-2027-egitim-ogretim-yili-takvimi-aciklandi/haber/41057/tr"),
        ),
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


def social_links(lang: str) -> str:
    """AliKa'nın sosyal medya hesapları: satır içi SVG simge, sayfa dilinde erişilebilir ad, yeni sekme."""
    words = home_copy(lang)["footer"]
    items = "".join(
        f'<li><a href="{esc(profile["url"])}" target="_blank" rel="me noopener" aria-label="{esc(words[profile["id"]])}">'
        f'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="{esc(profile["icon"])}"/></svg></a></li>'
        for profile in SOCIAL_PROFILES
    )
    return f'<ul class="footer-social" aria-label="{esc(words["follow"])}">{items}</ul>'


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
        <div><strong>AliKa</strong><span>{esc(words["tagline"])}</span>{social_links(lang)}</div>
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
  <meta property="og:site_name" content="{BRAND_NAME.get(lang, 'AliKa')}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{BASE_URL}/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{esc(OG_IMAGE_ALT['tr' if lang == 'tr' else 'en'])}">
</head>
<body{' class="content-route"' if slug == "content" else ''}>
  {header(locales, lang, slug)}
  {body}
  {footer(locales, lang)}
  <script src="/assets/site.js" defer></script>
</body>
</html>
"""




def guide_document(locales: dict[str, dict], title: str, description: str, canonical: str, body: str, lang: str = "tr", schema_type: str = "Article", updated: tuple[str, str] = GUIDE_UPDATED) -> str:
    article_schema = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "headline": title,
        "description": description,
        "mainEntityOfPage": canonical,
        "inLanguage": "en-GB" if lang == "en" else "tr-TR",
        "author": {"@type": "Organization", "name": "ErenKa Software"},
        "publisher": {"@type": "Organization", "name": "ErenKa Software"},
        "dateModified": updated[0],
    }
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0A1631">
  <title>{esc(title)} — {BRAND_NAME["en" if lang == "en" else "tr"]}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{canonical}">
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="icon" href="/assets/brand/alika-logo.png">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="{'en_GB' if lang == 'en' else 'tr_TR'}">
  <meta property="og:site_name" content="{BRAND_NAME["en" if lang == "en" else "tr"]}">
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
    short = f'/videos/kurulum/{guide["video_short"]}' if guide.get("video_short") else ""
    short_player = (
        f'<figure class="guide-video-short"><video controls preload="none" playsinline poster="{short}.webp" aria-label="{esc(guide["video_short_label"])}">'
        f'<source src="{short}.mp4" type="video/mp4"><track kind="captions" src="{short}.tr.vtt" srclang="tr" label="Türkçe"></video>'
        f'<figcaption>{esc(guide["video_short_label"])}</figcaption></figure>'
        if short else ""
    )
    player = (
        f'<video controls preload="none" playsinline poster="{video}.webp" aria-label="{esc(guide["video_label"])}"><source src="{video}.mp4" type="video/mp4">'
        f'<track kind="captions" src="{video}.tr.vtt" srclang="tr" label="Türkçe"></video>'
    )
    video_aside = (
        f'<aside class="guide-video"><div><strong>{esc(guide.get("video_heading", "Gerçek ürün akışını izleyin"))}</strong><span>{esc(guide["video_label"])}</span>{video_note}</div>'
        + (f'<div class="guide-video-pair">{player}{short_player}</div>' if short else player)
        + "</aside>"
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
            'onclick="document.body.classList.add(\'print-plan\');window.print();document.body.classList.remove(\'print-plan\')">'
            f'{esc(printable.get("button", "Planı yazdırın"))}</button></section>'
        )
    product = guide.get("product")
    product_section = (
        f'<section><h2>{esc(product[0])}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in product[1])}</section>'
        if product else ""
    )
    # Mevzuat rehberlerinde ilgili rehberler ve resmî kaynaklar ayrı listelenir.
    related = guide.get("related")
    related_section = (
        f'<section><h2>İlgili rehberler</h2><ul class="guide-links">{"".join(f"<li><a href=\"/{GUIDE_BASE}/{slug}/\">{esc(label)}</a></li>" for label, slug in related)}</ul></section>'
        if related else ""
    )
    sources = guide.get("sources")
    sources_section = (
        f'<section><h2>Kaynaklar</h2><ul class="guide-links">{"".join(f"<li><a href=\"{esc(url)}\" target=\"_blank\" rel=\"noopener noreferrer\">{esc(label)}</a></li>" for label, url in sources)}</ul></section>'
        if sources else ""
    )
    updated = guide.get("updated", GUIDE_UPDATED)
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
          <p class="eyebrow">{esc(guide.get("eyebrow", eyebrow))}</p>
          <h1>{esc(guide["title"])}</h1>
          <p class="guide-lede">{esc(guide["lede"])}</p>
          <p class="guide-updated">Son güncelleme: <time datetime="{updated[0]}">{updated[1]}</time></p>
          <p class="guide-disclosure"><strong>Açıklık notu:</strong> Bu içerik AliKa’nın geliştiricisi ErenKa Software tarafından hazırlanmıştır. {disclosure}</p>
        </header>
        {sections}
        {printable_section}
        {related_section}
        {product_section}
        {android_section}
        {video_aside}
        {cta}
        {sources_section}
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


def download_name(row: dict) -> str:
    """Kaydedilen dosyanın adı: yüklenen ZIP'in kendi adı (site.js boş download özniteliğinde genel ad kullanır)."""
    return row["download_url"].rsplit("/", 1)[-1]


def content_package_list(rows: list[dict], lang: str, summary: str, label_key: str = "title") -> str:
    """Bir dersin ya da LGS paketinin JSONL dosyalarını açılır listede tek tek indirme bağlantısı olarak verir."""
    labels = CONTENT_LIBRARY_LABELS[lang]
    items = "".join(
        f"""<li><a href="{esc(row['download_url'])}" download="{esc(row['filename'])}">{esc(row[label_key])}</a>"""
        f"""<span>{format_count(row['questions'], lang)} {esc(labels[5])}</span></li>"""
        for row in rows
    )
    return f"""<details class="package-files"><summary>{esc(summary)}</summary><ul>{items}</ul></details>"""


def content_games(catalog: dict, lang: str) -> str:
    """Ortak ekran oyun paketleri: sayfa dilindeki dört yaş grubu öne, diğer diller açılır listede."""
    section = CONTENT_SECTION_LABELS[lang]

    def band_links(packages: list[dict], count_label: str | None) -> str:
        return "".join(
            f"""<a href="{esc(package['download_url'])}" download="{esc(package['filename'])}">"""
            f"""{esc(section['age'].format(package['age_min'], package['age_max']))}"""
            + (f"<small>{esc(count_label.format(format_count(package['items'], lang)))}</small>" if count_label else "")
            + "</a>"
            for package in packages
        )

    cards = []
    for game in catalog["games"]:
        name, body = section[game["slug"]]
        by_lang: dict[str, list[dict]] = {}
        for package in game["packages"]:
            by_lang.setdefault(package["language"], []).append(package)
        own = by_lang.get(lang) or by_lang.get("en", [])
        others = "".join(
            f"""<li><span lang="{code}">{LANGUAGE_FLAGS[code]} {esc(LANGUAGE_NATIVE_NAMES[code])}</span>"""
            f"""<span class="game-band-links">{band_links(packages, None)}</span></li>"""
            for code, packages in by_lang.items() if code != lang
        )
        cards.append(f"""
        <article class="game-pack-card" data-game="{esc(game['slug'])}">
          <img src="{esc(game['art_url'])}" alt="" width="960" height="540" loading="lazy" decoding="async">
          <div>
            <h3>{esc(name)}</h3>
            <p>{esc(body)}</p>
            <p class="game-band-row">{band_links(own, section[game['item_kind']])}</p>
            <details class="package-files"><summary>{esc(section['other_langs'])}</summary><ul class="game-lang-list">{others}</ul></details>
          </div>
        </article>""")
    if not cards:
        return ""
    return f"""
      <section class="content-extra-section game-space" id="oyunlar" aria-labelledby="content-games-title">
        <div class="content-extra-heading">
          <h2 id="content-games-title">{esc(section['games_title'])}</h2>
          <p>{esc(section['games_body'])}</p>
          <p class="honesty-note">{esc(section['games_install'])}</p>
        </div>
        <div class="game-pack-grid">{"".join(cards)}</div>
      </section>"""


def content_video(name: str, label: str, lang: str, extra_class: str = "") -> str:
    """Kanal videosunun sitedeki dosyası; tıklanana kadar yalnız kapak yüklenir, YouTube'a bağlanılmaz."""
    file = f"/videos/kurulum/{name}"
    track_label = CONTENT_SECTION_LABELS[lang]["tr_name"]
    return (
        f'<video class="content-video{extra_class}" controls preload="none" playsinline poster="{file}.webp" aria-label="{esc(label)}">'
        f'<source src="{file}.mp4" type="video/mp4">'
        f'<track kind="captions" src="{file}.tr.vtt" srclang="tr" label="{esc(track_label)}"></video>'
    )


def content_library(catalog: dict, lang: str) -> str:
    labels = CONTENT_LIBRARY_LABELS[lang]
    section = CONTENT_SECTION_LABELS[lang]
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
          </div>
        <a class="button direct-download" href="{esc(row['download_url'])}" download="{esc(download_name(row))}"
           data-direct-download>{esc(labels[2])}</a>
      </article>""" for row in catalog["grades"])
    subject_cards = "".join(f"""
      <article data-content-item data-country="{esc(row['country_slug'])}" data-grade="{esc(row['grade_slug'])}">
        <small>{esc(row['country_code'])} · {esc(labels[7].format(row['grade']))}</small>
        <h3>{esc(row['subject'])}</h3>
        <p>{format_count(row['notes'], lang)} {esc(labels[4])} · {format_count(row['questions'], lang)} {esc(labels[5])}</p>
        <a class="package-cta" href="{esc(row['download_url'])}" download="{esc(download_name(row))}">{esc(labels[3])}</a>
        {content_package_list(row['packages'], lang, section['packages'].format(len(row['packages'])))}
      </article>""" for row in catalog["subjects"])
    lgs = catalog.get("lgs") or {}
    video_lang = f'<p class="content-video-lang">{esc(section["video_lang"])}</p>' if section["video_lang"] else ""
    lgs_section = f"""
      <section class="content-extra-section" id="lgs" aria-labelledby="content-lgs-title">
        <div class="content-lgs-intro">
          <div class="content-extra-heading">
            <h2 id="content-lgs-title">{esc(section['lgs_title'])}</h2>
            <p>{esc(section['lgs_body'])}</p>
            {video_lang}
          </div>
          <figure class="content-lgs-video">
            {content_video("lgs-denemesi", section['lgs_video'], lang, " content-video-wide")}
            {content_video("lgs-denemesi-dikey", section['lgs_video'], lang, " content-video-tall")}
          </figure>
        </div>
        <article class="grade-download-card">
          <div><small>{esc(labels[7].format(lgs['grade']))} · LGS 2027</small>
            <h3>{len(lgs['packages'])} {esc(scope[4])} · {format_count(lgs['questions'], lang)} {esc(labels[5])}</h3>
            </div>
          <a class="button direct-download" href="{esc(lgs['download_url'])}" download="{esc(download_name(lgs))}" data-direct-download>{esc(section['lgs_download'])}</a>
        </article>
        {content_package_list(lgs['packages'], lang, section['packages'].format(len(lgs['packages'])), "subject")}
      </section>""" if lgs.get("packages") else ""
    prep = catalog.get("lgs_prep") or {}
    prep_cards = "".join(f"""
        <article class="grade-download-card">
          <div><small>{esc(labels[7].format(prep['grade']))} · {esc(section[label_key])}</small>
            <h3>{len(part['packages'])} {esc(scope[4])} · {format_count(part['notes'], lang)} {esc(labels[4])} · {format_count(part['questions'], lang)} {esc(labels[5])}</h3>
            </div>
          <a class="button direct-download" href="{esc(part['download_url'])}" download="{esc(download_name(part))}" data-direct-download>{esc(section[download_key])}</a>
        </article>
        {content_package_list(part['packages'], lang, section['packages'].format(len(part['packages'])), "subject")}"""
        for key, label_key, download_key in (("exam", "prep_exam", "prep_exam_download"), ("units", "prep_units", "prep_units_download"))
        if (part := prep.get(key)))
    prep_section = f"""
      <section class="content-extra-section" id="lgs-2028" aria-labelledby="content-lgs-prep-title">
        <div class="content-extra-heading">
          <h2 id="content-lgs-prep-title">{esc(section['prep_title'])}</h2>
          <p>{esc(section['prep_body'])}</p>
          <p>{esc(section['prep_note'])}</p>
        </div>
        {prep_cards}
      </section>""" if prep_cards else ""
    primary_cards = "".join(f"""
        <article class="grade-download-card">
          <div><small>{esc(section['age'].format(row['age_min'], row['age_max']))}</small>
            <h3>{esc(section['primary_body'].format(format_count(row['questions'], lang)))}</h3>
            <p>{esc(section['primary_note'])}</p></div>
          <a class="button direct-download" href="{esc(row['download_url'])}" download="{esc(row['filename'])}">{esc(section['primary_download'])}</a>
        </article>""" for row in catalog.get("primary", []))
    primary_section = f"""
      <section class="content-extra-section" id="ilkokul" aria-labelledby="content-primary-title">
        <div class="content-extra-heading">
          <h2 id="content-primary-title">{esc(section['primary_title'])}</h2>
        </div>
        {primary_cards}
      </section>""" if primary_cards else ""
    return f"""
      {lgs_section}
      {prep_section}
      <div class="content-scope" data-content-scope>
        <p><strong>{esc(scope[0])}</strong> {esc(scope[1])}</p>
        <p class="content-scope-plan"><strong>{esc(scope[2])}</strong> {esc(scope[3])}</p>
      </div>
      <div class="content-filters" data-content-filters>
        <label>{esc(labels[0])}<select data-content-country>{country_options}</select></label>
        <label>{esc(labels[1])}<select data-content-grade>{grade_options}</select></label>
      </div>
      <p class="honesty-note">{esc(labels[8])}<br>{esc(section['requirements'])}</p>
      <aside class="content-howto" aria-labelledby="content-howto-title">
        <div>
          <h2 id="content-howto-title">{esc(section['howto_title'])}</h2>
          <p>{esc(section['howto_body'])}</p>
          {video_lang}
        </div>
        {content_video("icerik-ekleme", section['howto_title'], lang)}
      </aside>
      <div class="grade-downloads">{grade_cards}</div>
      <div class="package-grid" data-content-grid>{subject_cards}</div>
      {primary_section}
      {content_games(catalog, lang)}
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
        write_page(base / "content" / "index.html", document(locales, lang, f"{title} — {BRAND_NAME.get(lang, 'AliKa')}", desc, content_page(lang, c, catalog), "content"))
        for slug in REDIRECT_ANCHORS:
            write_page(base / slug / "index.html", redirect_document(lang, slug))

    guide_index_url = f"{BASE_URL}/{GUIDE_BASE}/"
    write_page(
        DIST / GUIDE_BASE / "index.html",
        guide_document(
            locales,
            "Türkçe Ebeveyn Rehberleri",
            "15 yaş altı sosyal medya düzenlemesi, çocuğa ilk telefon ve hediye cihaz ayarları, bilgisayarı paylaşan kardeşler, Windows ve Android’de ekran süresi, ailece plan, ara tatil ve yarıyıl tatili, soru çözerek süre kazanma ve bulutsuz ebeveyn kontrolü için Türkçe rehberler.",
            guide_index_url,
            guide_index_body(),
        ),
    )
    for guide in PUBLISHED_GUIDES:
        canonical = f"{BASE_URL}/{GUIDE_BASE}/{guide['slug']}/"
        write_page(
            DIST / GUIDE_BASE / guide["slug"] / "index.html",
            guide_document(locales, guide["title"], guide["description"], canonical, guide_article_body(guide), updated=guide.get("updated", GUIDE_UPDATED)),
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
