import { build } from 'esbuild';
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin';

const commonConfig = {
    plugins: [vanillaExtractPlugin()],
    entryPoints: ['src/ts/render.ts'],
    sourcemap: true,
    bundle: true,
    format: 'esm',
    target: ['es2020'],
}

async function buildAll() {
    await build({
        ...commonConfig,
        minify: true,
        outfile: './dist/pdf-ctrl.min.js',
    });

    await build({
        ...commonConfig,
        minify: false,
        outfile: './dist/pdf-ctrl.js',
    });
}

buildAll().catch(() => process.exit(1));