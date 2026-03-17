export interface FlameModel {
  template: Float32Array;   // [N_VERTICES * 3] — mean face
  faces: Uint32Array;       // [N_FACES * 3] — triangle indices
  shapedirs: Float32Array;  // [N_VERTICES * 3 * N_SHAPE] — shape basis
  exprdirs: Float32Array;   // [N_VERTICES * 3 * N_EXPR] — expression basis
  n_vertices: number;
  n_faces: number;
  n_shape: number;
  n_expr: number;
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
  files: {
    template: string;
    faces: string;
    shapedirs: string;
    exprdirs: string;
  };
}
