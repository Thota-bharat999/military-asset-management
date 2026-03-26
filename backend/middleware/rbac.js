// Role hierarchy
const ROLES = {
  admin: 3,
  base_commander: 2,
  logistics_officer: 1,
};

/**
 * Restrict access to specified roles only.
 * Usage: authorize('admin', 'base_commander')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not permitted to perform this action.`,
      });
    }
    next();
  };
};

/**
 * Ensures base_commander and logistics_officer can only access their own base's data.
 * Admin can access any base.
 * Checks req.body.baseId, req.query.baseId, or req.params.baseId.
 */
const restrictToOwnBase = (req, res, next) => {
  if (req.user.role === 'admin') return next();

  const requestedBaseId =
    req.body.baseId || req.query.baseId || req.params.baseId;

  if (requestedBaseId && req.user.baseId) {
    const userBaseId = req.user.baseId._id
      ? req.user.baseId._id.toString()
      : req.user.baseId.toString();

    if (requestedBaseId !== userBaseId) {
      return res.status(403).json({
        message: 'Access denied. You can only access data for your own base.',
      });
    }
  }
  next();
};

module.exports = { authorize, restrictToOwnBase, ROLES };
