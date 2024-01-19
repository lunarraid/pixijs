import { writeFileSync } from 'fs-extra';
import {
    UNIFORM_TO_ARRAY_SETTERS,
    UNIFORM_TO_SINGLE_SETTERS
} from '../../src/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes';
import {
    uboSyncFunctionsSTD40,
    uboSyncFunctionsWGSL
} from '../../src/rendering/renderers/shared/shader/utils/uboSyncFunctions';
import { uniformParsers } from '../../src/rendering/renderers/shared/shader/utils/uniformParsers';

/**
 * this file auto generates the unsafe eval functions for uniforms and uniform buffers
 * it is used to generate the files:
 * - src/unsafe-eval/uniformSyncFunctions.ts
 * - src/unsafe-eval/uniformBufferSyncFunctions.ts
 *
 * This exists so we only have to maintain the all these parsers in one place.
 */
const header = `
/**
 * This file is auto generated by scripts/utils/autoGenerateUnsafeEvalFunctions.ts
 * Do not edit manually - or you will be sad.
 */

import type { UNIFORM_TYPES } from '../rendering/renderers/shared/shader/types';
`;

function autoGenerateUnsafeEvalFunctions()
{
    function convertToFunctionWithLocation(body: string)
    {
        body = body.replace('location', `ud[name].location`);

        return `function(name:string, cu:any, cv:any, v:any, ud:any, uv:any, gl:any):void
        {
            ${body}
        }`;
    }

    function convertToFunction(body: string)
    {
        return `(name:string, cu:any, cv:any, v:any, ud:any, uv:any, gl:any):void =>
        {
            ${body}
        }`;
    }

    const out: string[] = [header];

    // eslint-disable-next-line max-len
    out.push(`export type UniformUploadFunction = (name: string, cu: any, cv: any, v: any, ud: any, uv: any, gl: any) => void;`);

    out.push('export const uniformSingleParserFunctions:Record<UNIFORM_TYPES|string, UniformUploadFunction> = {');
    for (const i in UNIFORM_TO_SINGLE_SETTERS)
    {
        const fn = UNIFORM_TO_SINGLE_SETTERS[i];

        out.push(`'${i}': ${convertToFunctionWithLocation(fn)},`);
    }
    out.push('};\n');

    out.push('export const uniformArrayParserFunctions:Record<UNIFORM_TYPES|string, UniformUploadFunction> = {');
    for (const i in UNIFORM_TO_ARRAY_SETTERS)
    {
        const fn = UNIFORM_TO_ARRAY_SETTERS[i];

        out.push(`'${i}': ${convertToFunctionWithLocation(fn)},`);
    }
    out.push('};\n');

    // now add the uniform parsers..
    out.push('export const uniformParserFunctions:UniformUploadFunction[] = [');
    for (const i in uniformParsers)
    {
        const fn = uniformParsers[i].uniform;

        out.push(`${convertToFunction(fn)},`);
    }
    out.push('];');

    const final = out.join('\n');

    const path = 'src/unsafe-eval/uniformSyncFunctions.ts';

    writeFileSync(path, final, 'utf8');
}

// uniform buffers!
function autoGenerateUboUnsafeEvalFunctions()
{
    const out: string[] = [header];

    // eslint-disable-next-line max-len
    out.push(`export type UboUploadFunction = (name:string, data:Float32Array, offset:number, uv:any, v:any) => void;`);

    function convertToFunction(body: string)
    {
        return `(name:string, data:Float32Array, offset:number, uv:any, v:any):void =>
        {
            ${body}
        }`;
    }

    // now add the uniform parsers..
    out.push('export const uboParserFunctions:UboUploadFunction[] = [');
    for (const i in uniformParsers)
    {
        const fn = uniformParsers[i].uboWgsl ?? uniformParsers[i].ubo;

        out.push(`${convertToFunction(fn)},`);
    }
    out.push('];');

    // and the basic uploads

    // now add the uniform parsers..
    out.push('export const uboSingleFunctionsWGSL:Record<UNIFORM_TYPES|string, UboUploadFunction> = {');
    for (const i in uboSyncFunctionsWGSL)
    {
        const fn = uboSyncFunctionsWGSL[i as keyof typeof uboSyncFunctionsWGSL];

        out.push(`'${i}': ${convertToFunction(fn)},`);
    }

    out.push('};');

    // now add the uniform parsers..
    out.push('export const uboSingleFunctionsSTD40:Record<UNIFORM_TYPES|string, UboUploadFunction> = {');
    for (const i in uboSyncFunctionsSTD40)
    {
        const fn = uboSyncFunctionsSTD40[i as keyof typeof uboSyncFunctionsSTD40];

        out.push(`'${i}': ${convertToFunction(fn)},`);
    }

    out.push('};');

    const final = out.join('\n');

    const path = 'src/unsafe-eval/uboSyncFunctions.ts';

    writeFileSync(path, final, 'utf8');
}

autoGenerateUnsafeEvalFunctions();
autoGenerateUboUnsafeEvalFunctions();
