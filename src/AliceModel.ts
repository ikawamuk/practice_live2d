import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';
import { CubismPhysicsUpdater } from '@framework/motion/cubismphysicsupdater';
import { CubismUpdateScheduler } from '@framework/motion/cubismupdatescheduler';

import type {
  ACubismMotion,
//  BeganMotionCallback,
//  FinishedMotionCallback
} from '@framework/motion/acubismmotion';

//import { CubismMotion } from '@framework/motion/cubismmotion';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import type { Model } from './AliceLive2DManager';

import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';
import { AliceTextureManager } from './AliceTextureManager';


const LoadStep = {
	LoadingAssets: "LoadingAssets",
	LoadingModel: "LoadingModel",
	LoadingPhysics: "LoadingPhysics",
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
			; //this.startRandomMotion(AliceDefine.MotionGroupIdle, AliceDefine.PriorityIdle);
		} else {
			this._motionManager.updateMotion(
				this._model,
				deltaTimeSeconds
			);
		}

		this._model.saveParameters();
		this.updateScheduler_.onLateUpdate(this._model, deltaTimeSeconds);
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
			await this.setupPhysics();
			await this.setupTexture(graphicsContext.getTextureManager());
		} catch (error) {
			AlicePlatform.printError('Failed to load Assets', error as Error);
		}
	}

	public constructor() {
		super();
		this.state_ = LoadStep.LoadingAssets;
		this.motions_ = new Map<string, ACubismMotion>();
		this.userTimeSeconds_ = 0.0;
		this.modelSetting_ = null;
		this.updateScheduler_ = new CubismUpdateScheduler();
		this.modelHomeDir_ = null;
	}

	public release(): void {
		if (this.updateScheduler_) {
			this.updateScheduler_.release();
		}
		super.release();
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


	private async setupPhysics(): Promise<void> {
		if (this.modelSetting_ == null
		|| this.modelSetting_.getPhysicsFileName() == '') { return ; }
		const path = this.modelHomeDir_ + this.modelSetting_.getPhysicsFileName();
		const response = await fetch(path);
		if (!response.ok) { return AlicePlatform.printMessage(`failed to load physics file ${path} (status ${response.status})`); }
		const arrayBuffer = await response.arrayBuffer();
		this.state_ = LoadStep.LoadingPhysics;
		this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);
		if (this._physics) {
			const physicsUpdater = new CubismPhysicsUpdater(this._physics);
			this.updateScheduler_.addUpdatableList(physicsUpdater);
		}
	}

	private async setupTexture(textureManager: AliceTextureManager): Promise<void> {
		if (this.modelSetting_ == null) { return ; }
		const textureCount: number = this.modelSetting_.getTextureCount();
		this.state_ = LoadStep.LoadingTexture;
		let isTextureBinded = false;
		for (let i = 0; i < textureCount; ++i) {
			if (this.modelSetting_.getTextureFileName(i) == '') {
				AlicePlatform.printMessage('getTextureFileName null');
				continue ;
			}
			const texturePath = this.modelHomeDir_ + this.modelSetting_.getTextureFileName(i);
			const textureInfo = await textureManager.createTextureFromPngFile(texturePath);
			if (textureInfo.id != null) {
				this.getRenderer().bindTexture(i, textureInfo.id);
				isTextureBinded = true;
			}
			this.getRenderer().setIsPremultipliedAlpha(true);
		}
		if (!isTextureBinded) throw new Error(`Failed to bind texture file`);
		this.state_ = LoadStep.CompleteSetup;
	}

	//private startMotion(
	//	group: string,
	//	no: number,
	//	priority: number,
	//): void {
	//	AlicePlatform.printMessage('HERE1');
	//	if (priority == AliceDefine.PriorityForce) {
	//		this._motionManager.setReservePriority(priority);
	//	} else if (!this._motionManager.reserveMotion(priority)) {
	//		if (this._debugMode) { AlicePlatform.printMessage(`[APP]can't start motion.`); }
	//		return ;
	//	}
	//	AlicePlatform.printMessage('HERE2');
	//	const name = `${group}_${no}`;
	//	const motion: CubismMotion = this.motions_.get(name) as CubismMotion;
	//	let autoDelete = false;
	//	if (motion == null) { return ; }
	//	//motion.setBeganMotionHandler(null as BeganMotionCallback);
	//	//motion.setFinishedMotionHandler(null as FinishedMotionCallback);
		
	//	return (this._motionManager.startMotionPriority(motion, autoDelete, priority));
	//}

	//private startRandomMotion(
	//	group: string,
	//	priority: number,
	//): void {
	//	AlicePlatform.printMessage(`getMotionCount ${this.modelSetting_!.getMotionCount(group)}`);
	//	if (this.modelSetting_ == null || this.modelSetting_.getMotionCount(group) == 0) { return ;}
	//	const no: number = Math.floor(Math.random() * this.modelSetting_.getMotionCount(group));
	//	return (this.startMotion(group, no, priority));
	//}


	private state_: LoadStep;

	private userTimeSeconds_: number;

	//private motions_: Map<string, ACubismMotion>;

	private updateScheduler_: CubismUpdateScheduler;
	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;

}
