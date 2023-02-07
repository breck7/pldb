// Memoization for immutable getters. Run the function once for this instance and cache the result.
const memoKeys = "__memoKeys"
const imemo = <Type>(
  target: unknown,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<Type>
): void => {
  const originalFn = descriptor.get!
  descriptor.get = function(this: Record<string, Type>): Type {
    const propName = `${propertyName}__memoized`
    if (this[propName] === undefined) {
      // Define the prop the long way so we don't enumerate over it
      const value = originalFn.apply(this)
      Object.defineProperty(this, propName, {
        configurable: false,
        enumerable: false,
        writable: true,
        value
      })
      const anyThis = <any>this
      if (!anyThis[memoKeys]) anyThis[memoKeys] = []
      anyThis[memoKeys].push(propName)
    }
    return this[propName]
  }
}

export { imemo }
