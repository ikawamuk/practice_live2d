
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismWebGLOffscreenManager } from '@framework/rendering/cubismoffscreenmanager';

import type { Live2DManager } from './AliceView';

import * as AliceDefine from './AliceDefine';
import { AliceModel } from './AliceModel';
import { AlicePlatform } from './AlicePlatform';
import type { DrawingContext } from './AliceModel';

export interface Model {
	loadAssets(modelPath: string, modelJsonName: string, drawingContext: DrawingContext): void;
	update(): void;
	draw(projection: CubismMatrix44, drawingContext: DrawingContext): void;
}

export class AliceLive2DManager implements Live2DManager {
	public constructor() {
		this.viewMatrix_ = new CubismMatrix44();
		this.model_ = null;
	}

	public initialize(drawingContext: DrawingContext): void {
		const modelName: string = AliceDefine.ModelName;
		if (AliceDefine.DebugLogEnable) {
			AlicePlatform.printMessage(`[APP]model name: '${modelName}'`);
		}
		const modelPath: string = AliceDefine.ResourcesPath + modelName + '/';
		let modelJsonName: string = AliceDefine.ModelName;
		modelJsonName += '.model3.json';

		const modelInstance = new AliceModel();
		modelInstance.loadAssets(modelPath, modelJsonName, drawingContext);
		this.model_ = modelInstance;
	}

	public release(): void {}

	public setViewMatrix(matrix: CubismMatrix44): void {
		for (let i = 0; i < 16; i++) {
			this.viewMatrix_.getArray()[i] = matrix.getArray()[i];
		}
	}

	public onUpdate(drawingContext: DrawingContext): void {
		if (this.model_ == null) {
			return ;
		}
		const gl = drawingContext.getGLManager().getGL();
		CubismWebGLOffscreenManager.getInstance().beginFrameProcess(gl);
		{
			const projection: CubismMatrix44 = this.setupProjection(drawingContext.getCanvas());
			this.model_.update();
			this.model_.draw(projection, drawingContext);
		}
		// モデルで使用するオフスクリーン管理の終了処理
		CubismWebGLOffscreenManager.getInstance().endFrameProcess(gl);
		// もし余っているオフスクリーンのリソースを解放したい場合行う処理
		CubismWebGLOffscreenManager.getInstance().releaseStaleRenderTextures(gl);
	}

	private setupProjection(canvas: HTMLCanvasElement): CubismMatrix44 {
		const { width, height } = canvas;
		const projection: CubismMatrix44 = new CubismMatrix44();
		// 横に長いモデルを縦長ウィンドウに表示する際モデルの横サイズでscaleを算出する
		// if (横に長いモデルを縦長ウィンドウに表示する際モデルの横サイズでscaleを算出する) {
		// 		...
		// } 
		// else {
			projection.scale(height / width, 1.0);
		// }
		projection.multiplyByMatrix(this.viewMatrix_);
		return (projection);
	}

	private viewMatrix_: CubismMatrix44;
	private model_: Model | null;
}
