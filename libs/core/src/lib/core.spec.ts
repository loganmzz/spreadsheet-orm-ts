import * as core from './core';
import {
  expect
} from '@jest/globals';

class InMemoryDatasource implements core.datasource.Datasource {
  private collections: Record<string, Promise<InMemoryCollection>> = {};
  constructor(collections: Record<string, any[][]>) {
    for (const name in collections) {
      this.collections[name] = Promise.resolve(new InMemoryCollection(name, collections[name]));
    }
  }

  getCollection(name: string): Promise<core.datasource.Collection> {
    return this.collections[name];
  }
}
class InMemoryCollection implements core.datasource.Collection {
  constructor(
    readonly name: string,
    private rows: any[][],
  ) {}

  async* getRows(query?: core.datasource.CollectionGetRowsInput): AsyncGenerator<core.datasource.Row> {
    const firstRowIndex = query?.rows?.[0] ?? 0;
    const lastRowIndex = query?.rows?.[1] ?? Infinity;
    let rowIndex = 0;
    for (const row of this.rows) {
      const currentRowIndex = rowIndex++;
      if (currentRowIndex <  firstRowIndex) continue;
      if (currentRowIndex >= lastRowIndex) break;
      yield new InMemoryRow([...row]);
    }
  }
}
class InMemoryRow implements core.datasource.Row {
  private values: Promise<any[]>
  constructor(values: any[]) {
    this.values = Promise.resolve(values);
  }

  getValues(): Promise<any[]> {
    return this.values;
  }
}

describe('core', () => {
  describe('engine', () => {
    it('example', async () => {
      const datasource = new InMemoryDatasource({
        Dog: [
          ['id', 'name'],
          [0   , 'Pluto'],
          [1   , 'Rex'],
        ],
      });
      const spec: core.spec.GlobalSpec = {
        collections: {
          Dog: {
            properties: {
              id: {},
              name: {},
            },
          },
        },
      };
      const engine = new core.engine.Engine(datasource, spec);

      type Dog = {
        id: number,
        name: string,
      };
      const dogs = engine.readAll<Dog>('Dog');

      let dog = await dogs.next();
      expect(dog).toMatchObject({
        done: false,
        value: {
          id: 0,
          name: 'Pluto',
        }
      });

      dog = await dogs.next();
      expect(dog).toMatchObject({
        done: false,
        value: {
          id: 1,
          name: 'Rex',
        }
      });

      dog = await dogs.next();
      expect(dog).toMatchObject({done: true});
    })
  });
});
