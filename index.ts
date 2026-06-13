/*
 * Hydro Batch Reset Password Plugin
 * Copyright (C) 2026 chen hao
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import {
  Context,
  Handler,
  param,
  Types,
  PRIV,
  requireSudo,
} from 'hydrooj';


function getUserModel() {
  const model = (globalThis as any).Hydro?.model?.user;
  if (!model) {
    throw new Error('无法获取 Hydro 用户模型：globalThis.Hydro.model.user 不存在，请确认 Hydro 已正常启动且版本支持用户模型。');
  }
  return model;
}

interface ResetResult {
  status: 'success' | 'partial' | 'error';
  message: string;
  failedDetails: string[];
  successCount: number;
  failedCount: number;
  totalCount: number;
}

function splitUsernames(raw: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const name of raw.split(/[\s,，;；]+/)) {
    const uname = name.trim();
    if (!uname) continue;

    const key = uname.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(uname);
  }

  return result;
}

class BatchResetPasswordHandler extends Handler {
  private render(result: ResetResult | null = null) {
    this.response.template = 'batch_reset_password.html';
    this.response.body = {
      page_name: 'manage_batch_reset_password',
      page_title: '批量重置用户密码',
      result,
    };
  }

  async get() {
    this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    this.render(null);
  }

  @requireSudo
  @param('usernames', Types.String)
  @param('newPassword', Types.String)
  async post(domainId: string, usernames: string, newPassword: string) {
    this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);

    const unameList = splitUsernames(usernames);

    if (!unameList.length) {
      this.render({
        status: 'error',
        message: '没有输入任何用户名。',
        failedDetails: [],
        successCount: 0,
        failedCount: 0,
        totalCount: 0,
      });
      return;
    }

    if (unameList.length > 500) {
      this.render({
        status: 'error',
        message: '一次最多处理 500 个用户。',
        failedDetails: [],
        successCount: 0,
        failedCount: 0,
        totalCount: unameList.length,
      });
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      this.render({
        status: 'error',
        message: '新密码长度必须在 8 到 128 位之间。',
        failedDetails: [],
        successCount: 0,
        failedCount: 0,
        totalCount: unameList.length,
      });
      return;
    }

    let successCount = 0;
    const failedDetails: string[] = [];

    for (const uname of unameList) {
      try {
        const UserModel = getUserModel();
        const udoc = await UserModel.getByUname('system', uname);

        if (!udoc) {
          failedDetails.push(`${uname}：用户不存在`);
          continue;
        }

        if (udoc._id <= 1) {
          failedDetails.push(`${uname}：拒绝修改系统保留用户`);
          continue;
        }

        if (udoc.hasPriv(PRIV.PRIV_EDIT_SYSTEM)) {
          failedDetails.push(`${uname}：拒绝批量修改系统管理员密码`);
          continue;
        }

        const updated = await UserModel.setPassword(udoc._id, newPassword);
        if (!updated) {
          failedDetails.push(`${uname}：密码更新失败，可能是虚拟用户或数据库异常`);
          continue;
        }

        successCount++;
      } catch (e: any) {
        failedDetails.push(`${uname}：发生异常 - ${e?.message || '未知错误'}`);
      }
    }

    this.render({
      status: failedDetails.length ? 'partial' : 'success',
      message: `成功重置 ${successCount} 人，失败 ${failedDetails.length} 人。`,
      failedDetails,
      successCount,
      failedCount: failedDetails.length,
      totalCount: unameList.length,
    });
  }
}

export async function apply(ctx: Context) {
  ctx.Route(
    'manage_batch_reset_password',
    '/manage/batch-reset-password',
    BatchResetPasswordHandler,
    PRIV.PRIV_EDIT_SYSTEM,
  );
}
