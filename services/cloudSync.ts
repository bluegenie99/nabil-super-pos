
import { db } from './db';
import { SHOP_CONFIG } from '../config';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const APP_FILE_NAME = 'superpos_cloud_data.json';

class CloudSyncEngine {
  private accessToken: string | null = null;
  private isSyncing = false;
  private syncStatus: 'idle' | 'syncing' | 'error' | 'success' = 'idle';
  private fileId: string | null = null;
  private onStatusChange: ((status: string) => void) | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('google_access_token');
    
    db.subscribe(() => {
      this.sync();
    });

    if (this.accessToken) {
        this.findOrCreateFile();
    }
  }

  setNotifyCallback(cb: (status: string) => void) {
    this.onStatusChange = cb;
    if (this.syncStatus) cb(this.syncStatus);
  }

  async initGoogleAuth() {
    // التحقق من أن المستخدم قام بتغيير الكود الافتراضي
    if (SHOP_CONFIG.google_client_id.includes('PASTE_YOUR_ID') || SHOP_CONFIG.google_client_id.includes('ضع_الكود')) {
        throw new Error("يرجى لصق الـ Client ID في ملف config.ts أولاً");
    }

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore
        const client = google.accounts.oauth2.initTokenClient({
          client_id: SHOP_CONFIG.google_client_id,
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error) {
              this.updateStatus('error');
              reject(response);
              return;
            }
            this.accessToken = response.access_token;
            localStorage.setItem('google_access_token', this.accessToken!);
            this.updateStatus('success');
            await this.findOrCreateFile();
            await this.sync();
            resolve(true);
          },
        });
        client.requestAccessToken();
      } catch (e) {
        reject(e);
      }
    });
  }

  private updateStatus(s: any) {
    this.syncStatus = s;
    if (this.onStatusChange) this.onStatusChange(s);
  }

  private async findOrCreateFile() {
    if (!this.accessToken) return;
    try {
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${APP_FILE_NAME}'&spaces=drive`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      
      if (resp.status === 401) {
        this.accessToken = null;
        localStorage.removeItem('google_access_token');
        this.updateStatus('idle');
        return;
      }

      const data = await resp.json();
      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
      } else {
        const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: APP_FILE_NAME, mimeType: 'application/json' })
        });
        const newFile = await createResp.json();
        this.fileId = newFile.id;
      }
      this.updateStatus('success');
    } catch (e) {
      console.error('File Error:', e);
      this.updateStatus('error');
    }
  }

  async sync() {
    if (!this.accessToken || !this.fileId || this.isSyncing) return;
    
    this.isSyncing = true;
    this.updateStatus('syncing');

    try {
      const store = db.getRawStore();
      const metadata = { name: APP_FILE_NAME, mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(store)], { type: 'application/json' }));

      const resp = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form
      });

      if (resp.ok) {
        this.updateStatus('success');
      } else {
        this.updateStatus('error');
      }
    } catch (e) {
      console.error('Sync failed:', e);
      this.updateStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }

  async restoreFromCloud() {
    if (!this.accessToken || !this.fileId) return;
    try {
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const cloudData = await resp.json();
      db.updateFromCloud(cloudData);
      return true;
    } catch (e) {
      return false;
    }
  }

  getStatus() { return this.syncStatus; }
}

export const cloudSync = new CloudSyncEngine();
