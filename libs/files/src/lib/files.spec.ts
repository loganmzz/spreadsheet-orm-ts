import * as files from './files.js';
import * as core from '@spreadsheet-orm/core';
import path from 'node:path';

function basedir(): string {
  const libdir = __dirname;
  const srcdir = path.dirname(libdir);
  const basedir = path.dirname(srcdir);
  return basedir;
}

function testdir() {
  return path.join(basedir(), "test");
}

describe('files', () => {
  it('example', async () => {
    const datadir = path.join(testdir(), "example");
    const datasource = new files.FilesDatasource(datadir);
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
  });
});
