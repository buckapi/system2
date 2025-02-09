/* import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadStyleServiceService {
  loadStyle(href: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class LoadStyleServiceService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  loadStyle(styleUrl: string) {
    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleUrl;
      document.head.appendChild(link);
    }
  }
}
