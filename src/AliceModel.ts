
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';

export class AliceModel {
	public update() {
		// TODO:
	}
	public draw(matrix: CubismMatrix44) {
		// TODO:
		matrix;
	}

	public loadAssets(dir: string, fileName: string): void {
		this.modelHomeDir_ = dir;
		const url = `${this.modelHomeDir_}${fileName}`;
		console.log(`[AliceModel] loadAssets 開始: ${url}`);

		fetch(url)
			.then((response) => {
				console.log(
					`[AliceModel] fetch 応答: status=${response.status} ok=${response.ok}`
				);
				if (!response.ok) {
					// 404などでもfetch自体は成功扱いになるので、ここで明示的にエラー化する
					throw new Error(`HTTP ${response.status} ${response.statusText}`);
				}
				return response.arrayBuffer();
			})
			.then((buffer) => {
				console.log(
					`[AliceModel] 取得成功: ${buffer.byteLength} bytes (${url})`
				);
				// TODO: ここで buffer からモデルを構築する
			})
			.catch((error) => {
				console.error(`[AliceModel] 取得失敗: ${url}`, error);
			});
	}

	public constructor() {
		this.modelHomeDir_ = null;
	}
	private modelHomeDir_: string | null;
}
