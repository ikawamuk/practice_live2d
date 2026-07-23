import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';
import { CubismPhysicsUpdater } from '@framework/motion/cubismphysicsupdater';
import { CubismUpdateScheduler } from '@framework/motion/cubismupdatescheduler';

import { CubismEyeBlink } from '@framework/effect/cubismeyeblink';
import { CubismEyeBlinkUpdater } from '@framework/motion/cubismeyeblinkupdater';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import type { Model } from './AliceLive2DManager';

import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';
import { AliceTextureManager } from './AliceTextureManager';


export interface GraphicsContext {
	getCanvas(): HTMLCanvasElement;
	getFrameBuffer(): WebGLFramebuffer;
	getGLManager(): AliceGLManager;
	getTextureManager(): AliceTextureManager;
}

export class AliceModel extends CubismUserModel implements Model {
	public update(): void {
		const deltaTimeSeconds: number = AlicePlatform.getDeltaTime();
		this.userTimeSeconds_ += deltaTimeSeconds;
		this._model.loadParameters();
		this.motionUpdated_ = false;
		this._model.saveParameters();
		this.updateScheduler_.onLateUpdate(this._model, deltaTimeSeconds);
		this._model.update();
	}

	public draw(matrix: CubismMatrix44, graphicsContext: GraphicsContext): void {
		if (this._model == null) return ;
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
			await this.setupEyeBlink();
		} catch (error) {
			AlicePlatform.printError('Failed to load Assets', error as Error);
		}
	}

	public constructor() {
		super();
		this.userTimeSeconds_ = 0.0;
		this.modelSetting_ = null;
		this.motionUpdated_ = false;
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
		this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);
		if (this._physics) {
			const physicsUpdater = new CubismPhysicsUpdater(this._physics);
			this.updateScheduler_.addUpdatableList(physicsUpdater);
		}
	}

	private async setupEyeBlink(): Promise<void> {
		if (this.modelSetting_ == null
		|| this.modelSetting_.getExpressionCount() == 0) { return ;}
		this._eyeBlink = CubismEyeBlink.create(this.modelSetting_);
		const eyeBlinkUpdater = new CubismEyeBlinkUpdater(
			() => this.motionUpdated_,
			this._eyeBlink
		);
		this.updateScheduler_.addUpdatableList(eyeBlinkUpdater);
	}

	private async setupTexture(textureManager: AliceTextureManager): Promise<void> {
		if (this.modelSetting_ == null) { return ; }
		const textureCount: number = this.modelSetting_.getTextureCount();
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
	}

	private userTimeSeconds_: number;

	private motionUpdated_: boolean;

	private updateScheduler_: CubismUpdateScheduler;
	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;

}
