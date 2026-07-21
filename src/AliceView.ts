
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';

import * as AliceDefine from './AliceDefine';
import { TextureInfo } from './AliceTextureManager'
import { AliceSprite } from './AliceSprite'
import type { GLManager } from './AliceSprite'
import { AlicePlatform } from './AlicePlatform';

class LogicalCanvas {
	width: number;
	height: number;
	ratio: number;
	left: number;
	right: number;
	bottom: number;
	top: number;
	public constructor(canvas: HTMLCanvasElement) {
		this.width = canvas.width;
		this.height = canvas.height;
		this.ratio = this.width / this.height;
		this.left = -this.ratio;
		this.right = this.ratio;
		this.bottom = AliceDefine.ViewLogicalBottom;
		this.top = AliceDefine.ViewLogicalTop;
	}
}

export interface TextureLoader {
	createTextureFromPngFile(
		fileName: string,
		// usePremultiply: boolean,
		callback: (textureInfo: TextureInfo) => void): void;
}

export interface ShaderCreater {
	createShader(): WebGLProgram | null;
}

export class AliceView {
	/*
		publicメソッド
	*/
	public constructor() {
		this.viewMatrix_ = new CubismViewMatrix();
		this.deviceToScreen_ = new CubismMatrix44();
		this.shader = null;
		this.background_ = null;
	}

	public initialize(canvas: HTMLCanvasElement): void {
		const logicalCanvas = new LogicalCanvas(canvas);
		this.initializeViewMatrix(logicalCanvas);
		this.initializeDeviceToScreen(logicalCanvas);
	}

	public initializeSprite(
		canvas: HTMLCanvasElement,
		glManager: GLManager,
		textureLoader: TextureLoader,
		shaderCreater: ShaderCreater,
	): void {
		const width = canvas.width;
		const height = canvas.height;
		const resourcesPath = AliceDefine.ResourcesPath;

		let imageName = '';

		imageName = AliceDefine.BackImageName;

		const initBackGroundTexture = (textureInfo: TextureInfo): void => {
			if (textureInfo.id == null) {
				throw new Error('textureInfo.id is not set');
			}
			const x: number = width * 0.5;
			const y: number = height * 0.5;
			const fheight = height * 0.95;
			const ratio = fheight / textureInfo.height;
			const fwidth = textureInfo.width * ratio;
			this.background_ = new AliceSprite(x, y, fwidth, fheight, textureInfo.id);
			this.background_.setGLManager(glManager);
		}
		textureLoader.createTextureFromPngFile(
			resourcesPath + imageName,
			initBackGroundTexture
		);
		if (this.shader == null) {
			this.shader = shaderCreater.createShader();
		}
	}

	public render(): void {
		AlicePlatform.printMessage('rendering!!!');
	}

	public release(): void {
		if (this.background_ == null) {
			return ;
		}
		this.background_.release();
	}


	/*
		privateメソッド
	*/
	private initializeViewMatrix(logicalCanvas: LogicalCanvas): void {
		this.viewMatrix_.setScreenRect(logicalCanvas.left, logicalCanvas.right, logicalCanvas.bottom, logicalCanvas.top);
		this.viewMatrix_.scale(AliceDefine.ViewScale, AliceDefine.ViewScale);
		// 表示範囲の設定
		this.viewMatrix_.setMaxScale(AliceDefine.ViewMaxScale); // 限界拡張率
		this.viewMatrix_.setMinScale(AliceDefine.ViewMinScale); // 限界縮小率
		// 表示できる最大範囲
		this.viewMatrix_.setMaxScreenRect(
			AliceDefine.ViewLogicalMaxLeft,
			AliceDefine.ViewLogicalMaxRight,
			AliceDefine.ViewLogicalMaxBottom,
			AliceDefine.ViewLogicalMaxTop
		);
	}

	private initializeDeviceToScreen(logicalCanvas: LogicalCanvas): void {
		this.deviceToScreen_.loadIdentity();
		if (logicalCanvas.width > logicalCanvas.height) {
			const screenW: number = Math.abs(logicalCanvas.right - logicalCanvas.left);
			this.deviceToScreen_.scaleRelative(screenW / logicalCanvas.width, -screenW / logicalCanvas.width);
		} else {
			const screenH: number = Math.abs(logicalCanvas.top - logicalCanvas.bottom);
			this.deviceToScreen_.scaleRelative(screenH / logicalCanvas.height, -screenH / logicalCanvas.height);
		}
		this.deviceToScreen_.translateRelative(-logicalCanvas.width * 0.5, -logicalCanvas.height * 0.5);
	}

	/*
		プロパティ
	*/
	private viewMatrix_: CubismViewMatrix;
	private deviceToScreen_: CubismMatrix44;
	private shader: WebGLProgram | null;
	private background_: AliceSprite | null;
}