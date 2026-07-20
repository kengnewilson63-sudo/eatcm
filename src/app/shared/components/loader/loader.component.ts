import { Component, ChangeDetectionStrategy } from '@angular/core';
@Component({ selector:'app-loader', imports:[], changeDetection:ChangeDetectionStrategy.OnPush,
  template:`<div class="flex items-center justify-center py-20"><svg class="w-8 h-8 text-primary animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>` })
export class LoaderComponent {
  // Moyen de transport du livreur

}
