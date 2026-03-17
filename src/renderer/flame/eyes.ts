export interface EyeVertexGroups {
  leftEyeVertices: number[];   // vertex indices for left eyeball
  rightEyeVertices: number[];  // vertex indices for right eyeball
  leftEyeFaces: number[];      // face indices that use left eye vertices
  rightEyeFaces: number[];     // face indices that use right eye vertices
}

/**
 * Identifies vertices and faces belonging to the eye globes in the FLAME mesh.
 * Logic:
 * - Left eye joint = index 3, right eye joint = index 4
 * - A vertex belongs to an eye if its weight for that joint > 0.5
 * - A face belongs to an eye if ALL 3 of its vertices belong to that eye group
 */
export function identifyEyeVertices(
  weights: Float32Array,  // [nVertices * nJoints]
  faces: Uint32Array,     // [nFaces * 3]
  nVertices: number,
  nJoints: number,
): EyeVertexGroups {
  const leftEyeVertices: number[] = [];
  const rightEyeVertices: number[] = [];
  
  const leftEyeJoint = 3;
  const rightEyeJoint = 4;

  const isLeftEyeVertex = new Uint8Array(nVertices);
  const isRightEyeVertex = new Uint8Array(nVertices);

  for (let v = 0; v < nVertices; v++) {
    const offset = v * nJoints;
    if (weights[offset + leftEyeJoint] > 0.5) {
      leftEyeVertices.push(v);
      isLeftEyeVertex[v] = 1;
    }
    if (weights[offset + rightEyeJoint] > 0.5) {
      rightEyeVertices.push(v);
      isRightEyeVertex[v] = 1;
    }
  }

  const leftEyeFaces: number[] = [];
  const rightEyeFaces: number[] = [];
  const nFaces = faces.length / 3;

  for (let f = 0; f < nFaces; f++) {
    const v1 = faces[f * 3];
    const v2 = faces[f * 3 + 1];
    const v3 = faces[f * 3 + 2];

    if (isLeftEyeVertex[v1] && isLeftEyeVertex[v2] && isLeftEyeVertex[v3]) {
      leftEyeFaces.push(f);
    } else if (isRightEyeVertex[v1] && isRightEyeVertex[v2] && isRightEyeVertex[v3]) {
      rightEyeFaces.push(f);
    }
  }

  return {
    leftEyeVertices,
    rightEyeVertices,
    leftEyeFaces,
    rightEyeFaces,
  };
}
