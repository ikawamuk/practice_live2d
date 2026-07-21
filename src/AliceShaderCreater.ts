
import { AlicePlatform } from './AlicePlatform'
import type { ShaderCreater } from './AliceView'
import type { GLManager } from './AliceSprite'

export class AliceShaderCreater implements ShaderCreater {
	public constructor () {
		this.glManager_ = null;
	}

	public setGLManager(glManager: GLManager) {
		this.glManager_ = glManager;
	}

	public createShader(): WebGLProgram | null {
		if (this.glManager_ == null) {
			throw new Error('GLManager is not set');
		}
		const gl = this.glManager_.getGL();

		// バーテックスシェーダーのコンパイル(Textureを配置するCanvas上の位置を計算するGPUプログラム)
		const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);
		if (vertexShaderId == null) {
			AlicePlatform.printMessage('failed to create vertexShader');
			return (null);
		}

		const vertexShader: string =
			'precision mediump float;' +
			'attribute vec3 position;' +
			'attribute vec2 uv;' +
			'varying vec2 vuv;' +
			'void main(void)' +
			'{' +
			'   gl_Position = vec4(position, 1.0);' +
			'   vuv = uv;' +
			'}';
		gl.shaderSource(vertexShaderId, vertexShader);
		gl.compileShader(vertexShaderId);
	

		// フラグメントシェーダのコンパイル(決まった位置にTextureを描画するプログラム)
		const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);
		if (fragmentShaderId == null) {
			AlicePlatform.printMessage('failed to create fragmentShader');
			return (null);
		}
		const fragmentShader: string =
			'precision mediump float;' +
			'varying vec2 vuv;' +
			'uniform sampler2D texture;' +
			'void main(void)' +
			'{' +
			'   gl_FragColor = texture2D(texture, vuv);' +
			'}';
		gl.shaderSource(fragmentShaderId, fragmentShader);
		gl.compileShader(fragmentShaderId);

		// ２つのプログラムを結合する
		const shaderProgramID = gl.createProgram();
		gl.attachShader(shaderProgramID, vertexShaderId);
		gl.attachShader(shaderProgramID, fragmentShaderId);

		gl.deleteShader(vertexShaderId);
		gl.deleteShader(fragmentShaderId);

		// リンク
		gl.linkProgram(shaderProgramID);
		gl.useProgram(shaderProgramID);
		return (shaderProgramID);
	}

	private glManager_: GLManager | null;
}