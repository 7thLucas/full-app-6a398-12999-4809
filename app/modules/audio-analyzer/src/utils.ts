// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export function singleton<T>(key: string, factory: () => T): T {
  const globalKey = Symbol.for(`singleton.factory.${key}`);
  const globalObj = globalThis as Record<symbol, any>;

  if (!(globalKey in globalObj)) {
    const instance = factory();

    if (instance && typeof instance === "object") {
      Object.freeze(instance);
    }

    globalObj[globalKey] = instance;
  }

  return globalObj[globalKey];
}
