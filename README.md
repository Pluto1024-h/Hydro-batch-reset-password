# Hydro Batch Reset Password Plugin

一个用于 Hydro OJ 的批量重置普通用户密码插件。

仓库地址：<https://github.com/Pluto1024-h/Hydro-batch-reset-password>

> ⚠️ 高危功能：该插件会直接修改用户密码。请先在测试用户上验证，再在生产环境使用。

## 功能

- 路由：`/manage/batch-reset-password`
- 仅允许拥有 `PRIV.PRIV_EDIT_SYSTEM` 的管理员访问。
- POST 操作使用 `@requireSudo` 保护。
- 支持按登录名批量重置密码，例如 `teacher2`、`teacher3`。
- 自动跳过系统保留用户和拥有系统编辑权限的管理员账号。
- 使用普通表单提交，适配 Hydro 的 sudo 重定向流程。
- 使用服务端 Nunjucks 模板渲染结果，避免前端 `innerHTML` 拼接造成 XSS 风险。

## 目录结构

```text
hydro-batch-reset-password/
├── LICENSE
├── README.md
├── package.json
├── index.ts
├── tsconfig.json
└── templates/
    └── batch_reset_password.html
```

## 安装

将本插件目录上传到服务器，例如：

```bash
/root/hydro-addons/hydro-batch-reset-password
```

确认该目录下能直接看到 `package.json`，然后执行：

```bash
hydrooj addon add /root/hydro-addons/hydro-batch-reset-password
pm2 restart hydrooj
```

## 使用

使用超级管理员账号登录 Hydro OJ，然后访问：

```text
https://你的域名/manage/batch-reset-password
```

输入登录名列表，例如：

```text
teacher2
teacher3
```

再输入统一的新密码并提交。

## 测试建议

1. 先创建普通测试用户，例如 `test001`。
2. 用本插件重置 `test001` 的密码。
3. 退出管理员账号，使用 `test001` 和新密码登录验证。
4. 尝试输入不存在的用户名，应显示失败详情。
5. 尝试输入管理员用户名，应被自动跳过。
6. 使用普通用户访问 `/manage/batch-reset-password`，应无权访问。

## License

This project is licensed under **AGPL-3.0-or-later**.

Hydro OJ itself is licensed under AGPL-3.0 with additional terms. This plugin is developed for Hydro OJ and uses Hydro's plugin APIs, so it is released under AGPL-3.0-or-later for compatibility.
