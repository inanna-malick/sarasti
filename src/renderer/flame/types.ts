export interface FlameModel {
  template: Float32Array;   // [N_VERTICES * 3] — mean face
  faces: Uint32Array;       // [N_FACES * 3] — triangle indices
  shapedirs: Float32Array;  // [N_VERTICES * 3 * N_SHAPE] — shape basis
  exprdirs: Float32Array;   // [N_VERTICES * 3 * N_EXPR] — expression basis
  albedoMean: Float32Array; // [N_VERTICES * 3] — mean albedo RGB
  albedoBasis: Float32Array; // [N_VERTICES * 3 * N_ALBEDO] — albedo basis
  // LBS / pose arrays
  weights: Float32Array;    // [N_VERTICES * N_JOINTS] — skinning weights
  posedirs: Float32Array;   // [N_POSE_FEATURES * N_VERTICES * 3] — pose corrective blendshapes
  jRegressor: Float32Array; // [N_JOINTS * N_VERTICES] — joint regressor (dense)
  kintreeTable: number[][]; // [2][N_JOINTS] — parent-child joint relationships
  n_vertices: number;
  n_faces: number;
  n_shape: number;
  n_expr: number;
  n_joints: number;
  n_pose_features: number;
  n_albedo_components: number;
}

export interface FlameBuffers {
  vertices: Float32Array;   // deformed vertex positions
  normals: Float32Array;    // computed face/vertex normals
}

export interface FlameMeta {
  n_vertices: number;
  n_faces: number;
  n_shape: number;
  n_expr: number;
  n_joints: number;
  n_pose_features: number;
  n_albedo_components: number;
  files: {
    template: string;
    faces: string;
    shapedirs: string;
    exprdirs: string;
    albedo_mean: string;
    albedo_basis: string;
    weights: string;
    posedirs: string;
    J_regressor: string;
    kintree: string;
  };
}

export interface FlameAlbedo {
  mean: Float32Array;
  basis: Float32Array;
  n_vertices: number;
  n_components: number;
}
