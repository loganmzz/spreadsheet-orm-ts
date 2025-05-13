import * as google from './google-spreadsheet';
import * as core from '@spreadsheet-orm/core';

const spreadsheetId = '11FXcCzZb2T3rd-PHaBDiE-gHG7YoF6Ux8M3LpY9rpgA';

describe('google-spreadsheet', () => {
  it('example', async () => {
    const client = new google.client.GoogleClient({});
    const oauth = await client.newAuth();
    const datasource = new google.datasource.GoogleSpreadsheetDatasouce(oauth, spreadsheetId);

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
