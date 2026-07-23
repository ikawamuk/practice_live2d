import { CubismDefaultParameterId } from '@framework/cubismdefaultparameterid';
import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';

import { CubismUserModel } from '@framework/model/cubismusermodel';
import { CubismPhysicsUpdater } from '@framework/motion/cubismphysicsupdater';
import { CubismUpdateScheduler } from '@framework/motion/cubismupdatescheduler';

import type { CubismIdHandle } from '@framework/id/cubismid';
import {
  BreathParameterData,
  CubismBreath
} from '@framework/effect/cubismbreath';
import { CubismBreathUpdater } from '@framework/motion/cubismbreathupdater';

import { CubismEyeBlink } from '@framework/effect/cubismeyeblink';
import { CubismEyeBlinkUpdater } from '@framework/motion/cubismeyeblinkupdater';

import { CubismFramework } from '@framework/live2dcubismframework';

import { CubismLipSyncUpdater } from '@framework/motion/cubismlipsyncupdater';

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

import type { Model } from './AliceLive2DManager';

import { AliceGLManager } from './AliceGLManager';
import { AlicePlatform } from './AlicePlatform';
import * as AliceDefine from './AliceDefine';
import { AliceTextureManager } from './AliceTextureManager';
import { AliceWavParameterProvider } from './AliceWavParameterProvider';


export interface DrawingContext {
	getCanvas(): HTMLCanvasElement;
	getFrameBuffer(): WebGLFramebuffer;
	getGLManager(): AliceGLManager;
	getTextureManager(): AliceTextureManager;
}

export class AliceModel extends CubismUserModel implements Model {
	public update(): void {
		if (!this.SetupComplete_) { return ; }
		const deltaTimeSeconds: number = AlicePlatform.getDeltaTime();
		this.userTimeSeconds_ += deltaTimeSeconds;
		this._model.loadParameters();
		this.motionUpdated_ = false;
		this._model.saveParameters();
		this.updateScheduler_.onLateUpdate(this._model, deltaTimeSeconds);
		this._model.update();
	}

	public draw(matrix: CubismMatrix44, drawingContext: DrawingContext): void {
		if (!this.SetupComplete_) { return ; }
		matrix.multiplyByMatrix(this._modelMatrix);
		this.getRenderer().setMvpMatrix(matrix);
		this.doDraw(drawingContext);
	}

	public doDraw(drawingContext: DrawingContext) {
		if (this._model == null) return ;
		const canvas = drawingContext.getCanvas();
		const viewport: number[] = [0, 0, canvas.width, canvas.height];
		this.getRenderer().setRenderState(
			drawingContext.getFrameBuffer(),
			viewport
		);
		this.getRenderer().drawModel(AliceDefine.ShaderPath);
	}

	public async startLipSyncSound(soundFileName: string): Promise<void> {
		const path = this.modelHomeDir_ + soundFileName;
		await this.wavParameterProvider_.start(path);
	}

	public async loadAssets(dir: string, modelJsonFileName: string, drawingContext: DrawingContext): Promise<void> {
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
			await this.setupModel(setting, drawingContext.getCanvas(), drawingContext.getGLManager());
			await this.setupPhysics();
			this.setupEyeBlink();
			this.setupBreath();
			this.setupLipsync();
			await this.setupTexture(drawingContext.getTextureManager());
			
			this.SetupComplete_ = true;
		} catch (error) {
			AlicePlatform.printError('Failed to load Assets', error as Error);
		}
		
	}

	public constructor() {
		super();
		this.SetupComplete_ = false;
		this.userTimeSeconds_ = 0.0;
		this.modelSetting_ = null;
		this.motionUpdated_ = false;
		this.updateScheduler_ = new CubismUpdateScheduler();
		this.modelHomeDir_ = null;

		this.idParamAngleX_ = CubismFramework.getIdManager().getId(
			CubismDefaultParameterId.ParamAngleX
		);
		this.idParamAngleY_ = CubismFramework.getIdManager().getId(
			CubismDefaultParameterId.ParamAngleY
		);
		this.idParamAngleZ_ = CubismFramework.getIdManager().getId(
			CubismDefaultParameterId.ParamAngleZ
		);
		this.idParamBodyAngleX_ = CubismFramework.getIdManager().getId(
			CubismDefaultParameterId.ParamBodyAngleX
		);
		this.lipSyncIds_ = new Array<CubismIdHandle>();
		this.wavParameterProvider_ = new AliceWavParameterProvider();
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

	private setupEyeBlink(): void {
		if (this.modelSetting_ == null
		|| this.modelSetting_.getEyeBlinkParameterCount() == 0) { return ;}
		this._eyeBlink = CubismEyeBlink.create(this.modelSetting_);
		const eyeBlinkUpdater = new CubismEyeBlinkUpdater(
			() => this.motionUpdated_,
			this._eyeBlink
		);
		this.updateScheduler_.addUpdatableList(eyeBlinkUpdater);
	}

	private setupBreath(): void {
		this._breath = CubismBreath.create();
		/**
		 * BreathParameterDataコンストラクタ
		 * @param parameterId   呼吸をひもづけるパラメータID
		 * @param offset        呼吸を正弦波としたときの、波のオフセット
		 * @param peak          呼吸を正弦波としたときの、波の高さ
		 * @param cycle         呼吸を正弦波としたときの、波の周期
		 * @param weight        パラメータへの重み
		*/
		const breathParameters: Array<BreathParameterData> = [
			new BreathParameterData(this.idParamAngleX_, 0.0, 15.0, 6.5345, 0.5),
			new BreathParameterData(this.idParamAngleY_, 0.0, 8.0, 3.5345, 0.5),
			new BreathParameterData(this.idParamAngleZ_, 0.0, 10.0, 5.5345, 0.5),
			new BreathParameterData(this.idParamBodyAngleX_, 0.0, 4.0, 15.5345, 0.5),
			new BreathParameterData(
				CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath),
				0.5, 0.5, 3.2345, 1)
		];
		this._breath.setParameters(breathParameters);
		const breathUpdater = new CubismBreathUpdater(this._breath);
		this.updateScheduler_.addUpdatableList(breathUpdater);
	};

	private setupLipsync(): void {
		if (this.modelSetting_ == null) { return ; }
		const lipSyncIdCount = this.modelSetting_.getLipSyncParameterCount();
		for (let i: number = 0; i < lipSyncIdCount; ++i) {
			this.lipSyncIds_[i] = this.modelSetting_.getLipSyncParameterId(i);
		}
		const lipSyncUpdater = new CubismLipSyncUpdater(this.lipSyncIds_, this.wavParameterProvider_);
		this.updateScheduler_.addUpdatableList(lipSyncUpdater);
	}

	private SetupComplete_: boolean;
	private userTimeSeconds_: number;

	private motionUpdated_: boolean;

	private idParamAngleX_: CubismIdHandle;
	private idParamAngleY_: CubismIdHandle;
	private idParamAngleZ_: CubismIdHandle;
	private idParamBodyAngleX_: CubismIdHandle;

	private lipSyncIds_: Array<CubismIdHandle>;
	private wavParameterProvider_: AliceWavParameterProvider;

	private updateScheduler_: CubismUpdateScheduler;
	private modelSetting_: ICubismModelSetting | null;
	private modelHomeDir_: string | null;

}
