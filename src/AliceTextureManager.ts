
import { AliceGLManager } from './AliceGLManager'
import type { TextureLoader } from './AliceView'

export class AliceTextureManager implements TextureLoader {
	public constructor() {
		this.glManager_ = null;
		this.textures_ = new Array<TextureInfo>();
	}
	public setGLManager(glManager_: AliceGLManager): void {
		this.glManager_ = glManager_;
	}

	public createTextureFromPngFile(
		fileName: string,
		callback: (textureInfo: TextureInfo) => void)
		: void {
		// すでにロード済みのものを探す
		for (let i = 0; i < this.textures_.length; i++) {
			if (this.textures_[i].fileName == fileName) {
				const img = new Image();
				this.textures_[i].img = img
				img.addEventListener(
					'load',
					(): void => callback(this.textures_[i]),
					{ passive: true }
				);
				img.src = fileName;
				return;
			}
		}
		// データのオンロードをトリガーにする
		const img = new Image();
		img.addEventListener (
			'load',
			(): void => {
				if (this.glManager_ == null) {
					throw new Error('GLManager in not set');
				}
				const gl = this.glManager_.getGL();
				const texture: WebGLTexture = gl.createTexture();
				// テクスチャを選択
				gl.bindTexture(gl.TEXTURE_2D, texture);
				// テクスチャにピクセルを書き込む
				gl.texParameteri(
					gl.TEXTURE_2D,
					gl.TEXTURE_MIN_FILTER,
					gl.LINEAR_MIPMAP_LINEAR
				);
				gl.texParameteri(
					gl.TEXTURE_2D,
					gl.TEXTURE_MAG_FILTER,
					gl.LINEAR
				);
				//// Premult処理を行わせる
				//if (usePremultiply) {
				//	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
				//}
				// テクスチャにピクセルを書き込む
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					img
				);
				// ミップマップを生成
				gl.generateMipmap(gl.TEXTURE_2D);
				// テクスチャをバインド
				gl.bindTexture(gl.TEXTURE_2D, null);
				const textureInfo: TextureInfo = new TextureInfo();
				if (textureInfo != null) {
					textureInfo.fileName = fileName;
					textureInfo.width = img.width;
					textureInfo.height = img.height;
					textureInfo.id = texture;
					textureInfo.img = img;
					//textureInfo.usePremultply = usePremultiply;
					if (this.textures_ != null) {
						this.textures_.push(textureInfo);
					}
				}
				callback(textureInfo);
			},
			{ passive: true }
		);
		img.src = fileName;
	}

	public release(): void {
		this.releaseAllTextures();
	}

	public releaseTextureByTexture(texture: WebGLTexture): void {
		if (this.glManager_ == null) {
			throw new Error('GLManager in not set');
		}
		for (let i = 0; i < this.textures_.length; i++) {
			if (this.textures_[i].id != texture) {
				continue;
			}
			this.glManager_.getGL().deleteTexture(this.textures_[i].id);
			this.textures_.splice(i, 1);
			break;
		}
	}

	public releaseAllTextures(): void {
		if (this.glManager_ == null) {
			throw new Error('GLManager in not set');
		}
		for (let i = 0; i < this.textures_.length; i++) {
			this.glManager_.getGL().deleteTexture(this.textures_[i].id);
			this.textures_.splice(i, 1);
			break;
		}
		this.textures_.length = 0;
	}

	private glManager_: AliceGLManager | null;
	private textures_: Array<TextureInfo>;
}

export class TextureInfo {
	img: HTMLImageElement | null = null;
	id: WebGLTexture | null = null;
	width: number = 0;
	height: number = 0;
	//usePremultply: boolean;
	fileName: string = "";
}
