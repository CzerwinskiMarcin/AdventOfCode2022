const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.ts',
        solutions: './src/solutions'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'static'), to: path.resolve(__dirname, 'dist', 'static')}
            ]
        })
    ],
    resolve: {
        fallback: { "path": require.resolve("path-browserify")},
        extensions: ['.tsx', '.ts', '.js']
    },
    target: 'node'
}