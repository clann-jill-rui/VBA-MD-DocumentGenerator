/**
 * VBAドキュメント生成ツールのメインモジュール。
 * 
 * このモジュールは、VBAソースコードからMarkdown形式のドキュメントを生成する
 * 一連のプロセス（設定読み込み、JSON変換、Markdown生成）を統括・制御します。
 * 
 * @module main
 * @author Me
 */
import * as fs from 'fs' ;
import * as path from 'path'; 
import * as fileUtils from './fileUtils';
import { resolvePathObj } from './pathResolver';
import type { resolvedFullPaths } from './pathResolver';
import * as vbaToJson from './vbaToJson';
import {jsonMDGenerator} from './jsonMDGenerator';
import { CONFIG_FILES, INTERNAL_KEYS, EXT } from './constants';
//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  汎用変数(シングルトン)の定義

/**
 * プロジェクトのルートディレクトリパス。
 * 
 * アプリケーション実行時に `fileUtils.findProjectRootPath` を使用して特定されます。
 * 取得に失敗した場合は例外をスローしてプロセスを終了するため、
 * 以降の処理では非nullの `string` 型として安全に利用できます。
 */
export const projectRootPath: string = (() => {
    
    const root = fileUtils.findProjectRootPath(process.cwd())

    if(!root){
        throw new Error('プロジェクトのルートパスの取得に失敗しました。プログラムを終了します。');
    }
    // ブロック内でnull判定を確定させ、string型に決定させる。
    // 他のプログラムで使用するとき、nullチェックが不要になる。
    return root;
})();
    

//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  制御用関数の定義
/**
 * アプリケーションのメインエントリポイント。
 * 
 * 設定ファイルを読み込み、以下の順序でドキュメント生成プロセスを実行します：
 * 1. `runXdocgen`: VBAソースコードを解析し、中間形式のJSONファイルを出力。
 * 2. `jsonToMDConvert`: 出力されたJSONファイルをMarkdownドキュメントに変換。
 * 
 * 処理の途中でエラーが発生した場合は、エラーメッセージを出力して終了します。
 */
export function main(){

    //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
    //                  初期化処理

    if(!projectRootPath){
        console.error('\x1b[31m❌ エラー: ルートパスの取得に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }
    
    const environmentJsonPath = path.join(projectRootPath, CONFIG_FILES.ENV);

    // プログラム中で使用するパス情報を管理するJSONの呼び出し
    const pathObj:resolvedFullPaths|null = resolvePathObj();

    if(!pathObj){
        console.error('\x1b[31m❌ エラー: コンフィグファイルの読み取りに失敗しました。処理を終了します。\x1b[0m');
        return null;
    }

    //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
    //                  メイン処理の実行開始


    // VBA → JSON
    const resultConvertJsonFullPaths: Map<string, Map<string,string>|Array<string>> | null = runXdocgen(
        pathObj.ioPaths.sourcePaths.srcFiles,
        pathObj.ioPaths.outputPaths.temp,
        pathObj.ioPaths.outputPaths.json,
        pathObj.params.extension
        );

    if(!resultConvertJsonFullPaths){
        console.error('\x1b[31m❌ エラー: VBA → JSONの変換に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }

    
    // JSON → MD
    const resultConvertMDFullPaths: Array<string> | null = 
    jsonToMDConvert(
    resultConvertJsonFullPaths,
    pathObj.ioPaths.outputPaths.markdown,
    );

    if(!resultConvertMDFullPaths){
        console.error('\x1b[31m❌ エラー: JSON → MDの変換に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }
    // 完了メッセージ（カラー付き）
    const relativeMDFullPaths = resultConvertMDFullPaths.map(p => path.relative(projectRootPath, p));
    console.log(`\n\x1b[32m✨ ドキュメント生成処理がすべて完了しました！\x1b[0m\n\n\x1b[36m[ 生成されたファイル一覧 ]\x1b[0m\n  \x1b[33m${relativeMDFullPaths.join('\n  ')}\x1b[0m\n`);
}


/**
 * docgenを実行し、VBAファイルをJSONファイルに変換する。
 * 
 * @remarks
 * 1. 指定されたソースフォルダ (`srcPath`) からVBAファイルを探索します。
 * 2. 作業用の一時フォルダ (`tempPath`) にファイルをコピーします。
 * 3. `vbaToJson` モジュールを使用して、各VBAファイルをJSON形式に変換し、出力フォルダ (`outputPath`) に保存します。
 * 
 * @param srcPath - 変換対象のVBAファイルが格納されているソースディレクトリのフルパス。
 * @param tempPath - 処理中に使用する一時作業用ディレクトリのフルパス。
 * @param outputPath - 生成されたJSONファイルを出力するディレクトリのフルパス。
 * @param targetExtension - 処理対象とするVBAファイルの拡張子（デフォルト: `EXT.VBA_DEFAULT`）。
 * @returns 以下の情報を含むMapオブジェクト。処理に失敗した場合は `null` を返します。
 * - `sourceVBAFileNameList`: 元のVBAファイル名（拡張子なし）と拡張子付きファイル名のMap。
 * - `outputJSONFullPathsList`: 生成されたJSONファイルのフルパスのリスト。
 */
export function runXdocgen(
    srcPath:string,  
    tempPath:string,
    outputPath:string,
    targetExtension:string = EXT.VBA_DEFAULT //メモ デフォルトを設定すると自動的にオプションになるため、?は不要になる。
    ): Map<string, Array<string>|Map<string,string> > | null{

    // VBAファイルのあるソースフォルダのチェックを行い結果をパスで取得。
    const checkedSrcPath : string|null = fileUtils.checkAndMakeDir(srcPath) ?? null;
    // VBAファイルをコピーする作業用フォルダのチェックを行い結果をパスで取得。
    const checkedTempPath : string|null = fileUtils.checkAndMakeDir(tempPath) ?? null;
    // JSONファイルを出力するフォルダのチェックを行い結果をパスで取得。
    const checkedOutputJsonPath : string|null = fileUtils.checkAndMakeDir(outputPath) ?? null;
    // 引数にする拡張子を事前にチェックし正規化したものを格納。
    const checkedExtension : string|null = fileUtils.normalizeExtension(targetExtension);

    if(!checkedSrcPath ||
       !checkedTempPath || 
       !checkedOutputJsonPath|| 
       !checkedExtension){
        
        console.error(`\x1b[31m❌ エラー: 引数の初期化に失敗したため処理を終了します。\x1b[0m`);
        return null;
    
    }

    //作業用フォルダのクリーンナップ
    fileUtils.cleanDirFiles(checkedTempPath,checkedExtension);

    //checkedSrcPathにあるファイルをDirent型のオブジェクトですべて取得。
    const vbaDirent = fs.readdirSync(checkedSrcPath,{ withFileTypes: true});

    // VBAファイルの名称を拡張子を変更しないまま、格納するMAP
    const fileNameWithExtMap:Map<string,string> = new Map();

    // Direntにフィルターをかけてファイルのみを対象にし(filter)、各ファイルごとに処理を行う(foreach)。
    vbaDirent.filter(dirent => dirent.isFile()).forEach(dirent =>{
        
        // 拡張子込みのファイル名の取得(Extension = 拡張子)
        const fileNameWithExt = dirent.name;

        // 拡張子なしのファイル名を取得
        const baseName = path.basename(fileNameWithExt, path.extname(fileNameWithExt));

        // MAPに格納していく。
        fileNameWithExtMap.set(baseName,fileNameWithExt);
        // 最終的な fileNameLists の例: { 'Module1': 'Module1.cls', 'Utils': 'Utils.bas', ... }
    });

    // 拡張子付きの名称を格納する配列
    const fileNameWithExtAry: Array<string> = Array.from(fileNameWithExtMap.values());

    //fileNameList配列の値を基にファイルのコピーを実行する。
    fileUtils.copyFileList(checkedSrcPath , checkedTempPath , fileNameWithExtAry);

    //コピー先フォルダ（checkedDestPath）からファイル名を取得して配列に格納する。
    const tempDirent = fs.readdirSync(checkedTempPath,{ withFileTypes: true});

    //tempDirentからDirent.filter()とDirent.isFile()でファイルのみを取り出し、Array.map()で新しい配列に格納。
    const tempFileNames: string[] = tempDirent.
    filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

    const outputJsonFullPathsList:Array<string>=[];

    try{    
        for(const targetFileName of tempFileNames){
            // console.log('\n---XDocGenを実行します---')

            const outputJsonDir:string|null = 
            vbaToJson.vbaToJson(checkedTempPath, targetFileName, checkedOutputJsonPath) ?? null;

            if(!outputJsonDir){
                console.error(`\x1b[31m❌ エラー: JSON化の処理に失敗しました。\x1b[0m`);
                continue; // ★ nullの場合は次のファイルの処理を行う
            }

            outputJsonFullPathsList.push(outputJsonDir);
        }       
    }catch(error: any){

        throw new Error(
            // エラー発生時にスローする。process.exit(1)だと強制的に処理が終了するため。
            // エラーオブジェクトには stderr プロパティが含まれることが多いですが、
            // 含まれない場合もあるため、両方を考慮してエラーメッセージを表示します
            `\x1b[31m❌ エラー: 実行中に問題が発生しました\n`+
            `エラー出力:${error.stderr ? error.stderr.toString() : error.message}\x1b[0m`);
     
    }

    // MAPにソースになったVBAファイルの名前のリストとJSON化したファイルのリストを格納する。
    const returnMaps: Map<string,Array<string> | Map<string,string>> = new Map();

    returnMaps.set(INTERNAL_KEYS.SRC_FILE_NAME_LIST, fileNameWithExtMap);
    returnMaps.set(INTERNAL_KEYS.OUTPUT_JSON_PATHS, outputJsonFullPathsList);

    return returnMaps;
}


/**
 * JSONファイルをMarkdownドキュメントに変換するプロセスを実行します。
 * 
 * @remarks
 * `runXdocgen` の実行結果として得られたJSONファイルリストとファイル名マッピング情報を使用し、
 * `jsonMDGenerator` を呼び出してMarkdownファイルを生成します。
 * 
 * @param requirePathAndNameMap - `runXdocgen` から返された、ファイルパスや名称のマッピング情報を含むMap。
 * @param outputMDPath - 生成されたMarkdownファイルを出力するディレクトリのフルパス。
 * @param targetExtension - 処理対象のJSONファイルの拡張子（デフォルト: `.json`）。
 * @returns 生成されたMarkdownファイルのフルパスのリスト。処理に失敗した場合は `null` を返します。
 */
export function jsonToMDConvert(
    requirePathAndNameMap: Map<string,Array<string>| Map<string,string>>,
    outputMDPath: string,
    targetExtension: string = EXT.JSON)
    : string[] | null{

//変換に成功したJsonファイルの名前を格納する配列。リザルト用。
const resultConvertFullPaths: Array<string> = [];

try {
    // パスのチェックを行い、問題なければパスを受け取る。
    const checkedOutputMDPath = fileUtils.checkAndMakeDir(outputMDPath);

    if(!checkedOutputMDPath){
        console.error(`\x1b[31m❌ エラー: 引数の初期化に失敗したため処理を終了します。\x1b[0m`);
        return null;
    }

    //拡張子の正規化とNULLチェック
    const checkedExtension = fileUtils.normalizeExtension(targetExtension);

    if(!checkedExtension || checkedExtension !== EXT.JSON){
        console.error(`\x1b[31m❌ エラー: 引数の拡張子${targetExtension}にエラーが存在するため、処理を終了します。\x1b[0m`);
        return null;
    }

    //MD出力先フォルダのクリーンアップ
    fileUtils.cleanDirFiles(outputMDPath,checkedExtension);

    // JSONのフルパスを持った配列をMapから取り出す
    // 1. get() の結果はユニオン型なので、先に受け止める
    const jsonFullPathListAry = requirePathAndNameMap.get(INTERNAL_KEYS.OUTPUT_JSON_PATHS);

    // 2. 戻り値が Array<string> であることを確認する
    if (!jsonFullPathListAry || !Array.isArray(jsonFullPathListAry)) {
    // 💡 undefined や Map が返された場合も、ここでエラーを出す
    console.error('\x1b[31m❌ エラー: JSONに変換した結果のリストの形式に異常があります。処理を中断します。\x1b[0m');
    return null;
    }

    if(jsonFullPathListAry.length === 0 ){
        console.error('\x1b[31m❌ エラー: JSONに変換した結果のリストが空です。後続の処理を実行できないため処理を中断します。\x1b[0m');
        return null;
    }

    // ファイル名と拡張子付きファイル名のセットを持ったMapをrequirePathAndNameMapから取り出す
    const vbaFileNameMap = requirePathAndNameMap.get(INTERNAL_KEYS.SRC_FILE_NAME_LIST);

    // Mapであるか検証、存在確認、長さのチェックを行う
    if(!vbaFileNameMap || !(vbaFileNameMap instanceof Map) || vbaFileNameMap.size === 0){
            console.error('\x1b[31m❌ エラー: 処理に必要なVBAファイル名が存在しません。\x1b[0m');
            return null;
        }
        
            // jsonMDGeneratorの処理を開始
            for(const jsonFullPath of jsonFullPathListAry){
            try {//メモ try-catchで囲むとデフォルトでエラー発生時に次の処理に進んでくれる

                // 拡張子なしの対象のファイルの名称を取得する。
                const baseFileName = path.basename(jsonFullPath, path.extname(jsonFullPath));
                // フォルダへの書き込みに必要な拡張子込みのフルパスを作成する。
                const outputMDFullPath = path.join(checkedOutputMDPath, baseFileName + EXT.MD);

                // MD化前のVBAソースファイルの拡張子を取得しておく。
                const vbaFileNameWithExt = vbaFileNameMap.get(baseFileName);
                
                // 一つのファイルの処理に失敗しても処理は継続する。
                if(!vbaFileNameWithExt){
                    console.error('\x1b[31m❌ エラー: MD化の処理に必要なVBAファイルの名称を取得できませんでした。\x1b[0m');
                    continue;
                }

                // 処理が問題なく完了した場合のみ結果のパスを文字列で受け取る
                const result = jsonMDGenerator(jsonFullPath,vbaFileNameWithExt,outputMDFullPath);

                // resultがnullの時は結果として扱わない
                if(result){
                resultConvertFullPaths.push(outputMDFullPath);
                }

            }catch(error : any){
                console.error(`\x1b[31m❌ エラー: [${path.basename(jsonFullPath)}]の処理中にエラーが発生しました。エラー: ${error.message}\x1b[0m`);
                continue;
            }
        }
    } catch (error: any) {
            console.error(`\x1b[31m❌ エラーが発生しました。エラー名：${error.name}\x1b[0m`);
            console.error(`\x1b[31mエラースタック：${error.stack}\x1b[0m`);
            return null;
    }

    // console.log(`--- 処理を終了 ---`);
    return resultConvertFullPaths;
}


if (require.main === module) {
    main();
}
