export type Datasource = {
  getCollection(name: string): Promise<Collection>,
}

export type Collection = {
  getRows(): AsyncGenerator<Row>,
}

export type Row = {
  getValues(): Promise<any[]>,
}
