/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // テストファイルは tests フォルダ内に置く設定
  roots: ['<rootDir>/tests'],
};