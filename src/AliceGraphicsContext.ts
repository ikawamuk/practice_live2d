
import * as AliceDefine from './AliceDefine';
import { AliceView } from './AliceView';
import type { ShaderCreater } from './AliceView';
import { AliceGLManager } from './AliceGLManager';
import { AliceTextureManager } from './AliceTextureManager';

export class AliceGraphicsContext implements ShaderCreater {

	/*
		publicメソッド
	*/
	public constructor() {
		this.view_ = new AliceView();
		this.glManager_ = new AliceGLManager();
		this.textureManager_ = new AliceTextureManager();
		this.canvas_ = null;
		this.frameBuffer_ = null;
	}

	public initialize(): boolean {
		this.canvas_ = this.makeNewCanvas();
	
		if (!this.glManager_.initialize(this.canvas_)) {
			return (false);
		}

		if (AliceDefine.CanvasSize === 'auto') {
			this.resizeCanvas(); // need gl
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

		this.view_.initialize(this.canvas_);
		this.view_.initializeSprite(this.canvas_, this.glManager_, this.textureManager_, this);
		return (true);
	}

	public update(): void {
		if (this.glManager_.getGL().isContextLost()) {
			return;
		}
		
	}

	public release(): void {

		this.view_.release();
		this.textureManager_.release();
		this.glManager_.release();
	}

	public createShader(): WebGLProgram {
		const gl = this.glManager_.getGL();
		// ...
		const shaderProgramID = gl.createProgram();
		// ...
		return (shaderProgramID);
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

	public getGLManager(): AliceGLManager {
		return (this.glManager_);
	}

	public getTextureManager(): AliceTextureManager {
		return (this.textureManager_);
	}

	public getCanvas(): HTMLCanvasElement {
		if (this.canvas_ == null) { throw new Error('canvas is not initialized'); }
		return (this.canvas_);
	}

	/*
		privateメソッド
	*/
	private makeNewCanvas(): HTMLCanvasElement {
		const width: number = 100;
		const height: number = 100;
		const canvas = document.createElement('canvas');
		canvas.style.width = `${width}vw`;
		canvas.style.height = `${height}vh`;
		document.body.appendChild(canvas);
		return (canvas);
	}

	/*
		プロパティ
	*/
	private view_: AliceView;

	private glManager_: AliceGLManager;
	private textureManager_: AliceTextureManager;
	private canvas_: HTMLCanvasElement | null;
	private frameBuffer_: WebGLFramebuffer | null;
}
