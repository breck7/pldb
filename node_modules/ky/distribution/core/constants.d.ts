import { type KyOptionsRegistry } from '../types/options.js';
import { type RequestInitRegistry } from '../types/request.js';
export declare const supportsRequestStreams: boolean;
export declare const supportsAbortController: boolean;
export declare const supportsResponseStreams: boolean;
export declare const supportsFormData: boolean;
export declare const requestMethods: readonly ["get", "post", "put", "patch", "head", "delete"];
export declare const responseTypes: {
    readonly json: "application/json";
    readonly text: "text/*";
    readonly formData: "multipart/form-data";
    readonly arrayBuffer: "*/*";
    readonly blob: "*/*";
};
export declare const maxSafeTimeout = 2147483647;
export declare const stop: unique symbol;
export declare const kyOptionKeys: KyOptionsRegistry;
export declare const requestOptionsRegistry: RequestInitRegistry;
