import core from '@spreadsheet-orm/core';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

export class FilesDatasource implements core.datasource.Datasource {
  collections: Record<string, Promise<FilesCollection>> = {};
  constructor(readonly directory: string) {}

  async getCollection(name: string): Promise<core.datasource.Collection> {
    let getCollection = this.collections[name];
    if (getCollection === undefined) {
      const filename = `${name}.csv`;
      const fullpath = path.join(this.directory, filename);
      if (fs.existsSync(fullpath)) {
        getCollection = Promise.resolve(new FilesCollection(name, fullpath));
      } else {
        getCollection = Promise.reject(new Error(`Collection ${JSON.stringify(name)} not found: no file ${JSON.stringify(fullpath)}`));
      }
      this.collections[name] = getCollection;
    }
    return getCollection;
  }
}

export class FilesCollection implements core.datasource.Collection {
  constructor(
    readonly name: string,
    readonly path: string,
  ) {}

  async* getRows(query?: core.datasource.CollectionGetRowsInput): AsyncGenerator<core.datasource.Row> {
    const reader = readline.createInterface({
      input: fs.createReadStream(this.path),
      crlfDelay: Infinity,
    });
    const firstRowIndex = query?.rows?.[0] ?? 0;
    const lastRowIndex = query?.rows?.[1] ?? Infinity;
    let rowIndex = 0;
    for await (const line of reader) {
      const currentRowIndex = rowIndex++;
      if (currentRowIndex <  firstRowIndex) continue;
      if (currentRowIndex >= lastRowIndex) break;
      let values: any = undefined;
      try {
        values = JSON.parse(`[${line}]`);
      } catch (e) {
        throw new Error(`Error reading collection ${JSON.stringify(this.name)}: ${this.path}:${currentRowIndex}: Invalid content: ${e}`, { cause: e });
      }
      yield new FilesRow(currentRowIndex, values);
    }
  }
}

export class FilesRow implements core.datasource.Row {
  private values: Promise<any[]>;
  constructor(
    readonly index: number,
    values: any[]
  ) {
    this.values = Promise.resolve(values);
  }

  getValues(): Promise<any[]> {
    return this.values;
  }
}
