

export interface GLManager {
	getGL(): WebGL2RenderingContext;
}

export class AliceSprite {
	public constructor(
		x: number,
		y: number,
		width: number,
		height: number,
		textureId: WebGLTexture
	) {
		this.rect_ = new Rect();
		this.rect_.left = x - width * 0.5;
		this.rect_.right = x + width * 0.5;
		this.rect_.up = y + height * 0.5;
		this.rect_.down = y - height * 0.5;
		this.texture_ = textureId;
		this.glManager_ = null;
	}

	public release(): void {
		const gl = this.glManager_?.getGL();
		gl?.deleteTexture(this.texture_)
	}

	public setGLManager(glManager: GLManager) {
		this.glManager_ = glManager;
	}

	private texture_: WebGLTexture;
	private rect_: Rect; // 矩形
	private glManager_: GLManager | null;
}

export class Rect {
  public left: number = 0; // 左辺
  public right: number = 0; // 右辺
  public up: number = 0; // 上辺
  public down: number = 0; // 下辺
}
