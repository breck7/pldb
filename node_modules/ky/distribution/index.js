/*! MIT License © Sindre Sorhus */
import { Ky } from './core/Ky.js';
import { requestMethods, stop } from './core/constants.js';
import { validateAndMerge } from './utils/merge.js';
const createInstance = (defaults) => {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const ky = (input, options) => Ky.create(input, validateAndMerge(defaults, options));
    for (const method of requestMethods) {
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        ky[method] = (input, options) => Ky.create(input, validateAndMerge(defaults, options, { method }));
    }
    ky.create = (newDefaults) => createInstance(validateAndMerge(newDefaults));
    ky.extend = (newDefaults) => createInstance(validateAndMerge(defaults, newDefaults));
    ky.stop = stop;
    return ky;
};
const ky = createInstance();
export default ky;
export { HTTPError } from './errors/HTTPError.js';
export { TimeoutError } from './errors/TimeoutError.js';
//# sourceMappingURL=index.js.map