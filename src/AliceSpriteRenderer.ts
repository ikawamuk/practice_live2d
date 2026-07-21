
import { AliceSprite } from './AliceSprite'

export class AliceSpriteRenderer {
	public constructor() {
			this.positionLocation_ = null;
			this.uvLocation_ = null;
			this.textureLocation_ = null;

			this.vertexBuffer_ = null;
			this.uvBuffer_ = null;
			this.indexBuffer_ = null;

			this.positionArray_ = null;
			this.uvArray_ = null;
			this.indexArray_ = null;

			this.firstDraw_ = true;
	}

	public render(sprite: AliceSprite, shader: WebGLProgram, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
		const texture = sprite.getTexture();
		// 初回描画時
		if (this.firstDraw_) {
			// 何番目のattribute変数か取得
			this.positionLocation_ = gl.getAttribLocation(shader, 'position');
			gl.enableVertexAttribArray(this.positionLocation_);

			this.uvLocation_ = gl.getAttribLocation(shader, 'uv');
			gl.enableVertexAttribArray(this.uvLocation_);

			// 何番目のuniform変数か取得
			this.textureLocation_ = gl.getUniformLocation(shader, 'texture');

			// uniform属性の登録
			gl.uniform1i(this.textureLocation_, 0);

			// uvバッファ、座標初期化
			{
				this.uvArray_ = new Float32Array([
					1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0
				]);

				// uvバッファを作成
				this.uvBuffer_ = gl.createBuffer();
			}

			// 頂点バッファ、座標初期化
			{
				const maxWidth = canvas.width;
				const maxHeight = canvas.height;

				// 頂点データ
				this.positionArray_ = new Float32Array([
					(sprite.getRect().right - maxWidth * 0.5) / (maxWidth * 0.5),
					(sprite.getRect().up - maxHeight * 0.5) / (maxHeight * 0.5),
					(sprite.getRect().left - maxWidth * 0.5) / (maxWidth * 0.5),
					(sprite.getRect().up - maxHeight * 0.5) / (maxHeight * 0.5),
					(sprite.getRect().left - maxWidth * 0.5) / (maxWidth * 0.5),
					(sprite.getRect().down - maxHeight * 0.5) / (maxHeight * 0.5),
					(sprite.getRect().right - maxWidth * 0.5) / (maxWidth * 0.5),
					(sprite.getRect().down - maxHeight * 0.5) / (maxHeight * 0.5)
				]);

				// 頂点バッファを作成
				this.vertexBuffer_ = gl.createBuffer();
			}

			// 頂点インデックスバッファ、初期化
			{
				// インデックスデータ
				this.indexArray_ = new Uint16Array([0, 1, 2, 3, 2, 0]);

				// インデックスバッファを作成
				this.indexBuffer_ = gl.createBuffer();
			}

			this.firstDraw_ = false;
		}

		const positionLocation = this.positionLocation_;
		const uvLocation = this.uvLocation_;
		const vertexBuffer = this.vertexBuffer_;
		const uvBuffer = this.uvBuffer_;
		const indexBuffer = this.indexBuffer_;
		const positionArray = this.positionArray_;
		const uvArray = this.uvArray_;
		const indexArray = this.indexArray_;
		if (
			positionLocation == null ||
			uvLocation == null ||
			vertexBuffer == null ||
			uvBuffer == null ||
			indexBuffer == null ||
			positionArray == null ||
			uvArray == null ||
			indexArray == null
		) {
			// 初期化が完了していない
			return;
		}

		// UV座標登録
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);

		// attribute属性を登録
		gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

		// 頂点座標を登録
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

		// attribute属性を登録
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		// 頂点インデックスを作成
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.DYNAMIC_DRAW);

		// モデルの描画
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.drawElements(
			gl.TRIANGLES,
			indexArray.length,
			gl.UNSIGNED_SHORT,
			0
		);
	}

	private positionLocation_: number | null;
	private uvLocation_: number | null;
	private textureLocation_: WebGLUniformLocation | null;

	private vertexBuffer_: WebGLBuffer | null;
	private uvBuffer_: WebGLBuffer | null;
	private indexBuffer_: WebGLBuffer | null;

	private positionArray_: Float32Array | null;
	private uvArray_: Float32Array | null;
	private indexArray_: Uint16Array | null;

	private firstDraw_: boolean;
}
