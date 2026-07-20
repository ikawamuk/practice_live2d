
import { CubismFramework, Option } from '@framework/live2dcubismframework';
import * as AliceDefine from './AliceDefine.ts';
import { AlicePlatform } from './AlicePlatform.ts';

export let singleton_instance: AliceApp | null = null;

export class AliceApp {
	/*
		publicメソッド
	*/
	public static getInstance(): AliceApp {
		if (singleton_instance == null) {
			singleton_instance = new AliceApp();
		}
		return (singleton_instance);
	}

	public static releaseInstance(): void {
		if (singleton_instance != null) {
			singleton_instance.release();
		}
		singleton_instance = null;
	}

	public initialize(): boolean {
		this.initializeCubism();
		return (true);
	}

	private initializeCubism(): void {
		this.cubismLogOption_.logFunction = AlicePlatform.printMessage;
		this.cubismLogOption_.loggingLevel = AliceDefine.CubismLogLevel;
		CubismFramework.startUp(this.cubismLogOption_);
		CubismFramework.initialize();
	}

	public run(): void {
		const loop = (): void => {
			if (singleton_instance == null) {
				return ;
			}
			AlicePlatform.updateTime();
			console.log(AlicePlatform.currentFrame);
			
			requestAnimationFrame(loop);
		}
		loop();
	}

	/*
		privateメソッド
	*/
	private constructor() {
		this.cubismLogOption_ = new Option();
	}

	private release(): void {
		CubismFramework.dispose();
		CubismFramework.cleanUp();
	}

	/*
		プロパティ
	*/
	private cubismLogOption_: Option;
}

