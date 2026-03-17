import { beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { initDirectionTablesSync } from '../../directions';
import type { DirectionTable, IdentityBasis } from '../../directions';

beforeAll(() => {
  const base = join(process.cwd(), 'public/data/directions');
  const tables: Record<string, DirectionTable> = {};
  for (const axis of ['age', 'build', 'valence', 'aperture']) {
    tables[axis] = JSON.parse(readFileSync(join(base, `${axis}.json`), 'utf8'));
  }
  const identity: IdentityBasis = JSON.parse(
    readFileSync(join(base, 'identity_basis.json'), 'utf8')
  );
  initDirectionTablesSync(tables, identity);
});
