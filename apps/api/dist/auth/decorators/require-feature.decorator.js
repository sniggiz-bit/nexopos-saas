"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireFeature = exports.FEATURE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.FEATURE_KEY = 'require_feature';
const RequireFeature = (flag) => (0, common_1.SetMetadata)(exports.FEATURE_KEY, flag);
exports.RequireFeature = RequireFeature;
//# sourceMappingURL=require-feature.decorator.js.map