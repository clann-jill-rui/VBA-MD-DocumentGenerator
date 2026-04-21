import { generateRow, generateMDTableHeader } from '../src/jsonMDGenerator';

// ■ describe: 'jsonMDGenerator' モジュールをテストグループ化します。
describe('jsonMDGenerator モジュールのテスト', () => {
    
    // 'generateRow' 関数のテストグループ化します。
    describe('generateRow 関数のテスト', () => {
        
        // itで単体のテストケースを作成します。
        it('配列からMarkdownのテーブル行を生成すること', () => {
            // 1. 準備 テスト用の値を用意します。
            const input = ['Name', 'Type', 'Description'];
            
            // 2. 実行 パラメータを渡して結果を得ます。
            const result = generateRow(input);
            
            // 3. 検証
            // expect(...).toContain(string): 文字列が含まれているか確認します。
            expect(result).toContain('| Name | Type | Description |');
        });

        // itで単体のテストケースを作成します。
        it('undefinedの要素はデフォルト値（値がありません）に置換されること', () => {
            // 1. 準備: 一部が undefined の配列
            const input = ['MyVar', undefined, '説明'];
            
            // 2. 実行
            const result = generateRow(input);

            // 3. 検証
            expect(result).toContain('MyVar');
            
            // expect(...).toMatch(regexp): 正規表現にマッチするか確認します。
            // ここでは "値がありません" という文言が含まれているかチェックしています。
            expect(result).toMatch(/値がありません/);
        });
    });

    // generateMDTableHeader のテストも同様に追加可能
});