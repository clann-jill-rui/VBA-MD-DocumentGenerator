/**
 * コンパイル $ tsc src/xdocgenJson_MDGenerator.ts -outdir dist
 * 実行 node dist/xdocgenJson_MDGenerator.js outputJson/AccessDbManager.json(cdir xdocgen-master)

 * # **1.xdocgenJsonMDGenerator について**
 * 
 * xdocgenがVBA(CLS)ファイルから作成したJSONファイルを、
 * MD形式ファイルに変換・出力しドキュメントを自動生成するプログラムです。
 * 
 * ---
 * 
 * ## **インポートモジュール一覧**  
 * 
 * - **`import * as fs from 'fs' ;`**
 *      - Node.jsのファイルを扱うモジュール  
 * 
 * - **`import * as path from 'path';`**
 *      - Node.jsのパスを扱うモジュール  
 * 
 * ---
 * 
 * ## **補足(文法・構文など) 自己学習用**
 * 
 * ---
 * 
 * - **TSにおけるインタフェースとJSのオブジェクト**
 * 
 * TSではインタフェースを宣言することができる。
 * インタフェースは「型」の定義を行い、その型と一致するデータのみを取りまとめる。
 * 「型」を強制することで安全を確保する仕組み。
 * 
 * ### **記述と使用の例**
 * 
 * - **宣言方法**
 * 
 * ``` TypeScript
 * 
 * interface Test{
 *      name: string ;
 *      score: number ;
 *      etc: (Array<string> | Array<number>);
 *      //配列はジェネリック型で記載。
 * }
 * ```
 * 
 * - **使用方法**
 * 
 * ``` TypeScript
 * 
 * 
 * let testAry:Test[]=[
 * 
 * //Testインタフェース型オブジェクトを配列内に作成
 * { name:'' , score:0 , etc:['a','b'] },
 * { name:'' , score:0 , etc:['c','d'] },
 * { name:'' , score:0 , etc:['e','f'] }
 * 
 * ];
 * 
 * //for...ofで配列内のオブジェクトに処理を加える
 * for(const tesObj of testAry){
 * 
 * testObj.name=`piyo`;
 * testObj.score=100;
 * 
 * //TestAryオブジェクトの中のetc配列をmapで新しい配列に置き換える
 * //mapはreturnで返した値から新しい配列を作り変数に格納する配列のメソッド
 * //配列変数.map(...); **配列内の値はインタフェースで指定した型に準じる必要がある**
 * testObj.etc = testObj.etc.map(etcVal => {
 * 
 *  return 'このブロックで配列の要素を処理するよ';
 * 
 * });
 * }
 * 
 * ```
 * 
 * コンパイル後はJSのオブジェクトとして、扱われる。
 * 
 * ---
 * 
 * - **型アサーション(as)**
 * 
 * 既存の変数、配列、オブジェクトの型を宣言しコンパイラに認識させる。  
 * 実際に型がキャストされるわけではなく、any型や型の不明なオブジェクトの型を  
 * コンパイラに認識させることでエラーが発生しない状態にする。  
 * 「対象 as 認識させる型」という形式で記述する。
 * 
 * - **使用方法**
 * 
 * ```typescript
 * 
 * let val:any="810";
 * let num:number=(val as string).length; 
 * 
 * //「変数 as 型」(型アサーション)を使うことで、「この変数は文字列なので、lengthプロパティにアクセス可能」とコンパイラに伝えている。
 * //実行時の変数型が変更されているわけではなく、あくまでコンパイルを通すための機能であることに注意。
 * 
 * ```
 * 
 * ---
 * 
 * - **JavaScriptの条件判定の仕様(truthy | falsy)について**
 * 
 * if文、論理演算子(&&,||)で結果が真偽値と期待されるとき、  
 * JavaScriptが自動的に値を変換し真偽で評価する仕様。
 * 
 * - **例文**
 * 
 * ``` TypeScript
 * 
 * const moduleInfo={
 *  VarName : 'piyo',
 *  VarDescription : 'piyopiyo'
 *  }
 * 
 * //左辺(moduleInfo.VarName)は自動的に値が(truthy | falsy)に変換され、
 * //値が存在するかの判定に置き換えられる。
 * //moduleInfoオブジェクトのVarNameプロパティが存在するとき、Trueとなる。
 * if (moduleInfo.VarName && moduleInfo.VarName.length > 0) {
 *      console.log(moduleInfo.VarName);
 * }
 * 
 * ```
 * 
 * - **Truthy | Falsy に変換される値について**
 * 
 * 条件判定の対象となる値が下記の表の値のとき、その値がFalsyか判断され、  
 * そうであればFalseに、そうでなければTrueとして変換される。  
 * なお、原則Falsyでない値はTruthyとして変換されるため、下記表にはFalsyとなる値のみ記載する。
 * 
 * 
 * |Falsyと判断される値|false|0(number)|''(空文字列)|null|undefined|NaN(Not a Number)|
 * |:---|:---|:---|:---|:---|:---|:---|
 * 
 * ---
 * 
 * - **配列.mapメソッド および 配列.forEachメソッド の引数について**
 * 
 * 以下の引数をmapまたはforEachで指定したとき、自動的に解釈され、適切な形で処理される。
 * なお、これらの引数は必須ではなく、使わない者は省略可能。
 * 
 * |引数|解釈される値|
 * |:---|:---|
 * |element|処理中の配列の要素|
 * |index|処理中の要素のインデックス|
 * |array|forEachが呼び出された元の配列|
 * 
 * - **サンプルコード**
 * 
 * ``` typescript
 * 
 * const testObj ={objAry:['piyo','hoge','hage']};
 *  
 * //forEach の パターン(配列内の要素を取り出して操作する) 
 * 
 * let forEachAry=[];
 * 
 * testObj.objAry.forEach((element, index, array) => {
 * //index=objAryの現在のインデックス,element=objAryの要素,array=objAry本体
 *      if(element !== 'hage'){
 * 
 *          forEachAry[index] = element;
 *          
 *      } else {
 *      
 *          console.log('hage');
 * 
 *      }
 * });
 * 
 * //----------------------------------------------------------------
 * 
 * //map の パターン(元の配列から新しい配列を生成する)
 * 
 * const mapAry: string[] = testObj.objAry.map((element, index, array):string =>{
 * 
 *      if(index !== array.length-1){
 * 
 *          return element+array[index+1];
 * 
 *      } else {
 *          
 *          return element+'last';
 * 
 *      }
 * });
 * 
 * ```
 * 
 * ---
 * 
 * @module xdocgenJsonMDGenerator
 * @author Gemini & Me
 */
import * as fs from 'fs';
import * as path from 'path';

// --- JSONデータの型定義 ---
/**
 * VbaParameter - XDOCGENが返すプロシージャの引数（パラメータ）のデフォルトJSONフォーマット
 * 
 * @interface
 * @property {string}  Name - 引数名
 * @property {boolean}  Optional - 引数がOptional(省略可能)であるか示す
 * @property {string}  Passing - 値渡し(ByVal)か参照渡し(ByRef)か示す
 * @property {boolean}  ParamArray - 引数が可変長引数であるか示す
 * @property {string}  Type - 引数の型
 * @property {boolean}  Array - 配列であるか示す
 * @property {string|null}  Default - 省略可能な場合に設定されるデフォルト値
 */
export interface VbaParameter {
    Name: string;
    Optional: boolean;
    Passing: string;
    ParamArray: boolean;
    Type: string;
    Array: boolean;
    Default: string | null;
}

/**
 * VbaProcedure - XDOCGENが返すプロシージャ（関数・サブルーチン）のデフォルトJSONフォーマット
 * 
 * @interface
 * @property {string}  Name - プロシージャの名前
 * @property {string}  Scope - プロシージャのアクセス修飾子
 * @property {boolean}  Static - staticか示す
 * @property {string}  Procedure - プロシージャの種類(Sub,Functionなど)
 * @property {string}  Type - 戻り値の型
 * @property {string}  Source - ソースコード
 * @property {VbaParameter|VbaParameter[]|null}  Param - 引数の情報
 */
export interface VbaProcedure {
    Name: string;
    Scope: string;
    Static: boolean;
    Procedure: string;
    Type: string;
    Source: string;
    Param: VbaParameter | VbaParameter[] | null;
}

/**
 * VbaModule - XDOCGENが返すモジュールレベルのカスタムJSONフォーマット
 * 
 * @interface
 * @property {string}  ModuleName - モジュール名
 * @property {string}  ModuleType - モジュールのタイプ
 * @property {string}  ModuleDescription - モジュールの説明
 * @property {string}  Author - 製作者
 * @property {string[] | null}  ProcName - プロシージャ名 staticならば、名称末尾に(static)を追記する。
 * @property {string[] | null}  ProcDescription - プロシージャの説明
 * @property {string[] | null}  VarName - グローバル変数の名前 static、constならば、名称末尾に(static)、(const)を追記する。
 * @property {string[] | null}  VarType - グローバル変数の型
 * @property {string[] | null}  VarDescription - グローバル変数の説明
 */
export interface VbaModule {
    ModuleName: string;
    ModuleType: string;
    ModuleDescription: string;
    Author: string;
    ProcName: string[] | null;
    ProcDescription: string[] | null;
    VarName: string[] | null;
    VarType: string[] | null;
    VarDescription: string[] | null;
}

/**
 * VbaModuleとVbaProcedure[]を格納する、JSONファイル内で最上位のオブジェクト。
 * 
 * @interface
 * @property {VbaModule}  Module
 * @property {VbaProcedure[]}  Procedures
 */
export interface VbaDocJson {
    Module: VbaModule;
    Procedures: VbaProcedure[] | null;
}

/**
 * 
 * ---
 * 
 * 引数で受け取ったパスからXDOCGENで出力したVBAのJSONファイルを読み込み、
 * VbaDocJsonインタフェース型のオブジェクトとして戻す関数。
 * 
 * ---
 * 
 * @param {string} filePath filepath -読み込むJSONファイルのパス。フォルダは基本的に→ ~/path/to/xdocgen-master/clsFiles
 * @returns {VbaDocJson|null} VbaDocJsonインタフェース型のオブジェクトを返す。
 */
export function readJsonFile(filePath: string): VbaDocJson | null {
    // --- JSONファイルを読み込む関数の定義 ---
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        //utf8でエンコードしてファイルを読み込む
        
        return JSON.parse(data) as VbaDocJson;
        //文字列のJSONデータをインタフェース型としてJSのオブジェクト型にパース(変換)する

    } catch (error: any) {
        console.error(`JSONファイルの読み込みまたは解析中にエラーが発生しました: ${error.message}`);
        return null;
    }
}

/**
 * xdocgenJson_MDGenerator関数が出力するMDファイルの基となる、データを作成・戻す関数。
 * readJsonFile関数が戻すVbaDocJson型のオブジェクトを基に、
 * 文字列型のローカル変数 markdown に MDドキュメントを構築し、戻り値とする。
 * 
 * ---
 * 
 * @param {VbaDocJson} jsonData - 変換対象のJSONデータ
 * @returns {string} - jsonDataから抜き出した情報をMD形式に変換した文字列
 */
export function convertJsonToMarkdown(jsonData: VbaDocJson): string {
    // --- JSONデータをMarkdownに変換する関数の定義 ---
    
    const moduleInfo = jsonData.Module;
    //引数からjsonData.Module(VBAのモジュール情報) を格納。
    
    const procedures = jsonData.Procedures;
    //引数からjsonData.Procedures(VBAのプロシージャ情報) を格納。

    let markdown = '';
    //MDをテキストで保持する戻り値

    // --- モジュール情報の生成 ---
    markdown += `# ${moduleInfo.ModuleName} リファレンス\n\n`;
    markdown += `**作成者:** ${moduleInfo.Author}\n\n`;
    markdown += `**モジュールタイプ:** ${moduleInfo.ModuleType}\n\n`;
    markdown += `**説明:** ${moduleInfo.ModuleDescription}\n\n`;
    markdown += `---\n\n`;

    // --- 変数情報の生成 ---
    markdown += `## グローバル変数\n\n`;
    if (moduleInfo.VarName && moduleInfo.VarName.length > 0 && moduleInfo.VarType && moduleInfo.VarType.length > 0 && moduleInfo.VarType.length == moduleInfo.VarName.length) {
    /*
    moduleInfo.VarName と moduleInfo.VarTypeは (truthy | falsy)により存在判定を行う
    moduleInfo.VarName.length > 0 と moduleInfo.VarType.length > 0 は要素の有無をチェック
    moduleInfo.VarType.length == moduleInfo.VarName.length は要素数が不ぞろいではないかチェック
    */
        markdown += `| 変数名 |型| 説明 |\n`;
        markdown += `| :--- | :--- |:--- |\n`;

        moduleInfo.VarName.forEach((varName, index) => {

            const description = moduleInfo?.VarDescription?.[index] || '説明なし';
            /*
            オプショナルチェイニングは、プロパティやメソッドの呼び出しに続けて使います。  
            配列の要素に安全にアクセスする場合は、ブラケットの前に?.をつけます。
            要素がNULLやUNDEFINEDの可能性があるとき、そのままアクセスするとエラーを返すため、
            NULLやUNDEFINEDのときの処理を決定するために用います。
            TSではusestrictモードの時は明示的なNULLチェックが必要です。
            */
            const type = moduleInfo?.VarType?.[index] || '不明';
            //グローバル変数のdescriptionを取得する。オプショナルチェイニング。

            markdown += `| \`${varName}\` | \`${type}\` | ${description} |\n`;
            //グローバル変数の名前と説明をMDに追記する。
            
         
        });
    } else {
        markdown += 'このモジュールには変数がありません。\n';
    }
    markdown += `\n---\n\n`;


    // --- プロシージャ（関数・サブルーチン）情報生成 ---
    markdown += `## プロシージャ一覧\n\n`;
    if (procedures && procedures.length > 0) {
        /*
        VbaDocJson.Procedure[]型オブジェクトが存在し、
        VbaDocJson.Procedure[]型オブジェクトが0個でなければ・・・
        */

        procedures.forEach(proc => {
        //VbaDocJson.Procedure[]型オブジェクト.VbaProcedureを利用。

            markdown += `### \`${proc.Name}\`\n\n`;
            
            const staticProcName = proc.Static == true ? proc.Name.concat('(static)') : proc.Name ;
            //プロシージャレベルオブジェクトのNameプロパティに(static)を結合
            const descriptionIndex = moduleInfo?.ProcName?.indexOf(staticProcName) ?? -1;
            /*
            プロシージャの名称からインデックス番号を探す。オプショナルチェイニング。
            
            ?? -1 ← NULL合体演算子
            左辺がNULL OR UNDEFINED のときに右辺の値を返す
            
            */
            let description:string; //戻り値
        
            if(descriptionIndex !== -1){
                description = moduleInfo?.ProcDescription?.[descriptionIndex] || '説明なし';
            }else{
                description='説明なし';
            }
            /*
            ↑の処理は下記の三項演算子の処理をif文での処理に置き換えたもの。
            let description = descriptionIndex !== -1 ? moduleInfo.ProcDescription[descriptionIndex] : '説明なし';
            */
            
            markdown += `**説明：** ${description}\n`;

            let procParamName;// 引数の情報を格納

            if(proc.Param == null){
                procParamName='NULL'; //NULLなら'NULL'を表示
            }else if(Array.isArray(proc.Param)){
                //Array.map()で新しい配列を生成し、Array.join()で配列内の名前を結合する
                procParamName = proc.Param.map(p => p.Name).join(', ');
            }else{
                procParamName = proc.Param.Name; //名前だけを返す
            }
            
            const retType = (proc.Procedure == 'Function' || proc.Procedure == 'Property') ? proc.Type : 'NULL';
            //プロシージャの種類がFunctionかプロシージャのときのみ、戻り値の型をretTypeに格納する

            const signature = `\n|アクセス修飾子|種類|引数|戻り値の型|\n|:---|:---|:---|:---|\n|${proc.Scope}|${proc.Procedure}|${procParamName}|${retType}|\n\n`;
            //プロシージャの表を作成。

            markdown += `${signature}`;
            
            if (proc.Param) {
                markdown += `**引数:**\n\n`;

                const params = Array.isArray(proc.Param) ? proc.Param : [proc.Param];
                /*
                三項演算。
                ture: proc.Param → procから直接オブジェクトをparamsに代入する
                false: [proc.Param] → Paramオブジェクトを持つ新しい配列を生成しparamsに代入                
                */

                params.forEach(param => {
                    const passing = param.Passing === 'ByRef' ? 'ByRef(参照渡し)' : 'Byval(値渡し)';
                    /*
                    三項演算。
                    ture: 'ByRef(参照渡し)'
                    false: 'Byval(値渡し)'
                    */
                    markdown += `- **引数名：${param.Name}** (${param.Type}): ${passing}\n`;
                });
                markdown += `\n`;
            }
            
            markdown += `**ソースコード**\n\n`;
            markdown += '```VB\n';
            markdown += proc.Source + '\n';
            markdown += '```\n\n';
        });
    } else {
        markdown += 'このモジュールにはプロシージャがありません。\n';
    }

    return markdown;
}

/**
 * 
 * ---
 * 
 * この関数はmodule.exportsでエクスポートしており、run.jsから使用される。
 * 
 * readJsonFile関数に引数からパス(inputPath)を渡しVBAのCLSファイルのデータをjsonData変数に戻す。
 * jsonDataを引数としてconvertJsonToMarkdown関数に渡し、MDデータを作成しmarkdownContent変数にそのデータを戻す。
 * 最後にこの関数がそのデータを引数のパス(outputPath)に書き込むことで、MDドキュメントの作成を完了する。
 * 
 * ---
 * 
 * @param {string} inputPath - 対象になるjsonファイルのパス
 * @param {string} outputPath - 出力先パス
 */
export function xdocgenJson_MDGenerator(inputPath:string , outputPath:string) {
    // --- メイン処理 ---
    // コマンドライン引数からJSONファイルのパスを取得
    //const inputPath = process.argv[2] || 'xdocgen-output.json';

    // 1. JSONファイルを読み込む
    const jsonData = readJsonFile(inputPath);

    if (jsonData) {
        // 2. JSONをMarkdownに変換する
        const markdownContent = convertJsonToMarkdown(jsonData);
        
        // 3. Markdownファイルを書き出す
        try {
            fs.writeFileSync(outputPath, markdownContent, 'utf8');
            console.log(`? ドキュメントが正常に生成されました: ${outputPath}`);
        } catch (error: any) {
            console.error(`? ファイルの書き込み中にエラーが発生しました: ${error.message}`);
        }
    }
}

module.exports ={ xdocgenJson_MDGenerator };