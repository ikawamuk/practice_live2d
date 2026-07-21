
import type { GLManager } from './AliceSprite'

export class AliceGLManager implements GLManager {
	public constructor() {
		this.gl_ = null;
	}

	public initialize(canvas: HTMLCanvasElement): boolean {
		this.gl_ = canvas.getContext('webgl2');
		if (!this.gl_) {
			alert('Cannot initialize WebGL. This browser does not support.');
			this.gl_ = null;
			return (false);
		}
		return (true);
	}

	public getGL(): WebGL2RenderingContext {
		if (this.gl_ == null) { throw new Error('GLManager is not initialized'); }
		return (this.gl_);
	}

	public release(): void {}

	private gl_: WebGL2RenderingContext | null;
}
