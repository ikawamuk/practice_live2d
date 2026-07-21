
import * as AliceDefine from './AliceDefine';
import { AliceView } from './AliceView';
import { AliceShaderCreater } from './AliceShaderCreater';
import { AliceGLManager } from './AliceGLManager';
import { AliceTextureManager } from './AliceTextureManager';
import { AlicePlatform } from './AlicePlatform';
import { AliceLive2DManager} from './AliceLive2DManager';

export class AliceGraphicsContext {

	/*
		publicメソッド
	*/
	public constructor() {
		this.view_ = new AliceView();
		this.glManager_ = new AliceGLManager();
		this.textureManager_ = new AliceTextureManager();
		this.shaderCreater_ = new AliceShaderCreater();
		this.live2DManager_ = new AliceLive2DManager();
		this.canvas_ = null;
		this.frameBuffer_ = null;
		this.resizeObserver_ = new ResizeObserver(
		(entries: ResizeObserverEntry[], observer: ResizeObserver) =>
			this.resizeObserverCallback.call(this, entries, observer)
		);
		this.needResize_ = true;
	}

	public initialize(): boolean {
		this.canvas_ = this.makeCanvas();
		if (!this.initializeGLContext(this.canvas_)) {
			return (false);
		}

		this.setupFrameBuffer(this.frameBuffer_);
		this.setupCanvasSize(this.canvas_);

		this.shaderCreater_.setGLManager(this.glManager_);
		this.textureManager_.setGLManager(this.glManager_);

		this.view_.initialize(this.canvas_);
		this.view_.initializeSprite(
			this.canvas_,
			this.glManager_,
			this.textureManager_,
			this.shaderCreater_
		);

		this.live2DManager_.initialize();
		this.resizeObserver_.observe(this.canvas_);
		return (true);
	}

	public update(): void {
		if (this.glManager_.getGL().isContextLost()) {
			return;
		}

		if (this.needResize_) {
			this.onResize();
			this.needResize_ = false;
		}

		const gl = this.glManager_.getGL();
		// 画面の初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		// 深度テストを有効化
		gl.enable(gl.DEPTH_TEST);
		// 近くにある物体は、遠くにある物体を覆い隠す
		gl.depthFunc(gl.LEQUAL);
		// カラーバッファや深度バッファをクリアする
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearDepth(1.0);
		// 透過設定
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		// 描画更新
		if (this.canvas_ == null) {
			throw new Error('canvas is not set');
		}
		this.view_.render(this.glManager_, this.canvas_, this.live2DManager_);
	}

	public release(): void {
		if (this.canvas_) {
			this.resizeObserver_.unobserve(this.canvas_);
		}
		this.resizeObserver_.disconnect();
		this.live2DManager_.release();
		this.view_.release();
		this.textureManager_.release();
		this.glManager_.release();
	}

	public onResize(): void {
		if (this.canvas_ == null) {
			AlicePlatform.printMessage('canvas is not set');
			return ;
		}
		this.resizeCanvas();
		this.view_.initialize(this.canvas_);
		this.view_.initializeSprite(
			this.canvas_,
			this.glManager_,
			this.textureManager_,
			this.shaderCreater_
		);
	}

	public resizeCanvas(): void {
		if (this.canvas_ == null) {
			AlicePlatform.printMessage('canvas is not set');
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
	private makeCanvas(): HTMLCanvasElement {
		const width: number = 100;
		const height: number = 100;
		const canvas = document.createElement('canvas');
		canvas.style.width = `${width}vw`;
		canvas.style.height = `${height}vh`;
		document.body.appendChild(canvas);
		return (canvas);
	}

	private initializeGLContext(canvas: HTMLCanvasElement): boolean {
		if (!this.glManager_.initialize(canvas)) {
			return (false);
		}
		const gl = this.glManager_.getGL();
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		return (true);
	}

	private setupFrameBuffer(framebuffer: WebGLFramebuffer | null): void {
		if (framebuffer == null) {
			const gl = this.getGLManager().getGL();
			framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		}
	}
	private setupCanvasSize(canvas: HTMLCanvasElement): void {
		if (AliceDefine.CanvasSize === 'auto') {
			this.resizeCanvas(); // need gl
		} else {
			canvas.width = AliceDefine.CanvasSize.width;
			canvas.height = AliceDefine.CanvasSize.height;
		}
	}

	private resizeObserverCallback(
		entries: ResizeObserverEntry[],
		observer: ResizeObserver
	): void {
		if (AliceDefine.CanvasSize === 'auto') {
			this.needResize_ = true;
		}
		entries;
		observer;
	}

	/*
		プロパティ
	*/
	private view_: AliceView;

	private glManager_: AliceGLManager;
	private textureManager_: AliceTextureManager;
	private shaderCreater_: AliceShaderCreater;
	private live2DManager_: AliceLive2DManager;
	private canvas_: HTMLCanvasElement | null;
	private frameBuffer_: WebGLFramebuffer | null;

	private resizeObserver_: ResizeObserver;
	private needResize_: boolean;
}
