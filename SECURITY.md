# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to the repository maintainer. All security vulnerabilities will be promptly addressed.

Please do not report security vulnerabilities through public GitHub issues.

## Security Best Practices for Users

### Environment Variables
- **Never commit API keys or sensitive data to the repository**
- Use `.env` or `.dev.vars` files for local development (these are already in .gitignore)
- For production deployments, use your hosting platform's environment variable system

### API Key Security
- Keep your OpenAI API keys secure and never share them
- Regularly rotate your API keys
- Use environment variables, not hardcoded values
- Monitor your API usage for unexpected activity

### Deployment Security
- Use HTTPS in production
- Implement rate limiting if exposing the MCP server publicly
- Keep dependencies updated with `npm audit` and `npm update`
- Use secrets management for production environment variables

### Repository Security
- This repository is open source and public
- No sensitive data should ever be committed
- All example files use placeholder values only
- Report security issues privately, not through public issues

## Dependencies

We regularly update dependencies to address security vulnerabilities. Please keep your local installation updated:

```bash
npm audit
npm update
```

## Contact

For security-related questions or to report vulnerabilities, please contact the repository maintainers privately.
