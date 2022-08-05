'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();

  // var User = router.models.user;
  router.get('/', server.loopback.status());
  server.use(router);
};
