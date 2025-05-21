export type Datasource = {
  getCollection(name: string): Promise<Collection>,
}

export type CollectionGetRowsInput = {
  rows?: [number,number],
}

export type Collection = {
  getRows(query?: CollectionGetRowsInput): AsyncGenerator<Row>,
}

export type Row = {
  getValues(): Promise<any[]>,
}
