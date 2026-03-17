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

  const [
    templateBuf, facesBuf, shapedirsBuf, exprdirsBuf,
    albedoMeanBuf, albedoBasisBuf,
    weightsBuf, posedirsBuf, jRegressorBuf,
  ] = await Promise.all([
    fetchBinary(join(basePath, meta.files.template)),
    fetchBinary(join(basePath, meta.files.faces)),
    fetchBinary(join(basePath, meta.files.shapedirs)),
    fetchBinary(join(basePath, meta.files.exprdirs)),
    fetchBinary(join(basePath, meta.files.albedo_mean)),
    fetchBinary(join(basePath, meta.files.albedo_basis)),
    fetchBinary(join(basePath, meta.files.weights)),
    fetchBinary(join(basePath, meta.files.posedirs)),
    fetchBinary(join(basePath, meta.files.J_regressor)),
  ]);

  // Load kintree as JSON (small, separate fetch)
  const kintreeResponse = await fetch(join(basePath, meta.files.kintree));
  if (!kintreeResponse.ok) {
    throw new Error(`Failed to load kintree from ${basePath}: ${kintreeResponse.statusText}`);
  }
  const kintreeTable: number[][] = await kintreeResponse.json();
  if (!Array.isArray(kintreeTable) || kintreeTable.length < 2) {
    throw new Error(`Invalid kintree data from ${basePath}: expected [[parents], [children]]`);
  }

  const template = new Float32Array(templateBuf);
  const faces = new Uint32Array(facesBuf);
  const shapedirs = new Float32Array(shapedirsBuf);
  const exprdirs = new Float32Array(exprdirsBuf);
  const albedoMean = new Float32Array(albedoMeanBuf);
  const albedoBasis = new Float32Array(albedoBasisBuf);
  const weights = new Float32Array(weightsBuf);
  const posedirs = new Float32Array(posedirsBuf);
  const jRegressor = new Float32Array(jRegressorBuf);

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
  if (weights.length !== meta.n_vertices * meta.n_joints) {
    throw new Error(`Weights length mismatch: expected ${meta.n_vertices * meta.n_joints}, got ${weights.length}`);
  }
  if (posedirs.length !== meta.n_pose_features * meta.n_vertices * 3) {
    throw new Error(`Posedirs length mismatch: expected ${meta.n_pose_features * meta.n_vertices * 3}, got ${posedirs.length}`);
  }
  if (jRegressor.length !== meta.n_joints * meta.n_vertices) {
    throw new Error(`J_regressor length mismatch: expected ${meta.n_joints * meta.n_vertices}, got ${jRegressor.length}`);
  }

  return {
    template,
    faces,
    shapedirs,
    exprdirs,
    albedoMean,
    albedoBasis,
    weights,
    posedirs,
    jRegressor,
    kintreeTable,
    n_vertices: meta.n_vertices,
    n_faces: meta.n_faces,
    n_shape: meta.n_shape,
    n_expr: meta.n_expr,
    n_joints: meta.n_joints,
    n_pose_features: meta.n_pose_features,
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
