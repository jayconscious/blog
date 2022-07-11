"use strict";

require("core-js/modules/es.promise.js");

require("core-js/modules/es.promise.finally.js");

[1, 2, 3].map(n => n + 1);
Promise.resolve().finally();