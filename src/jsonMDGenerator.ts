/**
 * JSONデータをMarkdown形式のドキュメントに変換するモジュール。
 * 
 * xdocgenがVBA(CLS)ファイルから作成したJSONファイルを、
 * MD形式ファイルに変換・出力しドキュメントを自動生成するプログラムです。
 * 
 * @module JsonMDGenerator
 * @author Gemini & Me
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vbaDocSchema from './vbaDoc.schema';
import type {vbaDocJson, procedureLevel, moduleLevel,procParameters} from './vbaDoc.schema'
import * as configLoader from './configLoader';
import { projectRootPath } from './main';
import { MD_TEXT, ENCODING } from './constants';

//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
//                                  関数定義

/**
 * Markdownドキュメント生成処理の全体を制御し、ファイルを書き出します。
 * 
 * @remarks
 * 1. 指定されたJSONファイルを読み込み、Zodスキーマで検証します。
 * 2. 各セクション（ナビゲーション、変数、定数、プロシージャ）のMarkdown生成関数を呼び出します。
 * 3. 生成されたMarkdownテキストを結合し、指定された出力パスにファイルとして書き出します。
 * 
 * @param srcJsonFullPath - 変換元となるJSONファイルのフルパス。
 * @param fileNameWithExt - VBAソースファイルのファイル名（拡張子付き）。リンク生成などに使用します。
 * @param outputPath - 生成されたMarkdownファイルを出力するパス。
 * @returns 生成されたMarkdownファイルのフルパス。処理に失敗した場合は `null` を返します。
 */
export function jsonMDGenerator(
    srcJsonFullPath: string ,
    fileNameWithExt: string | undefined,
    outputPath: string)
    :string | null {

    // 1. JSONファイルを読み込む

    // 💡 Zodスキーマ (vbaDocJsonSchema) を使用して、VBA解析結果のJSONファイルを検証します。
    // 必須プロパティ (Module, Proceduresなど) が存在するか、型が正しいかを確認します。
    const srcJson = configLoader.validateData(
    vbaDocSchema.vbaDocJsonSchema , srcJsonFullPath);

    const module: moduleLevel | undefined = srcJson?.module;
    const procedure : Array<procedureLevel> | null | undefined= srcJson?.procedures;

    if(!srcJson || !module || !procedure){
        console.error('\x1b[31m❌ エラー: JSONのチェックに失敗しました。処理を中断します。\x1b[0m');
        return null;
    }

    // 拡張子込みでファイル名を抽出する
    // おまけ 拡張子抜きでファイル名を抽出する場合 → const jsonfileName = path.basename(srcJsonFullPath,path.extname(srcJsonFullPath));
    let result = ''; 
    let markdownContent : string ='';
    

    // 2. JSONをMarkdownに変換するーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    if(!fileNameWithExt){
        console.error('\x1b[31m❌ エラー: MD文書の作成に必要な情報に問題があります：VBAファイル名\x1b[0m');
        return null;
    }
    const navigateMd = generateMDNavigateSection(fileNameWithExt, module, procedure);

    // ナビゲーションセクションの作成ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    if(navigateMd === null){
        console.error('\x1b[31m❌ エラー: ナビゲーションセクションの作成に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }
    markdownContent += navigateMd;

    // 変数セクションの作成ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    const variantsMd = generateMDVariantsSection(module);

    if(variantsMd === null){
        console.error('\x1b[31m❌ エラー: 変数セクションの作成に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }
    markdownContent += variantsMd;
    
    // 定数セクションの作成ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    const constantsMd = generateMDConstantsSection(procedure, module);
    if (constantsMd) {
        markdownContent += constantsMd;
    }

    // 列挙型・ユーザー定義型セクションの作成ーーーーーーーーーーーーーーーーーーーーーーーーー
    const enumTypeMd = generateMDEnumAndTypeSection(procedure, module);
    if (enumTypeMd) {
        markdownContent += enumTypeMd;
    }

    // プロシージャセクションの作成ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
    const procedureMd = generateMDProceduresSection( procedure, module);
    
    if(procedureMd === null){
        console.error('\x1b[31m❌ エラー: プロシージャセクションの作成に失敗しました。処理を終了します。\x1b[0m');
        return null;
    }
    markdownContent += procedureMd;

    if(markdownContent.length === 0){
        console.error('\x1b[31m❌ エラー: すべてのセクションの作成に失敗しました。\x1b[0m');
        return null;
    }

    // 3. Markdownファイルを書き出す
        try {
            // const baseMdFileName = path.basename(srcJsonFullPath,path.extname(srcJsonFullPath)) + '.md';
            // const outputFullPath = path.join(outputPath, baseMdFileName);

            // writeFileSync()の第一引数はファイルまで含んだフルパスを渡す。第二引数は書き込む文字列の情報。
            fs.writeFileSync(outputPath, markdownContent, ENCODING.UTF8);
            result = outputPath;
            const relativeMdPath = path.relative(projectRootPath, outputPath);
            console.log(`  \x1b[32m✔\x1b[0m Markdownを生成: \x1b[33m${relativeMdPath}\x1b[0m`);
            
        } catch (error: any) {
            console.error(`\x1b[31m❌ エラー: ファイルの書き込み中にエラーが発生しました: ${error.message}\x1b[0m`);
    }

    //作成したマークダウンのフルパスを戻す予定;
    return  result;
}


/**
 * ドキュメントのヘッダーおよびナビゲーション（目次）セクションを作成します。
 * 
 * @remarks
 * モジュール名、作成者、説明、最終更新日などのメタ情報と、
 * 変数・定数・プロシージャへのリンクを含む目次を生成します。
 * 
 * @param srcJsonFileName - 変換対象のファイル名。
 * @param module - モジュールレベルの情報（Author, Descriptionなど）。
 * @param procedures - プロシージャレベルの情報（リスト）。
 * @returns Markdown形式のナビゲーションセクション文字列。失敗時は `null`。
 */
// TODO: 変数の修飾子(接頭語)を識別してドキュメント化できる機能を追加したい。
// TODO: プロシージャごとのソースコードを取り出して、ドキュメントに反映させたい。
export function generateMDNavigateSection(
    srcJsonFileName: string, 
    module: moduleLevel | undefined,
    procedures: Array<procedureLevel>| null | undefined
    ): string | null{

    if((!module || !procedures) ){
        console.error('\x1b[31m❌ エラー: JSONデータの受け取りに失敗しました。\x1b[0m');
        return null;
    }
    
    if(!module?.author && !module?.description){
        console.error('\x1b[31m❌ エラー: [JSONにタグが存在しない] または [モジュールの説明と作成者の情報が存在しない]ため処理を終了します。\x1b[0m');
        return null;
    }

    // マークダウンコンテンツになる戻り値
    let markdown = '';
    
    
//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
// --- ヘッダー部分の作成処理開始 ---

    markdown += `# ${srcJsonFileName}${MD_TEXT.HEADER_SUFFIX}\n\n`;
    const authorStr = module.author ? module.author : '不明';
    markdown += `**${MD_TEXT.AUTHOR}** ${authorStr}\n\n`;

    //JSONに変換する前のソースファイルの拡張子を取得
    const extWithDot = path.extname(srcJsonFileName).toLowerCase();
    
    // 拡張子でモジュールのタイプを識別する
    switch(extWithDot){
        
        case '.cls': 
            markdown += `**${MD_TEXT.MODULE_TYPE}クラス**\n\n`;
            break;
        
        case '.bas':
            markdown += `**${MD_TEXT.MODULE_TYPE}標準**\n\n`;
            break;

        case '.frm':
        case '.frx':
            markdown += `**${MD_TEXT.MODULE_TYPE}フォーム**\n\n`;
            break;
        
        default:
        markdown += `**${MD_TEXT.MODULE_TYPE}不明**\n\n`;

    }
    
    // モジュール全体の説明
    const descStr = module.description ? module.description : '説明なし';
    markdown += `**${MD_TEXT.DESCRIPTION}** ${descStr}\n\n`;

    // LastUpdateとToDoの出力を追加
    // モジュールの最終更新日とToDoタスクをMarkdownヘッダーに表示します。
    if (module.lastUpdate) {
        const lastUpdateStr = Array.isArray(module.lastUpdate) ? module.lastUpdate.join(', ') : module.lastUpdate;
        markdown += `**最終更新日:** ${lastUpdateStr}\n\n`;
    }

    // ToDoの出力
    if (module.todo) {
        const todoStr = Array.isArray(module.todo) ? module.todo.join(', ') : module.todo;
        markdown += `**ToDo:** ${todoStr}\n\n`;
    }

    markdown += `---\n\n`;


//￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
// --- 目次の生成開始 ---  

    markdown += `## ${MD_TEXT.TOC}\n\n`;
    
    // --- 変数 ---  
    markdown += `- **${MD_TEXT.VAR_LIST}**\n\n`;

    const varNames = module.varName
    
    if(varNames){
        
        // varNamesが配列か検査し、配列でない場合でも配列になるように処理
        const varsToIterate:Array<string> = Array.isArray(varNames)
                                            ? varNames
                                            : [String(varNames)];
        
        for(const varName of varsToIterate){
            
            if(varName){
                markdown += `  - [${varName}](#${varName})\n\n`;
            }
        }
    }
    
    // 定数一覧へのリンク
    const constants = procedures?.filter(p => p.procedure === 'Const');
    if (constants && constants.length > 0) {
        markdown += `- **定数一覧**\n\n`;
        for (const c of constants) {
            markdown += `  - [${c.name}](#${c.name})\n`;
        }
        markdown += `\n`;
    }

    // Enum・Type一覧へのリンク（説明が書かれているもののみ）
    const procDescMap = module ? getProcDescriptionMap(module) : new Map<string, string>();
    const varDescMap = module ? getVarDescriptionMap(module) : new Map<string, string>();
    const enumsAndTypes = procedures?.filter(p => (p.procedure === 'Enum' || p.procedure === 'Type') && !!(p.varDescription || varDescMap.get(p.name) || procDescMap.get(p.name)));
    if (enumsAndTypes && enumsAndTypes.length > 0) {
        markdown += `- **列挙型・ユーザー定義型一覧**\n\n`;
        for (const et of enumsAndTypes) {
            markdown += `  - [${et.name}](#${et.name})\n`;
        }
        markdown += `\n`;
    }

    // --- プロシージャ ---  
    markdown += `- **${MD_TEXT.PROC_LIST}**\n\n`;
    if(!procedures){
        
    }else{
            for(const proc of procedures){
                // Const, Enum, Typeは別セクションに出すのでここではスキップ
                if (proc.procedure === 'Const' || proc.procedure === 'Enum' || proc.procedure === 'Type') continue;

                // 対象がstaticのときproc.nameに(Static)を付与して変数に格納
                const procName = proc.static === true ? `${proc.name}${MD_TEXT.STATIC_SUFFIX}` : proc.name;

                // 正規表現を使用して、すべての括弧を除去するように修正 (以前はreplace文字列指定で最初の1つしか消えていなかった)
                // 正規表現を使用して、すべての括弧を除去するように修正
                // メモ　正規表現　g(global search) は対象の文字列から一致するパターンをすべて抽出する。以下の場合は、() を空白に置き換える。
                const procLinkName= procName.toLocaleLowerCase().replace(/\(/g,"").replace(/\)/g,"");

                markdown += `  - [${proc.name}](#${procLinkName})\n`;
            }
    }
    
    return markdown += '\n';
}


/**
 * 変数一覧セクションを作成します。
 * 
 * @remarks
 * モジュールレベルで定義された変数（`@VarName`タグなど）の情報をテーブル形式で出力します。
 * 
 * @param obj - 変数情報を含むモジュールレベルのオブジェクト。
 * @returns Markdown形式の変数一覧セクション文字列。
 */
export function generateMDVariantsSection(obj: moduleLevel):string | null{

// console.log('変数セクションの作成を開始します。');

// マークダウンコンテンツになる戻り値です。
let variantsSection:string = `---\n\n## ${MD_TEXT.VAR_LIST}\n\n`;

// 変数タグ(@VarName, @VarType)が両方とも存在しない場合は、変数がないものとして正常に処理する
if (!obj.varName && !obj.varType) {
    return variantsSection += `${MD_TEXT.NO_VAR_DOC}\n\n`;
}

// @VarName と @VarType の片方しか存在しない場合は、記述ミスとして警告を出す
if ((obj.varName && !obj.varType) || (!obj.varName && obj.varType)) {
        console.warn(
        `\x1b[33m⚠️ 警告: 変数関連のタグが不完全です。\n` +
        `@VarName と @VarType はセットで記述する必要があります。\x1b[0m`
    );
    return variantsSection += `${MD_TEXT.NO_VAR_DOC}\n\n`;
}

// varNameとvarTypeが両方存在する場合のみテーブルを生成する
if (obj.varName && obj.varType) {

        // @VarName, @VarType, @VarDescription をそれぞれ配列として扱うための正規化処理
        // 値が単一（文字列）の場合でも配列に変換することで、後続のループ処理を統一します。
        const varNames = Array.isArray(obj.varName) ? obj.varName : [obj.varName];
        const varTypes = Array.isArray(obj.varType) ? obj.varType : [obj.varType];
        const varDescriptions = obj.varDescription ? (Array.isArray(obj.varDescription) ? obj.varDescription : [obj.varDescription]) : [];
        
        // @VarDescription のうち `[[変数名]]: 説明文` の形式で書かれているものを抽出し、
        // 変数名をキーとしたMapを作成します。これにより、タグの記述順序に依存しない紐付けが可能になります。
        const varDescMap = getVarDescriptionMap(obj);

        variantsSection += generateMDTableHeader( MD_TEXT.TH_VAR );

        for (let i=0; i < varNames.length; i++) {
            
            const currentVarName = varNames[i];
            const varNameCol = currentVarName ? `<a id="${currentVarName}">\`${currentVarName}\`</a>` : MD_TEXT.VAL_NONE;

            const currentVarType = varTypes[i];
            const varTypeCol = currentVarType ? `\`${currentVarType}\`` : MD_TEXT.VAL_NONE;

            let varDescription = '';

            // --- 説明文の解決 ---
            // 1. マップから検索（[[変数名]]: 形式で明示的に指定されている場合を最優先）
            if (currentVarName && varDescMap.has(currentVarName)) {
                varDescription = varDescMap.get(currentVarName)!;
            } 
            // 2. インデックスベースでのフォールバック (従来の方式：タグが書かれた順番で紐付ける)
            else if (i < varDescriptions.length) {
                const desc = varDescriptions[i];
                // マップで処理されなかった（[[名前]]: 形式ではない）通常の説明文のみを採用し、
                // 他の変数の名前付き説明文を誤って取り込まないように除外します。
                if (desc && !/^\[\[([^\]]+)\]\]:/.test(desc)) {
                    varDescription = desc;
                }
            }

            if (!varDescription) {
                varDescription = MD_TEXT.VAL_NONE;
            } else {
                // 出力前に [[名前]]: のプレフィックスを綺麗に除去する
                varDescription = cleanDescription(varDescription).replace(/\n/g, '<br>');
            }

            variantsSection += generateRow( [varNameCol, varTypeCol, varDescription] );            
        }
    }
    // console.log('変数セクションの作成が終了しました。');
    return variantsSection + `\n---\n\n`;
}


/**
 * 定数一覧セクションを作成します。
 * 
 * @remarks
 * `Public Const` として定義された定数を抽出し、テーブル形式で出力します。
 * 
 * @param procedureObjAry - プロシージャ情報の配列（Constもここに含まれます）。
 * @param moduleObj - モジュール情報（説明文の解決に使用）。
 * @returns Markdown形式の定数一覧セクション文字列。
 */
export function generateMDConstantsSection(procedureObjAry: Array<procedureLevel>, moduleObj: moduleLevel): string | null {
    
    const constants = procedureObjAry.filter(p => p.procedure === 'Const');
    if (!constants || constants.length === 0) {
        return null;
    }

    // console.log('定数セクションの作成を開始します。');

    // 説明文マップの取得
    const procDescMap = getProcDescriptionMap(moduleObj);
    const varDescMap = getVarDescriptionMap(moduleObj);

    let section = `## 定数一覧\n\n`;
    section += `|定数名|型|値|説明|\n`;
    section += `|:---|:---|:---|:---|\n`;

    for (const c of constants) {
        // 値の簡易抽出 (Sourceから = の右側を取得)
        let value: string = MD_TEXT.VAL_NONE;
        const match = c.source.match(/=\s*(.*)$/m);
        if (match && match[1]) {
            let rawValue = match[1].trim()
            // 行末のコメントを除去 (簡易対応: 文字列外の ' 以降を削除したいが、正規表現だけでは限界があるため、
            // 明らかな行末コメントのみ除去する)
            // VBAのコメント ' ...
            const commentIndex = rawValue.indexOf("'");
            if (commentIndex > 0) {
                // 文字列リテラル内の ' かどうかの厳密な判定は省略し、簡易的に除去
                rawValue = rawValue.substring(0, commentIndex).trim();
            }
            value = `\`${rawValue}\``;
        }

        // --- 定数の説明文の取得 ---
        let description = '';
        if (c.varDescription) {
            // 1. 直上に書かれた @VarDescription を最優先
            description = Array.isArray(c.varDescription) ? c.varDescription.join('<br>') : c.varDescription;
        } else {
            // 2. モジュールレベルに `[[定数名]]:` 形式で書かれた @VarDescription を検索
            // 3. (後方互換性) `[[定数名]]:` 形式で書かれた @ProcDescription を検索
            description = varDescMap.get(c.name) || procDescMap.get(c.name) || '';
        }

        if (!description) {
            description = MD_TEXT.VAL_NONE;
        } else {
            // 出力前に [[名前]]: のプレフィックスを綺麗に除去する
            description = cleanDescription(description);
            description = description.replace(/\n/g, '<br>');
        }

        const nameCol = `<a id="${c.name}">\`${c.name}\`</a>`;
        const typeCol = `\`${c.type}\``;
        
        section += `| ${nameCol} | ${typeCol} | ${value} | ${description} |\n`;
    }
    
    section += `\n---\n\n`;
    // console.log('定数セクションの作成が終了しました。');
    return section;
}

/**
 * 列挙型・ユーザー定義型一覧セクションを作成します。
 * 
 * @remarks
 * `Enum` および `Type` のうち、@VarDescriptionなどの説明が付与されている
 * 「重要なもの」のみを抽出し、変数や定数と同じようにテーブル形式で出力します。
 */
export function generateMDEnumAndTypeSection(procedureObjAry: Array<procedureLevel>, moduleObj: moduleLevel): string | null {
    const procDescMap = getProcDescriptionMap(moduleObj);
    const varDescMap = getVarDescriptionMap(moduleObj);
    
    const enumsAndTypes = procedureObjAry.filter(p => {
        if (p.procedure !== 'Enum' && p.procedure !== 'Type') return false;
        // --- 出力対象の判定 ---
        // 以下のいずれかの方法で説明が記述されているもののみを「重要」と見なし、
        // ドキュメントの独立した一覧テーブルに出力します。
        // 1. 要素の直上に @VarDescription がある
        // 2. モジュールレベルに [[名前]]: 形式の @VarDescription または @ProcDescription がある
        return !!(p.varDescription || varDescMap.get(p.name) || procDescMap.get(p.name));
    });

    if (!enumsAndTypes || enumsAndTypes.length === 0) {
        return null;
    }

    // console.log('列挙型・ユーザー定義型セクションの作成を開始します。');

    let section = `## 列挙型・ユーザー定義型一覧\n\n`;
    section += `|名称|種類|説明|\n`;
    section += `|:---|:---|:---|\n`;

    for (const et of enumsAndTypes) {
        // 説明文の解決（直上のタグ -> モジュールレベルのVarDesc -> モジュールレベルのProcDesc の順）
        let description = et.varDescription ? (Array.isArray(et.varDescription) ? et.varDescription.join('<br>') : et.varDescription) : (varDescMap.get(et.name) || procDescMap.get(et.name) || '');
        
        // 出力前に [[名前]]: のプレフィックスを綺麗に除去する
        description = cleanDescription(description);
        description = description.replace(/\n/g, '<br>');

        const nameCol = `<a id="${et.name}">\`${et.name}\`</a>`;
        const typeCol = `\`${et.procedure}\``;
        
        section += `| ${nameCol} | ${typeCol} | ${description} |\n`;
    }
    
    section += `\n`;

    for (const et of enumsAndTypes) {
        section += `### \`${et.name}\`\n\n`;
        section += `\`\`\`vba\n${et.source}\n\`\`\`\n\n`;
    }

    section += `---\n\n`;
    // console.log('列挙型・ユーザー定義型セクションの作成が終了しました。');
    return section;
}

/**
 * プロシージャ（関数・サブルーチン）一覧セクションを作成します。
 * 
 * @remarks
 * 各プロシージャの詳細情報（シグネチャ、説明、引数リスト、ソースコード）を生成します。
 * 
 * @param procedureObjAry - プロシージャ情報の配列。
 * @param moduleObj - モジュール情報（プロシージャごとの説明文 `ProcDescription` を解決するために使用）。
 * @returns Markdown形式のプロシージャセクション文字列。
 */
export function generateMDProceduresSection(procedureObjAry: Array<procedureLevel> , moduleObj: moduleLevel):string | null{

// console.log('関数セクションの作成を開始します。');

    // 戻り値用の変数
    let procedureSection:string=`## ${MD_TEXT.FUNC_LIST}\n\n`; 
    
    // パース用の正規表現 [[...]]: の形式で、moduleLevelSchema.procDescriptionの先頭にプロシージャ名を付けることを強制するために利用。
    // RegExpモジュールで正規表現で文字を抜き出すときは抜き出す対象を()で囲む、これをキャプチャグループという。
    // @procDescriptionタグの説明文は [[プロシージャ名]]: で開始しない場合エラーとなる。
    const regExp:RegExp = /^\[\[([^\]]+)\]\]:\s*(.*)/;


    // VbaDocJson.Procedure[]型オブジェクトが存在し、かつ0個でなければ・・・
    if (procedureObjAry && procedureObjAry.length > 0) {

        //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
        // --- 初期処理１ プロシージャの説明文を管理するMAPを生成 ---
        // 2026/03/01 Refactor: 共通関数化
        const procDescMap = getProcDescriptionMap(moduleObj);

        //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
        // --- 初期処理２ プロシージャの引数情報を管理するMAPを生成 ---

        // procedureObjAry[].param | param[] をプロシージャ名とパラメータオブジェクトをセットで管理するMAP
        // MAP<プロシージャ名 , param<procParameters>[] | param>の形式で管理。
        const paramsMap : Map<string, Array<procParameters>> = new Map<string, Array<procParameters>>();
        
        // 各プロシージャごとの引数リストを持つMAPを作成する。
        for(const proc of procedureObjAry){
            if(!proc || !proc.param ){
                continue;
            }
            const paramAry:Array<procParameters> = Array.isArray(proc.param) ? proc.param : [proc.param];
            paramsMap.set(proc.name,paramAry);
        }


        //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
        // --- プロシージャセクションの生成を開始 ---

        for(const proc of procedureObjAry){
            
            // Const, Enum, Typeは別セクションで出力するためスキップ
            if (proc.procedure === 'Const' || proc.procedure === 'Enum' || proc.procedure === 'Type') continue;
            
            // static関数だったら関数名に(static)を付与
            const checkedProcName = proc.static === true ? `${proc.name}${MD_TEXT.STATIC_SUFFIX}` : proc.name;
            procedureSection += `### \`${checkedProcName}\`\n\n`; 

            // --- プロシージャ説明文の取得と解決 ---
            // Enum/Type は @VarDescription を使用し、それ以外は @ProcDescription を使用する
            let description = '';
            const isTypeOrEnum = proc.procedure === 'Enum' || proc.procedure === 'Type';
            
            if (isTypeOrEnum && proc.varDescription) {
                // 直上の @VarDescription (複数行対応)
                description = Array.isArray(proc.varDescription) ? proc.varDescription.join('<br>') : proc.varDescription;
            } else if (!isTypeOrEnum && proc.procDescription) {
                // 直上の @ProcDescription (複数行対応)
                description = Array.isArray(proc.procDescription) ? proc.procDescription.join('<br>') : proc.procDescription;
            } else {
                // --- フォールバック: モジュールレベルにまとめた記述からの取得 ---
                // モジュールレベルに `@ProcDescription: [[名前]]: 説明` と書かれている場合を処理
                // 1. 完全一致で検索 (例: "MyProp(Get)")
                description = procDescMap.get(proc.name) || '';

                // 2. 見つからない場合、プロパティのサフィックスを除去して検索 (例: "MyProp")
                // これにより [[PropertyName]]: 説明 と書くだけで Get/Let 両方に適用可能になる
                if (!description) {
                    const baseName = proc.name.replace(/\((Get|Let|Set)\)$/, "");
                    description = procDescMap.get(baseName) || '';
                }
            }
            
            // Markdownへの出力前に [[名前]]: のプレフィックスを削除して綺麗にする
            description = cleanDescription(description);
            if(!description){
                procedureSection += `${MD_TEXT.NO_DESC}\n\n`;
            }else{
                procedureSection += `#### 説明\n\n${description.replace(/\n/g, '<br>')}\n\n`;
            }

            //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
            // --- プロシージャのアクセス修飾子、種類、戻り値テーブルを作成開始 ---
            const procTableHeader:string|null = generateMDTableHeader(MD_TEXT.TH_PROC);
            const procTableRows:string|null = generateRow([proc.scope,proc.procedure,proc.type]);
            procedureSection += procTableHeader;
            procedureSection += procTableRows;
            procedureSection += '\n';

            //￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣
            // --- プロシージャの引数テーブル生成を開始 ---
            
            // 2026/03/01 Update: Const, Enum, Type の場合は引数リストを表示しないように変更
            // 定数や列挙型には引数がないため、引数セクション自体をスキップします。
            const isConstOrEnum = proc.procedure === 'Const' || proc.procedure === 'Enum' || proc.procedure === 'Type';
            
            if (!isConstOrEnum) {
                procedureSection += '#### 引数リスト\n\n';
                
                // マップから対象プロシージャの引数情報（配列）を取得
                const params = paramsMap.get(proc.name);
                
                if(!params){
                    // 引数がない場合の代替メッセージを追加
                    procedureSection += `${MD_TEXT.NO_ARG}\n\n`;
                }else{
                    // 引数テーブルのヘッダー行を生成して追加
                    const paramTableHeader:string|null = generateMDTableHeader(MD_TEXT.TH_PARAM);
                    procedureSection += paramTableHeader;

                    // 各引数の情報をループ処理で抽出し、テーブルの行として追加
                    for(const param of params){
                        // 配列やParamArray（可変長引数）の場合は、名前の末尾に修飾子（[] や [...]）をつける
                        const nameStr : string = param.array ? `${param.name}[]` : param.paramArray ? `${param.name}[...]` : param.name ;
                        // 渡し方（ByRef: 参照渡し / ByVal: 値渡し）の表示文字列を決定
                        const passingStr : string = param.passing === 'ByRef' ? MD_TEXT.VAL_BYREF : MD_TEXT.VAL_BYVAL;
                        // オプション（省略可能かどうか）の表示文字列を決定
                        const optionalStr : string = param.optional ? MD_TEXT.VAL_YES : MD_TEXT.VAL_NO;
                        // デフォルト値が設定されていない場合の表示文字列を決定
                        const defaultStr : string = !param.default ? MD_TEXT.VAL_EMPTY : param.default;

                        // 整形した各文字列を元にテーブルの1行分を生成し、セクションに追加
                        procedureSection += generateRow( [nameStr , param.type , passingStr , optionalStr , defaultStr] );
                    }
                    procedureSection += '\n';
                }
            }
            // 各プロシージャの最後に、実際のVBAソースコードをコードブロックとして追加
            procedureSection += `\`\`\` vba\n${proc.source}\n\`\`\`\n\n<br>\n\n`;
        }
        // 全プロシージャの処理が完了したら、セクションの終わりに区切り線を追加して返す
        return procedureSection += '---\n';
    }
    // プロシージャ情報が存在しない、または配列が空の場合でも、区切り線を追加して返す
    return procedureSection += '---\n';
}

/**
 * モジュールレベルの @ProcDescription タグから、プロシージャ名をキー、説明文を値とするMapを生成します。
 * 
 * @remarks
 * `@ProcDescription: [[プロシージャ名]]: 説明文` という形式で記述されたタグを解析し、
 * 各プロシージャと説明文を紐づけるために使用します。
 * 
 * @internal
 * @param moduleObj - モジュールレベルの解析結果オブジェクト
 * @returns プロシージャ名をキー、説明文を値とする Map オブジェクト
 */
function getProcDescriptionMap(moduleObj: moduleLevel): Map<string, string> {
    // 戻り値用のマップを宣言
    const procDescMap = new Map<string, string>();
    
    // ProcDescriptionを取得
    const procDesc = moduleObj.procDescription;
    // NULLが戻ったら空のMAPを返す
    if (!procDesc) return procDescMap;
    
    // ProcDescriptionをパースするための配列を定義
    const procDescriptionsToParse: string[] = [];
    // procDescが配列か文字列かチェックして、パース用配列にまとめる
    if (Array.isArray(procDesc)) {
        // 配列のとき、スプレッド構文(...)でパース用配列に展開して追加
        procDescriptionsToParse.push(...procDesc);
    } else if (typeof procDesc === 'string') {
        // 文字列のとき、そのままパース用配列に追加
        procDescriptionsToParse.push(procDesc);
    }
    // パースするための正規表現を定義
    const regExp = /^\[\[([^\]]+)\]\]:\s*(.*)/;

    // パース用配列から要素を順次取り出す
    for (const item of procDescriptionsToParse) {
        // 正規表現で配列を分割
        const match = item.match(regExp);
        
        if (match && match.length > 2) {
            const key = match[1]?.trim();
            const val = match[2]?.trim();
            
            if (key && val) {
                // コンパイラが追跡できずundefinedの可能性が残るため、非nullアサーション(!)を使用
                procDescMap.set(key, val);
            }
        }
    }
    return procDescMap;
}

/**
 * モジュールレベルの @VarDescription タグから、変数/定数/Enum/Type名をキー、説明文を値とするMapを生成します。
 * 
 * @remarks
 * `@VarDescription: [[名前]]: 説明文` という形式で記述されたタグを解析し、
 * 記述順序に依存せず、確実に対象の要素と説明文を紐づけるために使用します。
 * 
 * @internal
 * @param moduleObj - モジュールレベルの解析結果オブジェクト
 * @returns 要素名をキー、説明文を値とする Map オブジェクト
 */
function getVarDescriptionMap(moduleObj: moduleLevel): Map<string, string> {
    // @VarDescriptionを名前とペアでセットするマップ
    const varDescMap = new Map<string, string>();
    
    // jsonからVarDescriptionの情報を取得
    const varDesc = moduleObj.varDescription;
    // NULLが返ったら空のマップのみを返す
    if (!varDesc) return varDescMap;

    // VarDescriptionをパースするための配列を宣言
    const varDescriptionsToParse: string[] = [];
    
    // VarDescriptionが配列か文字列かチェックして、パース用配列にまとめる
    if (Array.isArray(varDesc)) {
        // 配列のときは、スプレッド構文(...)でパース用配列に展開して追加
        varDescriptionsToParse.push(...varDesc);
    } else if (typeof varDesc === 'string') {
        // 文字列のときは、そのままパース用配列に追加
        varDescriptionsToParse.push(varDesc);
    }
    // [[]]の中の名前を解析する正規表現
    const regExp = /^\[\[([^\]]+)\]\]:\s*(.*)/;

    // 正規表現でVarDescriptionをパース
    for (const item of varDescriptionsToParse) {
        // [[]]:があるVarDescriptionのみ取得
        const match = item.match(regExp);
        // matchが存在しかつパースしたmatchが[[]]とそれ以降の要素を返すとき
        if (match && match.length > 2) {
            const key = match[1]?.trim(); 
            const val = match[2]?.trim();
            
            if (key && val) {
                // コンパイラが追跡できずundefinedの可能性が残るため、非nullアサーション(!)を使用
                varDescMap.set(key, val);
            }
        }
    }
    return varDescMap;
}

/**
 * 説明文の先頭に付与されている `[[名前]]:` などの識別用プレフィックスを削除し、
 * Markdown出力用にクリーンな説明文のテキストを返します。
 * 
 * @remarks
 * 例: `[[MyVar]]: この変数の説明` -> `この変数の説明`
 * 
 * @internal
 * @param desc - プレフィックスが含まれる可能性のある説明文
 * @returns プレフィックスが除去された説明文
 */
function cleanDescription(desc: string): string {
    // descがNULLなどの場合は空文字を返す
    if (!desc) return '';
    // 正規表現で[[Name]]:を空白に置換
    return desc.replace(/^\[\[([^\]]+)\]\]:\s*/, '');
}

/**
 * ヘルパー関数 :マークダウンの表の見出し行を戻す。(1、2行目)
 * 引数に読み取り専用の値を指定するときには、readonly　を引数の型に追加して、
 * 読み取り専用であることをあらかじめ宣言します。
 * そうでない場合に、引数に書き込み可能な変数を指定すると警告が出てしまいます。
 * 
 * @internal
 * @param cols - テーブルのヘッダー項目の配列
 * @return Markdownテーブルのヘッダー文字列（2行分）
 */
export function generateMDTableHeader(cols: readonly (string|undefined)[]):string|null{

    // 見出しが存在しなければ空文字を返す
    if(cols.length === 0){
        console.warn('\x1b[33m⚠️ 警告: 表の見出しが指定されていません。\x1b[0m');
        return '';
    }
    // ヘッダーとヘッダーの次の行の仕切りを定義
    let headerRow: string ='|';
    let alignmentRow: string ='|';

    for(const check of cols){
        if(!check){
            console.warn('\x1b[33m⚠️ 警告: マークダウンの表題の値が不正です。処理を中断します。\x1b[0m');
            return null;
        }
            // ヘッダーに要素を継ぎ足して行く
            headerRow += `${check}|`;
            // ヘッダーの次の行を継ぎ足して行く
            alignmentRow += `:--|`;
    }
    // 成形したヘッダーを返す
    const fullTableHead =`${headerRow}\n${alignmentRow}\n`;
    return fullTableHead;
}


/**
 * ヘルパー関数 :マークダウンの表の行作成の共通化処理を変数に格納。
 * rowValにreadonlyをつけて定数であることを明示しています。
 * これをつけないと書き込み可能引数で呼び出されたときに警告が表示されます。
 * let description = procDescMap.get(c.name);
 * @internal
 * @param rowVal - セルの値の配列
 * @return Markdownテーブルの1行分の文字列
 */
export function generateRow(rowVal: readonly (string | undefined)[]):string{
        const safeCols: Array<string> = rowVal.map(c => c !== undefined ? c : MD_TEXT.VAL_NONE);
        return `| ${safeCols.join(' | ')} |\n`;
}