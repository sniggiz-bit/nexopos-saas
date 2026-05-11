-- Clean up open shifts for providencia to allow a fresh start
UPDATE "CashShift" SET status = 'CLOSED', "endTime" = NOW() WHERE "branchId" = 'branch-providencia' AND status = 'OPEN';
