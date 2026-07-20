
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

	public initialize(): boolean {
		this.initializeCubism();
		return (true);
	}

	public run(): void {
		const loop = (): void => {
			if (singleton_instance == null) {
				return ;
			}
			AlicePlatform.updateTime();

			console.log(AlicePlatform.currentFrame); // for test
			
			requestAnimationFrame(loop);
		}
		loop();
	}

	public static releaseInstance(): void {
		if (singleton_instance != null) {
			singleton_instance.release();
		}
		singleton_instance = null;
	}

	/*
		privateメソッド
	*/
	private constructor() {
		this.cubismLogOption_ = new Option();
	}

	private initializeCubism(): void {
		this.cubismLogOption_.logFunction = AlicePlatform.printMessage;
		this.cubismLogOption_.loggingLevel = AliceDefine.CubismLogLevel;
		CubismFramework.startUp(this.cubismLogOption_);
		CubismFramework.initialize();
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

