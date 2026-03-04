"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckLimit = exports.LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.LIMIT_KEY = 'check_limit';
const CheckLimit = (resource) => (0, common_1.SetMetadata)(exports.LIMIT_KEY, resource);
exports.CheckLimit = CheckLimit;
//# sourceMappingURL=check-limit.decorator.js.map