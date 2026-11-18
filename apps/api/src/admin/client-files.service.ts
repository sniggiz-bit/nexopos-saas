import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export function localAssetPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let pathname = value;
  if (/^https?:\/\//.test(value)) {
    try {
      const url = new URL(value);
      const allowed = [process.env.FRONTEND_URL || 'https://nexopos.cl', process.env.API_PUBLIC_URL || 'https://nexopos.cl/api'].map(v => new URL(v).origin);
      if (!allowed.includes(url.origin)) return null;
      pathname = url.pathname;
    } catch { return null; }
  }
  return /^\/api\/static\/(products|logos)\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,160}$/.test(pathname) ? pathname : null;
}

@Injectable()
export class ClientFilesService {
  constructor(private prisma: PrismaService) {}
  async clean(tenantId: string, candidates: string[]) {
    const root = path.resolve(process.cwd(), '..', '..', 'uploads');
    const failed: string[] = [];
    let removed = 0;
    let shared = 0;
    const [products, tenants, configs, assets] = await Promise.all([
      this.prisma.product.findMany({ select: { image: true, galleryImages: true } }),
      this.prisma.tenant.findMany({ select: { logoUrl: true, storeSettings: true } }),
      this.prisma.dteConfig.findMany({ select: { liorenLogo: true } }),
      this.prisma.uploadAsset.findMany({ select: { path: true } }),
    ]);
    const referenced = new Set<string>();
    const visit = (v: unknown) => {
      if (typeof v === 'string') { const url = localAssetPath(v); if (url) referenced.add(url); }
      else if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') Object.values(v).forEach(visit);
    };
    [products, tenants, configs, assets].forEach(visit);
    for (const raw of [...new Set(candidates)]) {
      const asset = localAssetPath(raw);
      if (!asset) continue;
      if (referenced.has(asset)) { shared++; continue; }
      const file = path.resolve(root, asset.slice('/api/static/'.length));
      if (!file.startsWith(root + path.sep)) { failed.push(asset); continue; }
      try {
        const stat = await fs.lstat(file);
        const real = await fs.realpath(file);
        if (!stat.isFile() || !real.startsWith(root + path.sep)) { failed.push(asset); continue; }
        await fs.unlink(file);
        removed++;
      } catch (error: any) { if (error.code !== 'ENOENT') failed.push(asset); }
    }
    // Receipt directories are partitioned by tenant. Resolve and verify each exact target.
    if (/^[a-zA-Z0-9_-]{1,128}$/.test(tenantId)) {
      for (const receiptRoot of [path.join(root, 'receipts'), path.resolve(process.cwd(), 'uploads', 'receipts')]) {
        const target = path.resolve(receiptRoot, tenantId);
        if (!target.startsWith(path.resolve(receiptRoot) + path.sep)) continue;
        try {
          const stat = await fs.lstat(target);
          const realRoot = await fs.realpath(receiptRoot);
          const realTarget = await fs.realpath(target);
          if (!stat.isDirectory() || !realTarget.startsWith(realRoot + path.sep)) { failed.push('receipts/' + tenantId); continue; }
          await fs.rm(target, { recursive: true, force: true });
        } catch (error: any) { if (error.code !== 'ENOENT') failed.push('receipts/' + tenantId); }
      }
    }
    return { removed, shared, failed };
  }
}
