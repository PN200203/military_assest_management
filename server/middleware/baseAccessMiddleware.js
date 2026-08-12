const checkBaseAccess = (req, res, next) => {
  // Admin can access all bases
  if (req.user.role === "ADMIN") {
    return next();
  }

  // Other users must have an assigned base
  if (!req.user.base_id) {
    return res.status(403).json({
      success: false,
      message: "No base is assigned to this user",
    });
  }

  // Get base ID from request
  const requestedBaseId =
    req.params.baseId ||
    req.body.base_id ||
    req.query.base_id;

  // If no base was specified
  if (!requestedBaseId) {
    return res.status(400).json({
      success: false,
      message: "Base ID is required",
    });
  }

  // Check whether user belongs to requested base
  if (
    Number(requestedBaseId) !==
    Number(req.user.base_id)
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You do not have access to this base",
    });
  }

  next();
};

module.exports = checkBaseAccess;