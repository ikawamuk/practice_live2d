
import * as AliceDefine from './AliceDefine';
import { AlliceGLManager } from './AlliceGLManager'
import { AliceTextureManager } from './AliceTextureManager'


export class AliceGraphicsContext {
	public constructor() {
		this.canvas_ = null;
		this.glManager_ = new AlliceGLManager();
		this.textureManager_ = new AliceTextureManager();
		this.frameBuffer_ = null;
	}

	public initialize(): boolean {
		const width: number = 100;
		const height: number = 100;
		this.canvas_ = document.createElement('canvas');
		this.canvas_.style.width = `${width}vw`;
		this.canvas_.style.height = `${height}vh`;
		document.body.appendChild(this.canvas_);

		if (!this.glManager_.initialize(this.canvas_)) {
			return (false);
		}

		if (AliceDefine.CanvasSize === 'auto') {
			this.resizeCanvas();
		} else {
			this.canvas_.width = AliceDefine.CanvasSize.width;
			this.canvas_.height = AliceDefine.CanvasSize.height;
		}

		this.textureManager_.setGLManager(this.glManager_);
		const gl = this.glManager_.getGL();
		if (this.frameBuffer_ == null) {
			this.frameBuffer_ = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		}
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


		return (true);
	}

	public update(): void {
		if (this.glManager_.getGL().isContextLost()) {
			return;
			}
	}

	public release(): void {

	}

	public resizeCanvas(): void {
		if (this.canvas_ == null) {
			return ;
		}
		this.canvas_.width = this.canvas_.clientWidth * window.devicePixelRatio;
		this.canvas_.height = this.canvas_.clientHeight * window.devicePixelRatio;
		const gl = this.glManager_.getGL();
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	}

	public getCanvas(): HTMLCanvasElement {
		if (this.canvas_ == null) { throw new Error('canvas is not initialized'); }
		return (this.canvas_);
	}

	private glManager_: AlliceGLManager;
	private textureManager_: AliceTextureManager;
	private canvas_: HTMLCanvasElement | null;
	private frameBuffer_: WebGLFramebuffer | null;
}
