import { IParameterProvider } from '@framework/motion/iparameterprovider';

export class AliceWavParameterProvider implements IParameterProvider {

	public async start(filePath: string): Promise<void> {
		await this.loadWavFile(filePath);
	}

	public async loadWavFile(filePath: string): Promise<void> {
		filePath;
	}

	public update(deltaTimeSeconds: number | undefined): boolean {
		deltaTimeSeconds;
		return (true);
	}

	/*
		音量によって0~1のパラメータを与える。
		AriaはParamMouthOpenYで口の大きさを変える。[0.5...1.0]までで徐々に大きく開く。
	*/
	public getParameter(): number {
		return (1);
	}

	public constructor() {
	}
}
