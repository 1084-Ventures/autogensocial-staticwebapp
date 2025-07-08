
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { preloadStandaloneComponents } from './app/components/loading/preload-components';

bootstrapApplication(AppComponent, appConfig)
  .then(() => preloadStandaloneComponents())
  .catch((err) => console.error(err));
