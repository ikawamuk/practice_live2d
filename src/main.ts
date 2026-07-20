
import { AliceApp } from './AliceApp.ts'

window.addEventListener(
	'load',
	(): void => {
		if (!AliceApp.getInstance().initialize()) {
			return ;
		}
		AliceApp.getInstance().run();
	}
);

window.addEventListener(
  'beforeunload',
  (): void => AliceApp.releaseInstance(),
  { passive: true }
);
