/**
 * ファイルシステム操作に関するユーティリティ関数群を提供するモジュール。
 * 
 * プロジェクトルートの探索、ディレクトリの作成・クリーンアップ、
 * ファイルのコピー、拡張子の正規化などの汎用的な処理を行います。
 * 
 * @module FileUtils
 * @author Me
 */
import * as fs from 'fs' ;
import * as path from 'path'; 
import { CONFIG_FILES } from './constants';


/**
 * プロジェクトのルートパス（package.jsonが存在するディレクトリ）を探索して返します。
 * 
 * @remarks
 * 1. `startDir` から開始して、親ディレクトリへ遡りながら `package.json` を探します。
 * 2. `excludedDir` で指定されたディレクトリ名の `package.json` は無視します（ビルド出力先などの誤検知防止）。
 * 3. ルートディレクトリまで到達しても見つからない場合はエラーをスローします。
 * 
 * @param startDir - 探索を開始するディレクトリパス。通常は `process.cwd()` を指定します。
 * @param excludedDir - 探索から除外するディレクトリ名（例: 'dist' など）。デフォルトは `'none'`。
 * @returns 特定されたプロジェクトルートの絶対パス。
 * @throws {Error} `package.json` が見つからない場合にエラーをスローします。
 */
export function findProjectRootPath(
    startDir: string, 
    excludedDir: string ='none')
    :string{
    let runDirectory=startDir;

    while(runDirectory !== path.parse(runDirectory).root){
        // runDirectoryがルートディレクトリのみになるまで親ディレクトリを辿る

        const otherPackageJson =path.basename(runDirectory) !== excludedDir;
        /*
        プロジェクトルートディレクトリ以外の/package.jsonを検索の対象外とするため、
        path.basename(runDirectory)でrunDirectoryのパスから最下位のパスを取得し、
        それがexcludedDirであればFALSEを代入する。下記のIF文でこの変数を条件としている。
        */
        
        if(fs.existsSync(path.join(runDirectory, CONFIG_FILES.PACKAGE_JSON)) && otherPackageJson){
        // package.json が存在するかチェックし、プロジェクトルート判定を行う

        return runDirectory;
        //判定が真ならプロジェクトルートを戻す

        }

        runDirectory=path.dirname(runDirectory);
        //判定が偽ならひとつ前の階層のパスを再代入しループする
    }

    throw new Error( `プロジェクトルートディレクトリ(${CONFIG_FILES.PACKAGE_JSON})が見つかりませんでした。\n` +
        `現在の作業ディレクトリ(${startDir})からルートまで遡り、package.jsonを検索しましたが、\n` +
        `除外設定されているパス名 ('${excludedDir}') と一致する ${CONFIG_FILES.PACKAGE_JSON} は無視されました。`);
    // 親ディレクトリへ移動
}



/**
 * 指定されたディレクトリの存在を確認し、存在しない場合は再帰的に作成します。
 * 
 * @remarks
 * `fs.mkdirSync` の `recursive: true` オプションを使用し、深い階層のディレクトリも一括で作成します。
 * 
 * @param targetPath - 確認（または作成）するディレクトリのパス。
 * @returns 作成または確認されたディレクトリのパス。エラーが発生した場合は `null`。
 */
export function checkAndMakeDir(targetPath:string):string | null{

    try{
        if(!fs.existsSync(targetPath)){
        // output.jsonフォルダが存在しなければ実行するブロック
        /*
        path.resolve()は、指定されたパスの絶対パスを生成する。←不要だったので削除
        OUT_PUT_JSONが相対パスであっても、絶対パスに変換した値を返す。
        */
        
            fs.mkdirSync(targetPath,{recursive:true})
            console.log(`引数のフォルダが存在しないため新たに作成しました： ${targetPath}`)
            /*
            fs.mkdirSync(path,Option) とは:pathのディレクトリに同期的にフォルダを作成する(フォルダが作成されるまで他の処理に進まない。)
            オプションのrecursive: true は、「もしOUTPUTJSON_DIRまでのパスの中に、まだ存在しないディレクトリがあれば、
            それらを一つずつ（再帰的に）作成していき、最終的に指定されたOUTPUTJSON_DIRを作成する」
            例えば、第一引数のパスが「A\B\C」だが、PC上に存在するパスが[A\]までしか存在しないとき、
            [\B\C]を階層的に作成する。オプションがない場合は、途中のパスが見つからない時点でエラーになる。
            */
        
            return targetPath

        }else{
        //output.jsonフォルダが既に存在しているときに実行するブロック

        // console.log(`引数のフォルダは既に存在しています:${targetPath}`); // ノイズになるため非表示
        return targetPath;
        }

        }catch(error : any){
            console.error( `\x1b[31m❌ エラー: フォルダ (${targetPath}) の存在確認または作成中に失敗しました。\n` +
            `詳細: ${error.message}\x1b[0m`);
            return null;
    }
}



/**
 * 指定されたディレクトリ内の、特定の拡張子を持つファイルをすべて削除します。
 * 
 * @remarks
 * ディレクトリ自体の存在確認を行い、存在する場合のみ削除処理を実行します。
 * 
 * @param targetPath - クリーンアップ対象のディレクトリパス。
 * @param targetExtension - 削除対象とするファイルの拡張子（例: `.json`, `.md`）。
 */
export function cleanDirFiles(targetPath:string, targetExtension:string):void{

    const extension = normalizeExtension(targetExtension);
    if(!extension){
        console.error(`\x1b[31m❌ エラー: 引数の拡張子${targetExtension}に問題があるため処理を終了します。\x1b[0m`);
        return;
    }

    const checkedTargetPath = checkAndMakeDir(targetPath);

    if(!checkedTargetPath){
        console.error(`\x1b[33m⚠️ クリーンアップ対象のフォルダ: ${targetPath}。\nエラーが発生したため処理をスキップします。\x1b[0m`);
        return; 
    }

    // console.log(`対象のフォルダ内の既存ファイル（拡張子: ${extension}）のクリーンアップ開始`);

    try{
            fs.readdirSync(checkedTargetPath).forEach(file =>{
            // 指定されたディレクトリ内のファイルとサブディレクトリの名称を同期的に"配列で返す"
                
                const filePath=path.join(checkedTargetPath,file);
                const stats = fs.lstatSync(filePath);
                // シンボリックリンクも正しく処理するため lstatSync を使用
            
                if(stats.isFile() && file.toLowerCase().endsWith(extension)){
                //対象がファイルであり、かつ、拡張子が一致する。
                    
                    try{
                        fs.unlinkSync(filePath);
                        //ディレクトリ名とファイル名の結合。完全パスの作成。
                        // console.log(`既存ファイルの削除完了: ${file}`);
                        //指定されたファイルを同期的に削除する
                    }catch(unlinkError : any){
                         console.error(`\x1b[33m⚠️ 削除失敗: ${file} - エラー: ${unlinkError.message}\x1b[0m`);
                    }
                }
            });

            // console.log(`既存のファイル（拡張子: ${extension}）のクリーンアップが完了しました。`); 

        }catch(error : any){
            // readdirSync や lstatSync の失敗（アクセス権限など）を捕捉し、処理を終了
            console.error(`\x1b[31m❌ エラーが発生しました。処理をスキップします。${error.message}\x1b[0m`);
            return;
        }
}



/**
 * ファイルリストに基づき、ファイルを指定されたコピー先フォルダへコピーします。
 * 
 * @remarks
 * 1. コピー先フォルダ (`targetPath`) の存在を確認・作成します。
 * 2. `fileList` に含まれる各ファイルを、`srcPath` から `targetPath` へコピーします。
 * 3. エラーが発生したファイルはスキップし、処理を継続します。
 * 
 * @param srcPath - コピー元の親ディレクトリパス。
 * @param targetPath - コピー先のディレクトリパス。
 * @param fileList - コピーするファイル名の配列。
 * @returns コピーに成功したファイルのフルパスリスト。初期化に失敗した場合は `null`。
 */
export function copyFileList(
    srcPath: string,
    targetPath:string,
    fileList:Array<string>)
    : Array<string> | null {
    
    //一時作業用フォルダの存在確認と、存在しなければ作成を行う関数
    const checkedTargetPath = checkAndMakeDir(targetPath);

    // コピー後のファイルのフルパスを格納する配列
    const resultFullPathAry:Array<string> = [];

    if(!checkedTargetPath){
        console.error(`\x1b[31m❌ エラー: 対象のパスがnullのため処理を終了します。\x1b[0m`);
        return null;
    }
    // console.log(`\n        ファイル コピー元フォルダ=${srcPath}\n        ファイル コピー先フォルダ=${checkedTargetPath}`);
    
    let errorFileName:string = '';

    if (fileList.length === 0) {
    console.log('\x1b[36mℹ️ 情報: コピー対象のファイルが見つかりませんでした。処理を終了します。\x1b[0m');
    return resultFullPathAry; // コピー処理は実行されなかったが、成功とみなす
    }
    

        for(const file of fileList) {
            try{        
                errorFileName = file;
                const targetSrcFullPath = path.join(srcPath,file);
                const targetFullPath = path.join(checkedTargetPath,file);
                //一時作業用フォルダパスとファイル名を結合

                // console.log(`"${file}"を"${checkedTargetPath}"へコピー中...`);

                fs.copyFileSync(targetSrcFullPath,targetFullPath);
                /*
                ソースファイルをデスティネーションに同期的にコピーする。(パス名とファイル名が必要)
                dest = destination ①行き先。到着地。
                ↓
                フォルダ名称をDestからTempに変更。
                */
                resultFullPathAry.push(targetFullPath);
                // console.log(`${file}のコピー完了`);
                
            }catch(error : any){
                console.error(`\x1b[31m❌ エラー: ${errorFileName}のコピーに失敗しました。\n`+
                    `エラー詳細: ${error.message}\x1b[0m`);
                continue;
            }
        }
                // console.log(`全コピー処理が完了`)
                return resultFullPathAry;
                    //const sourceFilePath = path.join(srcPath,file);
                    //コピー元フォルダのパス
                    // console.log('sourcefilepath='+sourceFilePath);
}


/**
 * ファイル拡張子を正規化します。
 * 
 * @remarks
 * 入力された拡張子から空白を除去し、小文字に変換します。
 * 先頭にドット `.` がない場合は付与します（例: `cls` -> `.cls`）。
 * 
 * @param targetExtension - 正規化対象の拡張子文字列。
 * @returns 正規化された拡張子（例: `.json`）。無効な入力の場合は `null`。
 */
export function normalizeExtension(targetExtension:string):string|null{

    // 空白の排除
    const trimTargetExtension = targetExtension.trim();

    // 空文字でないことを確認
    if(!trimTargetExtension || trimTargetExtension.length < 1 ){
        console.error(`\x1b[31m❌ エラー: 拡張子として無効な値が渡されました。値: "${trimTargetExtension}"\x1b[0m`)
        return null;
    }

    // .で始まる拡張子を渡されたかチェックし、ついていればそのまま、なければ付与する。
    const normalizedExtension = trimTargetExtension.startsWith('.') ? 
    trimTargetExtension.toLowerCase() : '.'+trimTargetExtension.toLowerCase();

    return normalizedExtension;
}