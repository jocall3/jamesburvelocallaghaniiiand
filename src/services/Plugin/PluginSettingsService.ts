```typescript
import { Storage } from '@ionic/storage-angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PluginSettingsService {

  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
  }

  public set(pluginId: string, settingKey: string, value: any): Promise<void> {
    return this._storage?.set(`${pluginId}.${settingKey}`, value);
  }

  public get(pluginId: string, settingKey: string): Promise<any> {
    return this._storage?.get(`${pluginId}.${settingKey}`);
  }

  public remove(pluginId: string, settingKey: string): Promise<void> {
    return this._storage?.remove(`${pluginId}.${settingKey}`);
  }

  public clearPluginSettings(pluginId: string): Promise<void> {
    return this.getAllKeys()
      .then(keys => {
        const keysToRemove = keys.filter(key => key.startsWith(pluginId + '.'));
        return Promise.all(keysToRemove.map(key => this._storage?.remove(key)));
      })
      .then(() => {
        return Promise.resolve();
      });
  }

  private getAllKeys(): Promise<string[]> {
    return this._storage?.keys() || Promise.resolve([]);
  }
}
```