/**
 * Falling Sand & Cellular Automata Engine
 */

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 200;
const HEIGHT = 150;
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

// Renk Matrisi (RGBA)
const COLORS = {
  [TYPE_EMPTY]: [15, 17, 26, 255],
  [TYPE_WALL]: [149, 165, 166, 255],
  [TYPE_SAND]: [246, 211, 101, 255],
  [TYPE_WATER]: [79, 172, 254, 210],
  [TYPE_WOOD]: [139, 90, 43, 255],
  [TYPE_FIRE]: [255, 78, 80, 255],
  [TYPE_GUNPOWDER]: [127, 140, 141, 255],
  [TYPE_ACID]: [46, 204, 113, 240],
  [TYPE_PLANT]: [39, 174, 96, 255],
  [TYPE_SMOKE]: [80, 80, 90, 180]
};

// Renk Çeşitlemesi (Daha organik görünmesi için)
function getVariantColor(type) {
  const base = COLORS[type];
  if (!base || type === TYPE_EMPTY) return base;
  const variation = (Math.random() - 0.5) * 20;
  return [
    Math.min(255, Math.max(0, base[0] + variation)),
    Math.min(255, Math.max(0, base[1] + variation)),
    Math.min(255, Math.max(0, base[2] + variation)),
    base[3]
  ];
}

let grid = new Uint8Array(WIDTH * HEIGHT);
let nextGrid = new Uint8Array(WIDTH * HEIGHT);
let fireLife = new Uint8Array(WIDTH * HEIGHT);

function getIndex(x, y) {
  return y * WIDTH + x;
}

let isPaused = false;
let currentElement = 'sand';
let brushSize = 3;
let isDrawing = false;
let drawType = TYPE_SAND;
let currentMousePos = null;

// Element Adını ID'ye dönüştürme
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

  // Aşağıdan yukarıya tarama (yerçekimi çakışmalarını önlemek için)
  for (let y = HEIGHT - 1; y >= 0; y--) {
    // X ekseninde rastgele yönlü tarama (asimetrik yığılmayı önler)
    const leftToRight = Math.random() < 0.5;
    const startX = leftToRight ? 0 : WIDTH - 1;
    const endX = leftToRight ? WIDTH : -1;
    const stepX = leftToRight ? 1 : -1;

    for (let x = startX; x !== endX; x += stepX) {
      const idx = getIndex(x, y);
      const type = grid[idx];

      if (type === TYPE_EMPTY) continue;
      activeParticles++;

      // --- 1. KUM (SAND) & BARUT (GUNPOWDER) ---
      if (type === TYPE_SAND || type === TYPE_GUNPOWDER) {
        if (y + 1 < HEIGHT) {
          const belowIdx = getIndex(x, y + 1);
          const below = nextGrid[belowIdx];

          // Düz düşüş (Boşluğa veya suya düşebilir)
          if (below === TYPE_EMPTY || below === TYPE_WATER || below === TYPE_ACID) {
            nextGrid[idx] = below;
            nextGrid[belowIdx] = type;
          } else {
            // Çapraz kayma
            const dir = Math.random() < 0.5 ? -1 : 1;
            const d1 = x + dir;
            const d2 = x - dir;
            let moved = false;

            if (d1 >= 0 && d1 < WIDTH) {
              const diagIdx = getIndex(d1, y + 1);
              const diag = nextGrid[diagIdx];
              if (diag === TYPE_EMPTY || diag === TYPE_WATER || diag === TYPE_ACID) {
                nextGrid[idx] = diag;
                nextGrid[diagIdx] = type;
                moved = true;
              }
            }
            if (!moved && d2 >= 0 && d2 < WIDTH) {
              const diagIdx = getIndex(d2, y + 1);
              const diag = nextGrid[diagIdx];
              if (diag === TYPE_EMPTY || diag === TYPE_WATER || diag === TYPE_ACID) {
                nextGrid[idx] = diag;
                nextGrid[diagIdx] = type;
              }
            }
          }
        }
      }

      // --- 2. SU (WATER) ---
      else if (type === TYPE_WATER) {
        if (y + 1 < HEIGHT) {
          const belowIdx = getIndex(x, y + 1);
          if (nextGrid[belowIdx] === TYPE_EMPTY) {
            nextGrid[idx] = TYPE_EMPTY;
            nextGrid[belowIdx] = TYPE_WATER;
            continue;
          }
        }
        // Sıvı yatay yayılma
        const dir = Math.random() < 0.5 ? -1 : 1;
        const d1 = x + dir;
        const d2 = x - dir;
        let moved = false;

        // Çapraz aşağı akış
        if (y + 1 < HEIGHT && d1 >= 0 && d1 < WIDTH && nextGrid[getIndex(d1, y + 1)] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(d1, y + 1)] = TYPE_WATER;
          moved = true;
        } else if (y + 1 < HEIGHT && d2 >= 0 && d2 < WIDTH && nextGrid[getIndex(d2, y + 1)] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(d2, y + 1)] = TYPE_WATER;
          moved = true;
        } else if (d1 >= 0 && d1 < WIDTH && nextGrid[getIndex(d1, y)] === TYPE_EMPTY) {
          // Sağa/sola akış
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(d1, y)] = TYPE_WATER;
          moved = true;
        } else if (d2 >= 0 && d2 < WIDTH && nextGrid[getIndex(d2, y)] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(d2, y)] = TYPE_WATER;
        }
      }

      // --- 3. ASİT (ACID) ---
      else if (type === TYPE_ACID) {
        // Çevresindeki eriyebilenleri erit
        const neighbors = [
          [x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]
        ];
        let reacted = false;
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
            const nIdx = getIndex(nx, ny);
            const nt = grid[nIdx];
            if (nt !== TYPE_EMPTY && nt !== TYPE_ACID && nt !== TYPE_WALL) {
              nextGrid[nIdx] = TYPE_EMPTY;
              nextGrid[idx] = TYPE_EMPTY; // Asit de tükenir
              reacted = true;
              break;
            }
          }
        }
        if (reacted) continue;

        // Su gibi akar
        if (y + 1 < HEIGHT && nextGrid[getIndex(x, y + 1)] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(x, y + 1)] = TYPE_ACID;
        } else {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const nx = x + dir;
          if (nx >= 0 && nx < WIDTH && nextGrid[getIndex(nx, y)] === TYPE_EMPTY) {
            nextGrid[idx] = TYPE_EMPTY;
            nextGrid[getIndex(nx, y)] = TYPE_ACID;
          }
        }
      }

      // --- 4. ATEŞ (FIRE) & DUMAN ---
      else if (type === TYPE_FIRE) {
        fireLife[idx]--;
        if (fireLife[idx] <= 0 || Math.random() < 0.15) {
          nextGrid[idx] = Math.random() < 0.3 ? TYPE_SMOKE : TYPE_EMPTY;
          continue;
        }

        // Ateş yukarı doğru hareket eder
        const upY = y - 1;
        const randX = x + (Math.random() < 0.5 ? -1 : 1);
        if (upY >= 0 && randX >= 0 && randX < WIDTH) {
          const upIdx = getIndex(randX, upY);
          if (nextGrid[upIdx] === TYPE_EMPTY) {
            nextGrid[upIdx] = TYPE_FIRE;
            fireLife[upIdx] = fireLife[idx];
            nextGrid[idx] = TYPE_EMPTY;
          }
        }

        // Komşuları yakma / Barut patlaması
        const neighbors = [
          [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
            const nIdx = getIndex(nx, ny);
            const nt = grid[nIdx];
            if (nt === TYPE_WOOD || nt === TYPE_PLANT) {
              if (Math.random() < 0.2) {
                nextGrid[nIdx] = TYPE_FIRE;
                fireLife[nIdx] = 20 + Math.floor(Math.random() * 30);
              }
            } else if (nt === TYPE_GUNPOWDER) {
              // PATLAMA!
              explode(nx, ny, 8);
            } else if (nt === TYPE_WATER) {
              nextGrid[idx] = TYPE_SMOKE; // Ateşi söndürür
            }
          }
        }
      }

      // --- 5. BİTKİ (PLANT) ---
      else if (type === TYPE_PLANT) {
        // Yakındaki sudan beslenip büyüme
        const neighbors = [
          [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
            const nIdx = getIndex(nx, ny);
            if (grid[nIdx] === TYPE_WATER) {
              nextGrid[nIdx] = TYPE_EMPTY;
              // Rastgele boş bir yöne büyü
              const growDir = neighbors[Math.floor(Math.random() * neighbors.length)];
              const gx = growDir[0], gy = growDir[1];
              if (gx >= 0 && gx < WIDTH && gy >= 0 && gy < HEIGHT && nextGrid[getIndex(gx, gy)] === TYPE_EMPTY) {
                nextGrid[getIndex(gx, gy)] = TYPE_PLANT;
              }
            }
          }
        }
      }

      // --- 6. DUMAN (SMOKE) ---
      else if (type === TYPE_SMOKE) {
        if (Math.random() < 0.1) {
          nextGrid[idx] = TYPE_EMPTY;
          continue;
        }
        const upY = y - 1;
        const rx = x + (Math.random() < 0.5 ? -1 : 1);
        if (upY >= 0 && rx >= 0 && rx < WIDTH && nextGrid[getIndex(rx, upY)] === TYPE_EMPTY) {
          nextGrid[idx] = TYPE_EMPTY;
          nextGrid[getIndex(rx, upY)] = TYPE_SMOKE;
        }
      }
    }
  }

  grid.set(nextGrid);
  particleEl.textContent = activeParticles;
}

// Patlama Fonksiyonu
function explode(cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < WIDTH && ty >= 0 && ty < HEIGHT) {
          const idx = getIndex(tx, ty);
          if (grid[idx] !== TYPE_WALL) {
            if (Math.random() < 0.7) {
              nextGrid[idx] = TYPE_FIRE;
              fireLife[idx] = 10 + Math.floor(Math.random() * 20);
            } else {
              nextGrid[idx] = TYPE_EMPTY;
            }
          }
        }
      }
    }
  }
}

// Görsel Render
const imgData = ctx.createImageData(WIDTH, HEIGHT);
const data32 = new Uint32Array(imgData.data.buffer);

function render() {
  for (let i = 0; i < grid.length; i++) {
    const type = grid[i];
    const c = COLORS[type];
    // ABGR format for little-endian Uint32
    data32[i] = (c[3] << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
  }
  ctx.putImageData(imgData, 0, 0);
}

// Çizim İşlemi
function drawAt(cx, cy, type, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        // Doğal akış hissi için hafif rastgele serpiştirme ve yoğun akış
        if (type !== TYPE_WALL && type !== TYPE_EMPTY && Math.random() < 0.25) continue;

        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
          const idx = getIndex(x, y);
          if (type === TYPE_EMPTY) {
            grid[idx] = TYPE_EMPTY;
          } else if (grid[idx] === TYPE_EMPTY || (type === TYPE_WALL) || (grid[idx] !== TYPE_WALL && Math.random() < 0.2)) {
            grid[idx] = type;
            if (type === TYPE_FIRE) {
              fireLife[idx] = 30 + Math.floor(Math.random() * 20);
            }
          }
        }
      }
    }
  }
}

// Mouse Eventleri
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  return {
    x: Math.floor((e.clientX - rect.left) * scaleX),
    y: Math.floor((e.clientY - rect.top) * scaleY)
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

canvas.addEventListener('mouseleave', () => {
  // Tuvalden çıksa bile basılı tutuyorsa son konumu sakla
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Tekerlekle Fırça Boyutu
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    brushSize = Math.min(15, brushSize + 1);
  } else {
    brushSize = Math.max(1, brushSize - 1);
  }
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
  render();
});

// Şablonlar
document.getElementById('preset-hourglass').addEventListener('click', () => {
  grid.fill(TYPE_EMPTY);
  // Kum saati duvarları çiz
  for (let i = 20; i < 70; i++) {
    drawAt(i, i, TYPE_WALL, 1);
    drawAt(WIDTH - i, i, TYPE_WALL, 1);
    drawAt(i, HEIGHT - i, TYPE_WALL, 1);
    drawAt(WIDTH - i, HEIGHT - i, TYPE_WALL, 1);
  }
  // İçine kum dök
  for (let y = 30; y < 60; y++) {
    for (let x = y + 5; x < WIDTH - y - 5; x++) {
      grid[getIndex(x, y)] = TYPE_SAND;
    }
  }
});

document.getElementById('preset-bomb').addEventListener('click', () => {
  grid.fill(TYPE_EMPTY);
  // Barut kutusu
  const cx = Math.floor(WIDTH / 2);
  const cy = Math.floor(HEIGHT / 2);
  drawAt(cx, cy, TYPE_GUNPOWDER, 18);
  // Üstüne fitil (odun) ve ucuna ateş
  for (let y = cy - 25; y < cy - 15; y++) {
    drawAt(cx, y, TYPE_WOOD, 1);
  }
  drawAt(cx, cy - 26, TYPE_FIRE, 2);
});

// FPS Sayacı ve Oyun Döngüsü
let lastTime = performance.now();
let frames = 0;

function loop(currentTime) {
  frames++;
  if (currentTime - lastTime >= 1000) {
    fpsEl.textContent = frames;
    frames = 0;
    lastTime = currentTime;
  }

  // Fare basılı tutuluyorsa hareket etmese bile kesintisiz ve yoğun akıt
  if (isDrawing && currentMousePos) {
    drawAt(currentMousePos.x, currentMousePos.y, drawType, brushSize);
  }

  if (!isPaused) {
    // 2x Fizik adımı: Simülasyonu belirgin şekilde hızlandırır ve akışkanlığı katlar
    updateSimulation();
    if (isDrawing && currentMousePos) {
      drawAt(currentMousePos.x, currentMousePos.y, drawType, brushSize);
    }
    updateSimulation();
  }
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
