
import { LogLevel } from '@framework/live2dcubismframework';

// Canvas width and height pixel values, or dynamic screen size ('auto').
export const CanvasSize: { width: number; height: number } | 'auto' = 'auto';

export const ViewScale = 1.0;
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;
export const ViewLogicalBottom = -1.0;
export const ViewLogicalTop = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// publicディレクトリはルート直下として配信される
export const ResourcesPath = '/Resources/';

// モデルの後ろにある背景の画像ファイル
export const BackImageName = 'Gemini_Generated_Image_Cyber.png';

// モデル定義---------------------------------------------
// モデルを配置したディレクトリ名の配列
// ディレクトリ名とmodel3.jsonの名前を一致させておくこと
export const ModelName = 'Aria';

// デバッグ用ログの表示オプション
export const DebugLogEnable = true;

// Frameworkから出力するログのレベル設定
export const CubismLogLevel: LogLevel =  LogLevel.LogLevel_Verbose;
