SELECT cs.id, cs.status, cs."branchId", b.name as branch_name, cs."openedById", u.email as opener_email 
FROM "CashShift" cs
JOIN "Branch" b ON cs."branchId" = b.id
JOIN "User" u ON cs."openedById" = u.id
WHERE cs.status = 'OPEN';
