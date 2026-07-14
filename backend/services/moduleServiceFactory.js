export function createModuleService(moduleName) {
  return {
    moduleName,
    list: async () => [],
    findById: async (_id) => null,
    create: async (payload) => payload,
    update: async (_id, payload) => payload,
    remove: async (_id) => true,
  };
}
