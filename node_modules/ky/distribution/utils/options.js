import { kyOptionKeys, requestOptionsRegistry } from '../core/constants.js';
export const findUnknownOptions = (request, options) => {
    const unknownOptions = {};
    for (const key in options) {
        if (!(key in requestOptionsRegistry) && !(key in kyOptionKeys) && !(key in request)) {
            unknownOptions[key] = options[key];
        }
    }
    return unknownOptions;
};
//# sourceMappingURL=options.js.map