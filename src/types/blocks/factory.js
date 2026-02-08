import { BLOCK_TYPES } from './constant';

export function createBlock(type = BLOCK_TYPES.PARAGRAPH, content = '') {
    return {
        id: crypto.randomUUID(),
        type,
        content,
    };
}
