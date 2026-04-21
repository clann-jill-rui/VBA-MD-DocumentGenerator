/**
 * 設定ファイル内のパス情報を解決し、絶対パスに変換するモジュール。
 * 
 * 環境設定ファイル (`vba-md-doc-env.json`) と メイン設定ファイル (`vba-md-doc-config.json`) を読み込み、
 * プロジェクトルートからの相対パスとして記述されている設定値を、実行環境における絶対パスに変換します。
 * 
 * @module PathResolver
 * @author Me
 */
import * as path from 'path';
import { projectRootPath } from './main';
import {getConfigJson} from './configLoader'
import * as configSchema from './config.schema'
import type { bootstrapConfig,pathsConfig } from './config.schema';
import { initialJsonRead } from './configLoader';


// ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第3階層オブジェクト

    /** resolvedFullPaths.io.sourceオブジェクト */
    export interface source{
        
        /** バッファとして設定した余分なプロパティ */
        anyFiles: string;

        /** ソース系ファイルのフルパス */
        srcFiles: string;
    }

    /** resolvedFullPaths.io.outputオブジェクト */
    export interface output{
        
        /** ソースファイル(マスタ)をコピーした作業用のファイルを格納するフォルダのフルパス */
        temp: string;

        /** 中間の成果物を格納するフォルダのフルパス */
        out: string;

        /** VBAを変換したJSONを格納するフォルダのフルパス */
        json: string;

        /** JSONを変換したマークダウンを格納するフォルダのフルパス */
        markdown: string;
    }


// ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第2階層オブジェクト

/** resolvedFullPaths.ioオブジェクト */
export interface io {

    /** ソースファイルのフルパスを管理 */
    sourcePaths: source;

    /** 出力先のフルパスを管理 */
    outputPaths: output;
}

export interface implementations {
// プログラムファイル

    /** main.tsのフルパス */
    implDir:string;
        
    /** main.tsのフルパス */
    main: string;

    /** vbaToJson.tsのフルパス */
    vbaToJson: string;

    /** configLoader.tsのフルパス */
    configLoader: string;

    /** config.Schema.tsのフルパス */
    configSchema: string;

    /** fileUtils.tsのフルパス */
    fileUtils: string;

    /** jsonMDGenerator.tsのフルパス */
    jsonMDGenerator: string;

    /** pathResolver.tsのフルパス */
    pathResolver: string;

    /** docgen.jsのフルパス */    
    xdocgen: string;

}

export interface params {
    
    /** 削除対象の拡張子を指定する */
    extension: string;

    /** マークダウン作成の分岐用フラグ */
    markdownFlg: string;
}


// ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第1階層オブジェクト

export interface resolvedFullPaths{

    /** package.jsonを基準にしたプロジェクトルートのフルパス */
    ioPaths: io;
    
    /** package.jsonを基準にしたプロジェクトルートのフルパス */
    implementationsPaths: implementations;

    /** package.jsonを基準にしたプロジェクトルートのフルパス */
    params: params;
}


// ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                      変数宣言


// ￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                      関数定義


/**
 * 設定ファイルのパス解決処理のエントリーポイント。
 * 
 * @remarks
 * 1. `initialJsonRead()` で環境設定 (`env.json`) を読み込みます。
 * 2. `getConfigJson()` でメイン設定 (`config.json`) を読み込みます。
 * 3. `constructFullPath()` を呼び出し、設定内の相対パスを全て絶対パスに変換します。
 * 
 * @returns 全てのパスが絶対パスに解決された設定オブジェクト。失敗時は `null`。
 */
export function resolvePathObj():resolvedFullPaths | null{
    
        const confJsonListObj:bootstrapConfig | null = initialJsonRead();
        const checkedConfProp = confJsonListObj?.targetConfig.bootConfigKey;

        if(!checkedConfProp){
            console.error('\x1b[31m❌ エラー: configファイルの名前がundefinedです。初期化用JSONファイル(vba-md-doc-env.json)を確認してください。\x1b[0m');
            return null;
        }

    const configObj: pathsConfig |null= getConfigJson(configSchema.configsSchema,checkedConfProp);

    if(!configObj){
        console.error('\x1b[31m❌ エラー: 指定されたコンフィグファイルが見つかりませんでした。\x1b[0m');
        return null;
    }

    const resolvedPathsObj : resolvedFullPaths|null  = constructFullPath(configObj);
    if(!resolvedPathsObj){
        console.error('\x1b[31m❌ エラー: パス情報を管理するオブジェクトがNULLで返されました。\x1b[0m');
        return null;
    }

    return resolvedPathsObj;
}


/**
 * 設定オブジェクト内のパス文字列を走査し、絶対パスへの変換処理をキックします。
 * 
 * @param configObj - 読み込まれた生の設定オブジェクト。
 * @returns パス解決後の設定オブジェクト。
 */
export function constructFullPath(configObj:pathsConfig|null):resolvedFullPaths| null{
    
    if(configObj === null){
        console.error('\x1b[31m❌ エラー: コンフィグが読み取れませんでした。処理を終了します。\x1b[0m');
        return null;
    }

    // Partial<インタフェース型>によって型を持った空のオブジェクトを宣言できる。
    // 最終的な型は<>に指定したインタフェース型によって決定する。
    const retResolvedObj:resolvedFullPaths = processPaths(configObj);

    return retResolvedObj;

}


/**
 * 任意のオブジェクトを再帰的に走査し、文字列型の値に対してパス結合処理を行う関数。
 * 
 * @remarks
 * オブジェクトのプロパティを再帰的に探索し、値が文字列であれば `projectRootPath` と結合して絶対パスにします。
 * これにより、設定ファイルの階層構造に依存せず、すべてのパス設定を一括で解決します。
 * 
 * @param obj - 処理対象のオブジェクト (pathsConfigまたはそのネストされたオブジェクト)
 * @returns パス結合処理後のオブジェクト
 */
export function processPaths<T extends object>(obj : T):T{

    // 戻り値になるオブジェクト(Partial<T>=オブジェクトの最終的な型を保証することで空オブジェクトの宣言を可能にする)
    const resolvedObj : Partial<T>={};
    
    // 1.引数objからresolvedObjにプロパティを格納する処理の開始
    // Object.entriesでキーと値のペアを取得し、ループする
    for(const [key,value] of Object.entries(obj)){

        // 2.objのプロパティが文字列の場合
        if(typeof value === 'string') {

            // 💡 `as any` を使用する理由:
            // TypeScriptでは、動的にプロパティ `[key]` を追加する際に厳密な型チェックが働きます。
            // `resolvedObj` は `Partial<T>` 型ですが、ループ内の `key` が `T` のどのプロパティに対応するか
            // 静的に解決できないため、型エラーが発生します。
            // ここでは、最終的に `resolvedObj as T` で型を保証することを前提に、
            // `as any` で一時的に型チェックを回避しています。
            // resolvedObjのプロパティが文字列ならそのままパスの解決を行う。
            (resolvedObj as any)[key] = path.join(projectRootPath! ,value);

        // 3.objのプロパティがオブジェクトの場合(再帰処理)
        }else if(typeof value === 'object' && value !== null && !Array.isArray(value)){
            
            // resolvedObjのプロパティがオブジェクトのとき再帰処理で処理を開始し、
            // 最下位の文字列のプロパティまで格納したらリターンして上位のプロパティを格納していき、
            // 最後にオブジェクトをプロパティとして格納する。
            (resolvedObj as any)[key] = processPaths(value as object) as any;
        
        // 4.それ以外のプロパティの場合
        }else{

            // 文字列、オブジェクトのいずれでもないプロパティが引数にされたとき、
            // 無条件で値をプロパティとして格納する。
            (resolvedObj as any)[key] = value;

        }
    }

    // 5.ジェネリスク型に型アサーションしつつ戻す
    return resolvedObj as T;
}
