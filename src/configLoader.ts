/**
 * 設定ファイル（JSON）の読み込みと検証を行うモジュール。
 * 
 * このモジュールは、アプリケーションの起動時に必要な設定情報をファイルから読み込み、
 * Zodスキーマを使用してその妥当性を検証します。
 * 
 * ## プログラム間の連携フロー
 * 1. `main.ts` が起動時に `pathResolver.resolvePathObj()` を呼び出します。
 * 2. `pathResolver` は本モジュールの `initialJsonRead()` を呼び出し、環境設定ファイル（`vba-md-doc-env.json`）を読み込みます。
 * 3. 続いて `getConfigJson()` を呼び出し、環境設定ファイルで指定されたメイン設定ファイル（例: `vba-md-doc-config.json`）を読み込みます。
 * 4. 読み込まれた設定オブジェクトは `pathResolver` によって絶対パスに解決され、`main.ts` に返されます。
 * 
 * @module ConfigLoader
 * @author Me
 */
import * as fs from 'fs';
import * as path from 'path';
import { z , ZodType, ZodError} from 'zod';
import * as configSchema from './config.schema';
import { projectRootPath } from './main';
import { CONFIG_FILES, ENCODING } from './constants';


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                              変数定義

export type bootConfObjType = configSchema.bootstrapConfig;
export type pathConfObjType = configSchema.pathsConfig;


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                              関数定義


/**
 * 環境設定ファイル（vba-md-doc-env.json）を読み込み、検証します。
 * 
 * @remarks
 * アプリケーションの初期化フェーズで最初に呼び出される関数です。
 * このファイルには、メインの設定ファイル（config.json）のパスやキー情報が含まれています。
 * 
 * @returns 検証済みの環境設定オブジェクト。読み込みや検証に失敗した場合は `null`。
 */
export function initialJsonRead(): bootConfObjType | null{

    // 💡 Zodスキーマ (bootstrapConfigSchema) を使用して、読み込んだJSONデータの構造を検証します。
    // 定義された型 (bootConfObjType) と一致しない場合、validateData内でエラーが捕捉されます。
    const bootstrapJson:bootConfObjType| null= 
    validateData(configSchema.bootstrapConfigSchema , path.join(projectRootPath, CONFIG_FILES.ENV));
    
    if(!bootstrapJson){
        console.error(`\x1b[31m❌ エラー: 初期化に必要な${CONFIG_FILES.ENV}が見つかりませんでした。\x1b[0m`);
        return null;
    }

    return bootstrapJson;
}


/**
 * 指定された設定ファイルを読み込み、Zodスキーマで検証して返します。
 * 
 * @remarks
 * `initialJsonRead` で取得した環境設定情報を基に、
 * 実際にアプリケーションで使用する設定ファイル（パス設定など）を特定して読み込みます。
 * 
 * @param bootConfschema - 検証に使用するZodスキーマ。
 * @param bootConfigKey - 環境設定オブジェクト内で、対象の設定ファイルパスが格納されているプロパティのキー。
 * @returns 検証済みの設定オブジェクト（型はスキーマから推論）。失敗した場合は `null`。
 */
export function getConfigJson<T extends ZodType>(bootConfschema:T,  bootConfigKey:string): z.infer<T>| null{

    const confJsonListObj:bootConfObjType | null = initialJsonRead();
    if(!confJsonListObj){
        console.error(`\x1b[31m❌ エラー: ${CONFIG_FILES.ENV}が読み込めませんでした。\x1b[0m`);
        return null;
    }
    
    // [targetProp as keyof typeof confJsonListObj.targetConfig] 型アサーション。
    // keyof：その型の持つプロパティのキー値を取得する。 targetProp as...：存在するキーの型であると断定する。
    // targetPropが必ずconfJsonListObj.targetConfigのキー値であると伝えている。
    // const bootConfPath:string = confJsonListObj.targetConfig[targetPropKey as keyof typeof confJsonListObj.targetConfig]; 
    const bootConfPath:string = confJsonListObj.targetConfig[bootConfigKey as keyof typeof confJsonListObj.targetConfig]; 

    if (typeof bootConfPath !== 'string') {
    // 💡 警告メッセージを出し、nullで終了
    console.error(`\x1b[31m❌ エラー: ブート設定JSONにキー "${bootConfigKey}" が見つからないか、パスが文字列ではありません。\x1b[0m`);
    return null;
    }

    // 💡 引数で受け取ったZodスキーマ (bootConfschema) を使用して、動的に対象のJSONファイルを検証します。
    // 成功すれば、スキーマから推論された型 (z.infer<T>) のオブジェクトが返されます。
    const confObj:z.infer<T> | null = 
    validateData(bootConfschema , path.join(projectRootPath,bootConfPath));

    return confObj;
}


/**
 * 任意のJSONファイルを読み込み、指定されたZodスキーマで検証します。
 * 
 * @remarks
 * ファイル読み込み (`loadJsonFile`) と スキーマ検証 (`schema.parse`) を一括で行うヘルパー関数です。
 * エラー発生時には詳細なログを出力します。
 * 
 * @param schema - 検証に使用するZodスキーマ。
 * @param sourceJsonFullPath - 読み込むJSONファイルのフルパス。
 * @returns 検証済みのオブジェクト。失敗した場合は `null`。
 */
export function validateData<T extends ZodType>(schema: T , sourceJsonFullPath: string):z.infer<T>|null{

    try{
        // JSONの読み込み
        const anyJsonFile = loadJsonFile(sourceJsonFullPath);
        // nullチェック＆型チェック
        // typeof は直後の値の型を文字列で返す演算子(typeof anyJsonFile なら anyJsonFileの型を文字列で戻す)
        if(anyJsonFile === null || typeof anyJsonFile === 'undefined'){
            console.warn(`\x1b[33m⚠️ 警告: ファイル${sourceJsonFullPath}は読み込めましたが、内容が空です。\x1b[0m`);
            return null;
        }
        
        // 💡 Zodによるバリデーション実行 (schema.parse) バリデーション＝検証
        // 読み込んだJSONデータ (anyJsonFile) が、Zodスキーマ (schema) の定義と一致するか検証します。
        // - 成功時: 型情報が付与されたオブジェクトを返します。
        // - 失敗時: ZodError例外をスローします。
        return schema.parse(anyJsonFile);
    
    }catch(e){
       
    // エラー型の比較を行う。Zodスキーマ由来のエラーの場合
    if(e instanceof ZodError){
        // 💡 修正点: オブジェクト全体 (e) を JSON.stringify で出力する
        console.error(`\x1b[31m--- ❌ Zod検証エラーが発生しました ---\x1b[0m`);
        console.error(`\x1b[31mファイル: "${sourceJsonFullPath}"\x1b[0m`);
        
        // ZodErrorオブジェクト全体を文字列化して出力
        // ZodErrorはシリアライズ（文字列化）のために .toString() メソッドを持つが、
        // JSON.stringify を試して、どのプロパティが出力されるか確認する
        console.error('\x1b[31mZodErrorオブジェクト全体:\x1b[0m', JSON.stringify(e, null, 2));

        // 念のため、標準の toString() も出力
        console.error('\x1b[31mZodError.toString():\x1b[0m', e.toString());
        
        console.error('\x1b[31mJSONのチェックに失敗しました。処理を中断します。\x1b[0m');
    } else if (e instanceof Error) {
        console.error(`\x1b[31m--- ❌ 設定ファイル処理エラーが発生しました ---\x1b[0m`);
        console.error(`\x1b[31mファイル: "${sourceJsonFullPath}"\x1b[0m`);
        console.error(`\x1b[31mエラー: ${e.message}\x1b[0m`);
        
    // その他のエラー
    } else {
        console.error(`\x1b[31m❌ 不明なエラー:\x1b[0m`, e);
    }
    
    return null;
    }
}



/**
 * 指定されたパスからJSONファイルを読み込み、パースして返します。
 * 
 * @remarks
 * ファイルの存在確認を行い、UTF-8として読み込みます。
 * 単純な `JSON.parse` を行うだけで、スキーマ検証は行いません。
 * 
 * @param filePath - 読み込むファイルのフルパス。
 * @returns パースされたJSONオブジェクト（unknown型）。
 * @throws ファイルが存在しない場合、またはJSONのパースに失敗した場合にエラーをスローします。
 */
export function loadJsonFile(filePath : string): unknown{
    
    if(!fs.existsSync(filePath)){
    //ファイルが見つからない場合、エラーをスローする。以下はスローにする前の処理。
        //console.error(`エラー： vbadocconf.jsonが見つかりません：${filePath}`);
        //process.exit(1);
    throw new Error(`エラー： ${filePath} が見つかりません：`);
    }
    try{

        const configFile = fs.readFileSync(filePath, ENCODING.UTF8);
        return JSON.parse(configFile);

    }catch(error: any){
        //ファイルが見つからない場合、エラーをスローする。以下はスローにする前の処理。
        //console.error(`エラー： config.jsonが見つかりません：${filePath}`);
        //process.exit(1);
        throw new Error(`エラー：設定ファイルの解析または読み込み中に失敗しました：${filePath} 詳細: ${error.message}`);
        }
}