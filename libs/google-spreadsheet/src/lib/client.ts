import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { authenticate } from '@google-cloud/local-auth';
import { OAuth2Client } from 'google-auth-library';
import { google }  from 'googleapis';

const DEFAULT_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export type GoogleClientConfigurationLike = {
  tokenPath?: string,
  keyfilePath?: string,
  scopes?: string[],
}

type GoogleClientConfiguration = {
  tokenPath: string,
  keyfilePath: string,
  scopes: string[],
}

function toAbsoluePath(filepath: string): string {
  filepath = path.normalize(filepath);
  if (!path.isAbsolute(filepath)) {
    filepath = path.join(process.cwd(), filepath);
  }
  return filepath;
}

export class GoogleClient {
  private configuration: GoogleClientConfiguration;
  constructor(
    configuration: GoogleClientConfigurationLike,
  ) {
    this.configuration = {
      tokenPath: toAbsoluePath(configuration?.tokenPath || '.local.google-token.json'),
      keyfilePath: toAbsoluePath(process.env.GOOGLE_APPLICATION_CREDENTIALS || '.credentials.json'),
      scopes: configuration?.scopes ?? DEFAULT_SCOPES,
    }
  }

  async newAuth(): Promise<OAuth2Client> {
    let googleAuth: any = undefined;
    if (fs.existsSync(this.configuration.tokenPath)) {
      try {
        const content = await fsp.readFile(this.configuration.tokenPath, { encoding: 'utf-8' });
        const credentials = JSON.parse(content);
        googleAuth = google.auth.fromJSON(credentials);
      } catch (err) {
        //FIXME Emit warning
      }
    }

    if (googleAuth === undefined) {
      //FIXME Log `Using Google Credentials from ${JSON.stringify(keyfilePath)}`
      googleAuth = await authenticate({
        scopes: this.configuration.scopes,
        keyfilePath: this.configuration.keyfilePath,
      });
      //FIXME Log `Connected to Google Services`
      if (googleAuth.credentials) {
        const content = await fsp.readFile(this.configuration.keyfilePath, { encoding: 'utf-8' });
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
          type: 'authorized_user',
          client_id: key.client_id,
          client_secret: key.client_secret,
          refresh_token: googleAuth.credentials.refresh_token,
        });
        await fsp.writeFile(this.configuration.tokenPath, payload, { encoding: 'utf-8' });
      }
    }
    return googleAuth as OAuth2Client;
  }
}

