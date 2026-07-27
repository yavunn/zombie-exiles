# ☣ Zombie Exiles

Barikatını savun, soruları doğru cevapla, hayatta kal.

**Zombie Exiles**, HTML5 Canvas ve saf JavaScript ile geliştirilmiş bir hayatta kalma + quiz oyunudur. Oyunun ana fikri şudur: **quiz cevapları savaş alanını doğrudan değiştirir.** Doğru cevap silahını güçlendirir ve barikatını onarır; yanlış cevap ekran dışından takviye zombi getirir.

Kütüphane, framework veya hazır görsel kullanılmaz. Karakter, zombiler, barikat, arka plan, mermiler, yağmur ve tüm efektler Canvas üzerinde JavaScript ile çizilir. Ses efektleri ve arka plan müziği Web Audio API ile prosedürel olarak üretilir.

## Nasıl oynanır

1. Oyuncu adı, zorluk ve karakter rengi seçerek başla.
2. Karakter otomatik ateş eder; sen sadece barikat önünde sağa-sola hareket edersin.
3. Belirli aralıklarla quiz sorusu açılır. **Soru ekranı açıkken savaş alanı tamamen donar** — zombiler, mermiler, dalga ilerlemesi ve hareket işlemez.
4. Oyun süreyle bitmez. Barikat sağlığı sıfırlanana kadar sonsuz hayatta kalma modunda devam eder.

### Kontroller

| Tuş | İşlev |
| --- | --- |
| `←` `→` veya `A` `D` | Karakteri hareket ettir |
| `P` | Duraklat / devam ettir |
| Fare / dokunma | Karakteri sürükleyerek hareket ettir |

### Quiz etkisi

| Sonuç | Etki |
| --- | --- |
| **Doğru** | Silah seviyesi ve kombo artar, zombiler geri itilir ve hasar alır, barikat az miktarda onarılır |
| **Yanlış** | Kombo sıfırlanır, zombiler yaklaşır, ekran dışından takviye zombi dalgası gelir |
| **Süre dolar** | Yanlış cevapla aynı ceza uygulanır |

Her quiz geldiğinde zombiler zorluğa göre az miktarda güçlenir. Zamanla zombi canı, hızı ve üretim baskısı her modda kademeli olarak artar.

## Zorluk seviyeleri

| Mod | Quiz aralığı | Karakter |
| --- | --- | --- |
| **Kolay** | 10 sn | Rahat öğrenme modu, düşük tehdit artışı |
| **Normal** | 10 sn | Dengeli hayatta kalma, orta tehdit artışı |
| **Zor** | ~7.2 sn | Sert ama geçilebilir; daha hızlı spawn, yüksek can/hız/hasar |

Her soru için cevap süresi tüm modlarda 10 saniyedir.

## Zombi türleri

Dokuz zombi türü dört gruba ayrılır:

- **Temel sürü** — Yürüyen, Koşucu, Sürüngen
- **Ağır tehditler** — Tank, Zırhlı
- **Özel mutasyonlar** — Toksik, Asitçi
- **Yüksek tehdit** — Avcı, Patlayıcı

Detaylı açıklamalar oyun içindeki **Zombi Arşivi** bölümünde yer alır.

## Özellikler

- 🎯 **211 soru**, 92 kategoride — HTML, CSS, JavaScript, internet temelleri ve web standartları
- 🃏 **Tekrarsız soru destesi** — sorulan soru havuzdan çıkar; tüm havuz bitmeden aynı soru gelmez
- 🔊 **Prosedürel ses** — Web Audio API ile 11 farklı efekt ve katmanlı ritimli arka plan müziği
- 💾 **En yüksek skor kaydı** — `localStorage` ile tarayıcıda saklanır
- 📊 **Soru analizi** — oyun sonunda tüm cevap geçmişi, senin cevabın ve doğru cevapla birlikte listelenir
- 🎨 **Tamamen Canvas çizimi** — dış görsel yok; parçacık, ekran sarsıntısı, yağmur ve neon efektler
- 📱 **Responsive tasarım** — CSS media query ile farklı ekran boyutlarına uyum

## Çalıştırma

Ekstra bir kurulum veya derleme adımı yoktur.

**En basit yol:** `index.html` dosyasını tarayıcıda aç.

**Yerel sunucu ile** (önerilir):

```bash
# Python 3
python -m http.server 8000

# veya Node.js
npx serve
```

Ardından tarayıcıdan `http://localhost:8000` adresini aç.

> **Not:** Tarayıcı politikaları gereği ses, ilk kullanıcı etkileşiminden (oyunu başlatma) sonra devreye girer.

## Proje yapısı

```
zombie-exiles/
├── index.html    # Sayfa iskeleti, HUD, overlay'ler (başlangıç, quiz, sonuç, yardım, arşiv)
├── style.css     # Tüm görsel tasarım, responsive kurallar ve animasyonlar
├── script.js     # Oyun motoru, soru havuzu, çizim, ses sistemi ve durum yönetimi
├── README.md
├── LICENSE
└── .gitignore
```

`script.js` içindeki ana bölümler:

| Bölüm | Açıklama |
| --- | --- |
| `DIFFICULTY` | Tüm zorluk dengesi tek noktada tanımlanır |
| `QUESTIONS` | 211 soruluk havuz |
| `ZOMBIE_TYPES` | Zombi türlerinin can, hız ve davranış değerleri |
| `Player` / `Zombie` / `Bullet` / `Particle` | Oyun nesnesi sınıfları |
| `update()` / `draw()` | Ana oyun döngüsü |
| `openQuiz()` / `resolveQuiz()` | Quiz akışı ve ödül/ceza mantığı |
| `playSound()` / `playMusicStep()` | Web Audio ile prosedürel ses üretimi |

## Kullanılan teknolojiler

- HTML5
- CSS3 (Flexbox, Grid, media query, animasyon)
- Vanilla JavaScript (ES6+)
- HTML Canvas API
- Web Audio API
- localStorage

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
