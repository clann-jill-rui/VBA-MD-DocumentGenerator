import { vbaDocGen } from '../xdocgen/docgen';

// ■ describe: テストをグループ化します。
// ここでは 'vbaDocGen' 関数に関するテストをまとめています。
describe('vbaDocGen 関数のテスト', () => {
    
    // ■ it: 個々のテストケースを定義します。
    // 「単純なSubプロシージャの解析ができること」を確認します。
    it('単純なSubプロシージャの解析を実行', () => {
        // 1. 準備: テスト用のVBAコード（入力）を用意
        const vbaCode = `
            Public Sub HelloWorld()
                Debug.Print "Hello"
            End Sub
        `;

        // 2. 実行: 関数を実行して結果を取得
        const jsonOutput = vbaDocGen(vbaCode);
        const result = JSON.parse(jsonOutput);

        // 3. 検証 (Assert): 結果が期待通りかチェックします。
        // ■ expect: Jestの検証（アサーション）を開始する関数です。
        // expect(実際の値) のように書き、その後に「マッチャー」と呼ばれる関数を繋げて
        // 「実際の値が期待通りであるか」を検証します。
        
        // expect().toHaveLength(n): 配列の長さが n であることを検証するマッチャー
        expect(result.Procedures).toHaveLength(1);
        
        // expect().toBe(期待値): プリミティブな値（文字列、数値など）が完全に一致することを検証するマッチャー
        expect(result.Procedures[0].Name).toBe('HelloWorld');
        expect(result.Procedures[0].Scope).toBe('Public');
    });

    // 別のテストケース: 定数(Const)の解析
    it('Constの解析を実行', () => {
        // 1. テスト用定数の準備
        const vbaCode = `Public Const MAX_COUNT As Integer = 100`;

        // 2. 関数の実行 
        const jsonOutput = vbaDocGen(vbaCode);
        const result = JSON.parse(jsonOutput);

        // 3. 結果の検証
        expect(result.Procedures).toHaveLength(1);
        expect(result.Procedures[0].Name).toBe('MAX_COUNT');
        expect(result.Procedures[0].Procedure).toBe('Const');
    });
});