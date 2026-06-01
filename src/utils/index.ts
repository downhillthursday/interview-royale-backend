export const logRequest = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

export const formatResponse = (data) => {
  return {
    success: true,
    data,
  };
};