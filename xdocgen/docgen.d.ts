// // docgen.d.ts

/**
 * CommonJS (module.exports) で書かれた外部ライブラリの型情報を、
 * TypeScriptに提供するための定義ファイルです。
 * これにより、vbaDocGen関数の引数と戻り値の型が保証されます。
 */

// ESモジュール形式（export function...）の書き方で記述します。
/**
 * xdocgen/docgen.js のための型定義ファイル。
 * CommonJS形式でエクスポートされた vbaDocGen 関数をTypeScriptから型安全に利用できるようにします。
 * 
 * @param vbaSourceCode - VBAモジュール、クラスなどのソースコード文字列。
 * @returns JSON形式に変換された文字列。
 */
export function vbaDocGen(vbaSourceCode: string): string;