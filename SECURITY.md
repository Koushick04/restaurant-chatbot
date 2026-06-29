# Security Policy

## Reporting A Vulnerability

Please report security issues privately to the repository owner instead of opening a public issue.

Include:

- A clear description of the issue
- Steps to reproduce
- Affected files, routes, or configuration
- Any suggested remediation

## Secret Handling

- Do not commit `.env` files.
- Do not expose Supabase service-role keys to the frontend.
- Rotate secrets immediately if they are shared accidentally.
- Use a strong `JWT_SECRET` and a non-default admin password in production.
