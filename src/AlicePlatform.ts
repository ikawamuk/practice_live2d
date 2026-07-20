
export class AlicePlatform {
	public static printMessage(message: string): void {
		console.log(message);
	}

	public static updateTime(): void {
		this.currentFrame = Date.now();
		this.deltaTime = (this.currentFrame - this.lastFrame) / 1000;
		this.lastFrame = this.currentFrame;
	}

	static currentFrame = 0.0;
	static lastFrame = 0.0;
	static deltaTime = 0.0;
}
