import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';
import { AliceTextureManager } from './AliceTextureManager';


const LoadStep = {
	LoadingAssets: "LoadingAssets",
	LoadingModel: "LoadingModel",
	LoadingTexture: "LoadingTexture",
	CompleteSetup: "CompleteSetup"
} as const;

type LoadStep = (typeof LoadStep)[keyof typeof LoadStep];

export interface GraphicsContext {
	getCanvas(): HTMLCanvasElement;
	getFrameBuffer(): WebGLFramebuffer;
	getGLManager(): AliceGLManager;
	getTextureManager(): AliceTextureManager;
}

export class AliceModel extends CubismUserModel {
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
		console.log(`[AliceModel] loadAssets 開始: ${url}`);

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`failed to load model file ${url} (status ${response.status})`);
			}
			const arrayBuffer = await response.arrayBuffer();
			const setting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
			await this.setupModel(setting, graphicsContext); 
		} catch (error) {
			AlicePlatform.printError('Failed to load Assets', error as Error);
		}
	}

	public constructor() {
		super();
		this.state_ = LoadStep.LoadingAssets;
		this.modelSetting_ = null;
		this.modelHomeDir_ = null;
	}

	private async setupModel(setting: ICubismModelSetting, graphicsContext: GraphicsContext): Promise<void> {

		// "Moc"
		this.modelSetting_ = setting;
		const mocFileName = this.modelSetting_.getModelFileName();
		if (mocFileName == '') {
			throw new Error('Model file does not exist.');
		}
		const path = this.modelHomeDir_ + mocFileName;
		const response = await fetch(path)
		if (!response.ok) {
			throw new Error(`Failed to load moc file ${path} (status ${response.status})`);
		}
		const arrayBuffer = await response.arrayBuffer();
		this.state_ = LoadStep.LoadingModel;
		this.loadModel(arrayBuffer, this._mocConsistency);

		const canvas = graphicsContext.getCanvas();
		this.createRenderer(canvas.width, canvas.height);

		this.getRenderer().startUp(graphicsContext.getGLManager().getGL());
		this.getRenderer().loadShaders(AliceDefine.ShaderPath);

		// "Textrue"
		this.state_ = LoadStep.CompleteSetup;
	}


	private state_: LoadStep;

	private userTimeSeconds_: number = 0.0;

	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;
}
