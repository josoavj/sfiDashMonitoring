import fs from 'fs';
import axios from 'axios';
import https from 'https';
import SyslogFilterService from './SyslogFilterService.js';
import dotenv from 'dotenv';

dotenv.config();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caCertPath = path.join(__dirname, "../assets/http_ca.crt"); // 👈 remonte d’un niveau vers /src
const caCert = fs.readFileSync(caCertPath);


export default class SyslogFetchService {
  constructor() {
    this.ELK_HOST = process.env.SFI_KIBANA_HOST;
    this.KIBANA_INDEX = process.env.SFI_KIBANA_INDEX_NAME;
    this.username = process.env.SFI_KIBANA_USERNAME;
    this.password = process.env.SFI_KIBANA_PASSWORD;

    // Agent HTTPS avec certificat
    this.agent = new https.Agent({
      ca: caCert,
      rejectUnauthorized: false,
    });
  }

  async fetchLogs(limit = 25) {
    try {
      const response = await axios.get(
        `https://${this.ELK_HOST}/${this.KIBANA_INDEX}/_search`,
        {
          httpsAgent: this.agent,
          auth: { username: this.username, password: this.password },
          headers: { 'Content-Type': 'application/json' },
          data: { size: limit },
        }
      );

      const hits = response.data.hits?.hits || [];

      const results = hits.map((hit, index) => {
        const syslogFilter = new SyslogFilterService(hit);
        const syslogDto = syslogFilter.filterSyslog();
        return syslogDto;
      });

      return results;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des logs :', error.message);
      return [];
    }
  }
}
