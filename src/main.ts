// Core は index.html の <head> の <script> で読み込み済み。
// グローバル変数 Live2DCubismCore がすでに存在している前提で使う。

// --- canvas を JS 側で生成して body に追加する ---
// （index.html の CSS が body > canvas:only-child を 100vw/100vh に伸ばす）
const canvas = document.createElement('canvas');
// 描画バッファの解像度はウィンドウサイズに合わせる（表示サイズはCSS任せ）
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 が使えません');

// --- 配線チェック用: Core が本当に読めているか確認 ---
if (typeof Live2DCubismCore === 'undefined') {
  throw new Error('Live2DCubismCore が読み込まれていません（index.html の script 順序を確認）');
}

const version = Live2DCubismCore.Version.csmGetVersion();
// 32bit の数値。上位からメジャー.マイナー.パッチにデコードできる
const major = (version >> 24) & 0xff;
const minor = (version >> 16) & 0xff;
const patch = version & 0xffff;
console.log(`✅ Cubism Core 読み込み成功: v${major}.${minor}.${patch} (raw=${version})`);
console.log('✅ WebGL2 コンテキスト取得成功');

// 動作確認としてキャンバスを塗る（後で描画ループに置き換える）
gl.clearColor(0.1, 0.1, 0.15, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
