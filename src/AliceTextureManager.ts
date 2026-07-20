
import { AlliceGLManager } from './AlliceGLManager'

export class AliceTextureManager {
	public constructor() {
		this.glManager_ = null;
	}
	public setGLManager(glManager_: AlliceGLManager): void {
		this.glManager_ = glManager_;
	}

	private glManager_: AlliceGLManager | null;
}
