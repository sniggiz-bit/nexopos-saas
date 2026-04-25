"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["BRANCH_ADMIN"] = "BRANCH_ADMIN";
    UserRole["CASHIER"] = "CASHIER";
})(UserRole || (exports.UserRole = UserRole = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["PENDING"] = "PENDING";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
