/**
 * VBAコード解析結果（JSON）のデータ構造を定義し、検証するためのZodスキーマモジュール。
 * 
 * `xdocgen` から出力されるJSONデータの型定義を行い、TypeScriptで安全に扱うための型推論を提供します。
 * 
 * @module VbaDocSchema
 * @author Me
 */
import { z } from 'zod';
import { DOC_TAGS } from './constants'; // 定数のインポート

//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//              ZODスキーマ定義 (インタフェースを扱うライブラリ)
//_____________________________________________________________________________________


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第3階層スキーマ定義

/** 
 * VBAのソースコードのプロシージャの引数（パラメータ）情報を定義するスキーマ。
 * 引数名、型、Optionalフラグ、参照渡し/値渡しなどの情報を管理します。
*/
export const procedureParameterSchema = z.object({

    Name: z.string(),
    Optional: z.boolean(),
    Passing:z.string(),
    ParamArray:z.boolean(),
    Type:z.string(),
    Array:z.boolean(),
    Default:z.string().nullable()


}).transform(data => {
    return {
        name:data.Name,
        optional:data.Optional,
        passing:data.Passing,
        paramArray:data.ParamArray,
        type:data.Type,
        array:data.Array,
        default:data.Default,
    }
});


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第2階層スキーマ定義

/** 
 * VBAのソースコードのプロシージャレベルの情報を定義するスキーマ。
 * プロシージャ名、スコープ、ソースコード、および引数リストを管理します。
 */
export const procedureLevelSchema =z.object({

    Name: z.string(),
    Scope: z.string(),
    Static: z.boolean(),
    Procedure: z.string(),
    Type: z.string(),
    Source: z.string(),
    Param: z.union([
        //単一のVbaParameterスキーマを持つオブジェクト
        procedureParameterSchema,
        //VbaParameterスキーマを複数持つオブジェクト
        z.array(procedureParameterSchema)
    ]).nullable(),//nullの許容
    [DOC_TAGS.VAR_DESC]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),
    [DOC_TAGS.PROC_DESC]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),

}).transform(data => {
    return {
        name: data.Name,
        scope: data.Scope,
        static: data.Static,
        procedure: data.Procedure,
        type: data.Type,
        source: data.Source,
        param: data.Param,
        varDescription: data[DOC_TAGS.VAR_DESC],
        procDescription: data[DOC_TAGS.PROC_DESC]
    }
});

/** 
 * VBAのソースコードのモジュールレベルの情報を定義するスキーマ。
 * モジュール全体の説明、作成者、およびXDocGenのカスタムタグ（@VarNameなど）を管理します。
 */
export const moduleLevelSchema = z.object({

    // @Description
    [DOC_TAGS.DESCRIPTION]: z.union([
        z.string().min(1), // 💡 必須 & 1文字以上を強制
        z.array(z.string().min(1)).min(1) // 💡 必須 & 1要素以上を強制
    ]),
    // JSONにキーが存在しない場合はエラーになります（必須）
    // 値が空文字列や空配列の場合もエラーになります。
    
    // モジュール名はプログラム名と一致しないときのみ取得。
    // Zod定義に存在しますがソース解析時にプログラムから取得するため,JSONからは取得していません。
    [DOC_TAGS.MODULE_NAME]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),

    // @VarName
    //グローバル変数や重要なオブジェクト変数を管理するタグ。
    [DOC_TAGS.VAR_NAME]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),

    // @VarType
    [DOC_TAGS.VAR_TYPE]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),
    
    // @VarDescription
    [DOC_TAGS.VAR_DESC]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),

    // @ProcDescription
    //プロシージャに説明が必要な際に使用。[[プロシージャ名]]:の形式で名称をタグの直後に記述する
    [DOC_TAGS.PROC_DESC]:z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),

    // @Author
    [DOC_TAGS.AUTHOR]: z.union([
        z.string().min(1, {
            error: "Authorは必須項目で、1文字以上必要です。"
        }),
        z.array(z.string().min(1)).min(1, {
            error: "Authorの配列は必須で、1要素以上必要です。"
        })
    ]).nullable(),

    // @ToDo
    [DOC_TAGS.TODO]: z.union([
        z.string().min(1, {
            error: "ToDoタグを記述する場合は、内容を1文字以上記述してください。"
        }),
        z.array(z.string().min(1)).min(1, {
            error: "ToDoタグを記述する場合は、内容を1文字以上記述してください。"
        })
    ]).nullable(),

    // @LastUpdate
    [DOC_TAGS.LAST_UPDATE]: z.union([
        z.string(),
        z.array(z.string())
    ]).nullable().optional(),


}).transform(data =>{
  return{
    description:data.Description,
    moduleName:data.ModuleName,
    varName:data.VarName,
    varType:data.VarType,
    varDescription:data.VarDescription,
    procDescription:data.ProcDescription,
    author:data.Author,
    todo:data.ToDo,
    lastUpdate:data.LastUpdate // 変換後のオブジェクトにも追加

  }  
});


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                  第1階層スキーマ定義

/** 
 * VBAドキュメントJSONのルートオブジェクトを定義する最上位スキーマ。
 * モジュール情報 (`Module`) とプロシージャ一覧 (`Procedures`) を包括します。
 */
export const vbaDocJsonSchema = z.object({

        Procedures:z.array(procedureLevelSchema).nullable().optional(),

        Module:moduleLevelSchema.optional(),

}).transform(data =>{
  return{
    procedures:data.Procedures,
    module:data.Module
  }  
});


// 型の抽出

//#region  ZodのOmitについてのまとめ
// Omit の機能
// 元の型から特定のプロパティ（キー）を削除し、新しい型を作成します。

// 1.コードでの役割
//      問題: Zodの transform を使った結果、vbaDocJsonSchema の型推論（z.infer）が内部の module や procedures の正確な型を認識できず、型不一致エラー（ts(2719)）が発生していました。
//      解決: あなたが記述した Omit は、以下の処理を行っています。
//      TypeScript
//      export type vbaDocJson = Omit<z.infer<typeof vbaDocJsonSchema>, 'module' | 'procedures'> & { ... };
//      除外: z.infer で得られた型から、エラーの原因となっていたプロパティである 'module' と 'procedures' の型定義を一時的に取り除きます。
//      結合: &（交差型）を使って、あなたが個別に抽出した正確な型 (moduleLevel、procedureLevel) を持つ新しいプロパティを追加し直します。
//      これにより、TypeScriptコンパイラは混乱した型ではなく、明示的に定義された正確な型のみを参照するようになり、警告が解消されます。
//      構文は Omit<元の型, '削除したいキー名' | '別のキー名'> です。
// 
// 2. Omitを使いどころと今回のエラーを解決したレポート
// 🎯 Omit を使うべきエラーとその解決策Omit は、TypeScriptが型の「不一致」や「過剰な情報」によりエラーを出す場合に、
//    元の型を調整してエラーを回避するために使用されます。事象（エラーメッセージ）想定される原因解決策（Omit の使い方）ts(2719): 同じ名前で2つの異なる型が存在しますが、これは関連していません。Zodの transform を伴うネストされた型の競合。 トップレベルの z.infer と、個別に抽出した z.infer の結果が、コンパイラによって別物と認識される。競合するプロパティを削除し、正しい型を再適用します。ts(2322): 型Aを型Bに割り当てることはできません。プロパティXが存在しません。元の型（A）に不要なプロパティXが含まれているため、代入先（B）の型がエラーを出す。または、ユーティリティ型で特定のプロパティを削除したい。削除したいプロパティを明示的に指定します。ts(2322): 型Aを型Bに割り当てることはできません。プロパティXの型が異なります。元の型（A）のプロパティXの型が過剰（例：`stringnumber）であり、代入先（B）では string` のみが必要な場合。💻 今回のエラー（ts(2719)）の詳細なまとめ1. 発生した事象エラー: ts(2719) （同じ名前で2つの異なる型が存在しますが、これは関連していません）2. 原因Zodの transform を使用し、ネストされたオブジェクトの型（例: moduleLevelSchema）を変換した。vbaDocJsonSchema 全体で z.infer を行った結果の型 (vbaDocJson) と、moduleLevelSchema から個別に抽出した型 (moduleLevel) が、コンパイラによって異なる実体と見なされた。vbaDocJson.module を moduleLevel の変数に代入しようとした際、「身元の違う型同士の代入はできない」 と判断された。3. 解決策Omit と &（交差型） を組み合わせて、型を再構成し、衝突を解消しました。TypeScriptexport type vbaDocJson = 
//     {
//         // 💡 正しい型でプロパティを上書きして再適用
//         module: moduleLevel | undefined;
//         procedures: Array<procedureLevel> | null | undefined;
//     };
// この方法により、TypeScriptは vbaDocJson.module の型を、個別に抽出された信頼できる moduleLevel 型として認識するようになり、エラーが解消されました。
//#endregion

export type vbaDocJson = Omit<z.infer<typeof vbaDocJsonSchema>,'module'|'procedures'>&{
        module: moduleLevel|undefined;
        procedures: Array<procedureLevel>| null | undefined;
     
};
// Zodの定義ごとに型にして利用します。
export type procedureLevel = z.infer<typeof procedureLevelSchema>;
export type moduleLevel = z.infer<typeof moduleLevelSchema>;
export type procParameters = z.infer<typeof procedureParameterSchema>;
