Option Explicit

'@Description: VBA-MD-DocumentGeneratorでサポートしている全てのタグと機能を網羅したサンプルモジュールです。
'このファイルを参考に、タグの使用方およびどのようなドキュメントが生成されるかご確認ください。
'
'@Author:山田 太郎
'@ToDo:サンプルコードのレビュー
'@ModuleName:SampleModule
'@LastUpdate:2026/03/21

'' ==========================================
' 変数のタグ付け
' ==========================================

'@VarName:m_DBConnection
'@VarType:ADODB.Connection
'@VarDescription:データベース接続を管理するプライベート変数です。
Private m_DBConnection As Object

'@VarName:Test
'@VarType:Object
'@VarDescription:テスト。
Private Test As Object

Private m_AppVersion As String

' ====================================================================================
' 定数一覧のタグ付け（※ @VarDescription が付与されたEnumとTypeのみが出力されます。）
' ====================================================================================

'@VarDescription:[[APP_TIMEOUT]]:アプリケーションのデフォルトタイムアウト秒数
Public Const APP_TIMEOUT As Long = 30

'@VarDescription:[[BASE_ERROR_CODE]]:システムのエラーコード（ベース）
Public Const BASE_ERROR_CODE As Long = 9999

'@VarDescription:[[TEST_VAL]]:テストです。
Private Const TEST_VAL As String ="TEST"

'@VarDescription:[[TEST_VAL2]]:テスト2です。
Const TEST_VAL2 As String ="TEST2"


' ===============================================================================================
' 列挙型・ユーザー定義型一覧のタグ付け（※ @VarDescription が付与されたEnumとTypeのみが出力されます。）
' ===============================================================================================

'@VarDescription:[[DBStatus]]:データベースの接続状態を表す列挙型
Public Enum DBStatus
    Connected = 1
    Disconnected = 0
    Connecting = 2
End Enum

'@VarDescription:[[TestEnum]]:テストです。
Private Enum TestEnum
    One = 1
    Two = 2
    Three = 3
End Enum

'@VarDescription:[[TestEnum2]]:テストです2。
Enum TestEnum2
    Four = 4
    Five = 5
    Six = 6
End Enum

'@VarDescription:[[UserInfo]]:ユーザー情報を格納するユーザー定義型
Public Type UserInfo
    ID As String
    Name As String
    Age As Integer
End Type

'@VarDescription:[[AppSettings]]:アプリケーションの内部設定を保持するプライベート型
Private Type AppSettings
    DebugMode As Boolean
    MaxRetries As Integer
End Type

' ====================================================================================
' プロシージャ一覧のテストです。説明(@ProcDescription)以外の内容はタグ付け無しで出力されます。
' ====================================================================================

'@ProcDescription:[[GetUser]]:指定されたユーザーIDに基づいてユーザー情報を取得します。
Public Function GetUser(ByVal userId As String, Optional ByVal includeDeleted As Boolean = False) As Object
    ' 処理内容
    Set GetUser = Nothing
End Function

'@ProcDescription:[[RegisterUser]]:ユーザー情報を新規登録します。
Public Sub RegisterUser(ByRef userInfo As UserInfo, ByRef resultMsg As String)
    ' 処理内容
    resultMsg = "Success"
End Sub

'@ProcDescription:[[CalculateSum]]:可変長引数を受け取るサンプル関数です。
Public Function CalculateSum(ParamArray values() As Variant) As Double
    Dim sum As Double
    Dim i As Integer
    sum = 0
    For i = LBound(values) To UBound(values)
        sum = sum + values(i)
    Next i
    CalculateSum = sum
End Function

' 配列引数の自動抽出テスト
Public Function JoinTexts(ByRef textArray() As String, Optional ByVal delimiter As String = ",") As String
    JoinTexts = Join(textArray, delimiter)
End Function

'@ProcDescription:[[CountExecutions]]:静的(Static)なサブルーチンのサンプルです。
Private Static Sub CountExecutions()
    Dim count As Integer
    count = count + 1
    Debug.Print "実行回数: " & count
End Sub

' プロパティのサンプル
'@ProcDescription:[[CurrentStatus]]:現在のステータスを取得します。
Public Property Get CurrentStatus() As DBStatus
    CurrentStatus = DBStatus.Connected
End Property

'@ProcDescription:[[CurrentStatus]]:現在のステータスを設定します。
Public Property Let CurrentStatus(ByVal value As DBStatus)
    ' ステータス設定処理
End Property
