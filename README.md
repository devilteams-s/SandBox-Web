# ⚗️ SandBox

> Noita ve Powder Game benzeri, tarayıcı tabanlı **hücresel otomat ve piksel fizik motoru**. Sıfır harici kütüphane bağımlılığı ile saf HTML5 Canvas ve modern JavaScript ile inşa edilmiştir.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Python 3](https://img.shields.io/badge/Python-3.x-3776AB?style=flat&logo=python&logoColor=white)

---

## ✨ Özellikler

### 🧪 Elementler & Doğal Reaksiyonlar
- ⏳ **Kum (Sand):** Yerçekimi etkisiyle dökülür, yığılır ve açılı piramitler oluşturur.
- 💧 **Su (Water):** Akışkan sıvı fiziği, yatay yayılma ve yangınları söndürme.
- 🪵 **Odun (Wood):** Katı organik bariyer, ateşe maruz kaldığında yavaşça yanar.
- 🔥 **Ateş (Fire):** Yanıcı maddeleri tutuşturur, duman çıkarır ve oksijensiz sönümlenir.
- 💣 **Barut (Gunpowder):** Ateş veya kıvılcımla temas ettiğinde zincirleme büyük patlamalar yaratır.
- 🧪 **Asit (Acid):** Duvar haricinde temas ettiği tüm elementleri aşındırıp eritir.
- 🌱 **Bitki (Plant):** Su ile temas ettiğinde canlı gibi filizlenir ve yayılır.
- 🧱 **Duvar (Wall):** Yok edilemez, geçirimsiz sınır blokları.
- 🧹 **Silgi (Empty):** İstenen pikselleri boşluğa dönüştürür.

### 🎮 Kontroller & Laboratuvar Araçları
- **Fırça Boyutu:** 1 ile 15 piksel arasında hassas boyutlandırma (Fare tekerleği veya kaydırıcı ile).
- **Simülasyon Kontrolleri:** ⏸️ Duraklat, ⏭️ Adım adım fizik hesaplama ve 🗑️ Tuvali temizleme.
- **Hazır Laboratuvar Düzenekleri:**
  - ⏳ **Kum Saati:** Cam fanus içine hapsedilmiş kum akış mekanizması.
  - 💥 **Barut & Ateş:** Zincirleme patlama simülasyonu.
- **Canlı Metrikler:** FPS sayacı ve anlık aktif parçacık adedi takibi.

---

## 🚀 Kurulum ve Yerel Sunucu Başlatma

Harici bir paket veya kütüphane (`npm install` vb.) gerektirmez.

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/devilteams-s/SandBox-Web.git
cd SandBox-Web
```

### 2. Yerel Sunucuyu Başlatın

Projede hem **Linux** hem **Windows** için otomatik tarayıcı açan Python geliştirme sunucusu hazır bulunmaktadır:

#### 🐧 Linux:
```bash
# Betiği çalıştırın (Otomatik tarayıcı açar)
./start-server.sh

# Veya doğrudan Python ile:
python3 server.py
```

#### 🪟 Windows:
- `start-server.bat` dosyasına **çift tıklayın**,
- Veya Komut İstemi'nde (CMD / PowerShell):
```cmd
python server.py
```

> **Not:** Sunucu başlatıldığında varsayılan tarayıcınızda otomatik olarak `http://localhost:5174` adresi açılır. Port meşgulse sıradaki boş port otomatik seçilir.

---

## 📁 Proje Yapısı

```
SandBox-Web/
├── index.html        # Ana simülasyon arayüzü
├── style.css         # Glassmorphism & neon laboratuvar stilleri
├── simulator.js      # Hücresel otomat, parçacık fiziği ve kimyasal reaksiyon motoru
├── server.py         # Çapraz platform Python yerel geliştirme sunucusu
├── start-server.sh   # Linux tek tıkla başlatma betiği
├── start-server.bat  # Windows tek tıkla başlatma betiği
├── README.md         # Dokümantasyon
└── LICENSE           # MIT Lisansı
```

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
