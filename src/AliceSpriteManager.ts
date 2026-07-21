
import { AliceSprite } from './AliceSprite';
import type { GLManager } from './AliceSprite';

// スプライト1つ分の描画状態（location・buffer・頂点配列・初回フラグ）
class RenderingState {
	positionLocation: number | null = null;
	uvLocation: number | null = null;
	textureLocation: WebGLUniformLocation | null = null;

	vertexBuffer: WebGLBuffer | null = null;
	uvBuffer: WebGLBuffer | null = null;
	indexBuffer: WebGLBuffer | null = null;

	positionArray: Float32Array | null = null;
	uvArray: Float32Array | null = null;
	indexArray: Uint16Array | null = null;

	firstDraw: boolean = true;
}

// スプライトのデータ(AliceSprite)と描画状態(RenderingState)を持ち、自分で描画するクラス
export class AliceSpriteManager {
	public constructor(sprite: AliceSprite) {
		this.sprite_ = sprite;
		this.state_ = new RenderingState();
		this.glManager_ = null;
	}

	public setGLManager(glManager: GLManager): void {
		this.glManager_ = glManager;
		this.sprite_.setGLManager(glManager);
	}

	public render(shader: WebGLProgram, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
		const sprite = this.sprite_;
		const state = this.state_;
		const texture = sprite.getTexture();

		// 初回描画時（このManagerが作られた時点の1回だけ）
		if (state.firstDraw) {
			// 何番目のattribute変数か取得
			state.positionLocation = gl.getAttribLocation(shader, 'position');
			gl.enableVertexAttribArray(state.positionLocation);

			state.uvLocation = gl.getAttribLocation(shader, 'uv');
			gl.enableVertexAttribArray(state.uvLocation);

			// 何番目のuniform変数か取得
			state.textureLocation = gl.getUniformLocation(shader, 'texture');

			// uniform属性の登録
			gl.uniform1i(state.textureLocation, 0);

			// uvバッファ、座標初期化
			{
				state.uvArray = new Float32Array([
					1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0
				]);

				// uvバッファを作成
				state.uvBuffer = gl.createBuffer();
			}

			// 頂点バッファ、座標初期化
			{
				const maxWidth = canvas.width;
				const maxHeight = canvas.height;

				// 頂点データ
				state.positionArray = new Float32Array([
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
				state.vertexBuffer = gl.createBuffer();
			}

			// 頂点インデックスバッファ、初期化
			{
				state.indexArray = new Uint16Array([0, 1, 2, 3, 2, 0]);

				// インデックスバッファを作成
				state.indexBuffer = gl.createBuffer();
			}

			state.firstDraw = false;
		}

		const positionLocation = state.positionLocation;
		const uvLocation = state.uvLocation;
		const vertexBuffer = state.vertexBuffer;
		const uvBuffer = state.uvBuffer;
		const indexBuffer = state.indexBuffer;
		const positionArray = state.positionArray;
		const uvArray = state.uvArray;
		const indexArray = state.indexArray;
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

	public release(): void {
		// テクスチャの解放
		this.sprite_.release();

		// バッファの解放（確保したGPUリソースを片付ける）
		const gl = this.glManager_?.getGL();
		if (gl) {
			gl.deleteBuffer(this.state_.vertexBuffer);
			gl.deleteBuffer(this.state_.uvBuffer);
			gl.deleteBuffer(this.state_.indexBuffer);
		}
	}

	private sprite_: AliceSprite;
	private state_: RenderingState;
	private glManager_: GLManager | null;
}
