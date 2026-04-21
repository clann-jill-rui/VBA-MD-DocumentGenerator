/**
 * 設定ファイル（JSON）の構造と検証ルールを定義するZodスキーマモジュール。
 * 
 * アプリケーションの設定ファイル (`vba-md-doc-config.json` および `vba-md-doc-env.json`) が
 * 正しい形式であることを保証するためのスキーマを提供します。
 * 
 * @module ConfigSchema
 * @author Me
 */
import { z , ZodType} from 'zod';
import type * as pathResolver from './pathResolver';
import { CONFIG_KEYS } from './constants'; // 定数のインポート

export type resolveFullPaths = pathResolver.resolvedFullPaths;
export type resolveIo = pathResolver.io;
export type resolveImplementations = pathResolver.implementations;
export type resolevParams = pathResolver.params;
export type resolveSource = pathResolver.source;
export type resolveOutput = pathResolver.output;


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//              ZODスキーマ定義 (インタフェースを扱うライブラリ)
//_____________________________________________________________________________________

//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第3階層スキーマ定義


/**
 * ソースパス設定のスキーマ定義。
 * @remarks `vba-md-doc-config.json` の `ioPaths.sourcePaths` に対応します。
 */
export const sourcePathsSchema:ZodType<resolveSource> = z.object({
    [CONFIG_KEYS.ANY_FILES]: z.string(),
    [CONFIG_KEYS.SRC_FILES]: z.string()
});


/**
 * 出力パス設定のスキーマ定義。
 * @remarks `vba-md-doc-config.json` の `ioPaths.outputPaths` に対応します。
 */
export const outputPathsSchema:ZodType<resolveOutput> = z.object({
    [CONFIG_KEYS.TEMP]: z.string(),
    [CONFIG_KEYS.OUT]: z.string(),
    [CONFIG_KEYS.JSON]: z.string(),
    [CONFIG_KEYS.MARKDOWN]: z.string(),
});


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第2階層スキーマ定義


/**
 * I/Oパス設定のスキーマ定義。
 * @remarks `vba-md-doc-config.json` の `ioPaths` に対応します。
 */
export const ioPathsSchema:ZodType<resolveIo> = z.object({

    [CONFIG_KEYS.SOURCE_PATHS]: sourcePathsSchema,
    [CONFIG_KEYS.OUTPUT_PATHS]: outputPathsSchema,

});


/**
 * プログラム実装ファイルのパス設定スキーマ定義。
 * @remarks `vba-md-doc-config.json` の `implementationsPaths` に対応します。
 */
export const implementationsPathsSchema:ZodType<resolveImplementations> = z.object({

    [CONFIG_KEYS.IMPL_DIR]: z.string(),
    [CONFIG_KEYS.MAIN]: z.string(),
    [CONFIG_KEYS.VBA_TO_JSON]: z.string(),
    [CONFIG_KEYS.CONFIG_LOADER]: z.string(),
    [CONFIG_KEYS.CONFIG_SCHEMA]: z.string(),
    [CONFIG_KEYS.FILE_UTILS]: z.string(),
    [CONFIG_KEYS.JSON_MD_GENERATOR]: z.string(),
    [CONFIG_KEYS.PATH_RESOLVER]: z.string(),
    [CONFIG_KEYS.XDOCGEN]: z.string()

});

/**
 * 実行パラメータ設定のスキーマ定義。
 * @remarks `vba-md-doc-config.json` の `params` に対応します。
 */
export const paramSchema:ZodType<resolevParams> =z.object({

    [CONFIG_KEYS.EXTENSION]: z.string(),
    [CONFIG_KEYS.MARKDOWN_FLG]: z.string(),
});


/**
 * 起動設定のスキーマ定義。
 * @remarks `vba-md-doc-env.json` の `targetConfig` に対応します。
 */
export const targetConfig = z.object({
    [CONFIG_KEYS.RESOLVE_BOOT_CONFIG_PATH]: z.string(),
    [CONFIG_KEYS.BOOT_CONFIG_KEY]: z.string()
})

//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第1階層スキーマ定義


/**
 * メイン設定ファイル (`vba-md-doc-config.json`) 全体のスキーマ定義。
 * @remarks
 * `pathResolver` モジュールで定義された `resolvedFullPaths` 型との型チェックを行っています。
 * これにより、JSON設定ファイルの構造とプログラム内部で利用する型との整合性を保証します。
 */
export const configsSchema: ZodType<resolveFullPaths> = z.object({
    [CONFIG_KEYS.IO_PATHS]: ioPathsSchema,
    [CONFIG_KEYS.IMPLEMENTATIONS_PATHS]: implementationsPathsSchema,
    [CONFIG_KEYS.PARAMS]: paramSchema
});

/**
 * 環境設定ファイル (`vba-md-doc-env.json`) 全体のスキーマ定義。
 */
export const bootstrapConfigSchema = z.object({
    [CONFIG_KEYS.TARGET_CONFIG]: targetConfig,
});


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  ZODスキーマの検証・型の抽出


//型の抽出(typeキーワード = 型の定義を変数に保持する)
// 変数、引数、戻り値に使用する型情報として利用できため、重要な要素である。
export type bootstrapConfig = z.infer<typeof bootstrapConfigSchema>;
export type pathsConfig = z.infer<typeof configsSchema>;