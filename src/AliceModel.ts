import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import {
//  CSM_ASSERT,
  CubismLogError,
//  CubismLogInfo
} from '@framework/utils/cubismdebug';


import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';


const LoadStep = {
	LoadingAssets: "LoadingAssets",
	LoadingModel: "LoadingModel",
	CompleteSetup: "CompleteSetup"
} as const;

type LoadStep = (typeof LoadStep)[keyof typeof LoadStep];

export interface GraphicsContext {
	getCanvas(): HTMLCanvasElement;
	getFrameBuffer(): WebGLFramebuffer;
	getGLManager(): AliceGLManager;
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

	public loadAssets(dir: string, fileName: string, graphicsContext: GraphicsContext): void {
		this.modelHomeDir_ = dir;
		const url = `${this.modelHomeDir_}${fileName}`;
		console.log(`[AliceModel] loadAssets 開始: ${url}`);

		fetch(url)
			.then((response) => { return response.arrayBuffer(); })
			.then(arrayBuffer => {
				const setting: ICubismModelSetting = new CubismModelSettingJson(
					arrayBuffer,
					arrayBuffer.byteLength
				);

				this.state_ = LoadStep.LoadingModel;
				AlicePlatform.printMessage(this.state_); // 
				this.setupModel(setting, graphicsContext);
			})
			.catch(error => {
				error;
				CubismLogError(`Failed to load file ${this.modelHomeDir_}${fileName}`);
			});
	}

	public constructor() {
		super();
		this.state_ = LoadStep.LoadingAssets;

		this.userTimeSeconds_ = 0.0;

		this.modelSetting_ = null;
		this.modelHomeDir_ = null;
	}

	private setupModel(setting: ICubismModelSetting, graphicsContext: GraphicsContext): void {
		this.modelSetting_ = setting;
		const modelFileName = this.modelSetting_.getModelFileName();
		if (modelFileName == '') {
			AlicePlatform.printMessage('Model data does not exist.');
		} else {
			const path = this.modelHomeDir_ + modelFileName;
			fetch(path)
				.then(response => {
					if (response.ok) {
						return (response.arrayBuffer());
					} else if (response.status >= 400) {
						CubismLogError(`Failed to load file ${this.modelHomeDir_}${modelFileName}`);
						return new ArrayBuffer(0);
					} else {
						throw new Error('unexpected error occuered while loading model file');
					}
				})
				.then(arrayBuffer => {
					this.loadModel(arrayBuffer, this._mocConsistency);
					this.state_ = LoadStep.CompleteSetup;
					AlicePlatform.printMessage(this.state_ );
				})
				.then(() => {
					const canvas = graphicsContext.getCanvas();
					this.createRenderer(canvas.width, canvas.height);
					this.getRenderer().startUp(graphicsContext.getGLManager().getGL());
					this.getRenderer().loadShaders(AliceDefine.ShaderPath);
				});
		}
		
	}

	private state_: LoadStep;


	private userTimeSeconds_: number = 0.0;

	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;
}
