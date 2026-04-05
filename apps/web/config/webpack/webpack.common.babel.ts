import webpack, { Configuration } from 'webpack';
import path from 'path';

const bundleName = 'app';

export const commonConfig: Configuration = {
    entry: {
        [bundleName]: [
            `core-js/stable`,
            `react`,
            `react-dom`,
            path.join(process.cwd(), `src/index`),
        ],
    },
    target: `web`,
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                PORT: JSON.stringify(process.env.PORT),
                ANALYZE: JSON.stringify(process.env.ANALYZE),
            },
        }),
    ],
    resolve: {
        extensions: [`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`],
    },
    performance: {
        hints: false,
    },
};
