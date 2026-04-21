import * as fs from 'fs';
import { validateData } from '../src/configLoader';
import { z } from 'zod';

// ■ モック化 (1): 外部依存の排除
// src/main.ts を「モック（偽物）」に置き換えます。
// 本物の main.ts はファイルシステムを使ってルートパスを探そうとしますが、
// テストでは「パスはこれだよ」と決め打ちした値を返すようにして、余計な処理を動かさないようにします。
jest.mock('../src/main', () => ({
    projectRootPath: 'C:/Mock/Root/Path'　//仮想のパスを
}));

// ■ モック化 (2): ファイルシステムの無効化
// Node.jsの 'fs' (ファイル操作) モジュール全体を「モック（偽物）」に置き換えます。
// これにより、fs.readFileSync などを使っても、実際にハードディスクのファイルは読み込まれません。
// 代わりに、戻り値を自由に設定できる「モック関数」になります。
jest.mock('fs');　//仮想のfsモジュールとして扱います。
 
// ■ describe: テストをグループ化するブロックです。
// 第一引数に「何のテストグループか」を文字列で記述します。
// ここでは 'configLoader' モジュールに関するテストをまとめています。
describe('configLoaderのテスト', () => {
 
    // describeはネスト（入れ子に）できます。
    // これにより、「configLoaderの中の、validateData関数」というように、より詳細にグループ分けできます。
    describe('validateData 関数のテスト', () => {
 
        // テスト全体で使う、簡易的なZodスキーマを定義します。
        // このスキーマに沿っているか、いないかで関数の挙動をテストします。
        const testSchema = z.object({
            appName: z.string(),
            version: z.number()
        });
 
        // ■ it: 個々の「テストケース」を定義します。
        // 第一引数に「このテストが何を検証するのか」を具体的に記述します。
        // 例：「それは、正しいJSONファイルを読み込んで検証できるべきである」
        it('正しいJSONファイルを読み込んで検証できること', () => {
            // ■ 1. 準備 (Arrange): テストに必要な「偽物」の振る舞いを設定します。
            
            // fs.existsSync が呼ばれたら、実際にはファイルがなくても「あるよ(true)」と嘘の返事をするように設定します。
            // (fs.existsSync as jest.Mock) は、TypeScriptに「これは偽物の関数（モック）だよ」と教えるためのおまじないです。
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            // fs.readFileSync が呼ばれたら、ディスクを見に行かずに、ここで用意したテスト用のJSON文字列を返すように設定します。
            // これで「ファイル読み込み」をシミュレートしています。
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
                appName: "TestApp",
                version: 1.0
            }));
 
            // ■ 2. 実行 (Act): テストしたい関数を呼び出します。
            // この偽物のファイルシステム環境の中で、validateData関数を実行します。
            // 関数内部では fs.readFileSync が呼ばれますが、上記で設定した偽物が動きます。
            const result = validateData(testSchema, 'dummy/path.json');
 
            // ■ 3. 検証 (Assert): 結果が期待通りか確認します。
            // expect(結果).toEqual(期待値) で、オブジェクトの中身が一致するかをチェックします。
            expect(result).toEqual({ appName: "TestApp", version: 1.0 });
        });
 
        it('スキーマに違反するJSONの場合はnullを返すこと', () => {
            // ■ 1. 準備
            // ファイルは存在することにします。
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            // わざと「不正なデータ（version が数値であるべきなのに文字列）」を返すように設定します。
            // これで「スキーマ定義と違う、壊れたJSONファイルを読み込んだ状況」をシミュレートします。
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
                appName: "TestApp",
                version: "v1.0"
            }));
 
            // ■ スパイ (Spy) の設置: エラーログの監視と無効化
            // jest.spyOn(オブジェクト, 'メソッド名') で、特定のメソッドを「監視」します。
            // ここでは、テスト中に console.error が呼ばれるとテスト結果が見づらくなるのを防ぐため、
            // .mockImplementation(() => {}) を使って「何もしない関数」に一時的に置き換えています。
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
 
            // ■ 2. 実行
            const result = validateData(testSchema, 'dummy/path.json');
            
            // ■ 3. 検証
            // データが不正なので、関数は null を返すと期待されます。
            // expect(...).toBeNull() で、結果が null であることをチェックします。
            expect(result).toBeNull();
 
            // ■ 後片付け: スパイの撤収
            // .mockRestore() で、監視していた console.error を元の本物の機能に戻します。
            // これを忘れると、他のテストで本当にエラーが出てもログが表示されなくなってしまいます。
            consoleSpy.mockRestore();
        });
    });
});