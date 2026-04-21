const { spawn } = require('child_process');

// ツールを実行
const child = spawn('node', ['dist/src/main.js']);

// 出力スピード（ミリ秒）。数値を大きくするとより遅くなります。
const TYPING_SPEED_MS = 10; 

async function slowPrint(data) {
    const text = data.toString();
    for (const char of text) {
        process.stdout.write(char);
        // 指定したミリ秒だけ待機
        await new Promise(resolve => setTimeout(resolve, TYPING_SPEED_MS));
    }
}

// 標準出力と標準エラー出力をキャッチしてゆっくり表示
child.stdout.on('data', slowPrint);
child.stderr.on('data', slowPrint);
