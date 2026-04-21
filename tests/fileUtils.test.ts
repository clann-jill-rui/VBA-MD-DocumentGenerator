import { normalizeExtension } from '../src/fileUtils';

// ■ describe: 'fileUtils' モジュールのテストをグループ化します。
describe('fileUtils モジュールのテスト', () => {
    
    // describe: 'normalizeExtension' 関数のテストグループをネストします。
    describe('normalizeExtension 関数のテスト', () => {

        // 正常系のテストケース
        it('ドットなしの拡張子にドットを付与して返すこと', () => {

            // ■ expect: Jestの検証（アサーション）を開始する関数です。
            // expect().toBe()はexpect()で得られた値がtoBe()と同じかどうかチェックします。
            // toBe()のような関数はマッチャーとも呼びます。
            expect(normalizeExtension('cls')).toBe('.cls');
        });

        it('ドットありの拡張子はそのまま（小文字化して）返すこと', () => {
            // 拡張子.basが変えることを期待します。大文字で渡しても小文字に正規化して返すことを期待します。
            expect(normalizeExtension('.BAS')).toBe('.bas');
        });

        it('大文字混じりの拡張子を小文字に正規化すること', () => {
            // 拡張子mdが変えることを期待します。大文字小文字まざりでも小文字に正規化して返すことを期待します。
            expect(normalizeExtension('Md')).toBe('.md');
        });

        // 異常系のテストケース
        it('空文字や空白のみの場合はnullを返し、エラーログを出力すること', () => {
            // ■ スパイ (Spy) の設置
            // jest.spyOn(object, methodName) は指定のオブジェクトのメソッドをjestがコントロールします。
            // 結果としては失敗になるので,.mockImplementation(() => {}) で,コンソールへのエラー表示を抑制します。
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // 検証: 無効な値を渡すと null が返るはず
            // expectでnormalizeExtensionに空文字（無効な値）を渡して,toBeNull()でnullが戻ることを期待します。
            expect(normalizeExtension('')).toBeNull();
            expect(normalizeExtension('   ')).toBeNull();

            // ■ 呼び出し確認
            // expect(...).toHaveBeenCalled(): スパイした関数が（1回以上）呼ばれたかを確認します。
            // エラー処理ルートを通ったことの証明になります。コンソールにメッセージは出ませんが,これで実行結果を確認できます。
            expect(consoleSpy).toHaveBeenCalled();

            // ■ 後片付け: スパイの撤収
            // console.error を元の状態に戻します。
            consoleSpy.mockRestore();
        });
    });
});