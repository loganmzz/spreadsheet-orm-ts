export type GlobalSpec = {
  collections: Record<string, CollectionSpec>
}

export type CollectionSpec = {
  name?: string,
  properties: Record<string, PropertySpec>
}

export type PropertySpec = {
  name?: string,
  resolver?: (rawValue: any) => any,
}
