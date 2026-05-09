"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerSyncDto = exports.SyncTypeDto = void 0;
const class_validator_1 = require("class-validator");
var SyncTypeDto;
(function (SyncTypeDto) {
    SyncTypeDto["PRODUCTS"] = "PRODUCTS";
    SyncTypeDto["INVENTORY"] = "INVENTORY";
    SyncTypeDto["ORDERS"] = "ORDERS";
    SyncTypeDto["FULL"] = "FULL";
})(SyncTypeDto || (exports.SyncTypeDto = SyncTypeDto = {}));
class TriggerSyncDto {
    type = SyncTypeDto.FULL;
}
exports.TriggerSyncDto = TriggerSyncDto;
__decorate([
    (0, class_validator_1.IsEnum)(SyncTypeDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TriggerSyncDto.prototype, "type", void 0);
//# sourceMappingURL=trigger-sync.dto.js.map