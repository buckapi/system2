import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScriptLoaderService {

  private scripts: any = {};

  constructor() {}

loadScript(scriptUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        // Estamos en un entorno que no tiene acceso a `document`
        reject('Document is not available in this environment');
        return;
      }

      if (this.scripts[scriptUrl]) {
        resolve({ script: scriptUrl, loaded: true, status: 'Already Loaded' });
      } else {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = scriptUrl;
        scriptElement.onload = () => {
          this.scripts[scriptUrl] = true;
          resolve({ script: scriptUrl, loaded: true, status: 'Loaded' });
        };
        scriptElement.onerror = (error: any) => reject({ script: scriptUrl, loaded: false, status: 'Failed to Load', error });
        document.body.appendChild(scriptElement);
      }
    });
  }

  loadScripts(scriptUrls: string[]): Promise<any[]> {
    const promises: Promise<any>[] = [];
    scriptUrls.forEach((url) => promises.push(this.loadScript(url)));
    return Promise.all(promises);
  }
}
