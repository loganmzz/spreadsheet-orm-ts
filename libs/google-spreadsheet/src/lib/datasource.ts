import * as core from '@spreadsheet-orm/core';

import { OAuth2Client } from 'google-auth-library';
import { google, sheets_v4 }  from 'googleapis';

export class GoogleSpreadsheetDatasouce implements core.datasource.Datasource {
  private client: sheets_v4.Sheets;
  private collections: Record<string, Promise<GoogleSpreadsheetCollection>> = {};
  constructor(
    private oauth: OAuth2Client,
    readonly spreadsheetId: string,
  ) {
    this.client = google.sheets({version: 'v4', auth: this.oauth});
  }

  async getCollection(name: string): Promise<core.datasource.Collection> {
    let collection = this.collections[name];
    if (collection === undefined) {
      collection = Promise.resolve(new GoogleSpreadsheetCollection(name, this.client, this.spreadsheetId));
      this.collections[name] = collection;
    }
    return await collection;
  }
}

export class GoogleSpreadsheetCollection implements core.datasource.Collection {
  constructor(
    private name: string,
    private client: sheets_v4.Sheets,
    private spreadsheetId: string,
  ) {}

  async* getRows(): AsyncGenerator<core.datasource.Row> {
    const response = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.name,
      valueRenderOption: 'UNFORMATTED_VALUE',
    })
    for (const row of response.data.values ?? []) {
      yield new GoogleSpreadsheetRow(row);
    }
  }
}

export class GoogleSpreadsheetRow implements core.datasource.Row {
  data: Promise<any>;
  constructor(
    data: any[],
  ) {
    this.data = Promise.resolve(data);
  }

  getValues(): Promise<any[]> {
    return this.data;
  }
}
