/**
 * SandBox - Yüksek Performanslı Piksel Fizik & Hücresel Otomat Motoru
 * 60 FPS Optimize Edilmiş Mimari
 */

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const WIDTH = 200;
const HEIGHT = 150;
const TOTAL_CELLS = WIDTH * HEIGHT;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Element Tanımları
const TYPE_EMPTY = 0;
const TYPE_WALL = 1;
const TYPE_SAND = 2;
const TYPE_WATER = 3;
const TYPE_WOOD = 4;
const TYPE_FIRE = 5;
const TYPE_GUNPOWDER = 6;
const TYPE_ACID = 7;
const TYPE_PLANT = 8;
const TYPE_SMOKE = 9;

// Doğal organik görünüm için Kum Renk Varyantları (3 farklı ton)
const TYPE_SAND_DARK = 10;
const TYPE_SAND_LIGHT = 11;
const TYPE_SAND_GOLD = 12;

// Derinlik ve Dalga hissi için Su Renk Varyantları (3 farklı ton)
const TYPE_WATER_DEEP = 13;
const TYPE_WATER_LIGHT = 14;
const TYPE_WATER_CYAN = 15;

// Ateş Alev & Kor Varyantları (Turuncu, Parlak Sarı, Koyu Kor)
const TYPE_FIRE_ORANGE = 16;
const TYPE_FIRE_YELLOW = 17;
const TYPE_FIRE_DARK = 18;

// Odun Doku Varyantları (Açık Meşe, Koyu Kabuk, Kuru Dal)
const TYPE_WOOD_DARK = 19;
const TYPE_WOOD_LIGHT = 20;
const TYPE_WOOD_BARK = 21;

// Önceden hesaplanmış 32-bit renk tablosu (ABGR - Little Endian)
// Her karede 30.000 defa bit shift ve nesne erişimi yapmayı engeller!
const COLOR_TABLE_32 = new Uint32Array(16);
function toABGR(r, g, b, a = 255) {
  return ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);
}

COLOR_TABLE_32[TYPE_EMPTY]      = toABGR(15, 17, 26, 255);
COLOR_TABLE_32[TYPE_WALL]       = toABGR(149, 165, 166, 255);
COLOR_TABLE_32[TYPE_SAND]       = toABGR(246, 211, 101, 255); // Orta altın sarısı
COLOR_TABLE_32[TYPE_SAND_DARK]  = toABGR(225, 185, 75, 255);  // Koyu çöl sarısı
COLOR_TABLE_32[TYPE_SAND_LIGHT] = toABGR(255, 230, 138, 255); // Açık parlak kum sarısı
COLOR_TABLE_32[TYPE_SAND_GOLD]  = toABGR(243, 198, 80, 255);  // Sıcak amber kumu
COLOR_TABLE_32[TYPE_WATER]       = toABGR(79, 172, 254, 255); // Standart okyanus mavisi
COLOR_TABLE_32[TYPE_WATER_DEEP]  = toABGR(41, 128, 185, 255); // Derin koyu su mavisi
COLOR_TABLE_32[TYPE_WATER_LIGHT] = toABGR(129, 236, 236, 255); // Açık köpük / yüzey turkuazı
COLOR_TABLE_32[TYPE_WATER_CYAN]  = toABGR(0, 168, 255, 255);   // Parlak neon camgöbeği
COLOR_TABLE_32[TYPE_WOOD]       = toABGR(139, 90, 43, 255);  // Klasik meşe odunu
COLOR_TABLE_32[TYPE_WOOD_DARK]  = toABGR(101, 67, 33, 255);   // Koyu ceviz ağacı
COLOR_TABLE_32[TYPE_WOOD_LIGHT] = toABGR(176, 120, 68, 255);  // Açık odun / talaş
COLOR_TABLE_32[TYPE_WOOD_BARK]  = toABGR(120, 75, 35, 255);   // Pürüzlü ağaç kabuğu
COLOR_TABLE_32[TYPE_FIRE]        = toABGR(255, 78, 80, 255);  // Parlak kızılağaç ateşi
COLOR_TABLE_32[TYPE_FIRE_ORANGE] = toABGR(255, 130, 45, 255); // Canlı alev turuncusu
COLOR_TABLE_32[TYPE_FIRE_YELLOW] = toABGR(255, 220, 75, 255); // Akkor sarı merkez
COLOR_TABLE_32[TYPE_FIRE_DARK]   = toABGR(215, 38, 56, 255);  // Koyu kor kırmızısı
COLOR_TABLE_32[TYPE_GUNPOWDER]  = toABGR(127, 140, 141, 255);
COLOR_TABLE_32[TYPE_ACID]       = toABGR(46, 204, 113, 255);
COLOR_TABLE_32[TYPE_PLANT]      = toABGR(39, 174, 96, 255);
COLOR_TABLE_32[TYPE_SMOKE]      = toABGR(100, 105, 115, 255);

// Izgara Belleği
let grid = new Uint8Array(TOTAL_CELLS);
let nextGrid = new Uint8Array(TOTAL_CELLS);
let fireLife = new Uint8Array(TOTAL_CELLS);

// Aktif Bounding Box (Yalnızca parçacık olan satırları işlemek için)
let minY = 0;
let maxY = HEIGHT - 1;

let isPaused = false;
let currentElement = 'sand';
let brushSize = 3;
let isDrawing = false;
let drawType = TYPE_SAND;
let currentMousePos = null;

const EL_MAP = {
  'empty': TYPE_EMPTY,
  'wall': TYPE_WALL,
  'sand': TYPE_SAND,
  'water': TYPE_WATER,
  'wood': TYPE_WOOD,
  'fire': TYPE_FIRE,
  'gunpowder': TYPE_GUNPOWDER,
  'acid': TYPE_ACID,
  'plant': TYPE_PLANT
};

// UI Elementleri
const fpsEl = document.getElementById('fps-counter');
const particleEl = document.getElementById('particle-counter');
const brushValEl = document.getElementById('brush-size-val');
const brushInput = document.getElementById('brush-size');
const pauseBtn = document.getElementById('btn-pause');

// Simülasyon Çekirdeği
function updateSimulation() {
  nextGrid.set(grid);
  let activeParticles = 0;
  let newMinY = HEIGHT;
  let newMaxY = 0;

  const startScanY = Math.min(HEIGHT - 1, maxY + 1);
  const endScanY = Math.max(0, minY - 1);

  for (let y = startScanY; y >= endScanY; y--) {
    const yOffset = y * WIDTH;
    const belowOffset = (y + 1) * WIDTH;
    const aboveOffset = (y - 1) * WIDTH;
    const leftToRight = (y & 1) === 0;
    const startX = leftToRight ? 0 : WIDTH - 1;
    const endX = leftToRight ? WIDTH : -1;
    const stepX = leftToRight ? 1 : -1;

    for (let x = startX; x !== endX; x += stepX) {
      const idx = yOffset + x;
      const type = grid[idx];

      if (type === TYPE_EMPTY) continue;
      activeParticles++;

      if (y < newMinY) newMinY = y;
      if (y > newMaxY) newMaxY = y;

      // 1. KUM & BARUT (Tüm kum tonları aynı akışkanlık fiziğini paylaşır)
      const isSandType = (type === TYPE_SAND || type === TYPE_SAND_DARK || type === TYPE_SAND_LIGHT || type === TYPE_SAND_GOLD);
      if (isSandType || type === TYPE_GUNPOWDER) {
        if (y + 1 < HEIGHT) {
          const bIdx = belowOffset + x;
          const below = nextGrid[bIdx];

          if (below === TYPE_EMPTY || (below === TYPE_WATER || below === TYPE_WATER_DEEP || below === TYPE_WATER_LIGHT || below === TYPE_WATER_CYAN) || below === TYPE_ACID) {
            nextGrid[idx] = below;
            nextGrid[bIdx] = type;
            if (y + 1 > newMaxY) newMaxY = y + 1;
          } else {
            const dir = (x + y) % 2 === 0 ? -1 : 1;
            const d1 = x + dir;
            const d2 = x - dir;
            let moved = false;

            if (d1 >= 0 && d1 < WIDTH) {
              const diagIdx = belowOffset + d1;
              const diag = nextGrid[diagIdx];
              if (diag === TYPE_EMPTY || (diag === TYPE_WATER || diag === TYPE_WATER_DEEP || diag === TYPE_WATER_LIGHT || diag === TYPE_WATER_CYAN) || diag === TYPE_ACID) {
                nextGrid[idx] = diag;
                nextGrid[diagIdx] = type;
                moved = true;
                if (y + 1 > newMaxY) newMaxY = y + 1;
              }
            }
            if (!moved && d2 >= 0 && d2 < WIDTH) {
              const diagIdx = belowOffset + d2;
              const diag = nextGrid[diagIdx];
              if (diag === TYPE_EMPTY || (diag === TYPE_WATER || diag === TYPE_WATER_DEEP || diag === TYPE_WATER_LIGHT || diag === TYPE_WATER_CYAN) || diag === TYPE_ACID) {
                nextGrid[idx] = diag;
                nextGrid[diagIdx] = type;
                if (y + 1 > newMaxY) newMaxY = y + 1;
              }
            }
          }
        }
      }

      // 2. SU (Tüm su tonları aynı akışkanlık fiziğini paylaşır)
      else if (type === TYPE_WATER || type === TYPE_WATER_DEEP || type === TYPE_WATER_LIGHT || type === TYPE_WATER_CYAN) {
        if (y + 1 < HEIGHT) {
          const bIdx = belowOffset + x;
          if (nextGrid[bIdx] === TYPE_EMPTY) {
            nextGrid[idx] = TYPE_EMPTY;
            nextGrid[bIdx] = type;
            if (y + 1 > newMaxY) newMaxY = y + 1;
            continue;
          }
        }
        const dir = (x + y) % 2 === 0 ? -1 : 1;
        const d1 = x + dir;
        const d2 = x - dir;

        if (y + 1 < HEIGHT && d1 >= 0 && d1 < WIDTH && nextGrid[belowOffset + d1] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[belowOffset + d1] = type;
          if (y + 1 > newMaxY) newMaxY = y + 1;
        } else if (y + 1 < HEIGHT && d2 >= 0 && d2 < WIDTH && nextGrid[belowOffset + d2] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[belowOffset + d2] = type;
          if (y + 1 > newMaxY) newMaxY = y + 1;
        } else if (d1 >= 0 && d1 < WIDTH && nextGrid[yOffset + d1] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[yOffset + d1] = type;
        } else if (d2 >= 0 && d2 < WIDTH && nextGrid[yOffset + d2] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[yOffset + d2] = type;
        }
      }

      // 3. ASİT
      else if (type === TYPE_ACID) {
        const neighbors = [belowOffset + x, yOffset + x - 1, yOffset + x + 1, aboveOffset + x];
        let reacted = false;
        for (let i = 0; i < 4; i++) {
          const nIdx = neighbors[i];
          if (nIdx >= 0 && nIdx < TOTAL_CELLS) {
            const nt = grid[nIdx];
            if (nt !== TYPE_EMPTY && nt !== TYPE_ACID && nt !== TYPE_WALL) {
              nextGrid[nIdx] = TYPE_EMPTY;
              nextGrid[idx] = TYPE_EMPTY;
              reacted = true;
              break;
            }
          }
        }
        if (reacted) continue;

        if (y + 1 < HEIGHT && nextGrid[belowOffset + x] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[belowOffset + x] = TYPE_ACID;
          if (y + 1 > newMaxY) newMaxY = y + 1;
        } else {
          const dir = (x + y) % 2 === 0 ? -1 : 1;
          const nx = x + dir;
          if (nx >= 0 && nx < WIDTH && nextGrid[yOffset + nx] === TYPE_EMPTY) {
            nextGrid[idx] = TYPE_EMPTY;
            nextGrid[yOffset + nx] = TYPE_ACID;
          }
        }
      }

      // 4. ATEŞ
      else if (type === TYPE_FIRE || type === TYPE_FIRE_ORANGE || type === TYPE_FIRE_YELLOW || type === TYPE_FIRE_DARK) {
        fireLife[idx]--;
        if (fireLife[idx] <= 0) {
          nextGrid[idx] = (x + y) % 5 === 0 ? TYPE_SMOKE : TYPE_EMPTY;
          continue;
        }

        const upY = y - 1;
        const rx = x + ((x ^ y) & 1 ? -1 : 1);
        if (upY >= 0 && rx >= 0 && rx < WIDTH) {
          const upIdx = aboveOffset + rx;
          if (nextGrid[upIdx] === TYPE_EMPTY) {
            nextGrid[upIdx] = TYPE_FIRE;
            fireLife[upIdx] = fireLife[idx];
            nextGrid[idx] = TYPE_EMPTY;
            if (upY < newMinY) newMinY = upY;
          }
        }

        // Komşuları tutuşturma
        const neighbors = [aboveOffset + x, belowOffset + x, yOffset + x - 1, yOffset + x + 1];
        for (let i = 0; i < 4; i++) {
          const nIdx = neighbors[i];
          if (nIdx >= 0 && nIdx < TOTAL_CELLS) {
            const nt = grid[nIdx];
            if ((nt === TYPE_WOOD || nt === TYPE_WOOD_DARK || nt === TYPE_WOOD_LIGHT || nt === TYPE_WOOD_BARK || nt === TYPE_PLANT)) {
              nextGrid[nIdx] = TYPE_FIRE;
              fireLife[nIdx] = 25;
            } else if (nt === TYPE_GUNPOWDER) {
              explode(nIdx % WIDTH, Math.floor(nIdx / WIDTH), 8);
            } else if (nt === TYPE_WATER) {
              nextGrid[idx] = TYPE_SMOKE;
            }
          }
        }
      }

      // 5. BİTKİ
      else if (type === TYPE_PLANT) {
        const neighbors = [aboveOffset + x, belowOffset + x, yOffset + x - 1, yOffset + x + 1];
        for (let i = 0; i < 4; i++) {
          const nIdx = neighbors[i];
          if (nIdx >= 0 && nIdx < TOTAL_CELLS && grid[nIdx] === TYPE_WATER) {
            nextGrid[nIdx] = TYPE_EMPTY;
            const growIdx = neighbors[(i + 1) % 4];
            if (growIdx >= 0 && growIdx < TOTAL_CELLS && nextGrid[growIdx] === TYPE_EMPTY) {
              nextGrid[growIdx] = TYPE_PLANT;
            }
          }
        }
      }

      // 6. DUMAN
      else if (type === TYPE_SMOKE) {
        if ((x + y + frames) % 15 === 0) {
          nextGrid[idx] = TYPE_EMPTY;
          continue;
        }
        const upY = y - 1;
        const rx = x + ((x ^ y) & 1 ? -1 : 1);
        if (upY >= 0 && rx >= 0 && rx < WIDTH) {
          const upIdx = aboveOffset + rx;
          if (nextGrid[upIdx] === TYPE_EMPTY) {
            nextGrid[idx] = TYPE_EMPTY;
            nextGrid[upIdx] = TYPE_SMOKE;
            if (upY < newMinY) newMinY = upY;
          }
        }
      }
    }
  }

  grid.set(nextGrid);
  minY = Math.max(0, newMinY);
  maxY = Math.min(HEIGHT - 1, newMaxY);
  particleEl.textContent = activeParticles;
}

// Patlama Fonksiyonu
function explode(cx, cy, radius) {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    const py = cy + dy;
    if (py < 0 || py >= HEIGHT) continue;
    const dy2 = dy * dy;
    const yOff = py * WIDTH;

    for (let dx = -radius; dx <= radius; dx++) {
      const px = cx + dx;
      if (px < 0 || px >= WIDTH) continue;

      if (dx * dx + dy2 <= r2) {
        const idx = yOff + px;
        if (grid[idx] !== TYPE_WALL) {
          nextGrid[idx] = Math.random() < 0.7 ? TYPE_FIRE : TYPE_EMPTY;
          if (nextGrid[idx] === TYPE_FIRE) fireLife[idx] = 20;
        }
      }
    }
  }
}

// Ultra Hızlı 32-bit Render
const imgData = ctx.createImageData(WIDTH, HEIGHT);
const data32 = new Uint32Array(imgData.data.buffer);

function render() {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    data32[i] = COLOR_TABLE_32[grid[i]];
  }
  ctx.putImageData(imgData, 0, 0);
}

// Çizim & Sürekli Akıtma
function drawAt(cx, cy, type, radius) {
  const r2 = radius * radius;
  minY = Math.max(0, Math.min(minY, cy - radius));
  maxY = Math.min(HEIGHT - 1, Math.max(maxY, cy + radius));

  for (let dy = -radius; dy <= radius; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= HEIGHT) continue;
    const dy2 = dy * dy;
    const yOff = y * WIDTH;

    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= WIDTH) continue;

      if (dx * dx + dy2 <= r2) {
        const idx = yOff + x;
        if (type === TYPE_EMPTY) {
          grid[idx] = TYPE_EMPTY;
        } else if (grid[idx] === TYPE_EMPTY || type === TYPE_WALL || (grid[idx] !== TYPE_WALL && Math.random() < 0.35)) {
          if (type === TYPE_SAND) {
            // Kum dökülürken 4 farklı doğal ton arasında zengin dağılım
            const r = Math.random();
            if (r < 0.35) grid[idx] = TYPE_SAND;
            else if (r < 0.60) grid[idx] = TYPE_SAND_DARK;
            else if (r < 0.85) grid[idx] = TYPE_SAND_LIGHT;
            else grid[idx] = TYPE_SAND_GOLD;
          } else if (type === TYPE_WATER) {
            // Su dökülürken okyanus dalga ve derinlik tonları
            const r = Math.random();
            if (r < 0.40) grid[idx] = TYPE_WATER;
            else if (r < 0.65) grid[idx] = TYPE_WATER_DEEP;
            else if (r < 0.85) grid[idx] = TYPE_WATER_LIGHT;
            else grid[idx] = TYPE_WATER_CYAN;
          } else if (type === TYPE_FIRE) {
            const r = Math.random();
            if (r < 0.35) grid[idx] = TYPE_FIRE;
            else if (r < 0.65) grid[idx] = TYPE_FIRE_ORANGE;
            else if (r < 0.85) grid[idx] = TYPE_FIRE_YELLOW;
            else grid[idx] = TYPE_FIRE_DARK;
          } else if (type === TYPE_WOOD) {
            const r = Math.random();
            if (r < 0.40) grid[idx] = TYPE_WOOD;
            else if (r < 0.65) grid[idx] = TYPE_WOOD_DARK;
            else if (r < 0.85) grid[idx] = TYPE_WOOD_LIGHT;
            else grid[idx] = TYPE_WOOD_BARK;
          } else {
            grid[idx] = type;
          }
          if (type === TYPE_FIRE) fireLife[idx] = 30;
        }
      }
    }
  }
}

// Mouse Koordinatları
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((e.clientX - rect.left) * (WIDTH / rect.width)),
    y: Math.floor((e.clientY - rect.top) * (HEIGHT / rect.height))
  };
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  drawType = (e.button === 2) ? TYPE_EMPTY : EL_MAP[currentElement];
  currentMousePos = getCanvasPos(e);
  drawAt(currentMousePos.x, currentMousePos.y, drawType, brushSize);
});

window.addEventListener('mouseup', () => {
  isDrawing = false;
  currentMousePos = null;
});

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasPos(e);
  currentMousePos = pos;
  if (isDrawing) {
    drawAt(pos.x, pos.y, drawType, brushSize);
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Tekerlekle Fırça Boyutu
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  brushSize = e.deltaY < 0 ? Math.min(15, brushSize + 1) : Math.max(1, brushSize - 1);
  brushInput.value = brushSize;
  brushValEl.textContent = brushSize;
}, { passive: false });

brushInput.addEventListener('input', (e) => {
  brushSize = parseInt(e.target.value);
  brushValEl.textContent = brushSize;
});

// Element Butonları
document.querySelectorAll('.el-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.el-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentElement = btn.dataset.element;
  });
});

// Kontrol Butonları
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? '▶️ Devam Et' : '⏸️ Duraklat';
});

document.getElementById('btn-step').addEventListener('click', () => {
  updateSimulation();
  render();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  grid.fill(TYPE_EMPTY);
  nextGrid.fill(TYPE_EMPTY);
  minY = HEIGHT;
  maxY = 0;
  render();
});

// Şablonlar
document.getElementById('preset-hourglass').addEventListener('click', () => {
  grid.fill(TYPE_EMPTY);
  for (let i = 20; i < 70; i++) {
    drawAt(i, i, TYPE_WALL, 1);
    drawAt(WIDTH - i, i, TYPE_WALL, 1);
    drawAt(i, HEIGHT - i, TYPE_WALL, 1);
    drawAt(WIDTH - i, HEIGHT - i, TYPE_WALL, 1);
  }
  for (let y = 30; y < 60; y++) {
    for (let x = y + 5; x < WIDTH - y - 5; x++) {
      const r = Math.random();
      grid[y * WIDTH + x] = r < 0.35 ? TYPE_SAND : (r < 0.65 ? TYPE_SAND_DARK : TYPE_SAND_LIGHT);
    }
  }
});

document.getElementById('preset-bomb').addEventListener('click', () => {
  grid.fill(TYPE_EMPTY);
  const cx = Math.floor(WIDTH / 2);
  const cy = Math.floor(HEIGHT / 2);
  drawAt(cx, cy, TYPE_GUNPOWDER, 18);
  for (let y = cy - 25; y < cy - 15; y++) {
    drawAt(cx, y, TYPE_WOOD, 1);
  }
  drawAt(cx, cy - 26, TYPE_FIRE, 2);
});

// 60 FPS Sabit Oyun Döngüsü
let lastTime = performance.now();
let frameCount = 0;

function loop(currentTime) {
  frameCount++;
  if (currentTime - lastTime >= 1000) {
    fpsEl.textContent = frameCount;
    frameCount = 0;
    lastTime = currentTime;
  }

  // Fare basılı tutulduğunda her karede kesintisiz akış
  if (isDrawing && currentMousePos) {
    drawAt(currentMousePos.x, currentMousePos.y, drawType, brushSize);
  }

  if (!isPaused) {
    updateSimulation();
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
