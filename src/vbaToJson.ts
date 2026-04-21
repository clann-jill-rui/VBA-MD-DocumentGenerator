/**
 * VBAソースコードをJSON形式に変換するモジュール。
 * 
 * 指定されたVBAファイルを読み込み、文字コード変換（Shift-JIS -> UTF-8）を行った上で、
 * `xdocgen` ライブラリを使用して解析し、結果をJSONファイルとして出力します。
 * 
 * @module VbaToJson
 * @author Me
 */


import * as fs from 'fs';
import * as path from 'path';
/*
 * iconv-lite: 文字コード変換ライブラリ。
 * Node.js標準ではサポートが不十分なShift_JIS等のエンコーディングを扱うために使用。
 * ネイティブビルド不要で動作するため、環境を選ばず利用可能。
 */
import * as iconv from 'iconv-lite';
import {vbaDocGen} from '../xdocgen/docgen';
import { EXTENSIONS, ENCODING, EXT } from './constants'; // 定数のインポート
import { projectRootPath } from './main';

/**
 * 単一のVBAファイルを処理し、JSONファイルを出力します。
 * 
 * @remarks
 * 1. ファイルの拡張子が許可リスト（`.cls`, `.bas`, `.frm` 等）に含まれているか確認します。
 * 2. ファイルをShift_JISとして読み込み、UTF-8文字列に変換します。
 * 3. `vbaDocGen` を呼び出して解析を行い、結果をJSONファイルとして保存します。
 * 
 * @param vbaSrcPath - VBAファイルが格納されているディレクトリのパス。
 * @param vbaFileName - 変換対象のVBAファイル名（拡張子付き）。
 * @param outputJsonPath - 生成されたJSONファイルを出力するディレクトリのパス。
 * @returns 出力されたJSONファイルのフルパス。処理に失敗またはスキップした場合は `null`。
 */
export function vbaToJson(
vbaSrcPath:string, 
vbaFileName:string,
outputJsonPath:string)
: string | null{

    // 拡張子リストを定数ファイル(constants.ts)から取得するように変更しています。
    // 💡 許可する拡張子リストを定義（小文字で比較するため）
    // as const で定義されたリテラル型を string[] として扱うために型注釈を追加します。
    const allowedExtension: readonly string[] = EXTENSIONS.VBA;
    
    // 💡 実際のファイルの拡張子を取得し、小文字に変換
    const actualExt = path.extname(vbaFileName).toLocaleLowerCase();
    
    // 1. ファイル名が存在しない、または、
    // 2. 許可された拡張子リストに含まれていない場合、処理をスキップ
    if(!vbaFileName || !allowedExtension.includes(actualExt)){
        console.error(`\x1b[33m⚠️ 警告: 拡張子がVBA対象外または不正です。ファイル名: ${vbaFileName} (拡張子: ${actualExt}) の処理をスキップします。\x1b[0m`);
        return null;
    }
    const vbaFilePath = path.join(vbaSrcPath, vbaFileName);
    console.log(`\n\x1b[36m▶ [VBA解析]\x1b[0m \x1b[1m${vbaFileName}\x1b[0m \x1b[36mの処理を開始...\x1b[0m`);

    // 引数のファイル名を拡張子なしの名称として取得する。
    const baseFileName = path.basename(vbaFileName,path.extname(vbaFileName));
    const outputJsonFullPaths = path.join(outputJsonPath, baseFileName + EXT.JSON);

    try {

        const vbaSourceCodeBuffer = fs.readFileSync(vbaFilePath);

        // iconv.decode() を使用して、vbaSourceCodeBuffer (Bufferオブジェクト) に格納されたバイトデータを、
        // UTF-8エンコーディングとしてデコード（文字コード変換）し、JavaScriptの文字列として vbaSourceCode に格納。
        const vbaSourceCode = iconv.decode(vbaSourceCodeBuffer, ENCODING.SHIFT_JIS);
        
        //インポートした vbaDocGen 関数を呼び出し、読み込んだVBAソースコード (vbaSourceCode) を引数として渡す。
        const jsonDoc = vbaDocGen(vbaSourceCode);
        
        // JSON.stringifyで整形して生成されたJSONをUTF-8で書き出す
        fs.writeFileSync(outputJsonFullPaths, JSON.stringify(JSON.parse(jsonDoc), null, 2), ENCODING.UTF8); 
        const relativeJsonPath = path.relative(projectRootPath, outputJsonFullPaths);
        console.log(`  \x1b[32m✔\x1b[0m JSONデータを保存: \x1b[33m${relativeJsonPath}\x1b[0m`);

    } catch (error : any) {
            
        if (error.code === 'ENOENT') {
        
            console.error(`\x1b[31m❌ エラー: ファイルが見つかりません: ${vbaFilePath}\x1b[0m`);
                return null;
        
            } else {
                console.error(`\x1b[31m❌ エラー: ファイル ${vbaFileName} の処理中にエラーが発生しました\n${error}\x1b[0m`);
                return null;
            }
        }
    // console.log(`--- ${vbaFileName} の処理が終了しました。 ---`);
    
    return outputJsonFullPaths;
}