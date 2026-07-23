import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import type { Model } from './AliceLive2DManager';

import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';
import { TextureInfo, AliceTextureManager } from './AliceTextureManager';


const LoadStep = {
	LoadingAssets: "LoadingAssets",
	LoadingModel: "LoadingModel",
	LoadingTexture: "toLoadTexture",
	CompleteSetup: "CompleteSetup"
} as const;

type LoadStep = (typeof LoadStep)[keyof typeof LoadStep];

export interface GraphicsContext {
	getCanvas(): HTMLCanvasElement;
	getFrameBuffer(): WebGLFramebuffer;
	getGLManager(): AliceGLManager;
	getTextureManager(): AliceTextureManager;
}

export class AliceModel extends CubismUserModel implements Model {
	public update(): void {
		if (this.state_ != LoadStep.CompleteSetup) return ;
		const deltaTimeSeconds: number = AlicePlatform.getDeltaTime();
		this.userTimeSeconds_ += deltaTimeSeconds;

		this._model.loadParameters();

		if (this._motionManager.isFinished()) {
			; // this.startRandomMothion();
		} else {
			this._motionManager.updateMotion(
				this._model,
				deltaTimeSeconds
			);
		}
		this._model.saveParameters();
		this._model.update();
	}

	public draw(matrix: CubismMatrix44, graphicsContext: GraphicsContext): void {
		if (this._model == null || this.state_ != LoadStep.CompleteSetup) return ;
		matrix.multiplyByMatrix(this._modelMatrix);
		this.getRenderer().setMvpMatrix(matrix);
		this.doDraw(graphicsContext);
	}

	public doDraw(graphicsContext: GraphicsContext) {
		if (this._model == null) return ;
		const canvas = graphicsContext.getCanvas();
		const viewport: number[] = [0, 0, canvas.width, canvas.height];
		this.getRenderer().setRenderState(
			graphicsContext.getFrameBuffer(),
			viewport
		);
		this.getRenderer().drawModel(AliceDefine.ShaderPath);
	}

	public async loadAssets(dir: string, modelJsonFileName: string, graphicsContext: GraphicsContext): Promise<void> {
		this.modelHomeDir_ = dir;
		const url = `${this.modelHomeDir_}${modelJsonFileName}`;
		console.log(`[AliceModel] initializing: ${url}`);

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`failed to load model file ${url} (status ${response.status})`);
			}
			const arrayBuffer = await response.arrayBuffer();
			const setting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
			await this.setupModel(setting, graphicsContext.getCanvas(), graphicsContext.getGLManager());
			await this.setupTexture(graphicsContext.getTextureManager());
		} catch (error) {
			AlicePlatform.printError('Failed to load Assets', error as Error);
		}
	}

	public constructor() {
		super();
		this.state_ = LoadStep.LoadingAssets;
		this.textureCount_ = 0;
		this.userTimeSeconds_ = 0.0;
		this.modelSetting_ = null;
		this.modelHomeDir_ = null;
	}

	private async setupModel(setting: ICubismModelSetting, canvas: HTMLCanvasElement, glManager: AliceGLManager): Promise<void> {

		// "Moc"
		this.modelSetting_ = setting;
		const mocFileName = this.modelSetting_.getModelFileName();
		if (mocFileName == '') { throw new Error('Model file does not exist.'); }
		
		const path = this.modelHomeDir_ + mocFileName;
		const response = await fetch(path)
		if (!response.ok) { throw new Error(`Failed to load moc file ${path} (status ${response.status})`); }
		
		const arrayBuffer = await response.arrayBuffer();
		this.state_ = LoadStep.LoadingModel;
		this.loadModel(arrayBuffer, this._mocConsistency);

		this.createRenderer(canvas.width, canvas.height);
		this.getRenderer().startUp(glManager.getGL());
		this.getRenderer().loadShaders(AliceDefine.ShaderPath);
	}

	private async setupTexture(textureManager: AliceTextureManager): Promise<void> {
		if (this.modelSetting_ == null) { return ; }
		const textureCount: number = this.modelSetting_.getTextureCount();
		for (let i = 0; i < textureCount; ++i) {
			if (this.modelSetting_.getTextureFileName(i) == '') {
				AlicePlatform.printMessage('getTextureFileName null');
				continue ;
			}
			let texturePath = this.modelHomeDir_ + this.modelSetting_.getTextureFileName(i);
			const onLoad = (textureInfo: TextureInfo): void => {
				if (textureInfo.id == null) {
					return ;
				}
				this.getRenderer().bindTexture(i, textureInfo.id);
				++this.textureCount_;
				if (this.textureCount_ >= textureCount) {
					this.state_ = LoadStep.CompleteSetup;
				}
			};

			this.state_ = LoadStep.LoadingTexture;
			textureManager.createTextureFromPngFile(texturePath, onLoad);
			this.getRenderer().setIsPremultipliedAlpha(true);
		}
	}

	private state_: LoadStep;

	private textureCount_: number;

	private userTimeSeconds_: number;

	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;

}
