import { Injectable } from '@angular/core';
import {ScriptStore} from "./script.store";

declare var document: any;

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private scripts: any = {};  
  constructor() { 
    ScriptStore.forEach((script: any) => {
      this.scripts[script.name] = {
          loaded: false,
          src: script.src
      };
  }); 
  }

  load(...scripts: string[]) {
    const loadTimes: any[] = [];
    const promises = scripts.map(script => () => {
      const startTime = performance.now();
      return this.loadScript(script).then(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        loadTimes.push({script, loadTime});
      });
    });
    return promises.reduce((p, fn) => p.then(fn), Promise.resolve())
      .then(() => {
        // console.table(loadTimes); // muestra por consola la tabla de scripts cargados
      });
  }

  loadScript(name: string) {
    return new Promise((resolve, reject) => {
        //resolve if already loaded
        if (this.scripts[name].loaded) {
            resolve({script: name, loaded: true, status: 'Already Loaded'});
        }
        else {
            //load script
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = this.scripts[name].src;
            if (script.readyState) {  //IE
                script.onreadystatechange = () => {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null;
                        this.scripts[name].loaded = true;
                        resolve({script: name, loaded: true, status: 'Loaded'});
                    }
                };
            } else {  //Others
                script.onload = () => {
                    this.scripts[name].loaded = true;
                    resolve({script: name, loaded: true, status: 'Loaded'});
                };
            }
            script.onerror = (error: any) => resolve({script: name, loaded: false, status: 'Loaded'});
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    });
  }

}
