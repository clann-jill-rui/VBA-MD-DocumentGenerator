/**
 * アプリケーション全体で使用する定数を一元管理するモジュール。
 * 
 * @module Constants
 * @author Me
 */

/*
 * ## `as const` (Const Assertion) について
 * このモジュールでは、すべての定数オブジェクトに `as const` を付与しています。
 * これはTypeScript特有の機能で、以下の2つの強力な効果により、定数の安全性を高めます。
 * 
 * 1. **読み取り専用 (Readonly) になる**
 *    - プロパティの変更がコンパイル時にエラーとなり、意図しない書き換えを防ぎます。
 *    ```typescript
 *    // コンパイルエラーになります！
 *    CONFIG_FILES.ENV = 'other.json'; 
 *    // Error: Cannot assign to 'ENV' because it is a read-only property.
 *    ```
 * 
 * 2. **型がリテラル型になる**
 *    - 各プロパティの型が、一般的な `string` 型ではなく、その値そのものの文字列リテラル型として推論されます。
 *    - `as const` なし: `ENV` は `string` 型
 *    - `as const` あり: `ENV` は `'vba-md-doc-env.json'` 型
 * 
 * これにより、タイプミスや不正な値の代入をコンパイラが検知できるようになり、コードの堅牢性が向上します。
 */

/**
 * 処理対象とするファイルの拡張子を定義します。
 */
export const EXTENSIONS = {
    VBA: ['.cls', '.bas', '.frm', '.mod', '.docm', '.xlsm'],
    JSON: '.json',
    MARKDOWN: '.md'
} as const;

/**
 * 単体の拡張子を定義します。
 */
export const EXT = {
    JSON: '.json',
    MD: '.md',
    VBA_DEFAULT: '.cls'
} as const;

/**
 * プロジェクトで使用する設定ファイル名を定義します。
 */
export const CONFIG_FILES = {
    ENV: 'vba-md-doc-env.json',
    MAIN: 'vba-md-doc-config.json',
    PACKAGE_JSON: 'package.json'
} as const;

/**
 * 設定ファイル内で使用されるキー名を一元管理します。
 */
export const CONFIG_KEYS = {
    IO_PATHS: 'ioPaths',
    SOURCE_PATHS: 'sourcePaths',
    OUTPUT_PATHS: 'outputPaths',
    ANY_FILES: 'anyFiles',
    SRC_FILES: 'srcFiles',
    TEMP: 'temp',
    OUT: 'out',
    JSON: 'json',
    MARKDOWN: 'markdown',

    IMPLEMENTATIONS_PATHS: 'implementationsPaths',
    IMPL_DIR: 'implDir',
    MAIN: 'main',
    VBA_TO_JSON: 'vbaToJson',
    CONFIG_LOADER: 'configLoader',
    CONFIG_SCHEMA: 'configSchema',
    FILE_UTILS: 'fileUtils',
    JSON_MD_GENERATOR: 'jsonMDGenerator',
    PATH_RESOLVER: 'pathResolver',
    XDOCGEN: 'xdocgen',

    PARAMS: 'params',
    EXTENSION: 'extension',
    MARKDOWN_FLG: 'markdownFlg',

    TARGET_CONFIG: 'targetConfig',
    RESOLVE_BOOT_CONFIG_PATH: 'resolveBootConfigPath',
    BOOT_CONFIG_KEY: 'bootConfigKey'
} as const;

/**
 * VBAソースコード内で使用されるXDocGenタグ名を定義します。
 */
export const DOC_TAGS = {
    DESCRIPTION: 'Description',
    AUTHOR: 'Author',
    LAST_UPDATE: 'LastUpdate', // 追加
    TODO: 'ToDo',
    MODULE_NAME: 'ModuleName',
    VAR_NAME: 'VarName',
    VAR_TYPE: 'VarType',
    VAR_DESC: 'VarDescription',
    PROC_DESC: 'ProcDescription'
} as const;

/**
 * アプリケーション内で使用するエラーメッセージを定義します。
 */
export const ERROR_MSGS = {
    ROOT_PATH_FAILED: 'プロジェクトのルートパスの取得に失敗しました。プログラムを終了します。',
    JSON_LOAD_FAILED: 'JSONのチェックに失敗しました。処理を中断します。'
} as const;

/**
 * ファイルの読み書き時に使用するエンコーディング（文字コード）を定義します。
 */
export const ENCODING = {
    SHIFT_JIS: 'Shift_JIS',
    UTF8: 'utf8'
} as const;

/**
 * 内部処理（Mapのキーなど）で使用するキー名を定義します。
 */
export const INTERNAL_KEYS = {
    SRC_FILE_NAME_LIST: 'sourceVBAFileNameList',
    OUTPUT_JSON_PATHS: 'outputJSONFullPathsList'
} as const;

/**
 * Markdownドキュメント生成時に使用する固定テキストやラベルを定義します。
 */
export const MD_TEXT = {
    HEADER_SUFFIX: ' リファレンス',
    AUTHOR: '作成者:',
    MODULE_TYPE: 'モジュールタイプ:',
    DESCRIPTION: '説明:',
    TOC: '目次',
    VAR_LIST: '変数一覧',
    PROC_LIST: 'プロシージャ一覧',
    FUNC_LIST: '関数一覧',
    NO_VAR_DOC: 'ドキュメント化された変数が存在しません',
    NO_VAR_MODULE: 'このモジュールには変数がありません。',
    NO_PROC_MODULE: 'このモジュールにはプロシージャがありません。',
    NO_DESC: '説明文が存在しません。',
    NO_ARG: 'このプロシージャには引数が存在しません。',
    STATIC_SUFFIX: '(Static)',
    
    // テーブルヘッダー
    TH_VAR: [' 変数名 ', ' 型 ', ' 説明 '],
    TH_PROC: ['アクセス修飾子', '種類', '戻り値'],
    TH_PARAM: ['名称', '型', '渡し方', 'オプション', 'デフォルト値'],
    
    // 値の表示
    VAL_NONE: '値がありません',
    VAL_BYREF: '参照渡し(ByRef)',
    VAL_BYVAL: '値渡し(ByVal)',
    VAL_YES: 'Yes',
    VAL_NO: 'No',
    VAL_EMPTY: '無'
} as const; 
