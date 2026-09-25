# ⚗️ SandBox

> Browser-based **cellular automata and pixel physics sandbox engine** inspired by Noita and Powder Game. Built with zero external dependencies using pure HTML5 Canvas and modern JavaScript.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Python 3](https://img.shields.io/badge/Python-3.x-3776AB?style=flat&logo=python&logoColor=white)
![i18n: TR/EN](https://img.shields.io/badge/Language-TR%20%7C%20EN-purple.svg)

---

## ✨ Features (Özellikler)

### 🌐 Multi-Language (Çoklu Dil)
- Instant **Turkish (TR)** and **English (EN)** toggle with localized element names and controls.

### 🧪 Elements & Natural Reactions
- ⏳ **Sand:** Granular falling physics with 4 organic desert & gold color tones.
- 💧 **Water:** Fluid dynamic surface flow, wave teal/cyan shades, extinguishes fire.
- 🪵 **Wood:** Solid combustible barrier with realistic oak & bark wood grains.
- 🔥 **Fire:** Flame spectrum (ember, orange, incandescent yellow), emits smoke.
- 💣 **Gunpowder:** Volatile explosive grains triggering chain reactions with fire.
- 🧪 **Acid:** Corrosive toxic lime liquid that erodes all organic & mineral matter.
- 🌱 **Plant:** Flora that sprouts and branches when nourished by water.
- 🧱 **Wall:** Indestructible boundary stone masonry.
- 🧹 **Eraser:** Clears cells back to void.

### 🎮 Controls & Lab Tools
- **Brush Size:** 1 to 15 pixels (adjustable via slider or mouse wheel).
- **Simulation Control:** ⏸️ Pause, ⏭️ Single-step physics, and 🗑️ Clear canvas.
- **Continuous Flow:** Hold mouse still to continuously pour dense streams of matter.
- **Built-in Presets:** Hourglass and Gunpowder Bomb demo setups.
- **Performance:** Precomputed 32-bit lookup engine locked at smooth **60 FPS**.

---

## 🚀 Quick Start & Local Server

Requires zero external packages (`npm install` not needed).

### 1. Clone the Repository
```bash
git clone https://github.com/devilteams-s/SandBox-Web.git
cd SandBox-Web
```

### 2. Launch Local Server

#### 🐧 Linux:
```bash
./start-server.sh
# or
python3 server.py
```

#### 🪟 Windows:
- Double click `start-server.bat` or run:
```cmd
python server.py
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
