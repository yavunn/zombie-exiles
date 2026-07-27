/*
  Zombie Exiles
  Ders projesi için HTML5 Canvas + JavaScript ile hazırlanmış özgün mini oyun.
  Ana fikir: Quiz cevapları oyun mekaniğini doğrudan değiştirir.
*/

'use strict';

// DOM elemanları tek bir objede tutulur; kodun okunabilirliği artar.
const ui = {
  canvas: document.getElementById('gameCanvas'),
  startOverlay: document.getElementById('startOverlay'),
  startForm: document.getElementById('startForm'),
  playerName: document.getElementById('playerName'),
  difficultySelect: document.getElementById('difficultySelect'),
  colorSelect: document.getElementById('colorSelect'),
  formError: document.getElementById('formError'),
  hudName: document.getElementById('hudName'),
  scoreText: document.getElementById('scoreText'),
  bestText: document.getElementById('bestText'),
  waveText: document.getElementById('waveText'),
  weaponText: document.getElementById('weaponText'),
  timerText: document.getElementById('timerText'),
  healthFill: document.getElementById('healthFill'),
  healthText: document.getElementById('healthText'),
  quizOverlay: document.getElementById('quizOverlay'),
  questionCategory: document.getElementById('questionCategory'),
  questionText: document.getElementById('questionText'),
  answerButtons: document.getElementById('answerButtons'),
  quizTimer: document.getElementById('quizTimer'),
  endOverlay: document.getElementById('endOverlay'),
  endTitle: document.getElementById('endTitle'),
  endSummary: document.getElementById('endSummary'),
  finalScore: document.getElementById('finalScore'),
  finalWave: document.getElementById('finalWave'),
  finalWeapon: document.getElementById('finalWeapon'),
  finalQuiz: document.getElementById('finalQuiz'),
  restartButton: document.getElementById('restartButton'),
  helpButton: document.getElementById('helpButton'),
  archiveButton: document.getElementById('archiveButton'),
  archiveButtonInline: document.getElementById('archiveButtonInline'),
  helpOverlay: document.getElementById('helpOverlay'),
  closeHelp: document.getElementById('closeHelp'),
  archiveOverlay: document.getElementById('archiveOverlay'),
  closeArchive: document.getElementById('closeArchive'),
  reviewBox: document.getElementById('reviewBox'),
  toast: document.getElementById('toast')
};

const ctx = ui.canvas.getContext('2d');
const STORAGE_KEY = 'zombie-exiles-best-score-v1';

// Zorluk ayarları tek noktada tanımlanır.
const DIFFICULTY = {
  // Sonsuz mod dengesi: oyun süreyle bitmez; her modda zaman + quiz tehdidi oyunu kademeli zorlaştırır.
  // spawn değeri büyüdükçe üretim aralığı uzar; speed/hp/damage baskıyı belirler.
  easy: {
    label: 'Kolay', spawn: 1.44, speed: 0.74, damage: 6.2, opening: 2,
    hp: 0.78, waveRamp: 0.026, spawnFloor: 0.70, rush: 0.58, repel: 1.24,
    quizThreat: 0.018, spawnThreat: 0.012, maxThreat: 0.30,
    endlessRamp: 0.095, maxSurvivalThreat: 0.55, endlessHp: 0.34, endlessSpeed: 0.24,
    minFire: 0.20, fireSlow: 0.00, multiShotDelay: 0.018, bulletDamageScale: 1.00, quizInterval: 10, healOnCorrect: 4.0
  },
  normal: {
    label: 'Normal', spawn: 1.12, speed: 0.96, damage: 8.6, opening: 3,
    hp: 0.94, waveRamp: 0.040, spawnFloor: 0.50, rush: 0.76, repel: 1.07,
    quizThreat: 0.030, spawnThreat: 0.020, maxThreat: 0.56,
    endlessRamp: 0.160, maxSurvivalThreat: 0.98, endlessHp: 0.48, endlessSpeed: 0.34,
    minFire: 0.22, fireSlow: 0.018, multiShotDelay: 0.030, bulletDamageScale: 0.94, quizInterval: 10, healOnCorrect: 3.5
  },
  hard: {
    label: 'Zor', spawn: 0.84, speed: 1.18, damage: 11.8, opening: 3,
    hp: 1.12, waveRamp: 0.058, spawnFloor: 0.37, rush: 0.98, repel: 0.89,
    quizThreat: 0.048, spawnThreat: 0.034, maxThreat: 0.86,
    endlessRamp: 0.210, maxSurvivalThreat: 1.45, endlessHp: 0.58, endlessSpeed: 0.42,
    minFire: 0.255, fireSlow: 0.035, multiShotDelay: 0.052, bulletDamageScale: 0.80, quizInterval: 7.2, healOnCorrect: 3.0
  }
};

const QUIZ_INTERVAL = 10;
const QUIZ_ANSWER_TIME = 10;

function getQuizInterval() {
  // Kolay ve Normal aynı kalır; sadece Zor modda sorular daha sık gelir.
  return state.difficulty.quizInterval || QUIZ_INTERVAL;
}
const VISIBLE_TARGET_Y = 42;
// Barikat artık can barının hemen ÜSTÜNE oturacak şekilde konumlandırılır.
// Health overlay ekranın en altında olduğu için 72px güvenli alan bırakıyoruz.
// Bu değer barikatın çarpışma/çizim çizgisini aşağı alır; zombilerin yürüyeceği mesafe artar.
const BARRICADE_OFFSET = 72;
const ROAD_TOP_RATIO = 0.30;
const QUESTION_REVEAL_DELAY = 0.15;

const QUESTIONS = [
  {
    "category": "HTML Temelleri",
    "text": "HTML ne işe yarar?",
    "answers": [
      "Web sayfalarının yapısını ve içeriğini tanımlamak için kullanılır.",
      "Web sayfalarının biçimlendirilmesi için kullanılır.",
      "Web sayfalarında animasyon çalıştırmak için kullanılır.",
      "Sunucu işletim sistemi kurmak için kullanılır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Temelleri",
    "text": "CSS nedir ve ne işe yarar?",
    "answers": [
      "Web sayfalarının biçimlendirilmesi için kullanılır.",
      "Web sayfasının ana yapısını kurar.",
      "Veritabanı bağlantısı yapar.",
      "Sunucu tarafında dosya aktarır."
    ],
    "correct": 0
  },
  {
    "category": "HTML Temelleri",
    "text": "Bir HTML sayfasının doküman tipini belirten ifade hangisidir?",
    "answers": [
      "<!DOCTYPE html>",
      "<head>",
      "<meta>",
      "<title>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Meta",
    "text": "<meta name=\"keywords\" content=\"Html, Css, JavaScript\"> etiketi ne işe yarar?",
    "answers": [
      "Arama motorlarına içerik hakkında anahtar kelime bilgisi verir.",
      "Üç farklı JavaScript dosyası çağırır.",
      "Sayfaya otomatik stil ekler.",
      "Canvas çözünürlüğünü ayarlar."
    ],
    "correct": 0
  },
  {
    "category": "Responsive CSS",
    "text": "CSS @media kuralı ne için kullanılır?",
    "answers": [
      "Farklı ekran boyutlarına göre stil uygulamak için.",
      "Sayfaya ses dosyası eklemek için.",
      "HTML dosyasını sıkıştırmak için.",
      "Sunucuya istek göndermek için."
    ],
    "correct": 0
  },
  {
    "category": "CSS Temelleri",
    "text": "Web teknolojilerinden hangisi stil düzenleme standardı olarak kullanılır?",
    "answers": [
      "CSS",
      "HTML",
      "HTTP",
      "FTP"
    ],
    "correct": 0
  },
  {
    "category": "Dosya Yapısı",
    "text": "Harici bir CSS dosyasının uzantısı hangisidir?",
    "answers": [
      ".css",
      ".html",
      ".js",
      ".style"
    ],
    "correct": 0
  },
  {
    "category": "CSS Organizasyonu",
    "text": "Harici CSS dosyası kullanmanın avantajı olmayan seçenek hangisidir?",
    "answers": [
      "JavaScript kodlarının doğrudan daha hızlı çalışması.",
      "Kodun daha düzenli olması.",
      "Aynı stilin birden fazla sayfada kullanılabilmesi.",
      "Bakım ve güncellemenin kolaylaşması."
    ],
    "correct": 0
  },
  {
    "category": "CSS Grid",
    "text": "CSS Grid’de sütunları tanımlamak için hangi özellik kullanılır?",
    "answers": [
      "grid-template-columns",
      "grid-template-rows",
      "grid-row-gap",
      "grid-areas"
    ],
    "correct": 0
  },
  {
    "category": "CSS Grid",
    "text": "CSS Grid’de satırları tanımlamak için hangi özellik kullanılır?",
    "answers": [
      "grid-template-rows",
      "grid-template-columns",
      "grid-column-gap",
      "grid-area-name"
    ],
    "correct": 0
  },
  {
    "category": "CSS Çeşitleri",
    "text": "Sitedeki tüm sayfalara etki etmesi için kullanılan stil şablonu hangisidir?",
    "answers": [
      "Harici CSS",
      "Yerel CSS",
      "Sistem CSS",
      "Tek satırlık CSS"
    ],
    "correct": 0
  },
  {
    "category": "CSS Çeşitleri",
    "text": "HTML belgesinin <head> bölümüne yazılan ve belge genelinde etkili olan stil çeşidi hangisidir?",
    "answers": [
      "Genel CSS",
      "Yerel CSS",
      "Harici CSS",
      "Sistem CSS"
    ],
    "correct": 0
  },
  {
    "category": "CSS Çeşitleri",
    "text": "Bir HTML etiketinin içinde sadece o etikete uygulanan stil çeşidi hangisidir?",
    "answers": [
      "Yerel CSS",
      "Harici CSS",
      "Genel CSS",
      "Sistem CSS"
    ],
    "correct": 0
  },
  {
    "category": "HTML Nitelikleri",
    "text": "HTML’de birden fazla elemana aynı stili vermek için genellikle hangi özellik kullanılır?",
    "answers": [
      "class",
      "id",
      "src",
      "href"
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçiciler",
    "text": "Tüm HTML elemanlarını seçmek için hangi CSS seçicisi kullanılır?",
    "answers": [
      "*",
      "body",
      "#all",
      ".everything"
    ],
    "correct": 0
  },
  {
    "category": "CSS Katmanlama",
    "text": "Üst üste çakışan öğelerde hangisinin üstte olacağını belirleyen özellik hangisidir?",
    "answers": [
      "z-index",
      "k-index",
      "v-index",
      "stack-index"
    ],
    "correct": 0
  },
  {
    "category": "HTML Gömme",
    "text": "HTML’de <iframe> etiketi hangi amaçla kullanılır?",
    "answers": [
      "Sayfaya harici bir web sayfası eklemek için.",
      "Metni kalın yapmak için.",
      "Sayfa başlığını değiştirmek için.",
      "Tablo hücresi oluşturmak için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Eski Etiketler",
    "text": "Kayan yazı oluşturmak için eskiden kullanılan HTML etiketi hangisidir?",
    "answers": [
      "<marquee>",
      "<iframe>",
      "<section>",
      "<span>"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "CSS’de line-height özelliği ne işe yarar?",
    "answers": [
      "Satır yüksekliğini / satır aralığını belirler.",
      "Yazıyı sağa hizalar.",
      "Metne link verir.",
      "Yazıyı gizler."
    ],
    "correct": 0
  },
  {
    "category": "HTML Metin",
    "text": "HTML5’te <bdo> etiketi ne işe yarar?",
    "answers": [
      "Metin yönünü belirlemek için kullanılır.",
      "Buton oluşturur.",
      "Tablo başlığı oluşturur.",
      "Sayfaya stil dosyası bağlar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Taşma",
    "text": "Taşan metnin sonuna üç nokta koymak için kullanılan CSS değeri hangisidir?",
    "answers": [
      "text-overflow: ellipsis",
      "overflow: cut",
      "text-trim: end",
      "overflow: dots"
    ],
    "correct": 0
  },
  {
    "category": "HTML Anlamsal",
    "text": "HTML’de <abbr> etiketi ne için kullanılır?",
    "answers": [
      "Kısaltmaları ve açıklamalarını göstermek için.",
      "Metni italik yapmak için.",
      "Dosya yüklemek için.",
      "Sayfaya video eklemek için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Satır İçi",
    "text": "HTML’de yaygın kullanılan satır içi element hangisidir?",
    "answers": [
      "<span>",
      "<div>",
      "<h1>",
      "<section>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Anlamsal",
    "text": "HTML’de <ins> ve <del> etiketleri neyi belirtir?",
    "answers": [
      "Eklenmiş ve silinmiş içeriği anlamsal olarak işaretler.",
      "Metni kalın ve italik yapar.",
      "Satır yüksekliği ayarlar.",
      "Tablo kenarlığı çizer."
    ],
    "correct": 0
  },
  {
    "category": "CSS Etkileşim",
    "text": "Bir elemanın üzerine gelindiğinde arka plan rengini değiştirmek için doğru yazım hangisidir?",
    "answers": [
      "div:hover { background-color: red; }",
      "div.hover { background-color: red; }",
      "div-hover { background-color: red; }",
      "div > hover { background-color: red; }"
    ],
    "correct": 0
  },
  {
    "category": "CSS Taşma",
    "text": "CSS’de taşan içeriği kontrol eden özellik hangisidir?",
    "answers": [
      "overflow",
      "text-flow",
      "wrap-text",
      "content-cut"
    ],
    "correct": 0
  },
  {
    "category": "HTML Başlık",
    "text": "Sayfa sekmesinde görünen başlığı belirleyen etiket hangisidir?",
    "answers": [
      "<title>",
      "<body>",
      "<br>",
      "<u>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Yapı",
    "text": "HTML sayfasının teknik/meta bilgilerini barındıran bölüm hangisidir?",
    "answers": [
      "<head>",
      "<body>",
      "<div>",
      "<br>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Yapı",
    "text": "Bir web sayfası oluştururken kullanılan temel HTML etiketlerinden biri hangisidir?",
    "answers": [
      "<body>",
      "<li>",
      "<br>",
      "<u>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Metin",
    "text": "HTML’de <wbr> etiketi ne işe yarar?",
    "answers": [
      "Kelimenin bölünebileceği yeri belirtir.",
      "Metni kalın yapar.",
      "Bir buton ekler.",
      "Bir resim ekler."
    ],
    "correct": 0
  },
  {
    "category": "CSS Satır İçi",
    "text": "CSS’i HTML’de satır içi eklemek için hangi özellik kullanılır?",
    "answers": [
      "style",
      "src",
      "href",
      "id-name"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "CSS’de metni altı çizili yapmak için hangi kullanım doğrudur?",
    "answers": [
      "text-decoration: underline;",
      "font-decoration: underline;",
      "text-style: underline;",
      "line-style: underline;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "CSS’de metni üstü çizili yapmak için hangi kullanım doğrudur?",
    "answers": [
      "text-decoration: line-through;",
      "text-decoration: underline;",
      "font-line: through;",
      "text-style: over;"
    ],
    "correct": 0
  },
  {
    "category": "HTML Link",
    "text": "Sayfa içinde belirli bir konuma atlamak için href özelliğine ne yazılır?",
    "answers": [
      "href=\"#bolum\"",
      "href=\"@bolum\"",
      "href=\"&bolum\"",
      "href=\"!bolum\""
    ],
    "correct": 0
  },
  {
    "category": "HTML Vurgu",
    "text": "HTML’de metni vurgulamak için kullanılan etiket hangisidir?",
    "answers": [
      "<mark>",
      "<highlight>",
      "<focus>",
      "<paint>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML’de tabloya başlık/açıklama eklemek için hangi etiket kullanılır?",
    "answers": [
      "<caption>",
      "<title>",
      "<header>",
      "<tbody>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML’de tablo başlık bölümünü tanımlayan etiket hangisidir?",
    "answers": [
      "<thead>",
      "<tbody>",
      "<tfoot>",
      "<caption>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "<fieldset> grubuna başlık eklemek için hangi etiket kullanılır?",
    "answers": [
      "<legend>",
      "<title>",
      "<caption>",
      "<label>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Stil",
    "text": "HTML içinde CSS kuralları yazmak için hangi etiket kullanılır?",
    "answers": [
      "<style>",
      "<script>",
      "<color>",
      "<theme>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Yorum",
    "text": "HTML’de yorum satırı nasıl yazılır?",
    "answers": [
      "<!-- yorum -->",
      "// yorum",
      "/* yorum */",
      "# yorum"
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML’de <th> etiketi hangi amaçla kullanılır?",
    "answers": [
      "Tablo başlık hücresi oluşturmak için.",
      "Tablo satırı oluşturmak için.",
      "Tabloyu hizalamak için.",
      "Tabloya resim eklemek için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML tablosunda hücreleri birleştirmek için hangi öznitelikler kullanılır?",
    "answers": [
      "rowspan ve colspan",
      "merge ve join",
      "cellmerge ve rowmerge",
      "tablejoin ve celljoin"
    ],
    "correct": 0
  },
  {
    "category": "HTML5",
    "text": "HTML5’te <meter> etiketi ne için kullanılır?",
    "answers": [
      "Bilinen aralık içindeki ölçü/değer göstermek için.",
      "Geri sayım yapmak için.",
      "Ses seviyesini otomatik açmak için.",
      "Tablo oluşturmak için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Görsel",
    "text": "HTML’de resim eklemek için hangi etiket kullanılır?",
    "answers": [
      "<img>",
      "<image>",
      "<picture>",
      "<src>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML’de temel tablo oluşturmak için hangi etiketler kullanılır?",
    "answers": [
      "<table>, <tr>, <td>",
      "<tab>, <row>, <cell>",
      "<grid>, <row>, <td>",
      "<list>, <item>, <value>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Alıntı",
    "text": "HTML’de <blockquote> etiketi ne işe yarar?",
    "answers": [
      "Blok alıntı göstermeyi sağlar.",
      "Metni kalın yapar.",
      "Kod bloğunu çalıştırır.",
      "Tablo satırı ekler."
    ],
    "correct": 0
  },
  {
    "category": "HTML5",
    "text": "HTML5’te veri listesi tanımlamak için hangi etiket kullanılır?",
    "answers": [
      "<datalist>",
      "<dataset>",
      "<listdata>",
      "<selectdata>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Metin",
    "text": "HTML’de <small> etiketi ne işe yarar?",
    "answers": [
      "Metni daha küçük boyutta gösterir.",
      "Metni italik yapar.",
      "Metni sola hizalar.",
      "Metni vurgular."
    ],
    "correct": 0
  },
  {
    "category": "HTML Anlamsal",
    "text": "HTML’de <address> etiketi ne için kullanılır?",
    "answers": [
      "İletişim bilgilerini belirtmek için.",
      "Harita eklemek için.",
      "Sayfayı yönlendirmek için.",
      "Tablo adresi vermek için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Anlamsal",
    "text": "HTML’de <time> etiketi hangi amaçla kullanılır?",
    "answers": [
      "Tarih ve saat bilgisini anlamsal olarak belirtmek için.",
      "Sayaç oluşturmak için.",
      "Sayfayı yenilemek için.",
      "Animasyon başlatmak için."
    ],
    "correct": 0
  },
  {
    "category": "CSS Yorum",
    "text": "Geçerli bir CSS yorum satırı hangisidir?",
    "answers": [
      "/* Bu bir yorumdur */",
      "<!-- Bu bir yorumdur -->",
      "// Bu bir yorumdur",
      "# Bu bir yorumdur"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Açılır menüde her bir seçeneği tanımlamak için hangi etiket kullanılır?",
    "answers": [
      "<option>",
      "<item>",
      "<choice>",
      "<value>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Simge",
    "text": "Üst simge oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<sup>",
      "<sub>",
      "<top>",
      "<high>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Simge",
    "text": "Alt simge oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<sub>",
      "<sup>",
      "<low>",
      "<bottom>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "HTML’de açılır liste oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<select>",
      "<list>",
      "<dropdown>",
      "<menu>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Yapı",
    "text": "HTML’de sayfa gövdesini tanımlayan etiket hangisidir?",
    "answers": [
      "<body>",
      "<main>",
      "<section>",
      "<page>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Buton",
    "text": "HTML’de buton oluşturmak için kullanılan etiket hangisidir?",
    "answers": [
      "<button>",
      "<press>",
      "<click>",
      "<action>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Bölümleme",
    "text": "Sayfada içerik gruplamak için sık kullanılan genel kapsayıcı etiket hangisidir?",
    "answers": [
      "<div>",
      "<group>",
      "<block>",
      "<area>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Gömülü İçerik",
    "text": "HTML’de gömülü içerik eklemek için kullanılan etiket hangisidir?",
    "answers": [
      "<embed>",
      "<include>",
      "<insert>",
      "<attach>"
    ],
    "correct": 0
  },
  {
    "category": "HTML5",
    "text": "HTML’de ilerleme çubuğu oluşturmak için kullanılan etiket hangisidir?",
    "answers": [
      "<progress>",
      "<bar>",
      "<loading>",
      "<status>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Tablo",
    "text": "HTML’de tablo gövdesini tanımlayan etiket hangisidir?",
    "answers": [
      "<tbody>",
      "<thead>",
      "<tfoot>",
      "<table-body>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Alıntı",
    "text": "Kısa alıntı göstermek için hangi HTML etiketi kullanılır?",
    "answers": [
      "<q>",
      "<quote>",
      "<cite>",
      "<blockquote>"
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": "Bir sınıfın içindeki tüm <p> etiketlerini seçmek için hangi yazım kullanılır?",
    "answers": [
      ".sinif p",
      ".sinif > p",
      "#sinif p",
      "sinif:p"
    ],
    "correct": 0
  },
  {
    "category": "HTML Temel",
    "text": "<base> etiketi ne işe yarar?",
    "answers": [
      "Sayfadaki göreceli URL’ler için temel adres belirler.",
      "Yazı tipini belirler.",
      "Veritabanı bağlantısı kurar.",
      "Sadece resimler için kullanılır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Kenarlık",
    "text": "Bir öğenin kenarlık stilini belirlemek için hangi CSS özelliği kullanılır?",
    "answers": [
      "border-style",
      "border-width",
      "border-color",
      "border-radius"
    ],
    "correct": 0
  },
  {
    "category": "CSS Kenarlık",
    "text": "Bir öğenin kenarlık rengini belirlemek için hangi özellik kullanılır?",
    "answers": [
      "border-color",
      "border-style",
      "border-width",
      "border-type"
    ],
    "correct": 0
  },
  {
    "category": "CSS Kenarlık",
    "text": "Bir öğenin kenarlık kalınlığını belirlemek için hangi özellik kullanılır?",
    "answers": [
      "border-width",
      "border-style",
      "outline-color",
      "edge-width"
    ],
    "correct": 0
  },
  {
    "category": "CSS Arka Plan",
    "text": "CSS’de arka plan resmi eklemek için kullanılan özellik hangisidir?",
    "answers": [
      "background-image",
      "image-bg",
      "bg-picture",
      "picture-background"
    ],
    "correct": 0
  },
  {
    "category": "CSS Arka Plan",
    "text": "Arka plan resminin tekrar etmesini engellemek için hangi kullanım doğrudur?",
    "answers": [
      "background-repeat: no-repeat;",
      "background-repeat: none;",
      "repeat: off;",
      "background: stop;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Arka Plan",
    "text": "Arka planın kapsayıcıyı tamamen kaplamasını sağlayan değer hangisidir?",
    "answers": [
      "background-size: cover;",
      "background-fit: full;",
      "background-fill: cover;",
      "background-size: complete;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Arka Plan",
    "text": "background-attachment: fixed; ne yapar?",
    "answers": [
      "Arka planı kaydırma sırasında sabit tutar.",
      "Arka planı gizler.",
      "Arka planı küçültür.",
      "Arka planı sola hizalar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Kural Yapısı",
    "text": "h1 { color: blue; } ifadesinde color nedir?",
    "answers": [
      "Özellik / property",
      "Değer / value",
      "Seçici / selector",
      "Kural adı"
    ],
    "correct": 0
  },
  {
    "category": "CSS Kural Yapısı",
    "text": "h1 { color: blue; } ifadesinde blue nedir?",
    "answers": [
      "Değer / value",
      "Özellik / property",
      "Seçici / selector",
      "Yorum satırı"
    ],
    "correct": 0
  },
  {
    "category": "CSS Renk",
    "text": "Kırmızı metin rengi vermek için doğru CSS yazımı hangisidir?",
    "answers": [
      "color: #FF0000;",
      "text-color: red;",
      "font-color: #FF0000;",
      "color = #FF0000;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Açılım",
    "text": "CSS’in açılımı nedir?",
    "answers": [
      "Cascading Style Sheets",
      "Creative Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets"
    ],
    "correct": 0
  },
  {
    "category": "CSS Font",
    "text": "Geçerli bir yazı tipi tanımlaması hangisidir?",
    "answers": [
      "font-family: Arial, sans-serif;",
      "text-font: Arial;",
      "typeface: Arial;",
      "font-style: Arial;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Boşluk",
    "text": "CSS’de bir elemanın dış boşluğunu ayarlayan özellik hangisidir?",
    "answers": [
      "margin",
      "padding",
      "border",
      "height"
    ],
    "correct": 0
  },
  {
    "category": "CSS Boşluk",
    "text": "CSS’de içerik ile kenar arasındaki iç boşluğu ayarlayan özellik hangisidir?",
    "answers": [
      "padding",
      "margin",
      "border",
      "outline"
    ],
    "correct": 0
  },
  {
    "category": "CSS Kutu Modeli",
    "text": "box-sizing: border-box ne işe yarar?",
    "answers": [
      "width/height değerlerine padding ve border dahil edilir.",
      "Elementin kenarlığını gizler.",
      "Dış boşlukları sıfırlar.",
      "Elementi görünmez yapar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Kenarlık",
    "text": "Köşeleri yuvarlatmak için hangi CSS özelliği kullanılır?",
    "answers": [
      "border-radius",
      "corner-radius",
      "round-border",
      "border-curve"
    ],
    "correct": 0
  },
  {
    "category": "CSS Tablo",
    "text": "border-collapse: collapse; ne işe yarar?",
    "answers": [
      "Tablodaki çift kenarlıkları tek çizgi gibi birleştirir.",
      "Tabloyu tamamen gizler.",
      "Tabloyu küçültür.",
      "Tabloyu dikey yapar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Liste",
    "text": "Liste öğelerinin madde işaretlerini kaldırmak için hangi kullanım doğrudur?",
    "answers": [
      "list-style: none;",
      "text-decoration: none;",
      "display: none;",
      "visibility: hidden;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Yerleşim",
    "text": "Bir elemanı normal akıştan çıkarıp sağa/sola yaslamak için kullanılan özellik hangisidir?",
    "answers": [
      "float",
      "position",
      "display",
      "align"
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": "CSS’de sınıf seçici nasıl yazılır?",
    "answers": [
      ".isim",
      "#isim",
      "*isim",
      "@isim"
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": "CSS’de id seçici nasıl yazılır?",
    "answers": [
      "#isim",
      ".isim",
      "*isim",
      "@isim"
    ],
    "correct": 0
  },
  {
    "category": "CSS Renk",
    "text": "CSS’de renk belirtirken hangisi geçerli yöntem değildir?",
    "answers": [
      "CMYK",
      "Hex kodu",
      "RGB",
      "HSL"
    ],
    "correct": 0
  },
  {
    "category": "HTML Karakter",
    "text": "HTML’de kod içinde görünmeyen boşluk karakteri nasıl eklenir?",
    "answers": [
      "&nbsp;",
      "&space;",
      "&empty;",
      "&blk;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Etkileşim",
    "text": "Elemanın üzerine gelince stil değişimi için kullanılan pseudo-class hangisidir?",
    "answers": [
      ":hover",
      ":focus",
      ":active",
      ":click"
    ],
    "correct": 0
  },
  {
    "category": "CSS Etkileşim",
    "text": "Tıklama/basılı durumunu belirten pseudo-class hangisidir?",
    "answers": [
      ":active",
      ":hover",
      ":focus",
      ":visited"
    ],
    "correct": 0
  },
  {
    "category": "CSS Konum",
    "text": "CSS’de elemanın konumunu belirleyen özellik hangisidir?",
    "answers": [
      "position",
      "location",
      "place",
      "layout"
    ],
    "correct": 0
  },
  {
    "category": "CSS Konum",
    "text": "Sayfa kaydırılsa bile ekranda sabit kalan konum değeri hangisidir?",
    "answers": [
      "fixed",
      "static",
      "relative",
      "absolute"
    ],
    "correct": 0
  },
  {
    "category": "CSS Konum",
    "text": "Normal akışa göre konumlandırılıp top/left ile hareket ettirilebilen değer hangisidir?",
    "answers": [
      "relative",
      "fixed",
      "absolute",
      "sticky"
    ],
    "correct": 0
  },
  {
    "category": "CSS Konum",
    "text": "En yakın konumlandırılmış üst elemana göre konumlandıran position değeri hangisidir?",
    "answers": [
      "absolute",
      "relative",
      "fixed",
      "static"
    ],
    "correct": 0
  },
  {
    "category": "CSS Ölçü",
    "text": "CSS’de 1em genellikle kaç piksele denk kabul edilir?",
    "answers": [
      "16px",
      "10px",
      "18px",
      "25px"
    ],
    "correct": 0
  },
  {
    "category": "CSS Efekt",
    "text": "filter: blur(5px); ne yapar?",
    "answers": [
      "Öğeye 5 piksellik bulanıklık efekti uygular.",
      "Öğeyi 5 derece döndürür.",
      "Öğeyi 5 piksel kaydırır.",
      "Öğeyi parlatır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Ölçü",
    "text": "Aşağıdaki ölçü birimlerinden hangisi görecelidir?",
    "answers": [
      "em",
      "px",
      "cm",
      "pt"
    ],
    "correct": 0
  },
  {
    "category": "CSS Ölçü",
    "text": "Aşağıdakilerden hangisi CSS birimi değildir?",
    "answers": [
      "xml",
      "px",
      "rem",
      "vh"
    ],
    "correct": 0
  },
  {
    "category": "CSS Geçiş",
    "text": "transition-delay: 1s; ne yapar?",
    "answers": [
      "Geçiş efektini 1 saniye geciktirir.",
      "Geçiş efektini hızlandırır.",
      "Öğeyi küçültür.",
      "Öğeyi döndürür."
    ],
    "correct": 0
  },
  {
    "category": "CSS Taşma",
    "text": "overflow: hidden ne yapar?",
    "answers": [
      "Taşan içeriği keser ve gizler.",
      "Her zaman kaydırma çubuğu ekler.",
      "İçeriği büyütür.",
      "Elementi tamamen siler."
    ],
    "correct": 0
  },
  {
    "category": "HTML Nitelikleri",
    "text": "HTML’de etiketlere ek bilgi veren yapılara ne ad verilir?",
    "answers": [
      "attribute",
      "property",
      "value-only",
      "data-rule"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "Metnin tüm harflerini büyük yapmak için hangi değer kullanılır?",
    "answers": [
      "uppercase",
      "big",
      "large",
      "capital"
    ],
    "correct": 0
  },
  {
    "category": "CSS Birim",
    "text": "vw ve vh birimleri neyi temsil eder?",
    "answers": [
      "Ekran genişliği ve yüksekliğinin yüzdesini.",
      "Video genişliği ve yüksekliğini.",
      "Sabit piksel ölçüsünü.",
      "Yazı tipi ağırlığını."
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": ":not seçicisi ne işe yarar?",
    "answers": [
      "Belirtilen kuralın dışındaki öğeleri seçmek için kullanılır.",
      "Hatalı kodları siler.",
      "Sadece boş öğeleri seçer.",
      "Gizli öğeleri bulur."
    ],
    "correct": 0
  },
  {
    "category": "CSS Efekt",
    "text": "filter: grayscale(100%); ne yapar?",
    "answers": [
      "Öğeyi tamamen siyah-beyaz yapar.",
      "Öğeyi bulanıklaştırır.",
      "Öğeyi şeffaflaştırır.",
      "Öğeyi parlatır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Oran",
    "text": "aspect-ratio özelliği neyi kolaylaştırır?",
    "answers": [
      "Genişlik ve yükseklik oranını korumayı.",
      "Sayfa hızını artırmayı.",
      "Renk uyumunu otomatik yapmayı.",
      "Metni kalınlaştırmayı."
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "white-space: nowrap ne yapar?",
    "answers": [
      "Metnin satır başı yapmasını engeller.",
      "Fazla boşlukları siler.",
      "Metni sağa hizalar.",
      "Metni gizler."
    ],
    "correct": 0
  },
  {
    "category": "CSS Cursor",
    "text": "cursor: pointer ne işe yarar?",
    "answers": [
      "Fare imlecini el şekline dönüştürür.",
      "Fare imlecini gizler.",
      "Tıklamayı devre dışı bırakır.",
      "İmleci büyütür."
    ],
    "correct": 0
  },
  {
    "category": "CSS Events",
    "text": "pointer-events: none ne yapar?",
    "answers": [
      "Eleman üzerindeki fare/dokunma olaylarını devre dışı bırakır.",
      "Tıklama olaylarını hızlandırır.",
      "İmleci el şekline çevirir.",
      "Sadece mobilde çalışır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Animasyon",
    "text": "CSS animasyonunda @keyframes ne için kullanılır?",
    "answers": [
      "Animasyonun adım adım durumlarını tanımlamak için.",
      "Animasyon gecikmesini tek başına ayarlamak için.",
      "Animasyonu silmek için.",
      "Elementi sabitlemek için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Olay",
    "text": "HTML belgesi yüklendiğinde tetiklenen olay hangisidir?",
    "answers": [
      "onload",
      "onstart",
      "onopen",
      "oninit"
    ],
    "correct": 0
  },
  {
    "category": "CSS Kenarlık",
    "text": "Kenar çizgisini çift çizgi yapmak için hangi değer kullanılır?",
    "answers": [
      "double",
      "solid",
      "dotted",
      "dashed"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Temelleri",
    "text": "Bilgisayarların birbirleriyle iletişim kurmasını sağlayan temel protokol ailesi hangisidir?",
    "answers": [
      "TCP/IP",
      "HTML",
      "CSS",
      "JPEG"
    ],
    "correct": 0
  },
  {
    "category": "Web Temelleri",
    "text": "Web sayfalarının görünümünü değiştiren teknoloji hangisidir?",
    "answers": [
      "CSS",
      "IP adresi",
      "Alan adı",
      "Sunucu işletim sistemi"
    ],
    "correct": 0
  },
  {
    "category": "JavaScript",
    "text": "=== operatörü ile == operatörü arasındaki temel fark nedir?",
    "answers": [
      "=== değer ve veri tipini, == çoğunlukla değeri karşılaştırır.",
      "=== sadece sayıları toplar.",
      "== veri tipini, === sadece boşluğu kontrol eder.",
      "İkisi HTML etiketi oluşturur."
    ],
    "correct": 0
  },
  {
    "category": "Web Sunucu",
    "text": "Hangisi bir web sunucusu yazılımıdır?",
    "answers": [
      "Apache",
      "Dreamweaver",
      "Mozilla",
      "Frontpage"
    ],
    "correct": 0
  },
  {
    "category": "CSS Geçiş",
    "text": "animation-delay özelliği ne yapar?",
    "answers": [
      "Animasyon başlamadan önce bekleme süresini belirler.",
      "Animasyonu siler.",
      "Animasyonun rengini değiştirir.",
      "Elementi gizler."
    ],
    "correct": 0
  },
  {
    "category": "CSS Kırpma",
    "text": "clip-path: circle(50%); ne yapar?",
    "answers": [
      "Öğeyi daire şeklinde kırpar.",
      "Öğeyi tamamen gizler.",
      "Öğeyi döndürür.",
      "Öğeyi saydam yapar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Renk",
    "text": "rgba(255, 0, 0, 0.5) ne anlama gelir?",
    "answers": [
      "%50 opaklıkta kırmızı renk.",
      "Tamamen siyah renk.",
      "%50 opaklıkta mavi renk.",
      "Saydam olmayan yeşil renk."
    ],
    "correct": 0
  },
  {
    "category": "Flexbox",
    "text": "align-items: center; genelde ne yapar?",
    "answers": [
      "Flex eksenine göre öğeleri çapraz eksende ortalar.",
      "Öğeleri sola yaslar.",
      "Öğeleri büyütür.",
      "Metni altı çizili yapar."
    ],
    "correct": 0
  },
  {
    "category": "CSS Sütun",
    "text": "column-count: 3; ne yapar?",
    "answers": [
      "İçeriği 3 sütuna böler.",
      "İçeriği 3 satıra böler.",
      "Öğeyi 3 kat büyütür.",
      "Öğeyi gizler."
    ],
    "correct": 0
  },
  {
    "category": "CSS Cursor",
    "text": "cursor: not-allowed; ne yapar?",
    "answers": [
      "İmleci yasak işareti görünümüne getirir.",
      "İmleci büyütür.",
      "İmleci gizler.",
      "İmleci metin seçimine çevirir."
    ],
    "correct": 0
  },
  {
    "category": "HTML Listeler",
    "text": "Sıralı liste oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<ol>",
      "<ul>",
      "<li>",
      "<dl>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Listeler",
    "text": "Sırasız liste oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<ul>",
      "<ol>",
      "<li>",
      "<dl>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Listeler",
    "text": "Liste elemanı oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<li>",
      "<ul>",
      "<ol>",
      "<item>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Medya",
    "text": "HTML sayfasına video eklemek için hangi etiket kullanılır?",
    "answers": [
      "<video>",
      "<movie>",
      "<media>",
      "<clip>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Medya",
    "text": "HTML sayfasına ses dosyası eklemek için hangi etiket kullanılır?",
    "answers": [
      "<audio>",
      "<sound>",
      "<music>",
      "<voice>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Medya",
    "text": "Video öğesine birden fazla kaynak eklemek için hangi etiket kullanılır?",
    "answers": [
      "<source>",
      "<track>",
      "<file>",
      "<src>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Medya",
    "text": "Video dosyasına altyazı eklemek için hangi etiket kullanılır?",
    "answers": [
      "<track>",
      "<subtitle>",
      "<caption>",
      "<text>"
    ],
    "correct": 0
  },
  {
    "category": "CSS Boyut",
    "text": "Bir elemanın genişliğini belirlemek için hangi CSS özelliği kullanılır?",
    "answers": [
      "width",
      "height",
      "size",
      "area"
    ],
    "correct": 0
  },
  {
    "category": "CSS Boyut",
    "text": "Bir elemanın yüksekliğini belirlemek için hangi CSS özelliği kullanılır?",
    "answers": [
      "height",
      "width",
      "length",
      "scale"
    ],
    "correct": 0
  },
  {
    "category": "CSS Görünürlük",
    "text": "opacity: 0 olan bir öğe için hangisi doğrudur?",
    "answers": [
      "Görünmezdir ama sayfada yer kaplayabilir.",
      "Sayfadan tamamen silinir.",
      "Rengi beyaza döner.",
      "Sadece metni gizlenir."
    ],
    "correct": 0
  },
  {
    "category": "CSS Görünürlük",
    "text": "display: none; ne yapar?",
    "answers": [
      "Öğeyi gizler ve sayfada yer kaplamaz.",
      "Öğeyi şeffaf yapar ama yer kaplar.",
      "Öğeyi sola yaslar.",
      "Öğeyi büyütür."
    ],
    "correct": 0
  },
  {
    "category": "CSS Görünürlük",
    "text": "display: none ile visibility: hidden arasındaki temel fark nedir?",
    "answers": [
      "display:none yer kaplatmaz; visibility:hidden gizler ama yerini korur.",
      "İkisi tamamen aynıdır.",
      "visibility:hidden öğeyi siler.",
      "display:none sadece mobilde çalışır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Display",
    "text": "Bir öğeyi blok seviyesine çevirmek için hangi kullanım doğrudur?",
    "answers": [
      "display: block;",
      "display: inline;",
      "display: none;",
      "display: row;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Display",
    "text": "Satır içi blok yapmak için hangi display değeri kullanılır?",
    "answers": [
      "inline-block",
      "block",
      "inline",
      "none"
    ],
    "correct": 0
  },
  {
    "category": "CSS Display",
    "text": "Elemanları esnek kutu düzenine sokan display değeri hangisidir?",
    "answers": [
      "flex",
      "block",
      "none",
      "table"
    ],
    "correct": 0
  },
  {
    "category": "CSS Display",
    "text": "Elemanları ızgara sistemiyle yerleştirmek için hangi kullanım doğrudur?",
    "answers": [
      "display: grid;",
      "display: table-row;",
      "layout-grid: true;",
      "grid-system: on;"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Temelleri",
    "text": "HTML’in açılımı nedir?",
    "answers": [
      "Hyper Text Markup Language",
      "High Text Marking Language",
      "Hyper Tool Multi Language",
      "Hyperlink Textual Marking Language"
    ],
    "correct": 0
  },
  {
    "category": "Web Standartları",
    "text": "Web standartlarını belirleyen kuruluş hangisidir?",
    "answers": [
      "W3C",
      "Mozilla",
      "Microsoft",
      "Google"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Protokol",
    "text": "HTTP açılımı nedir?",
    "answers": [
      "Hyper Text Transfer Protocol",
      "Hyper Transfer Text Protocol",
      "High Transfer Text Protocol",
      "Hyperlink Text Translation Protocol"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Protokol",
    "text": "Tarayıcı ile web sunucusu arasındaki iletişim genelde hangi protokoller üzerinden gerçekleşir?",
    "answers": [
      "HTTP ve HTTPS",
      "FTP ve SMTP",
      "Bluetooth ve SMS",
      "DNS ve JPEG"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Temelleri",
    "text": "DNS nedir?",
    "answers": [
      "Alan adlarının IP adresleriyle ilişkilendirilmesini sağlayan sistemdir.",
      "Sadece resim sıkıştırma formatıdır.",
      "CSS animasyon motorudur.",
      "HTML başlık etiketidir."
    ],
    "correct": 0
  },
  {
    "category": "İnternet Protokol",
    "text": "HTTP ve HTTPS arasındaki temel fark nedir?",
    "answers": [
      "HTTPS veriyi şifreli/güvenli iletir.",
      "HTTP sadece mobilde çalışır.",
      "HTTPS statik dosya göstermez.",
      "İkisi arasında fark yoktur."
    ],
    "correct": 0
  },
  {
    "category": "İnternet Temelleri",
    "text": "Dünya çapında bilgisayarları birbirine bağlayan büyük iletişim ağına ne denir?",
    "answers": [
      "İnternet",
      "Domain",
      "Web sayfası",
      "Tarayıcı"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Alan Adı",
    "text": "Karmaşık IP numaraları yerine kullanılan kolay hatırlanan adlara ne denir?",
    "answers": [
      "Domain / alan adı",
      "Browser",
      "Server RAM",
      "Protocol CSS"
    ],
    "correct": 0
  },
  {
    "category": "HTML Dil",
    "text": "Bir web sayfasının ana dilini belirtmek için doğru kullanım hangisidir?",
    "answers": [
      "<html lang=\"tr\">",
      "<html language=\"tr\">",
      "<meta lang=\"tr\">",
      "<body language=\"tr\">"
    ],
    "correct": 0
  },
  {
    "category": "Alan Adı",
    "text": "Eğitim kurumları için kullanılan alan adı uzantısı hangisidir?",
    "answers": [
      ".edu",
      ".com",
      ".net",
      ".info"
    ],
    "correct": 0
  },
  {
    "category": "Alan Adı",
    "text": "Ticari kuruluşlar için kullanılan alan adı uzantısı hangisidir?",
    "answers": [
      ".com",
      ".gov",
      ".edu",
      ".mil"
    ],
    "correct": 0
  },
  {
    "category": "HTML Görsel",
    "text": "Doğru HTML resim etiketi kullanımı hangisidir?",
    "answers": [
      "<img src=\"image.jpg\" alt=\"Resim\">",
      "<img alt=\"Resim\">image.jpg</img>",
      "<pic href=\"image.jpg\">",
      "<image url=\"image.jpg\">"
    ],
    "correct": 0
  },
  {
    "category": "HTML Meta",
    "text": "Sayfa karakter kodlamasını belirtmek için hangi meta etiketi kullanılır?",
    "answers": [
      "<meta charset=\"UTF-8\">",
      "<meta encoding=\"UTF-8\">",
      "<charset>",
      "<encoding>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "HTML’de form gönderim yöntemi olarak kullanılan değerlerden biri hangisidir?",
    "answers": [
      "post",
      "send",
      "push",
      "share"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Form içindeki metin giriş alanına varsayılan değer atamak için hangi öznitelik kullanılır?",
    "answers": [
      "value",
      "default",
      "placeholder",
      "initial"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Form elemanlarına açıklama/etiket eklemek için hangi etiket kullanılır?",
    "answers": [
      "<label>",
      "<title>",
      "<caption>",
      "<header>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "<fieldset> etiketi ne için kullanılır?",
    "answers": [
      "Form öğelerini gruplamak için.",
      "Formu göndermeyi durdurmak için.",
      "Sayfa başlığını belirlemek için.",
      "Video eklemek için."
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Bir label etiketini giriş elemanıyla ilişkilendirmek için hangi nitelik kullanılır?",
    "answers": [
      "for",
      "name",
      "value",
      "target"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "GET ve POST arasındaki temel fark nedir?",
    "answers": [
      "GET veriyi URL’ye ekler; POST isteğin gövdesinde gönderir.",
      "POST sadece resimler içindir.",
      "GET her zaman daha güvenlidir.",
      "İkisi tamamen aynıdır."
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Bir butonu devre dışı bırakmak için hangi öznitelik kullanılır?",
    "answers": [
      "disabled",
      "readonly",
      "locked",
      "inactive"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "HTML’de formun gönderileceği adresi belirleyen özellik hangisidir?",
    "answers": [
      "action",
      "method",
      "submit",
      "target-color"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Bir form elemanına odaklanıldığında tetiklenen olay hangisidir?",
    "answers": [
      "onfocus",
      "onclick",
      "onhover",
      "onenter"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Bir sayfada birden fazla seçeneğin seçilebildiği giriş türü hangisidir?",
    "answers": [
      "checkbox",
      "radio",
      "select",
      "option"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Sayfa yüklendiğinde bir form elemanına otomatik odaklanmak için hangi özellik kullanılır?",
    "answers": [
      "autofocus",
      "selected",
      "active",
      "focus-on"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "HTML’de metin alanı oluşturmak için hangi etiket kullanılır?",
    "answers": [
      "<textarea>",
      "<inputarea>",
      "<textinput>",
      "<field>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Kullanıcıdan şifre almak için hangi input türü kullanılır?",
    "answers": [
      "type=\"password\"",
      "type=\"secret\"",
      "type=\"text\"",
      "type=\"hidden\""
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Dosya yükleme alanı oluşturmak için hangi input türü kullanılır?",
    "answers": [
      "type=\"file\"",
      "type=\"upload\"",
      "type=\"document\"",
      "type=\"attachment\""
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Sadece sayı girişi için hangi input type değeri kullanılır?",
    "answers": [
      "number",
      "digits",
      "numeric",
      "integer"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Kullanıcıya belirli aralıkta seçim yaptıran kaydırma çubuğu hangisidir?",
    "answers": [
      "<input type=\"range\">",
      "<input type=\"scroll\">",
      "<input type=\"slider\">",
      "<input type=\"meter\">"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Onay kutusu oluşturmak için hangi input türü kullanılır?",
    "answers": [
      "type=\"checkbox\"",
      "type=\"radio\"",
      "type=\"option\"",
      "type=\"tick\""
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Kullanıcıdan telefon numarası almak için hangi input türü kullanılır?",
    "answers": [
      "tel",
      "phone",
      "number",
      "contact"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "placeholder niteliği ne işe yarar?",
    "answers": [
      "Alan boşken görünen ipucu metnini belirler.",
      "Alan değerini sunucuya göndermez.",
      "Alanı sadece okunur yapar.",
      "Alanı gizler."
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Tarih seçimi için kullanılan input tipi hangisidir?",
    "answers": [
      "date",
      "calendar",
      "day",
      "select"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "<input type=\"color\"> ne oluşturur?",
    "answers": [
      "Renk seçme aracı açan giriş alanı.",
      "Metin rengi etiketi.",
      "Gradyan oluşturucu.",
      "Şifre alanı."
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Bir input alanını sadece okunur yapmak için hangi özellik kullanılır?",
    "answers": [
      "readonly",
      "disabled",
      "fixed",
      "lock"
    ],
    "correct": 0
  },
  {
    "category": "HTML Form",
    "text": "Kullanıcıya göstermeden sunucuya parametre göndermek için hangi input tipi kullanılır?",
    "answers": [
      "hidden",
      "submit",
      "button",
      "reset"
    ],
    "correct": 0
  },
  {
    "category": "CSS Transition",
    "text": "Bir elemana geçiş efekti uygulamak için hangi CSS özelliği kullanılır?",
    "answers": [
      "transition",
      "animation",
      "transform",
      "duration"
    ],
    "correct": 0
  },
  {
    "category": "CSS Transition",
    "text": "Geçişin ne kadar süreceğini belirleyen alt özellik hangisidir?",
    "answers": [
      "transition-duration",
      "transition-delay",
      "transition-property",
      "transition-mode"
    ],
    "correct": 0
  },
  {
    "category": "CSS Animasyon",
    "text": "Bir elemana animasyon uygulamak için kullanılan ana özellik hangisidir?",
    "answers": [
      "animation",
      "transition",
      "transform",
      "delay"
    ],
    "correct": 0
  },
  {
    "category": "CSS Transform",
    "text": "transform: scale(1.5); ne yapar?",
    "answers": [
      "Öğeyi 1.5 kat büyütür.",
      "Öğeyi 1.5 derece döndürür.",
      "Öğeyi gizler.",
      "Öğeyi 1.5 piksel kaydırır."
    ],
    "correct": 0
  },
  {
    "category": "CSS Transform",
    "text": "Bir elemanı 2D düzlemde döndürmek için hangi transform fonksiyonu kullanılır?",
    "answers": [
      "rotate()",
      "scale()",
      "translate()",
      "skew()"
    ],
    "correct": 0
  },
  {
    "category": "CSS Transform",
    "text": "Bir elemanın konumunu kaydırmak için hangi transform fonksiyonu kullanılır?",
    "answers": [
      "translate()",
      "rotate()",
      "scale()",
      "matrix-only()"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Sunucu",
    "text": "IIS açılımı nedir?",
    "answers": [
      "Internet Information Services",
      "Internet Insert Services",
      "Internet Information Security",
      "Insert Internet Services"
    ],
    "correct": 0
  },
  {
    "category": "İnternet Protokol",
    "text": "TCP/IP protokol yapısında olmayan katman hangisidir?",
    "answers": [
      "İletişim Katmanı",
      "Uygulama Katmanı",
      "Taşıma Katmanı",
      "İnternet Katmanı"
    ],
    "correct": 0
  },
  {
    "category": "İnternet URL",
    "text": "İnternet adresine kısaca ne denir?",
    "answers": [
      "URL",
      "IP-only",
      "Client",
      "Host RAM"
    ],
    "correct": 0
  },
  {
    "category": "HTML Bağlantı",
    "text": "Bir bağlantıyı yeni sekmede açmak için hangi öznitelik kullanılır?",
    "answers": [
      "target=\"_blank\"",
      "target=\"_self\"",
      "open=\"new\"",
      "window=\"blank\""
    ],
    "correct": 0
  },
  {
    "category": "HTML Bağlantı",
    "text": "Harici CSS dosyası bağlamak için doğru etiket hangisidir?",
    "answers": [
      "<link rel=\"stylesheet\" href=\"style.css\">",
      "<script src=\"style.css\">",
      "<css src=\"style.css\">",
      "<style href=\"style.css\">"
    ],
    "correct": 0
  },
  {
    "category": "HTML Bağlantı",
    "text": "E-posta bağlantısı oluşturmak için href içinde hangi yapı kullanılır?",
    "answers": [
      "mailto:email@example.com",
      "email:email@example.com",
      "send:email@example.com",
      "smtp:email@example.com"
    ],
    "correct": 0
  },
  {
    "category": "CSS Link",
    "text": "Linklerin alt çizgisini kaldırmak için hangi CSS kullanılır?",
    "answers": [
      "a { text-decoration: none; }",
      "a { text-line: none; }",
      "link { underline: none; }",
      "a { decoration: no-line; }"
    ],
    "correct": 0
  },
  {
    "category": "CSS Scroll",
    "text": "scroll-behavior: smooth; ne işe yarar?",
    "answers": [
      "Sayfa içi link kaymasını yumuşak animasyonla yapar.",
      "Kaydırmayı tamamen kapatır.",
      "Sayfayı otomatik aşağı indirir.",
      "Mouse tekerleğini bozar."
    ],
    "correct": 0
  },
  {
    "category": "HTML Responsive",
    "text": "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> ne için kullanılır?",
    "answers": [
      "Mobil cihazlarda doğru ölçeklenme için.",
      "Sayfanın dilini belirlemek için.",
      "Tarayıcı yakınlaştırmasını silmek için.",
      "Sayfanın başlığını değiştirmek için."
    ],
    "correct": 0
  },
  {
    "category": "CSS Birim",
    "text": "rem birimi neye göre hesaplanır?",
    "answers": [
      "Kök elementin yazı boyutuna göre.",
      "Üst elementin arka planına göre.",
      "Viewport genişliğine göre.",
      "Ekran piksel yoğunluğuna göre."
    ],
    "correct": 0
  },
  {
    "category": "CSS Hizalama",
    "text": "Metni ortalamak için hangi CSS kullanılır?",
    "answers": [
      "text-align: center;",
      "align: center;",
      "margin: center;",
      "float: center;"
    ],
    "correct": 0
  },
  {
    "category": "Flexbox",
    "text": "Bir öğeyi yatay ve dikey ortalamak için Flexbox’ta hangi ikili kullanılır?",
    "answers": [
      "justify-content: center; align-items: center;",
      "text-align: center; vertical-align: middle;",
      "float: center; margin: auto;",
      "position: center; align: center;"
    ],
    "correct": 0
  },
  {
    "category": "CSS Gölge",
    "text": "Bir öğeye kutu gölgesi eklemek için hangi özellik kullanılır?",
    "answers": [
      "box-shadow",
      "text-shadow",
      "shadow-box",
      "element-shadow"
    ],
    "correct": 0
  },
  {
    "category": "CSS Gölge",
    "text": "Metne gölge efekti vermek için hangi özellik kullanılır?",
    "answers": [
      "text-shadow",
      "box-shadow",
      "drop-shadow",
      "font-shadow"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "Kelimeler arasındaki boşluğu ayarlayan özellik hangisidir?",
    "answers": [
      "word-spacing",
      "letter-spacing",
      "text-gap",
      "font-gap"
    ],
    "correct": 0
  },
  {
    "category": "CSS Metin",
    "text": "Harfler arasındaki boşluğu ayarlayan özellik hangisidir?",
    "answers": [
      "letter-spacing",
      "word-gap",
      "char-size",
      "text-empty"
    ],
    "correct": 0
  },
  {
    "category": "HTML Semantik",
    "text": "Menü ve gezinme bağlantıları için kullanılan HTML5 etiketi hangisidir?",
    "answers": [
      "<nav>",
      "<menuonly>",
      "<linkbar>",
      "<bar>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Semantik",
    "text": "Ana içerik alanını belirtmek için kullanılan etiket hangisidir?",
    "answers": [
      "<main>",
      "<core>",
      "<primary>",
      "<bodymain>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Semantik",
    "text": "Sayfanın alt bölümünü tanımlayan etiket hangisidir?",
    "answers": [
      "<footer>",
      "<bottom>",
      "<end>",
      "<down>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Semantik",
    "text": "Makale içeriğini belirtmek için kullanılan etiket hangisidir?",
    "answers": [
      "<article>",
      "<post>",
      "<story>",
      "<text>"
    ],
    "correct": 0
  },
  {
    "category": "HTML Semantik",
    "text": "Yan içerik için kullanılan etiket hangisidir?",
    "answers": [
      "<aside>",
      "<side>",
      "<extra>",
      "<column>"
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": "nth-child(2n) hangi elementleri seçer?",
    "answers": [
      "Her çift sıradaki elementi.",
      "Sadece ikinci elementi.",
      "Sadece tek sıradakileri.",
      "Son iki elementi."
    ],
    "correct": 0
  },
  {
    "category": "CSS Seçici",
    "text": ":first-child seçicisi neyi seçer?",
    "answers": [
      "Üst öğesi içindeki ilk çocuk öğeyi.",
      "Sayfadaki ilk resmi.",
      "Sadece ilk CSS kuralını.",
      "Sadece <h1> etiketlerini."
    ],
    "correct": 0
  },
  {
    "category": "Canvas",
    "text": "Canvas üzerinde 2 boyutlu çizim yapmak için hangi bağlam alınır?",
    "answers": [
      "getContext(\"2d\")",
      "getCanvas(\"2d\")",
      "drawHTML()",
      "makeContext()"
    ],
    "correct": 0
  },
  {
    "category": "Canvas",
    "text": "Canvas üzerinde dikdörtgen çizmek için sık kullanılan metot hangisidir?",
    "answers": [
      "fillRect()",
      "drawDiv()",
      "makeBox()",
      "rectHTML()"
    ],
    "correct": 0
  },
  {
    "category": "Canvas",
    "text": "Canvas animasyon döngüsü için genellikle hangi JavaScript fonksiyonu kullanılır?",
    "answers": [
      "requestAnimationFrame()",
      "setHTMLFrame()",
      "drawLoopCSS()",
      "refreshCanvasFile()"
    ],
    "correct": 0
  },
  {
    "category": "JavaScript",
    "text": "JavaScript’te diziye eleman eklemek için yaygın kullanılan metot hangisidir?",
    "answers": [
      "push()",
      "paint()",
      "query()",
      "appendCss()"
    ],
    "correct": 0
  },
  {
    "category": "JavaScript",
    "text": "DOM’dan id ile eleman seçmek için hangi metot kullanılır?",
    "answers": [
      "document.getElementById()",
      "document.findId()",
      "window.idSelect()",
      "html.getId()"
    ],
    "correct": 0
  },
  {
    "category": "JavaScript",
    "text": "Bir butona tıklama olayı eklemek için modern kullanım hangisidir?",
    "answers": [
      "addEventListener(\"click\", fonksiyon)",
      "onclick-css: true",
      "button.hover()",
      "listenClickCSS()"
    ],
    "correct": 0
  },
  {
    "category": "Web API",
    "text": "Tarayıcıda en yüksek skoru kalıcı saklamak için hangisi uygundur?",
    "answers": [
      "localStorage",
      "console.log",
      "alert",
      "Math.random"
    ],
    "correct": 0
  },
  {
    "category": "Oyun Mantığı",
    "text": "Bir oyunda çarpışma kontrolü ne için kullanılır?",
    "answers": [
      "Nesnelerin temas edip etmediğini anlamak için.",
      "CSS dosyasını küçültmek için.",
      "Ses seviyesini kapatmak için.",
      "HTML başlığını değiştirmek için."
    ],
    "correct": 0
  },
  {
    "category": "Oyun Tasarımı",
    "text": "Seviye/dalga sistemi oyunda en çok ne sağlar?",
    "answers": [
      "Zorluğun zamanla artmasını sağlar.",
      "Dosya adını değiştirir.",
      "Tarayıcıyı kapatır.",
      "Yorum satırlarını siler."
    ],
    "correct": 0
  }
];

const state = {
  running: false,
  paused: false,
  gameOver: false,
  playerName: 'Oyuncu',
  playerColor: '#00f5ff',
  difficulty: DIFFICULTY.normal,
  width: 1280,
  height: 720,
  dpr: 1,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  health: 100,
  wave: 1,
  weaponLevel: 1,
  correctAnswers: 0,
  wrongAnswers: 0,
  combo: 0,
  maxCombo: 0,
  timeLeft: 0,
  elapsed: 0,
  spawnTimer: 0,
  spawnInterval: 1.35,
  quizCooldown: QUIZ_INTERVAL,
  quizActive: false,
  quizLocked: false,
  quizRemaining: 0,
  currentQuestion: null,
  questionIndex: 0,
  questionDeck: [],
  lastQuestionId: null,
  quizThreat: 0,
  screenShake: 0,
  autoFireTimer: 0,
  lastFrame: 0,
  player: null,
  zombies: [],
  bullets: [],
  particles: [],
  floatingTexts: [],
  missedQuestions: [],
  questionHistory: [],
  rain: [],
  keys: new Set(),
  pointerActive: false,
  pointerX: null,
  audioReady: false,
  audioContext: null,
  music: null,
  musicTimer: null
};


const ZOMBIE_TYPES = {
  normal: {
    title: 'Yürüyen', radius: 25, hp: 72, hpWave: 8, speed: 61, value: 38, damageBonus: 0,
    skin: '#7ea86d', dark: '#1d331d', cloth: '#33485a', glow: '#ff466d', eye: '#ff3f6c'
  },
  runner: {
    title: 'Koşucu', radius: 21, hp: 54, hpWave: 6, speed: 101, value: 40, damageBonus: 1,
    skin: '#a7bc70', dark: '#263a19', cloth: '#2b3655', glow: '#ffb347', eye: '#ffd166'
  },
  tank: {
    title: 'Tank', radius: 35, hp: 138, hpWave: 16, speed: 43, value: 66, damageBonus: 10,
    skin: '#7b8895', dark: '#1d2730', cloth: '#48505c', glow: '#b7c4d8', eye: '#ff3f6c'
  },
  toxic: {
    title: 'Toksik', radius: 27, hp: 88, hpWave: 10, speed: 58, value: 58, damageBonus: 5,
    skin: '#9adb39', dark: '#1e3a0a', cloth: '#31401b', glow: '#b6ff00', eye: '#fff59b'
  },
  crawler: {
    title: 'Sürüngen', radius: 19, hp: 50, hpWave: 5, speed: 112, value: 44, damageBonus: 3,
    skin: '#719678', dark: '#18271d', cloth: '#273544', glow: '#00f5ff', eye: '#8ffcff'
  },
  brute: {
    title: 'Zırhlı', radius: 32, hp: 176, hpWave: 18, speed: 37, value: 82, damageBonus: 15,
    skin: '#6f7787', dark: '#151b22', cloth: '#303640', glow: '#ff7a18', eye: '#ff3f6c'
  },
  spitter: {
    title: 'Asitçi', radius: 24, hp: 82, hpWave: 8, speed: 49, value: 62, damageBonus: 6,
    skin: '#7fd17b', dark: '#183519', cloth: '#293a34', glow: '#9cff33', eye: '#e8ff8d'
  },
  hunter: {
    title: 'Avcı', radius: 23, hp: 74, hpWave: 8, speed: 125, value: 72, damageBonus: 7,
    skin: '#9a8267', dark: '#241812', cloth: '#3f2735', glow: '#ff4fd8', eye: '#ff9de7'
  },
  exploder: {
    title: 'Patlayıcı', radius: 29, hp: 98, hpWave: 11, speed: 54, value: 76, damageBonus: 22,
    skin: '#a8734e', dark: '#31170f', cloth: '#4a2d20', glow: '#ff3f6c', eye: '#ffd166'
  }
};

class Player {
  constructor() {
    this.x = state.width * 0.5;
    this.y = getBarricadeY() - 68 * state.dpr;
    this.radius = 30;
    this.speed = 440;
  }

  update(dt) {
    let direction = 0;
    if (state.keys.has('ArrowLeft') || state.keys.has('a')) direction -= 1;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) direction += 1;

    if (state.pointerActive && typeof state.pointerX === 'number') {
      const diff = state.pointerX - this.x;
      if (Math.abs(diff) > 8) {
        direction = Math.sign(diff);
        this.x += direction * Math.min(Math.abs(diff), this.speed * dt);
      }
    } else {
      this.x += direction * this.speed * dt;
    }
    this.x = clamp(this.x, 80, state.width - 80);
  }

  draw() {
    const glow = state.playerColor;
    const bob = Math.sin(state.elapsed * 6.5) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);

    // Gölge: karakterin zemine oturmasını sağlar.
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 39, 58, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Arkadan gelen neon savunma halkası.
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(state.elapsed * 4.8) * 0.04;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 7;
    ctx.shadowBlur = 28;
    ctx.shadowColor = glow;
    ctx.beginPath();
    ctx.ellipse(0, -10, 50, 60, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Bacaklar: sert kareler yerine kalın organik çizgiler.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09111d';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-14, 18); ctx.quadraticCurveTo(-17, 32, -29, 47);
    ctx.moveTo(12, 18); ctx.quadraticCurveTo(19, 32, 29, 47);
    ctx.stroke();
    ctx.strokeStyle = '#1a2638';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14, 19); ctx.quadraticCurveTo(-18, 32, -26, 43);
    ctx.moveTo(12, 19); ctx.quadraticCurveTo(18, 32, 26, 43);
    ctx.stroke();

    // Uzun kapüşonlu mont gövdesi.
    const coat = ctx.createLinearGradient(-38, -48, 35, 38);
    coat.addColorStop(0, '#f4fbff');
    coat.addColorStop(0.16, glow);
    coat.addColorStop(0.5, '#1c2b40');
    coat.addColorStop(1, '#070c15');
    ctx.fillStyle = coat;
    ctx.shadowBlur = 18;
    ctx.shadowColor = glow;
    ctx.beginPath();
    ctx.moveTo(-25, -33);
    ctx.bezierCurveTo(-43, -15, -40, 18, -26, 36);
    ctx.quadraticCurveTo(-9, 45, 0, 36);
    ctx.quadraticCurveTo(12, 45, 28, 35);
    ctx.bezierCurveTo(42, 14, 39, -18, 24, -33);
    ctx.quadraticCurveTo(0, -44, -25, -33);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // İç zırh ve çapraz kayışlar.
    ctx.strokeStyle = 'rgba(236,247,255,0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-21, -22); ctx.lineTo(16, 29);
    ctx.moveTo(22, -23); ctx.lineTo(-12, 29);
    ctx.stroke();
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -28); ctx.lineTo(0, 31);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Kollar ve eldivenler.
    ctx.strokeStyle = '#0c1420';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-29, -19); ctx.quadraticCurveTo(-47, -4, -50, 16);
    ctx.moveTo(29, -18); ctx.quadraticCurveTo(47, -9, 58, -16);
    ctx.stroke();
    ctx.fillStyle = '#02060c';
    ctx.beginPath(); ctx.arc(-51, 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(59, -17, 8, 0, Math.PI * 2); ctx.fill();

    // Kapüşon ve yüz maskesi.
    ctx.fillStyle = '#07101e';
    ctx.beginPath();
    ctx.moveTo(-25, -53);
    ctx.bezierCurveTo(-22, -82, 24, -82, 27, -52);
    ctx.bezierCurveTo(20, -33, -20, -32, -25, -53);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-22, -53); ctx.bezierCurveTo(-18, -75, 20, -75, 23, -53);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#dce9ef';
    ctx.beginPath();
    ctx.ellipse(1, -53, 17, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101827';
    ctx.beginPath();
    ctx.ellipse(0, -55, 19, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.shadowBlur = 16;
    ctx.shadowColor = glow;
    ctx.fillRect(-13, -58, 26, 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#070b12';
    ctx.beginPath();
    ctx.moveTo(-11, -47); ctx.quadraticCurveTo(0, -40, 12, -47); ctx.lineTo(8, -38); ctx.quadraticCurveTo(0, -35, -8, -38); ctx.closePath();
    ctx.fill();

    // Tüfek: daha bütünleşik silüet.
    ctx.save();
    ctx.translate(23, -17);
    ctx.rotate(-0.09 + Math.sin(state.elapsed * 8) * 0.015);
    const gun = ctx.createLinearGradient(0, -7, 78, 7);
    gun.addColorStop(0, '#e8f6ff');
    gun.addColorStop(0.45, '#71849d');
    gun.addColorStop(1, '#111722');
    ctx.fillStyle = gun;
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(61, -8); ctx.quadraticCurveTo(76, -5, 78, 0); ctx.quadraticCurveTo(76, 6, 61, 8); ctx.lineTo(0, 8); ctx.quadraticCurveTo(-7, 0, 0, -8); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#05080d';
    ctx.beginPath();
    ctx.moveTo(25, 5); ctx.lineTo(43, 5); ctx.lineTo(38, 24); ctx.lineTo(27, 24); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.shadowBlur = 20;
    ctx.shadowColor = glow;
    ctx.beginPath();
    ctx.ellipse(77, 0, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffd166';
    ctx.font = `900 ${12 * state.dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${state.weaponLevel}`, 0, 64);
    ctx.restore();
  }
}

class Zombie {
  constructor(type, lane) {
    this.type = ZOMBIE_TYPES[type] ? type : 'normal';
    this.config = ZOMBIE_TYPES[this.type];
    this.lane = lane;
    this.x = lane;
    this.y = -240 - Math.random() * 220;
    this.radius = this.config.radius;
    const survivalPressure = getSurvivalPressure();
    const threatHp = 1 + state.quizThreat * 0.42 + survivalPressure * (state.difficulty.endlessHp || 0.42);
    const threatSpeed = 1 + state.quizThreat * 0.30 + survivalPressure * (state.difficulty.endlessSpeed || 0.30);
    this.maxHp = (this.config.hp + Math.max(0, state.wave - 1) * this.config.hpWave) * (state.difficulty.hp || 1) * threatHp;
    this.hp = this.maxHp;
    this.speed = this.config.speed * state.difficulty.speed * threatSpeed * (1 + Math.max(0, state.wave - 1) * (state.difficulty.waveRamp || 0.045));
    this.wobble = Math.random() * Math.PI * 2;
    this.dead = false;
    this.value = this.config.value;
    this.hitFlash = 0;
    this.spitCooldown = 1.4 + Math.random() * 1.6;
    this.stepSeed = Math.random() * 8;
  }

  update(dt) {
    const fast = this.type === 'runner' || this.type === 'crawler' || this.type === 'hunter';
    this.wobble += dt * (fast ? 8.8 : 5.2);
    this.y += this.speed * dt;
    const side = this.type === 'hunter' ? 34 : this.type === 'runner' ? 22 : this.type === 'crawler' ? 18 : 12;
    this.x += Math.sin(this.wobble) * side * dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    if (this.type === 'spitter' && this.y > state.height * 0.39 && !this.dead) {
      this.spitCooldown -= dt;
      if (this.spitCooldown <= 0) {
        this.spitCooldown = 2.7 + Math.random() * 1.2;
        damageBase(2.8 + state.wave * 0.34);
        addFloatingText('ASİT SALDIRISI', this.x, this.y - 36, '#b6ff00');
        createBurst(this.x, this.y - 18, '#b6ff00', 18, 0.62);
        playSound('hurt');
      }
    }

    const barricadeY = getBarricadeY();
    if (this.y > barricadeY && !this.dead) {
      this.dead = true;
      const burstDamage = this.type === 'exploder' ? 10 : 0;
      damageBase(state.difficulty.damage + this.config.damageBonus + burstDamage);
      addFloatingText(`${this.config.title.toUpperCase()} BARİKATA VURDU!`, state.width * 0.5, barricadeY - 45, '#ff3f6c');
      createBurst(this.x, barricadeY, this.config.glow, this.type === 'exploder' ? 46 : 24);
      playSound('hurt');
    }
  }

  takeDamage(amount) {
    const actualDamage = this.type === 'brute' ? amount * 0.8 : this.type === 'tank' ? amount * 0.92 : amount;
    this.hp -= actualDamage;
    this.hitFlash = 0.08;
    createBurst(this.x, this.y, this.config.glow, 5);
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      state.score += this.value + state.weaponLevel * 2 + state.combo * 3;
      addFloatingText(`+${this.value}`, this.x, this.y - 30, '#b6ff00');
      createBurst(this.x, this.y, this.config.glow, this.type === 'tank' || this.type === 'brute' || this.type === 'exploder' ? 40 : 28, 1.05);

      if (this.type === 'toxic' || this.type === 'exploder') {
        const splash = this.type === 'exploder' ? 34 + state.weaponLevel * 4 : 14 + state.weaponLevel * 3;
        const radius = this.type === 'exploder' ? 150 : 120;
        for (const zombie of state.zombies) {
          if (zombie !== this && !zombie.dead && distance(this.x, this.y, zombie.x, zombie.y) < radius * state.dpr) {
            zombie.hp -= splash;
            zombie.hitFlash = 0.08;
          }
        }
        if (this.type === 'exploder') addFloatingText('PATLAMA!', this.x, this.y - 54, '#ffd166');
      }
      playSound('kill');
    }
  }

  draw() {
    const cfg = this.config;
    const t = state.elapsed * 6 + this.wobble;
    const r = this.radius;
    const low = this.type === 'crawler';
    const sy = low ? 0.62 : 1;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, sy);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, r + 18, r * 1.32, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (this.hitFlash > 0) {
      ctx.shadowBlur = 34;
      ctx.shadowColor = '#fff';
    } else {
      ctx.shadowBlur = 15;
      ctx.shadowColor = cfg.glow;
    }

    // Uzuvlar: düz geometrik parçalar yerine kıvrımlı, yırtık silüet.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = cfg.dark;
    ctx.lineWidth = Math.max(7, r * 0.25);
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.25);
    ctx.quadraticCurveTo(-r * 1.18, r * 0.08 + Math.sin(t) * 3, -r * 1.32, r * 0.55);
    ctx.moveTo(r * 0.58, -r * 0.22);
    ctx.quadraticCurveTo(r * 1.14, r * 0.18 + Math.cos(t) * 3, r * 1.2, r * 0.6);
    ctx.moveTo(-r * 0.25, r * 0.52);
    ctx.quadraticCurveTo(-r * 0.42, r * 1.14, -r * 0.76, r * 1.48);
    ctx.moveTo(r * 0.22, r * 0.52);
    ctx.quadraticCurveTo(r * 0.5, r * 1.08, r * 0.78, r * 1.47);
    ctx.stroke();

    // Pençeler.
    ctx.strokeStyle = cfg.glow;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      const hx = side * r * 1.25;
      const hy = r * 0.58;
      ctx.moveTo(hx, hy); ctx.lineTo(hx + side * 10, hy + 4);
      ctx.moveTo(hx, hy); ctx.lineTo(hx + side * 8, hy + 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Gövde blob'u.
    const body = ctx.createLinearGradient(-r, -r, r, r * 1.3);
    body.addColorStop(0, this.hitFlash > 0 ? '#fff' : cfg.skin);
    body.addColorStop(0.48, cfg.cloth);
    body.addColorStop(1, cfg.dark);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.72);
    ctx.bezierCurveTo(-r * 1.04, -r * 0.2, -r * 0.82, r * 0.62, -r * 0.34, r * 0.93);
    ctx.quadraticCurveTo(0, r * 1.08, r * 0.42, r * 0.9);
    ctx.bezierCurveTo(r * 0.9, r * 0.5, r * 0.95, -r * 0.22, r * 0.58, -r * 0.72);
    ctx.quadraticCurveTo(0, -r * 1.0, -r * 0.65, -r * 0.72);
    ctx.fill();

    // Yırtık kıyafet ve göğüs çizikleri.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(5,10,12,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.28); ctx.lineTo(r * 0.2, r * 0.68);
    ctx.moveTo(r * 0.42, -r * 0.2); ctx.lineTo(-r * 0.16, r * 0.72);
    ctx.moveTo(-r * 0.55, r * 0.32); ctx.lineTo(r * 0.55, r * 0.48);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.28 + i * r * 0.22, r * 0.08 + Math.sin(t + i) * 1.2, r * 0.07, r * 0.25, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kafa: bozuk organik form.
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : cfg.skin;
    ctx.beginPath();
    ctx.moveTo(-r * 0.63, -r * 1.02);
    ctx.bezierCurveTo(-r * 0.48, -r * 1.42, r * 0.44, -r * 1.43, r * 0.63, -r * 1.02);
    ctx.bezierCurveTo(r * 0.78, -r * 0.62, r * 0.35, -r * 0.36, 0, -r * 0.37);
    ctx.bezierCurveTo(-r * 0.38, -r * 0.37, -r * 0.82, -r * 0.62, -r * 0.63, -r * 1.02);
    ctx.fill();

    // Saç/kemik çıkıntıları.
    ctx.fillStyle = cfg.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.54, -r * 1.16);
    ctx.lineTo(-r * 0.28, -r * 1.42);
    ctx.lineTo(-r * 0.07, -r * 1.13);
    ctx.lineTo(r * 0.2, -r * 1.36);
    ctx.lineTo(r * 0.52, -r * 1.09);
    ctx.lineTo(r * 0.28, -r * 1.2);
    ctx.closePath();
    ctx.fill();

    // Gözler.
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = cfg.eye;
    ctx.fillStyle = cfg.eye;
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.86, Math.max(3, r * 0.13), Math.max(2, r * 0.08), 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.22, -r * 0.84, Math.max(3, r * 0.13), Math.max(2, r * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ağız ve dişler.
    ctx.strokeStyle = '#07100a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.56);
    ctx.quadraticCurveTo(0, -r * 0.45 + Math.sin(t) * 1.5, r * 0.28, -r * 0.53);
    ctx.stroke();
    ctx.fillStyle = '#e8f4e2';
    ctx.fillRect(-r * 0.12, -r * 0.52, 3, 5);
    ctx.fillRect(r * 0.08, -r * 0.52, 3, 5);

    // Türlere özel görsel farklar.
    if (this.type === 'spitter' || this.type === 'toxic') {
      ctx.fillStyle = cfg.glow;
      ctx.globalAlpha = this.type === 'spitter' ? 0.58 : 0.42;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(r * (0.38 + i * 0.05), -r * (0.28 - i * 0.18), r * (0.13 + i * 0.025) + Math.sin(t + i) * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (this.type === 'tank' || this.type === 'brute') {
      ctx.strokeStyle = '#c7d0dc';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.58, -r * 0.5); ctx.lineTo(r * 0.6, -r * 0.36);
      ctx.moveTo(-r * 0.5, -r * 0.08); ctx.lineTo(r * 0.48, r * 0.04);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (this.type === 'hunter') {
      ctx.strokeStyle = cfg.glow;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-r * 1.36, r * 0.5); ctx.lineTo(-r * 1.66, r * 0.3);
      ctx.moveTo(r * 1.24, r * 0.55); ctx.lineTo(r * 1.54, r * 0.37);
      ctx.stroke();
    }
    if (this.type === 'exploder') {
      ctx.fillStyle = '#ffd166';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff3f6c';
      ctx.beginPath();
      ctx.arc(0, r * 0.12, r * 0.27 + Math.sin(t * 1.4) * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (this.type === 'crawler') {
      ctx.strokeStyle = cfg.glow;
      ctx.globalAlpha = 0.46;
      ctx.beginPath();
      ctx.moveTo(-r * 1.05, r * 0.88); ctx.quadraticCurveTo(0, r * 1.08, r * 1.05, r * 0.88);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Tür etiketi ve HP barı.
    ctx.font = `800 ${10 * state.dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(236,247,255,0.82)';
    ctx.fillText(cfg.title, 0, -r * 1.78);

    const hpWidth = r * 2.1;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(-hpWidth / 2, -r * 1.58, hpWidth, 6, 3);
    ctx.fill();
    ctx.fillStyle = cfg.glow;
    roundRect(-hpWidth / 2, -r * 1.58, hpWidth * clamp(this.hp / this.maxHp, 0, 1), 6, 3);
    ctx.fill();

    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, target, power, spreadAngle = 0, damageScale = 1) {
    this.x = x;
    this.y = y;
    this.radius = 5 + Math.min(5, power * 0.72);
    this.damage = (23 + power * 7.2) * damageScale;
    this.speed = 760 + power * 31;
    this.dead = false;

    const dx = target.x - x;
    const dy = target.y - y;
    const angle = Math.atan2(dy, dx) + spreadAngle;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.color = power >= 5 ? '#ffd166' : power >= 3 ? '#b6ff00' : '#00f5ff';
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -40 || this.x > state.width + 40 || this.y < -260 || this.y > state.height + 90) {
      this.dead = true;
      return;
    }

    for (const zombie of state.zombies) {
      if (zombie.dead) continue;
      if (distance(this.x, this.y, zombie.x, zombie.y) < this.radius + zombie.radius * 0.95) {
        zombie.takeDamage(this.damage);
        this.dead = true;
        playSound('hit');
        break;
      }
    }
  }

  draw() {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, speed = 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = (80 + Math.random() * 260) * speed;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * velocity;
    this.vy = Math.sin(angle) * velocity;
    this.life = 0.45 + Math.random() * 0.55;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 4;
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.97;
    this.vy *= 0.97;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingText {
  constructor(text, x, y, color) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.1;
    this.maxLife = 1.1;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 42 * dt;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

function initRain() {
  state.rain = [];
  for (let i = 0; i < 95; i += 1) {
    state.rain.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      speed: 380 + Math.random() * 340,
      length: 10 + Math.random() * 22,
      alpha: 0.12 + Math.random() * 0.22
    });
  }
}

function resizeCanvas() {
  const rect = ui.canvas.getBoundingClientRect();
  state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  state.width = Math.floor(rect.width * state.dpr);
  state.height = Math.floor(rect.height * state.dpr);
  ui.canvas.width = state.width;
  ui.canvas.height = state.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (state.player) {
    state.player.y = getBarricadeY() - 68 * state.dpr;
    state.player.x = clamp(state.player.x, 80, state.width - 80);
  }
  initRain();
}

function startGame(event) {
  event.preventDefault();
  const cleanedName = sanitizeName(ui.playerName.value.trim());

  // Hata yönetimi: boş veya çok kısa kullanıcı adı engellenir.
  if (cleanedName.length < 2) {
    ui.formError.textContent = 'Lütfen en az 2 karakterlik bir oyuncu adı gir.';
    showToast('Oyuncu adı eksik. Oyun başlatılamadı.');
    return;
  }

  ensureAudio();
  playSound('start');
  startBackgroundMusic();
  resetGame(cleanedName, ui.difficultySelect.value, ui.colorSelect.value);
  ui.startOverlay.classList.remove('active');
  ui.endOverlay.classList.remove('active');
  showToast(`${cleanedName}, barikatı savun!`);
}

function resetGame(name, difficultyKey, color) {
  resizeCanvas();
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.playerName = name;
  state.playerColor = color;
  state.difficulty = DIFFICULTY[difficultyKey] || DIFFICULTY.normal;
  state.score = 0;
  state.health = 100;
  state.wave = 1;
  state.weaponLevel = 1;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.timeLeft = 0;
  state.elapsed = 0;
  state.spawnTimer = 0;
  state.spawnInterval = getSpawnInterval();
  state.quizCooldown = getQuizInterval();
  state.quizActive = false;
  state.quizLocked = false;
  state.quizRemaining = 0;
  state.currentQuestion = null;
  state.questionIndex = 0;
  state.questionDeck = buildQuestionDeck();
  state.lastQuestionId = null;
  state.quizThreat = 0;
  state.screenShake = 0;
  state.autoFireTimer = 0;
  state.lastFrame = performance.now();
  state.player = new Player();
  state.zombies = [];
  state.bullets = [];
  state.particles = [];
  state.floatingTexts = [];
  state.missedQuestions = [];
  state.questionHistory = [];
  initRain();
  spawnOpeningHorde();
  updateHud();
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!state.running) return;

  const dt = Math.min(0.033, (timestamp - state.lastFrame) / 1000 || 0);
  state.lastFrame = timestamp;

  if (!state.paused && !state.gameOver) {
    update(dt);
  }
  draw();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Quiz ekrandayken savaş alanı tamamen donar: süre, zombiler, mermiler ve dalga ilerlemez.
  if (state.quizActive) {
    updateQuiz(dt);
    updateHud();
    return;
  }

  state.elapsed += dt;
  // Süre artık kazanma/kaybetme koşulu değildir. Oyun barikat canı bitene kadar sonsuz modda devam eder.
  state.timeLeft = state.elapsed;
  state.wave = Math.max(1, Math.floor(state.elapsed / 18) + 1);
  state.spawnInterval = getSpawnInterval();
  state.screenShake = Math.max(0, state.screenShake - dt * 22);

  state.player.update(dt);
  updateSpawning(dt);
  updateAutoFire(dt);
  updateQuiz(dt);
  updateObjects(dt);
  updateRain(dt);

  updateHud();
}



function getBarricadeY() {
  return state.height - BARRICADE_OFFSET * state.dpr;
}

function getSurvivalPressure() {
  // Dakika bazlı sonsuz zorluk eğrisi. Kolay yavaş, Normal belirgin, Zor hızlı tırmanır.
  const perMinute = state.difficulty.endlessRamp || 0.12;
  const maxThreat = state.difficulty.maxSurvivalThreat || 0.8;
  return Math.min(maxThreat, (state.elapsed / 60) * perMinute);
}

function getSpawnInterval() {
  const wavePressure = Math.max(0, state.wave - 1) * 0.046;
  const threatPressure = state.quizThreat * 0.48;
  const survivalPressure = getSurvivalPressure() * 0.26;
  const base = Math.max(0.58, 1.30 - wavePressure - threatPressure - survivalPressure) * state.difficulty.spawn;
  return Math.max(state.difficulty.spawnFloor || 0.5, base);
}

function spawnOpeningHorde() {
  const count = state.difficulty.opening || 3;
  const margin = 130;
  const span = Math.max(1, state.width - margin * 2);
  for (let i = 0; i < count; i += 1) {
    const x = margin + (span * (i + 0.5)) / count + (Math.random() - 0.5) * 20;
    const typePool = state.difficulty.label === 'Zor'
      ? ['normal', 'normal', 'runner']
      : ['normal', 'normal', 'normal', 'runner'];
    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const zombie = new Zombie(type, x);
    zombie.y = -190 - i * 48 - Math.random() * 90;
    zombie.hp *= state.difficulty.label === 'Zor' ? 0.96 : 0.88;
    zombie.speed *= 0.86;
    state.zombies.push(zombie);
  }
  state.spawnTimer = state.spawnInterval * 1.35;
}

function updateSpawning(dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnZombie();
    state.spawnTimer = state.spawnInterval * (0.9 + Math.random() * 0.55);
  }
}

function spawnZombie() {
  const margin = 80;
  const laneCount = 8;
  const laneWidth = (state.width - margin * 2) / (laneCount - 1);
  const lane = margin + Math.floor(Math.random() * laneCount) * laneWidth + (Math.random() - 0.5) * 24;
  state.zombies.push(new Zombie(chooseZombieType(), lane));
}

function chooseZombieType() {
  const roll = Math.random();
  const pressure = getSurvivalPressure();

  if (state.wave >= 7 && roll > 0.84 - pressure * 0.06) return 'brute';
  if (state.wave >= 6 && roll > 0.10 && roll < 0.22 + pressure * 0.04) return 'exploder';
  if (state.wave >= 5 && roll > 0.70 && roll < 0.84 + pressure * 0.04) return 'hunter';
  if (state.wave >= 5 && roll > 0.24 && roll < 0.39 + pressure * 0.03) return 'spitter';
  if (state.wave >= 4 && roll > 0.57 && roll < 0.70 + pressure * 0.03) return 'crawler';
  if (state.wave >= 3 && roll > 0.42 && roll < 0.57 + pressure * 0.03) return 'toxic';
  if (state.wave >= 2 && roll < 0.16 + pressure * 0.04) return 'tank';
  if (state.wave >= 1 && roll > 0.76 - pressure * 0.06) return 'runner';
  return 'normal';
}

function updateAutoFire(dt) {
  state.autoFireTimer -= dt;
  const spreadCount = state.weaponLevel >= 8 ? 3 : state.weaponLevel >= 4 ? 2 : 1;
  const baseInterval = 0.56 - Math.min(state.weaponLevel, 9) * 0.034;
  const fireInterval = Math.max(
    state.difficulty.minFire || 0.20,
    baseInterval + (state.difficulty.fireSlow || 0) + Math.max(0, spreadCount - 1) * (state.difficulty.multiShotDelay || 0.025)
  );
  if (state.autoFireTimer > 0) return;

  const target = findNearestZombie();
  if (!target) return;

  const muzzleY = state.player.y - 16;
  const diffDamage = state.difficulty.bulletDamageScale || 1;
  const shotDamageScale = spreadCount === 1 ? 1 : spreadCount === 2 ? 0.54 : 0.38;
  const damageScale = diffDamage * shotDamageScale;

  if (spreadCount === 1) {
    state.bullets.push(new Bullet(state.player.x + 54, muzzleY, target, state.weaponLevel, 0, damageScale));
  } else if (spreadCount === 2) {
    // Çift mermi artık toplamda yaklaşık %24 bonus verir; eskisi gibi hasarı ikiye katlayıp Zor modu kırmaz.
    state.bullets.push(new Bullet(state.player.x + 42, muzzleY - 4, target, state.weaponLevel, 0, damageScale));
    state.bullets.push(new Bullet(state.player.x + 62, muzzleY + 4, target, state.weaponLevel, 0, damageScale));
  } else {
    // Üçlü mermi geniş alan kontrolü sağlar ama mermi başı hasar düşüktür; sonsuz mod dengesi korunur.
    state.bullets.push(new Bullet(state.player.x + 42, muzzleY - 5, target, state.weaponLevel, 0, damageScale));
    state.bullets.push(new Bullet(state.player.x + 54, muzzleY, target, state.weaponLevel, 0, damageScale));
    state.bullets.push(new Bullet(state.player.x + 66, muzzleY + 5, target, state.weaponLevel, 0, damageScale));
  }

  createBurst(state.player.x + 67, state.player.y - 16, state.weaponLevel >= 5 ? '#ffd166' : '#00f5ff', 5, 0.55);
  playSound('shoot');
  state.autoFireTimer = fireInterval;
}

function findNearestZombie() {
  let best = null;
  let bestDistance = Infinity;
  for (const zombie of state.zombies) {
    if (zombie.dead || zombie.y < VISIBLE_TARGET_Y * state.dpr) continue;
    const d = distance(state.player.x, state.player.y, zombie.x, zombie.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = zombie;
    }
  }
  return best;
}

function updateQuiz(dt) {
  if (state.quizActive) {
    if (state.quizLocked) return;
    state.quizRemaining -= dt;
    ui.quizTimer.textContent = Math.ceil(state.quizRemaining).toString();
    if (state.quizRemaining <= 0) {
      resolveQuiz(false, true);
    }
    return;
  }

  state.quizCooldown -= dt;
  if (state.quizCooldown <= 0) {
    openQuiz();
  }
}

function buildQuestionDeck() {
  const indices = QUESTIONS.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function getNextQuestion() {
  if (!state.questionDeck.length) {
    state.questionDeck = buildQuestionDeck();
    // Yeni tur başlarken önceki turun son sorusu tekrar en başa gelmesin.
    if (state.lastQuestionId !== null && state.questionDeck[0] === state.lastQuestionId && state.questionDeck.length > 1) {
      const swapIndex = 1 + Math.floor(Math.random() * (state.questionDeck.length - 1));
      [state.questionDeck[0], state.questionDeck[swapIndex]] = [state.questionDeck[swapIndex], state.questionDeck[0]];
    }
  }
  const questionId = state.questionDeck.shift();
  state.lastQuestionId = questionId;
  state.questionIndex += 1;
  return QUESTIONS[questionId];
}

function applyQuizThreat() {
  const increase = state.difficulty.quizThreat || 0.02;
  state.quizThreat = Math.min(state.difficulty.maxThreat || 0.25, state.quizThreat + increase);
  const hpBoost = 1 + increase * 0.55;
  const speedBoost = 1 + increase * 0.35;
  for (const zombie of state.zombies) {
    if (zombie.dead) continue;
    zombie.maxHp *= hpBoost;
    zombie.hp = Math.min(zombie.maxHp, zombie.hp * hpBoost + 2);
    zombie.speed *= speedBoost;
  }
  state.spawnInterval = getSpawnInterval();
  addFloatingText('TEHDİT ARTTI', state.width * 0.5, state.height * 0.32, '#ffd166');
}

function openQuiz() {
  state.quizActive = true;
  state.quizLocked = false;
  state.pointerActive = false;
  state.quizRemaining = QUIZ_ANSWER_TIME;
  state.currentQuestion = getNextQuestion();
  applyQuizThreat();

  ui.questionCategory.textContent = `${state.currentQuestion.category} • Savaş Donduruldu`;
  ui.questionText.textContent = state.currentQuestion.text;
  ui.quizTimer.textContent = Math.ceil(state.quizRemaining).toString();
  ui.answerButtons.innerHTML = '';

  const shuffled = shuffleAnswers(state.currentQuestion);
  shuffled.forEach((answer, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span>${escapeHtml(answer.text)}`;
    button.dataset.answerText = answer.text;
    button.addEventListener('click', () => resolveQuiz(answer.correct, false, button));
    ui.answerButtons.appendChild(button);
  });

  ui.quizOverlay.classList.add('active');
  showToast(`Quiz geldi: savaş donduruldu, ${state.difficulty.label} tehdidi yükseldi.`);
  playSound('quiz');
}

function getWeaponUpgradeGain() {
  // İlk doğru cevaplar oyuncuya nefes aldırır; sonraki seviyeler kontrollü yükselir.
  // Böylece silah gelişimi hissedilir olur ama 2'li/3'lü mermi oyunu kırmaz.
  if (state.weaponLevel < 3) return 2;
  if (state.weaponLevel < 5 && state.combo >= 2) return 2;
  if (state.combo > 0 && state.combo % 4 === 0) return 2;
  return 1;
}

function healBarrierOnCorrect() {
  // Doğru cevap oyuncuyu ödüllendirir ama barikatı sınırsızca doldurup oyunu bozmaz.
  const missingHealth = Math.max(0, 100 - state.health);
  if (missingHealth <= 0) return 0;
  const baseHeal = state.difficulty.healOnCorrect || 3;
  const comboBonus = Math.min(1.6, state.combo * 0.22);
  const healAmount = Math.min(missingHealth, baseHeal + comboBonus);
  state.health = Math.min(100, state.health + healAmount);
  return healAmount;
}

function resolveQuiz(isCorrect, timeout = false, clickedButton = null) {
  if (!state.quizActive || state.quizLocked) return;
  state.quizLocked = true;

  const correctText = state.currentQuestion.answers[state.currentQuestion.correct];
  const selectedText = timeout
    ? 'Cevap verilmedi'
    : (clickedButton ? clickedButton.dataset.answerText : 'Bilinmiyor');
  const resultLabel = isCorrect ? 'Doğru' : (timeout ? 'Süre doldu' : 'Yanlış');

  // Her cevaplanan soru burada kaydedilir. Oyun sonundaki analiz sadece yanlışları değil,
  // doğru/yanlış/süre doldu dahil tüm quiz geçmişini gösterir.
  state.questionHistory.push({
    number: state.questionHistory.length + 1,
    category: state.currentQuestion.category,
    question: state.currentQuestion.text,
    selected: selectedText,
    correct: correctText,
    result: resultLabel,
    remaining: Math.max(0, Math.ceil(state.quizRemaining)),
    weaponAfter: state.weaponLevel
  });

  const buttons = Array.from(ui.answerButtons.querySelectorAll('button'));
  buttons.forEach((button) => {
    button.disabled = true;
    if (button.dataset.answerText === correctText) {
      button.classList.add('correct');
    }
  });
  if (clickedButton && !isCorrect) clickedButton.classList.add('wrong');

  if (isCorrect) {
    state.correctAnswers += 1;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    const upgradeGain = getWeaponUpgradeGain();
    state.weaponLevel = Math.min(12, state.weaponLevel + upgradeGain);
    state.questionHistory[state.questionHistory.length - 1].weaponAfter = state.weaponLevel;
    state.score += 85 + state.weaponLevel * 20 + Math.floor(state.quizRemaining) * 5 + state.combo * 12 + upgradeGain * 16;
    state.quizCooldown = getQuizInterval();
    const healed = healBarrierOnCorrect();
    repelZombies();
    const healText = healed > 0 ? ` • BARİKAT +${healed.toFixed(1)}` : '';
    addFloatingText(`DOĞRU! KOMBO x${state.combo} • SİLAH +${upgradeGain}${healText}`, state.width * 0.5, state.height * 0.44, '#b6ff00');
    showToast(healed > 0
      ? `Doğru cevap! Silah Lv.${state.weaponLevel}, barikat +${healed.toFixed(1)}.`
      : `Doğru cevap! Silah seviyesi ${state.weaponLevel}, kombo x${state.combo}.`);
    playSound('correct');
  } else {
    state.wrongAnswers += 1;
    state.missedQuestions.push({
      question: state.currentQuestion.text,
      selected: selectedText,
      correct: correctText,
      reason: resultLabel
    });
    state.combo = 0;
    state.score = Math.max(0, state.score - 35);
    state.quizCooldown = getQuizInterval();
    rushZombies();
    spawnPenaltyHorde(timeout);
    const text = timeout ? 'Süre doldu! Dışarıdan zombi takviyesi geliyor.' : 'Yanlış cevap! Dışarıdan zombi takviyesi geliyor.';
    addFloatingText(text.toUpperCase(), state.width * 0.5, state.height * 0.44, '#ff3f6c');
    showToast(text);
    playSound(timeout ? 'timeout' : 'wrong');
  }

  setTimeout(() => {
    ui.quizOverlay.classList.remove('active');
    state.quizActive = false;
    state.quizLocked = false;
    state.currentQuestion = null;
  }, 720);
}

function repelZombies() {
  state.screenShake = 5;
  const repelPower = state.difficulty.repel || 1;
  createBurst(state.width * 0.5, state.height * 0.45, '#b6ff00', 60, 1.3);
  for (const zombie of state.zombies) {
    if (zombie.dead) continue;
    zombie.y -= (44 + state.weaponLevel * 8) * repelPower;
    zombie.takeDamage((14 + state.weaponLevel * 6) * repelPower);
  }
}

function rushZombies() {
  state.screenShake = 8;
  const rushPower = state.difficulty.rush || 0.8;
  for (const zombie of state.zombies) {
    if (zombie.dead) continue;
    zombie.y += (24 + state.wave * 2.2) * rushPower;
    zombie.speed *= 1 + 0.030 * rushPower;
  }
  createBurst(state.width * 0.5, state.height * 0.35, '#ff3f6c', 42, 1.2);
}

function spawnPenaltyHorde(timeout = false) {
  const label = state.difficulty.label;
  const baseCount = label === 'Kolay' ? 1 : label === 'Normal' ? 2 : 2;
  const extra = timeout ? 1 : 0;
  const pressureExtra = getSurvivalPressure() > 0.75 ? 1 : 0;
  const hardChance = label === 'Zor' && Math.random() < 0.42 ? 1 : 0;
  const count = Math.min(5, baseCount + extra + pressureExtra + hardChance);
  const margin = 95;
  const span = Math.max(1, state.width - margin * 2);

  for (let i = 0; i < count; i += 1) {
    const x = margin + Math.random() * span;
    const zombie = new Zombie(chooseZombieType(), x);
    // Yanlış cevap cezası ekranda birden belirmez; zombiler görüş alanının üstünden yürüyerek gelir.
    zombie.y = -300 - i * 64 - Math.random() * 180;
    zombie.speed *= label === 'Zor' ? 0.94 : label === 'Normal' ? 0.88 : 0.82;
    zombie.hp *= label === 'Zor' ? 0.92 : 0.84;
    state.zombies.push(zombie);
  }

  addFloatingText(`+${count} TAKVİYE ZOMBİ`, state.width * 0.5, state.height * 0.37, '#ffb347');
}

function updateObjects(dt) {
  for (const zombie of state.zombies) zombie.update(dt);
  for (const bullet of state.bullets) bullet.update(dt);
  for (const particle of state.particles) particle.update(dt);
  for (const text of state.floatingTexts) text.update(dt);

  state.zombies = state.zombies.filter((zombie) => !zombie.dead && zombie.y < state.height + 80);
  state.bullets = state.bullets.filter((bullet) => !bullet.dead);
  state.particles = state.particles.filter((particle) => particle.life > 0);
  state.floatingTexts = state.floatingTexts.filter((text) => text.life > 0);
}

function updateRain(dt) {
  for (const drop of state.rain) {
    drop.y += drop.speed * dt;
    drop.x -= drop.speed * 0.18 * dt;
    if (drop.y > state.height + 40) {
      drop.y = -40;
      drop.x = Math.random() * state.width;
    }
    if (drop.x < -40) drop.x = state.width + 40;
  }
}

function draw() {
  ctx.save();
  const shakeX = (Math.random() - 0.5) * state.screenShake;
  const shakeY = (Math.random() - 0.5) * state.screenShake;
  ctx.translate(shakeX, shakeY);

  drawBackground();
  drawRain();
  drawRoadAndBarricade();

  for (const bullet of state.bullets) bullet.draw();
  for (const zombie of state.zombies) zombie.draw();
  if (state.player) state.player.draw();
  for (const particle of state.particles) particle.draw();
  for (const text of state.floatingTexts) text.draw();

  drawVignette();
  if (state.paused && !state.gameOver) drawPauseScreen();
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, '#02040f');
  gradient.addColorStop(0.38, '#071026');
  gradient.addColorStop(0.72, '#100914');
  gradient.addColorStop(1, '#050307');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  // Ay ve bulutlu sis: sahneyi daha sinematik gösterir.
  ctx.save();
  const moonX = state.width * 0.81;
  const moonY = state.height * 0.14;
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = '#e8fbff';
  ctx.shadowBlur = 48 * state.dpr;
  ctx.shadowColor = '#71f7ff';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 38 * state.dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(moonX - 15 * state.dpr, moonY - 8 * state.dpr, 34 * state.dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Uzak kan kırmızısı bulut parlaması.
  ctx.save();
  const skyGlow = ctx.createRadialGradient(state.width * 0.18, state.height * 0.22, 0, state.width * 0.18, state.height * 0.22, state.width * 0.55);
  skyGlow.addColorStop(0, 'rgba(255,63,108,0.18)');
  skyGlow.addColorStop(0.45, 'rgba(0,245,255,0.07)');
  skyGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();

  // Parallax şehir: sabit pseudo-random yükseklikler, her frame titreme yapmaz.
  const horizon = state.height * 0.34;
  for (let layer = 0; layer < 3; layer += 1) {
    ctx.save();
    ctx.globalAlpha = [0.24, 0.40, 0.62][layer];
    ctx.fillStyle = ['#16223a', '#0d182d', '#07101d'][layer];
    const block = [92, 70, 52][layer] * state.dpr;
    const offset = layer * 19 * state.dpr;
    for (let x = -block; x < state.width + block; x += block) {
      const seed = Math.abs(Math.sin((x + 173 * layer) * 0.013));
      const h = (68 + seed * 112 + layer * 18) * state.dpr;
      const w = block * (0.58 + seed * 0.24);
      ctx.fillRect(x + offset, horizon - h + layer * 26 * state.dpr, w, h);

      ctx.fillStyle = layer === 2 ? 'rgba(0,245,255,0.20)' : 'rgba(255,209,102,0.12)';
      for (let wy = horizon - h + 16 * state.dpr; wy < horizon + layer * 26 * state.dpr - 10; wy += 22 * state.dpr) {
        if (Math.sin(x * 0.03 + wy * 0.04 + layer) > 0.2) {
          ctx.fillRect(x + offset + w * 0.22, wy, 5 * state.dpr, 9 * state.dpr);
          ctx.fillRect(x + offset + w * 0.58, wy + 3 * state.dpr, 5 * state.dpr, 9 * state.dpr);
        }
      }
      ctx.fillStyle = ['#16223a', '#0d182d', '#07101d'][layer];
    }
    ctx.restore();
  }

  // Uzak tel örgü ve elektrik direkleri.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = '#9defff';
  ctx.lineWidth = 1.4 * state.dpr;
  const fenceY = state.height * 0.40;
  for (let x = -40 * state.dpr; x < state.width + 60 * state.dpr; x += 46 * state.dpr) {
    ctx.beginPath();
    ctx.moveTo(x, fenceY - 18 * state.dpr);
    ctx.lineTo(x + 34 * state.dpr, fenceY + 16 * state.dpr);
    ctx.moveTo(x + 34 * state.dpr, fenceY - 18 * state.dpr);
    ctx.lineTo(x, fenceY + 16 * state.dpr);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,63,108,0.28)';
  ctx.beginPath();
  ctx.moveTo(0, fenceY);
  ctx.lineTo(state.width, fenceY - 8 * state.dpr);
  ctx.stroke();
  ctx.restore();

  // Sis katmanı.
  ctx.save();
  const fog = ctx.createRadialGradient(state.width * 0.5, state.height * 0.47, 0, state.width * 0.5, state.height * 0.47, state.width * 0.76);
  fog.addColorStop(0, 'rgba(0,245,255,0.13)');
  fog.addColorStop(0.48, 'rgba(255,63,108,0.06)');
  fog.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function drawRoadAndBarricade() {
  const roadTop = state.height * ROAD_TOP_RATIO;
  const roadBottom = state.height;
  const leftTop = state.width * 0.29;
  const rightTop = state.width * 0.71;
  const leftBottom = -state.width * 0.15;
  const rightBottom = state.width * 1.15;
  const barricadeY = getBarricadeY();

  ctx.save();

  // Islak asfalt yolu.
  const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  roadGrad.addColorStop(0, '#182033');
  roadGrad.addColorStop(0.62, '#090d15');
  roadGrad.addColorStop(1, '#030407');
  ctx.fillStyle = roadGrad;
  ctx.beginPath();
  ctx.moveTo(leftTop, roadTop);
  ctx.lineTo(rightTop, roadTop);
  ctx.lineTo(rightBottom, roadBottom);
  ctx.lineTo(leftBottom, roadBottom);
  ctx.closePath();
  ctx.fill();

  // Yol üzerinde parlama ve çatlaklar.
  ctx.save();
  ctx.globalAlpha = 0.18;
  const shine = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  shine.addColorStop(0, 'rgba(255,255,255,0.08)');
  shine.addColorStop(0.5, 'rgba(0,245,255,0.14)');
  shine.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.moveTo(state.width * 0.45, roadTop);
  ctx.lineTo(state.width * 0.55, roadTop);
  ctx.lineTo(state.width * 0.78, roadBottom);
  ctx.lineTo(state.width * 0.22, roadBottom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(0,245,255,0.58)';
  ctx.lineWidth = 4 * state.dpr;
  ctx.shadowBlur = 14 * state.dpr;
  ctx.shadowColor = '#00f5ff';
  ctx.beginPath();
  ctx.moveTo(leftTop, roadTop);
  ctx.lineTo(leftBottom, roadBottom);
  ctx.moveTo(rightTop, roadTop);
  ctx.lineTo(rightBottom, roadBottom);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Perspektif şeritler.
  ctx.setLineDash([20 * state.dpr, 24 * state.dpr]);
  ctx.strokeStyle = 'rgba(236,247,255,0.18)';
  ctx.lineWidth = 2 * state.dpr;
  for (let i = 1; i <= 4; i += 1) {
    const t = i / 5;
    const xTop = lerp(leftTop, rightTop, t);
    const xBottom = lerp(leftBottom, rightBottom, t);
    ctx.beginPath();
    ctx.moveTo(xTop, roadTop);
    ctx.lineTo(xBottom, roadBottom);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Çatlak ve moloz detayları.
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2 * state.dpr;
  for (let i = 0; i < 16; i += 1) {
    const t = i / 15;
    const y = lerp(roadTop + 26 * state.dpr, barricadeY - 18 * state.dpr, t);
    const center = state.width * (0.32 + ((i * 37) % 42) / 100);
    ctx.beginPath();
    ctx.moveTo(center, y);
    ctx.lineTo(center + Math.sin(i * 2.1) * 32 * state.dpr, y + 18 * state.dpr);
    ctx.lineTo(center + Math.cos(i * 1.7) * 46 * state.dpr, y + 32 * state.dpr);
    ctx.stroke();
  }

  // Barikat, health barın hemen üstüne gerçek Canvas koordinatıyla çekildi; aradaki siyah boşluk artık oyun yolu olarak kullanılır.
  ctx.save();
  const baseGrad = ctx.createLinearGradient(0, barricadeY - 36 * state.dpr, 0, state.height);
  baseGrad.addColorStop(0, 'rgba(4,7,13,0.25)');
  baseGrad.addColorStop(1, 'rgba(0,0,0,0.86)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, barricadeY - 34 * state.dpr, state.width, state.height - barricadeY + 34 * state.dpr);

  // Metal taban.
  ctx.fillStyle = 'rgba(7,10,18,0.92)';
  roundRect(state.width * 0.04, barricadeY - 18 * state.dpr, state.width * 0.92, 36 * state.dpr, 10 * state.dpr);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,245,255,0.38)';
  ctx.lineWidth = 2 * state.dpr;
  ctx.stroke();

  // Sağlamlaştırılmış neon barikat panelleri.
  const panelW = 96 * state.dpr;
  for (let x = -panelW * 0.5; x < state.width + panelW; x += panelW * 0.78) {
    ctx.save();
    ctx.translate(x, barricadeY - 6 * state.dpr);
    ctx.rotate(-0.055);
    const grad = ctx.createLinearGradient(0, -18 * state.dpr, panelW, 18 * state.dpr);
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(0.48, '#ff3f6c');
    grad.addColorStop(1, '#00f5ff');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 12 * state.dpr;
    ctx.shadowColor = '#ff3f6c';
    roundRect(0, -16 * state.dpr, panelW, 32 * state.dpr, 7 * state.dpr);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(4,7,12,0.72)';
    ctx.fillRect(12 * state.dpr, -16 * state.dpr, 10 * state.dpr, 32 * state.dpr);
    ctx.fillRect(52 * state.dpr, -16 * state.dpr, 10 * state.dpr, 32 * state.dpr);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.3 * state.dpr;
    ctx.strokeRect(2 * state.dpr, -14 * state.dpr, panelW - 4 * state.dpr, 28 * state.dpr);
    ctx.restore();
  }

  // Barikat üstü elektrik hattı.
  ctx.strokeStyle = 'rgba(182,255,0,0.72)';
  ctx.lineWidth = 2.6 * state.dpr;
  ctx.shadowBlur = 18 * state.dpr;
  ctx.shadowColor = '#b6ff00';
  ctx.beginPath();
  for (let x = 0; x <= state.width; x += 30 * state.dpr) {
    const y = barricadeY - 38 * state.dpr + Math.sin(x * 0.05 + state.elapsed * 9) * 3 * state.dpr;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Can göstergesinin görsel karşılığı olarak barikat üzerinde uyarı ışıkları.
  const lamps = 10;
  for (let i = 0; i < lamps; i += 1) {
    const lit = i / lamps < state.health / 100;
    const x = state.width * 0.18 + i * state.width * 0.064;
    ctx.fillStyle = lit ? '#b6ff00' : 'rgba(255,63,108,0.45)';
    ctx.shadowBlur = lit ? 14 * state.dpr : 6 * state.dpr;
    ctx.shadowColor = lit ? '#b6ff00' : '#ff3f6c';
    ctx.beginPath();
    ctx.arc(x, barricadeY - 25 * state.dpr, 4.2 * state.dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawRain() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const drop of state.rain) {
    ctx.globalAlpha = drop.alpha;
    ctx.strokeStyle = '#b7f7ff';
    ctx.lineWidth = 1.2 * state.dpr;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.length * 0.28, drop.y + drop.length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVignette() {
  const v = ctx.createRadialGradient(state.width * 0.5, state.height * 0.48, state.width * 0.2, state.width * 0.5, state.height * 0.48, state.width * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.56)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawPauseScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ecf7ff';
  ctx.font = `900 ${48 * state.dpr}px system-ui, sans-serif`;
  ctx.fillText('DURAKLATILDI', state.width / 2, state.height / 2);
  ctx.font = `500 ${20 * state.dpr}px system-ui, sans-serif`;
  ctx.fillText('Devam etmek için P tuşuna bas.', state.width / 2, state.height / 2 + 42 * state.dpr);
  ctx.restore();
}

function updateHud() {
  ui.hudName.textContent = state.playerName;
  ui.scoreText.textContent = Math.floor(state.score).toString();
  ui.bestText.textContent = state.best.toString();
  ui.waveText.textContent = state.wave.toString();
  ui.weaponText.textContent = `Lv. ${state.weaponLevel}`;
  ui.timerText.textContent = `%${Math.min(999, Math.floor((state.quizThreat + getSurvivalPressure()) * 100))}`;
  ui.healthText.textContent = Math.max(0, Math.ceil(state.health)).toString();
  ui.healthFill.style.width = `${clamp(state.health, 0, 100)}%`;
}

function damageBase(amount) {
  state.health = Math.max(0, state.health - amount);
  state.screenShake = 12;
  if (state.health <= 0) {
    endGame(false);
  }
}

function endGame(won) {
  if (state.gameOver) return;
  state.gameOver = true;
  state.running = false;
  state.quizActive = false;
  ui.quizOverlay.classList.remove('active');

  const final = Math.floor(state.score + (won ? state.health * 8 : 0));
  state.score = final;
  if (final > state.best) {
    state.best = final;
    localStorage.setItem(STORAGE_KEY, String(final));
  }

  ui.endTitle.textContent = won ? 'Barikat Savunuldu!' : 'Barikat Düştü!';
  ui.endSummary.textContent = won
    ? `${state.playerName}, saldırıyı başarıyla püskürttün.`
    : `${state.playerName}, oyun süreyle bitmez; barikat canı sıfırlandığı için savunma sona erdi.`;
  ui.finalScore.textContent = final.toString();
  ui.finalWave.textContent = state.wave.toString();
  ui.finalWeapon.textContent = state.weaponLevel.toString();
  ui.finalQuiz.textContent = `${state.correctAnswers} / ${state.wrongAnswers} • Kombo ${state.maxCombo}`;
  renderReview();
  ui.endOverlay.classList.add('active');
  playSound(won ? 'win' : 'lose');
  stopBackgroundMusic();
}


function renderReview() {
  if (!ui.reviewBox) return;

  if (!state.questionHistory.length) {
    ui.reviewBox.innerHTML = '<h3>Soru Analizi</h3><p>Bu oyunda quiz sorusu cevaplanmadan barikat düştü.</p>';
    return;
  }

  const correctCount = state.questionHistory.filter((item) => item.result === 'Doğru').length;
  const wrongCount = state.questionHistory.filter((item) => item.result === 'Yanlış').length;
  const timeoutCount = state.questionHistory.filter((item) => item.result === 'Süre doldu').length;

  const items = state.questionHistory.map((item) => {
    const statusClass = item.result === 'Doğru' ? 'ok' : (item.result === 'Yanlış' ? 'bad' : 'timeout');
    const selectedLine = item.result === 'Doğru'
      ? `Cevabın: ${escapeHtml(item.selected)}`
      : `Cevabın: ${escapeHtml(item.selected)} • Doğru: ${escapeHtml(item.correct)}`;

    return `
      <li class="${statusClass}">
        <strong>${item.number}. ${escapeHtml(item.result)} • ${escapeHtml(item.category)}</strong>
        <span>${escapeHtml(item.question)}</span>
        <em>${selectedLine}</em>
      </li>`;
  }).join('');

  ui.reviewBox.innerHTML = `
    <h3>Soru Analizi</h3>
    <p>Tüm cevap geçmişi: ${correctCount} doğru, ${wrongCount} yanlış, ${timeoutCount} süre doldu.</p>
    <ol>${items}</ol>`;
}

function createBurst(x, y, color, count, speed = 1) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push(new Particle(x, y, color, speed));
  }
}

function addFloatingText(text, x, y, color) {
  state.floatingTexts.push(new FloatingText(text, x, y, color));
}

function shuffleAnswers(question) {
  return question.answers
    .map((text, index) => ({ text, correct: index === question.correct }))
    .sort(() => Math.random() - 0.5);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeName(name) {
  return name.replace(/[<>]/g, '').replace(/\s+/g, ' ').slice(0, 16);
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => ui.toast.classList.remove('show'), 2500);
}

function ensureAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }

  // Bazı tarayıcılar sesi kullanıcı etkileşimine kadar askıya alır; Başlat tuşu bu kilidi açar.
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume().catch(() => {});
  }

  state.audioReady = true;
}

function playSound(type) {
  if (!state.audioContext) return;
  const ac = state.audioContext;
  const now = ac.currentTime;

  const profiles = {
    start: { notes: [260, 390, 520], duration: 0.38, wave: 'triangle', volume: 0.075, gap: 0.055 },
    shoot: { notes: [560], duration: 0.035, wave: 'square', volume: 0.024, end: 0.55 },
    hit: { notes: [230, 145], duration: 0.055, wave: 'sawtooth', volume: 0.04, gap: 0.012, end: 0.48 },
    kill: { notes: [120, 88, 62], duration: 0.14, wave: 'triangle', volume: 0.058, gap: 0.02, end: 0.62 },
    hurt: { notes: [84, 52], duration: 0.24, wave: 'square', volume: 0.082, gap: 0.03, end: 0.38 },
    quiz: { notes: [360, 480], duration: 0.14, wave: 'sine', volume: 0.052, gap: 0.04, end: 1.25 },
    correct: { notes: [520, 660, 880], duration: 0.24, wave: 'sine', volume: 0.082, gap: 0.045, end: 1.55 },
    wrong: { notes: [180, 132, 96], duration: 0.24, wave: 'sawtooth', volume: 0.09, gap: 0.035, end: 0.42 },
    timeout: { notes: [420, 210, 70], duration: 0.32, wave: 'triangle', volume: 0.076, gap: 0.055, end: 0.30 },
    win: { notes: [440, 660, 880, 1175], duration: 0.46, wave: 'triangle', volume: 0.088, gap: 0.065, end: 1.35 },
    lose: { notes: [98, 73, 49, 38], duration: 0.62, wave: 'sawtooth', volume: 0.095, gap: 0.055, end: 0.24 },
    musicPulse: { notes: [49, 98], duration: 0.55, wave: 'sine', volume: 0.018, gap: 0.02, end: 0.75 }
  };
  const profile = profiles[type] || profiles.hit;

  profile.notes.forEach((freq, index) => {
    const start = now + index * (profile.gap || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = profile.wave;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, freq * (profile.end || 0.55)), start + profile.duration);
    gain.gain.setValueAtTime(profile.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + profile.duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + profile.duration + 0.025);
  });
}

function startBackgroundMusic() {
  if (!state.audioContext || state.music) return;
  const ac = state.audioContext;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const master = ac.createGain();
  const filter = ac.createBiquadFilter();
  const padA = ac.createOscillator();
  const padB = ac.createOscillator();
  const padGain = ac.createGain();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();

  master.gain.setValueAtTime(0.075, ac.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(920, ac.currentTime);
  filter.Q.setValueAtTime(0.65, ac.currentTime);

  padA.type = 'triangle';
  padB.type = 'sine';
  padA.frequency.setValueAtTime(55, ac.currentTime);
  padB.frequency.setValueAtTime(82.41, ac.currentTime);
  padGain.gain.setValueAtTime(0.018, ac.currentTime);
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.045, ac.currentTime);
  lfoGain.gain.setValueAtTime(120, ac.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  padA.connect(padGain);
  padB.connect(padGain);
  padGain.connect(filter);
  filter.connect(master);
  master.connect(ac.destination);
  padA.start();
  padB.start();
  lfo.start();

  state.music = { master, filter, padA, padB, padGain, lfo, lfoGain, step: 0 };
  state.musicTimer = window.setInterval(playMusicStep, 245);
}

function playMusicStep() {
  if (!state.audioContext || !state.music || state.gameOver) return;
  const ac = state.audioContext;
  const step = state.music.step % 16;
  const when = ac.currentTime + 0.015;
  const master = state.music.master;

  const bass = [55, null, 55, 65.41, null, 73.42, 65.41, null, 49, null, 55, 65.41, null, 82.41, 73.42, null];
  const arp = [146.83, 196, 220, null, 246.94, 220, 196, null, 164.81, 196, 246.94, null, 293.66, 246.94, 220, null];
  const lead = [null, null, 392.00, null, null, 329.63, null, null, null, 349.23, null, null, 440.00, null, null, null];

  if (bass[step]) scheduleMusicTone(bass[step], 0.25, 'sawtooth', 0.052, when, 520);
  if (arp[step] && !state.quizActive) scheduleMusicTone(arp[step], 0.12, 'triangle', 0.026, when, 1450);
  if (lead[step] && !state.quizActive) scheduleMusicTone(lead[step], 0.16, 'sine', 0.018, when, 1800);
  if (step === 0 || step === 8) scheduleMusicTone(43.65, 0.14, 'sine', 0.085, when, 190);
  if (step === 4 || step === 12) scheduleNoiseHit(0.052, 0.090, when, 1300);
  if (step === 2 || step === 6 || step === 10 || step === 14) scheduleNoiseHit(0.018, 0.038, when, 3000);

  // Zorluk arttıkça müzik çok az hızlanmış hissi verir: ekstra metalik vuruşlar eklenir.
  if ((state.difficulty.label === 'Zor' || getSurvivalPressure() > 0.55) && (step === 3 || step === 11)) {
    scheduleMusicTone(329.63, 0.055, 'square', 0.010, when, 2200);
  }

  state.music.step += 1;

  function scheduleMusicTone(freq, duration, wave, volume, start, filterFreq) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const localFilter = ac.createBiquadFilter();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    localFilter.type = 'lowpass';
    localFilter.frequency.setValueAtTime(filterFreq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(localFilter);
    localFilter.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function scheduleNoiseHit(volume, duration, start, highpassFreq) {
    const bufferSize = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    const highpass = ac.createBiquadFilter();
    source.buffer = buffer;
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(highpassFreq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(highpass);
    highpass.connect(gain);
    gain.connect(master);
    source.start(start);
  }
}

function stopBackgroundMusic() {
  if (state.musicTimer) {
    window.clearInterval(state.musicTimer);
    state.musicTimer = null;
  }
  if (!state.music) return;
  const ac = state.audioContext;
  const stopAt = ac ? ac.currentTime + 0.20 : 0;
  try {
    state.music.master.gain.exponentialRampToValueAtTime(0.001, stopAt);
    state.music.padA.stop(stopAt + 0.03);
    state.music.padB.stop(stopAt + 0.03);
    state.music.lfo.stop(stopAt + 0.03);
  } catch (_) {
    // Ses düğümleri zaten durmuş olabilir; oyun akışını etkilemez.
  }
  state.music = null;
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

ui.startForm.addEventListener('submit', startGame);
ui.restartButton.addEventListener('click', () => {
  stopBackgroundMusic();
  ui.endOverlay.classList.remove('active');
  ui.startOverlay.classList.add('active');
});
ui.helpButton.addEventListener('click', () => ui.helpOverlay.classList.add('active'));
ui.closeHelp.addEventListener('click', () => ui.helpOverlay.classList.remove('active'));
ui.helpOverlay.addEventListener('click', (event) => {
  if (event.target === ui.helpOverlay) ui.helpOverlay.classList.remove('active');
});
if (ui.archiveOverlay && ui.closeArchive) {
  if (ui.archiveButton) {
    ui.archiveButton.addEventListener('click', () => ui.archiveOverlay.classList.add('active'));
  }
  if (ui.archiveButtonInline) {
    ui.archiveButtonInline.addEventListener('click', () => ui.archiveOverlay.classList.add('active'));
  }
  ui.closeArchive.addEventListener('click', () => ui.archiveOverlay.classList.remove('active'));
  ui.archiveOverlay.addEventListener('click', (event) => {
    if (event.target === ui.archiveOverlay) ui.archiveOverlay.classList.remove('active');
  });
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
    event.preventDefault();
  }
  state.keys.add(key);
  if (key === 'p' && state.running && !state.gameOver && !state.quizActive) {
    state.paused = !state.paused;
    showToast(state.paused ? 'Oyun duraklatıldı.' : 'Oyun devam ediyor.');
  }
});
window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  state.keys.delete(key);
});

function setPointerPosition(event) {
  const rect = ui.canvas.getBoundingClientRect();
  const ratioX = state.width / rect.width;
  state.pointerX = (event.clientX - rect.left) * ratioX;
}

ui.canvas.addEventListener('pointerdown', (event) => {
  state.pointerActive = true;
  setPointerPosition(event);
  ui.canvas.setPointerCapture?.(event.pointerId);
});

ui.canvas.addEventListener('pointermove', (event) => {
  if (!state.pointerActive) return;
  setPointerPosition(event);
});

ui.canvas.addEventListener('pointerup', () => {
  state.pointerActive = false;
});

ui.canvas.addEventListener('pointercancel', () => {
  state.pointerActive = false;
});

resizeCanvas();
updateHud();
draw();
