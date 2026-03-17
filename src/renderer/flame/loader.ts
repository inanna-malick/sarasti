import type { FlameModel, FlameMeta } from './types';

/**
 * Fetch FLAME .bin files and construct the FlameModel.
 * Progressive: loads template+faces first (render placeholder),
 * then shapedirs+exprdirs (enable deformation).
 */
export async function loadFlameModel(basePath: string): Promise<FlameModel> {
  const join = (base: string, file: string) => (base.endsWith('/') ? `${base}${file}` : `${base}/${file}`);

  const metaResponse = await fetch(join(basePath, 'flame_meta.json'));
  if (!metaResponse.ok) {
    throw new Error(`Failed to load flame_meta.json from ${basePath}: ${metaResponse.statusText}`);
  }
  const meta: FlameMeta = await metaResponse.json();

  const [templateBuf, facesBuf, shapedirsBuf, exprdirsBuf, albedoMeanBuf, albedoBasisBuf] = await Promise.all([
    fetchBinary(join(basePath, meta.files.template)),
    fetchBinary(join(basePath, meta.files.faces)),
    fetchBinary(join(basePath, meta.files.shapedirs)),
    fetchBinary(join(basePath, meta.files.exprdirs)),
    fetchBinary(join(basePath, meta.files.albedo_mean)),
    fetchBinary(join(basePath, meta.files.albedo_basis)),
  ]);

  const template = new Float32Array(templateBuf);
  const faces = new Uint32Array(facesBuf);
  const shapedirs = new Float32Array(shapedirsBuf);
  const exprdirs = new Float32Array(exprdirsBuf);
  const albedoMean = new Float32Array(albedoMeanBuf);
  const albedoBasis = new Float32Array(albedoBasisBuf);

  // Validate array lengths match expected dimensions from meta
  if (template.length !== meta.n_vertices * 3) {
    throw new Error(`Template length mismatch: expected ${meta.n_vertices * 3}, got ${template.length}`);
  }
  if (faces.length !== meta.n_faces * 3) {
    throw new Error(`Faces length mismatch: expected ${meta.n_faces * 3}, got ${faces.length}`);
  }
  if (shapedirs.length !== meta.n_vertices * 3 * meta.n_shape) {
    throw new Error(`Shapedirs length mismatch: expected ${meta.n_vertices * 3 * meta.n_shape}, got ${shapedirs.length}`);
  }
  if (exprdirs.length !== meta.n_vertices * 3 * meta.n_expr) {
    throw new Error(`Exprdirs length mismatch: expected ${meta.n_vertices * 3 * meta.n_expr}, got ${exprdirs.length}`);
  }
  if (albedoMean.length !== meta.n_vertices * 3) {
    throw new Error(`Albedo mean length mismatch: expected ${meta.n_vertices * 3}, got ${albedoMean.length}`);
  }
  if (albedoBasis.length !== meta.n_vertices * 3 * meta.n_albedo_components) {
    throw new Error(`Albedo basis length mismatch: expected ${meta.n_vertices * 3 * meta.n_albedo_components}, got ${albedoBasis.length}`);
  }

  return {
    template,
    faces,
    shapedirs,
    exprdirs,
    albedoMean,
    albedoBasis,
    n_vertices: meta.n_vertices,
    n_faces: meta.n_faces,
    n_shape: meta.n_shape,
    n_expr: meta.n_expr,
    n_albedo_components: meta.n_albedo_components,
  };
}

async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch binary file ${url}: ${response.statusText}`);
  }
  return response.arrayBuffer();
}
