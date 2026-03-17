import { describe, it, expect } from 'vitest';
import {
  axisAngleToRotationMatrix,
  computeJointLocations,
  forwardKinematics,
  applyLBS,
} from './lbs';
import { makeMockFlameModel, MOCK_N_VERTICES, MOCK_N_JOINTS } from '../../../test-utils/flame-fixtures';
import { zeroPose } from '../../types';

describe('FLAME LBS Engine', () => {
  describe('axisAngleToRotationMatrix', () => {
    it('returns identity for zero rotation', () => {
      const R = axisAngleToRotationMatrix([0, 0, 0]);
      expect(Array.from(R)).toEqual([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]);
    });

    it('handles 90 degree rotation around Z', () => {
      const R = axisAngleToRotationMatrix([0, 0, Math.PI / 2]);
      // Rz = [cos -sin 0; sin cos 0; 0 0 1] = [0 -1 0; 1 0 0; 0 0 1]
      expect(R[0]).toBeCloseTo(0);
      expect(R[1]).toBeCloseTo(-1);
      expect(R[3]).toBeCloseTo(1);
      expect(R[4]).toBeCloseTo(0);
      expect(R[8]).toBeCloseTo(1);
    });
  });

  describe('computeJointLocations', () => {
    it('maps joints to vertices correctly based on regressor', () => {
      const nVertices = 4;
      const nJoints = 2;
      const jRegressor = new Float32Array(nJoints * nVertices);
      // Joint 0 is at vertex 1
      jRegressor[0 * nVertices + 1] = 1.0;
      // Joint 1 is average of vertex 2 and 3
      jRegressor[1 * nVertices + 2] = 0.5;
      jRegressor[1 * nVertices + 3] = 0.5;

      const vertices = new Float32Array([
        0, 0, 0, // v0
        1, 2, 3, // v1
        10, 0, 0, // v2
        0, 10, 0, // v3
      ]);

      const joints = computeJointLocations(jRegressor, vertices, nJoints, nVertices);
      expect(joints[0]).toBe(1);
      expect(joints[1]).toBe(2);
      expect(joints[2]).toBe(3);
      expect(joints[3]).toBe(5); // (10+0)/2
      expect(joints[4]).toBe(5); // (0+10)/2
      expect(joints[5]).toBe(0); // (0+0)/2
    });
  });

  describe('forwardKinematics', () => {
    it('propagates identity transforms correctly', () => {
      const nJoints = 2;
      const localRotations = [
        axisAngleToRotationMatrix([0, 0, 0]),
        axisAngleToRotationMatrix([0, 0, 0]),
      ];
      const kintreeTable = [[-1, 0], [0, 1]];
      const joints = new Float32Array([
        0, 0, 0,
        1, 0, 0,
      ]);

      const { worldTransforms, worldTranslations } = forwardKinematics(localRotations, kintreeTable, joints);
      expect(Array.from(worldTransforms[0])).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
      expect(Array.from(worldTransforms[1])).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
      expect(worldTranslations[0]).toBe(0);
      expect(worldTranslations[3]).toBe(1);
    });

    it('propagates nested rotations correctly', () => {
      const nJoints = 2;
      // Parent rotated 90 deg around Z
      // Child rotated 90 deg around Z relative to parent
      const localRotations = [
        axisAngleToRotationMatrix([0, 0, Math.PI / 2]),
        axisAngleToRotationMatrix([0, 0, Math.PI / 2]),
      ];
      const kintreeTable = [[-1, 0], [0, 1]];
      const joints = new Float32Array([
        0, 0, 0,
        1, 0, 0,
      ]);

      const { worldTransforms, worldTranslations } = forwardKinematics(localRotations, kintreeTable, joints);
      
      // World R0 = local R0 (90 deg Z)
      expect(worldTransforms[0][0]).toBeCloseTo(0);
      expect(worldTransforms[0][1]).toBeCloseTo(-1);

      // World R1 = R0 * R1 (180 deg Z)
      // R180z = [-1 0 0; 0 -1 0; 0 0 1]
      expect(worldTransforms[1][0]).toBeCloseTo(-1);
      expect(worldTransforms[1][4]).toBeCloseTo(-1);
      expect(worldTransforms[1][1]).toBeCloseTo(0);

      // World T0 = J0 = [0, 0, 0]
      expect(worldTranslations[0]).toBe(0);

      // World T1 = R0 * (J1 - J0) + T0 = R0 * ([1,0,0] - [0,0,0]) + [0,0,0] = R0 * [1,0,0] = [0, 1, 0]
      expect(worldTranslations[3]).toBeCloseTo(0);
      expect(worldTranslations[4]).toBeCloseTo(1);
      expect(worldTranslations[5]).toBeCloseTo(0);
    });
  });

  describe('applyLBS', () => {
    it('returns input vertices unchanged for zero pose', () => {
      const model = makeMockFlameModel();
      const pose = zeroPose();
      const shapedVertices = new Float32Array(model.template);
      const posedVertices = applyLBS(model, shapedVertices, pose);

      for (let i = 0; i < posedVertices.length; i++) {
        expect(posedVertices[i]).toBeCloseTo(shapedVertices[i], 5);
      }
    });

    it('shifts vertices appropriately with neck pitch', () => {
      const model = makeMockFlameModel();
      const pose = zeroPose();
      pose.neck = [Math.PI / 2, 0, 0]; // 90 degree pitch (X)
      const shapedVertices = new Float32Array(model.template);
      
      // J0 = V0 (from mock JRegressor)
      // J1 = V1
      // Weights for V1: 0.8 to J1, 0.05 to others.
      // Since J1 is neck, and neck is rotated around J1 (its parent J0 is root),
      // vertices weighted to J1 should move.
      
      const posedVertices = applyLBS(model, shapedVertices, pose);
      
      // Check if vertices have changed
      let changed = false;
      for (let i = 0; i < posedVertices.length; i++) {
        if (Math.abs(posedVertices[i] - shapedVertices[i]) > 0.01) {
          changed = true;
          break;
        }
      }
      expect(changed).toBe(true);
    });
  });
});
