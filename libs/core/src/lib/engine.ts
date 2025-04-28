import {
  Datasource,
} from './datasource';
import {
  GlobalSpec,
} from './spec';

export class Engine {

  private resolvers: Record<string, Promise<CollectionResolver>> = {};

  constructor(
    readonly datasource: Datasource,
    readonly spec: GlobalSpec,
  ) {}

  async* readAll<T>(collection: string): AsyncGenerator<T> {
    let getResolver = this.resolvers[collection];
    if (getResolver === undefined) {
      const collectionSpec = this.spec.collections[collection];
      if (collectionSpec === undefined) {
        throw new Error(`Unknown collection ${JSON.stringify(collection)}`);
      }
      getResolver = CollectionResolver.init(this, collection);
      this.resolvers[collection] = getResolver;
    }
    const resolver = await getResolver;
    for await (const entity of resolver.readAll<T>()) {
      yield entity;
    }
  }
}

type CellMapping = {
  key: string,
  name: string,
  index: number,
  resolver: (raw: any) => any,
}

class CollectionResolver {
  constructor(
    readonly engine: Engine,
    readonly name: string,
    readonly mappings: CellMapping[],
  ) {}

  static async init(engine: Engine, name: string): Promise<CollectionResolver> {
    const spec = engine.spec.collections[name];
    if (spec === undefined) {
      throw new Error(`No specification found for collection ${JSON.stringify(name)}`);
    }

    const collectionName = spec.name ?? name;
    const collection = await engine.datasource.getCollection(collectionName);

    const rows = collection.getRows();
    const row = await rows.next();
    if (row.done) {
      throw new Error(`No title row for collection ${JSON.stringify(name)}`);
    }

    const mappingByName: Record<string, CellMapping> = {};
    for (const key in spec.properties) {
      const property = spec.properties[key];
      const name = property.name ?? key;
      mappingByName[name] = {
        key,
        name,
        index: -1,
        resolver: property.resolver ?? ((value: any) => value),
      }
    }

    const mappings: CellMapping[] = [];
    const cells = await row.value.getValues();
    for (let i = 0; i < cells.length; i++) {
      const mapping = mappingByName[cells[i]];
      if (mapping) {
        mapping.index = i;
        mappings.push(mapping);
      }
    }

    return new CollectionResolver(engine, name, mappings);
  }

  async* readAll<T>(): AsyncGenerator<T> {
    const collection = await this.engine.datasource.getCollection(this.name);
    const rows = collection.getRows();
    let next = await rows.next();
    if (next.done) return;

    for await (const row of rows) {
      const raws = await row.getValues();
      const data: Record<string, any> = {};
      for (const mapping of this.mappings) {
        const raw = mapping.index < raws.length ? raws[mapping.index] : undefined;
        const value = mapping.resolver(raw);
        data[mapping.key] = value;
      }
      yield data as T;
    }
  }
}
