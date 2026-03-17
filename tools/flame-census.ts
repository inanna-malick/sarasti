import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_DATA = resolve(ROOT, 'public/data');

const N_SHAPE_CENSUS = 50;
const N_EXPR_CENSUS = 40;

interface ComponentInfo {
  index: number;
  description: string;
  tier: string;
  effect_magnitude: number;
}

const EXISTING_EXPR_DESC: Record<number, string> = {
  0: "jaw open + smile",
  1: "smile/frown",
  2: "mouth open extreme open",
  3: "lip parting / protrusion",
  4: "brow raise/lower",
  5: "lip pursing forward/back",
  6: "jaw lateral shift",
  7: "head shape modifier",
  8: "subtle lip/nose",
  9: "eye/cheek region",
};

const EXISTING_SHAPE_DESC: Record<number, string> = {
  0: "face width/size",
  1: "face height (elongated vs compressed)",
  2: "jaw shape (square vs pointed chin)",
  3: "secondary width",
  4: "fine shape detail (β4)",
  5: "fine shape detail (β5)",
  6: "fine shape detail (β6)",
  7: "fine shape detail (β7)",
  8: "fine shape detail (β8)",
  9: "fine shape detail (β9)",
};

async function main() {
  console.log('Starting FLAME census...');

  // 1. Load metadata and compute magnitudes
  const meta = JSON.parse(readFileSync(resolve(PUBLIC_DATA, 'flame_meta.json'), 'utf-8'));
  const shapedirs = new Float32Array(readFileSync(resolve(PUBLIC_DATA, 'flame_shapedirs.bin')).buffer);
  const exprdirs = new Float32Array(readFileSync(resolve(PUBLIC_DATA, 'flame_exprdirs.bin')).buffer);

  const n_vertices = meta.n_vertices;

  function computeMagnitudes(dirs: Float32Array, count: number): number[] {
    const magnitudes: number[] = [];
    const N = n_vertices * 3;
    for (let i = 0; i < count; i++) {
      const offset = i * N;
      const basis = dirs.subarray(offset, offset + N);
      let sum = 0;
      for (let j = 0; j < N; j++) {
        sum += basis[j] * basis[j];
      }
      magnitudes.push(Math.sqrt(sum));
    }
    return magnitudes;
  }

  const shapeMagnitudes = computeMagnitudes(shapedirs, meta.n_shape);
  const exprMagnitudes = computeMagnitudes(exprdirs, meta.n_expr);

  function assignTiers(magnitudes: number[], indices: number[]): string[] {
    const sorted = indices.map(i => ({ index: i, mag: magnitudes[i] }))
      .sort((a, b) => b.mag - a.mag);
    
    const tiers = new Array(indices.length);
    sorted.forEach((item, rank) => {
      let tier = "tier3";
      if (rank < 5) tier = "tier1";
      else if (rank < 20) tier = "tier2";
      
      // Find original index in indices array
      const idx = indices.indexOf(item.index);
      tiers[idx] = tier;
    });
    return tiers;
  }

  const shapeIndices = Array.from({ length: N_SHAPE_CENSUS }, (_, i) => i);
  const exprIndices = Array.from({ length: N_EXPR_CENSUS }, (_, i) => i);

  const shapeTiers = assignTiers(shapeMagnitudes, shapeIndices);
  const exprTiers = assignTiers(exprMagnitudes, exprIndices);

  const shapeCensus: ComponentInfo[] = shapeIndices.map(i => ({
    index: i,
    description: EXISTING_SHAPE_DESC[i] || `shape component β${i}`,
    tier: shapeTiers[i],
    effect_magnitude: Number(shapeMagnitudes[i].toFixed(4))
  }));

  const exprCensus: ComponentInfo[] = exprIndices.map(i => ({
    index: i,
    description: EXISTING_EXPR_DESC[i] || `expression component ψ${i}`,
    tier: exprTiers[i],
    effect_magnitude: Number(exprMagnitudes[i].toFixed(4))
  }));

  const census = {
    shape: shapeCensus,
    expression: exprCensus
  };

  writeFileSync(resolve(PUBLIC_DATA, 'census.json'), JSON.stringify(census, null, 2));
  console.log(`Saved census.json with ${N_SHAPE_CENSUS} shapes and ${N_EXPR_CENSUS} expressions`);

  // 2. Render triplet strips
  const server = await createServer({ root: ROOT, server: { port: 3099, strictPort: true } });
  await server.listen();
  const baseUrl = 'http://localhost:3099';

  const execPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  console.log('Launching chromium...');
  if (execPath) console.log('Using executablePath:', execPath);
  const browser = await chromium.launch({
    headless: true,
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  // Set a large viewport for the grid
  await page.setViewportSize({ width: 2400, height: 4000 });

  async function captureGrid(mode: 'shape' | 'expr', count: number, outputPath: string) {
    console.log(`Rendering ${mode} grid...`);
    // Create a temporary HTML for rendering the grid
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #000; color: #fff; font-family: monospace; }
    .grid { display: flex; flex-direction: column; gap: 2px; padding: 2px; }
    .triplet { display: flex; gap: 2px; height: 200px; }
    .cell { position: relative; width: 200px; height: 200px; background: #111; }
    canvas { width: 100%; height: 100%; }
    .label {
      position: absolute; bottom: 2px; left: 4px;
      font-size: 10px; background: rgba(0,0,0,0.5); padding: 1px 3px;
    }
  </style>
</head>
<body>
  <div class="grid" id="grid"></div>
  <script type="module">
    import * as THREE from '/node_modules/three/build/three.module.js';

    async function loadModel() {
      const meta = await (await fetch('/data/flame_meta.json')).json();
      const [tBuf, fBuf, sBuf, eBuf] = await Promise.all([
        fetch('/data/flame_template.bin').then(r => r.arrayBuffer()),
        fetch('/data/flame_faces.bin').then(r => r.arrayBuffer()),
        fetch('/data/flame_shapedirs.bin').then(r => r.arrayBuffer()),
        fetch('/data/flame_exprdirs.bin').then(r => r.arrayBuffer()),
      ]);
      return {
        template: new Float32Array(tBuf),
        faces: new Uint32Array(fBuf),
        shapedirs: new Float32Array(sBuf),
        exprdirs: new Float32Array(eBuf),
        ...meta,
      };
    }

    function deform(model, beta, psi) {
      const verts = new Float32Array(model.template);
      const N = model.n_vertices * 3;
      for (let c = 0; c < model.n_shape; c++) {
        if (beta[c] === 0) continue;
        const off = c * N;
        for (let i = 0; i < N; i++) verts[i] += model.shapedirs[off + i] * beta[c];
      }
      for (let c = 0; c < model.n_expr; c++) {
        if (psi[c] === 0) continue;
        const off = c * N;
        for (let i = 0; i < N; i++) verts[i] += model.exprdirs[off + i] * psi[c];
      }
      return verts;
    }

    const model = await loadModel();
    const grid = document.getElementById('grid');

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(200, 200);
    renderer.setClearColor(0x1a1a1a);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
    camera.position.set(0, 0, 0.6);
    camera.lookAt(0, 0, 0);

    const mat = new THREE.MeshNormalMaterial();

    for (let i = 0; i < ${count}; i++) {
      if (i % 5 === 0) console.log('Rendering ' + '${mode}' + ' triplet ' + i + '...');
      const triplet = document.createElement('div');
      triplet.className = 'triplet';
      
      for (const val of [-3, 0, 3]) {
        const beta = new Float32Array(model.n_shape);
        const psi = new Float32Array(model.n_expr);
        if ('${mode}' === 'expr') psi[i] = val;
        else beta[i] = val;

        const verts = deform(model, beta, psi);
        const geo = new THREE.BufferGeometry();
        geo.setIndex(new THREE.BufferAttribute(model.faces, 1));
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        renderer.render(scene, camera);
        scene.remove(mesh);

        const cell = document.createElement('div');
        cell.className = 'cell';
        const img = document.createElement('img');
        img.src = renderer.domElement.toDataURL();
        cell.appendChild(img);
        
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = '${mode === 'expr' ? 'ψ' : 'β'}' + i + '=' + val;
        cell.appendChild(label);
        
        triplet.appendChild(cell);
        geo.dispose();
      }
      grid.appendChild(triplet);
    }
    
    document.body.dataset.done = 'true';
  </script>
</body>
</html>
`;
    const tempHtml = resolve(ROOT, 'census-temp.html');
    writeFileSync(tempHtml, htmlContent);

    await page.goto(`${baseUrl}/census-temp.html`);
    await page.waitForSelector('body[data-done="true"]', { timeout: 120000 });
    
    const gridElement = await page.$('#grid');
    if (gridElement) {
      await gridElement.screenshot({ path: outputPath });
    }
    console.log(`Saved ${outputPath}`);
  }

  await captureGrid('shape', N_SHAPE_CENSUS, resolve(PUBLIC_DATA, 'census-shape.png'));
  await captureGrid('expr', N_EXPR_CENSUS, resolve(PUBLIC_DATA, 'census-expr.png'));

  await browser.close();
  await server.close();
  console.log('FLAME census complete.');
}

main().catch(console.error);
