export const moduleStatus = (moduleName) => (_req, res) => {
  res.status(200).json({
    success: true,
    message: `${moduleName} API foundation is ready`,
    data: {
      module: moduleName,
      status: 'ready',
    },
  });
};
