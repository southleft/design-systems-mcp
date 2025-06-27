# Contributing to Design Systems MCP

Thank you for your interest in contributing to the Design Systems MCP! This project thrives on community contributions and we welcome all forms of participation.

## 🤝 **Ways to Contribute**

### **🐛 Bug Reports & Issues**
- Check [existing issues](../../issues) first to avoid duplicates
- Use the issue templates when available
- Provide clear reproduction steps
- Include environment details (OS, Node.js version, etc.)

### **💡 Feature Requests**
- Search existing issues for similar requests
- Clearly describe the problem and proposed solution
- Explain the use case and potential impact
- Consider starting a [discussion](../../discussions) for major features

### **📚 Content Contributions**
- Add new design system documentation and resources
- Improve existing content organization
- Update outdated information
- Enhance content metadata and tagging

### **🔧 Code Contributions**
- Fix bugs and issues
- Improve performance and reliability
- Add new MCP tools and capabilities
- Enhance the user interface and experience

### **📖 Documentation**
- Improve setup and usage instructions
- Add examples and tutorials
- Fix typos and unclear explanations
- Translate documentation

## 🚀 **Getting Started**

### **1. Fork & Clone**
```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/your-username/design-systems-mcp.git
cd design-systems-mcp
```

### **2. Set Up Development Environment**
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .dev.vars
# Edit .dev.vars with your OpenAI API key

# Start development server
npm run dev
```

### **3. Create a Branch**
```bash
# Create a descriptive branch name
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### **4. Make Changes**
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes locally
- Update documentation as needed

### **5. Submit Pull Request**
- Push your branch to your fork
- Create a pull request to the main repository
- Fill out the PR template completely
- Link related issues in the description

## 📚 **Adding Content**

### **Content Guidelines**

**✅ Content we welcome:**
- Public design system documentation
- Open source design resources
- Educational articles and guides
- Best practices and methodologies
- Official documentation from design tools
- Case studies with proper attribution

**❌ Content to avoid:**
- Copyrighted material without permission
- Internal/private company documentation
- Content without proper attribution
- Duplicate or redundant resources
- Low-quality or incomplete guides

### **Attribution Requirements**

When adding content, you **must**:

1. **Verify permission** to share the content
2. **Provide proper attribution** to original authors
3. **Include source links** and original URLs
4. **Update CREDITS.md** with author information
5. **Respect original licensing** and terms

### **Content Addition Process**

1. **Add source content** to `local-content-library/`
2. **Run ingestion scripts:**
   ```bash
   # For PDFs
   npm run ingest:pdf path/to/document.pdf

   # For URLs
   npm run ingest:url https://example.com/article

   # For bulk CSV
   npm run ingest:csv path/to/urls.csv
   ```
3. **Update content loading** in `src/index.ts`
4. **Test locally** with `npm run dev`
5. **Update CREDITS.md** with attribution
6. **Submit pull request** with changes

## 🔧 **Development Guidelines**

### **Code Style**
- Use TypeScript for type safety
- Follow existing naming conventions
- Write self-documenting code with clear variable names
- Add comments for complex logic
- Use meaningful commit messages

### **Testing**
- Test all changes locally before submitting
- Verify the MCP server responds correctly
- Test the AI chat interface thoroughly
- Check that new content is searchable and accessible

### **Performance**
- Keep content chunks reasonably sized
- Optimize search performance
- Minimize memory usage
- Consider bandwidth for content loading

### **Security**
- Never commit API keys or sensitive data
- Follow the security guidelines in [SECURITY.md](SECURITY.md)
- Use environment variables for configuration
- Validate user inputs appropriately

## 🔒 **Security Considerations**

### **For Contributors**
- **Never commit secrets** - Use `.env` or `.dev.vars` files
- **Review dependencies** - Check for known vulnerabilities
- **Validate inputs** - Sanitize any user-provided data
- **Report security issues** privately to maintainers

### **For Content**
- **Respect copyright** - Only add content you have permission to share
- **Verify sources** - Ensure content comes from legitimate sources
- **Check for PII** - Remove any personal information from content
- **Review metadata** - Ensure no sensitive information in tags or descriptions

## 📝 **Pull Request Guidelines**

### **Before Submitting**
- [ ] Code follows project conventions
- [ ] Changes have been tested locally
- [ ] Documentation has been updated
- [ ] New content includes proper attribution
- [ ] No secrets or sensitive data included
- [ ] Related issues are referenced

### **PR Description Should Include**
- **Summary** of changes made
- **Motivation** for the changes
- **Testing** performed
- **Screenshots** for UI changes
- **Breaking changes** if any
- **Attribution updates** for new content

### **Review Process**
1. **Automated checks** must pass
2. **Manual review** by maintainers
3. **Security scan** for sensitive data
4. **Attribution verification** for content
5. **Testing** in development environment

## 🎯 **Project Priorities**

### **High Priority**
- Security and privacy improvements
- Performance optimizations
- High-quality design system content
- Bug fixes and stability

### **Medium Priority**
- New MCP tools and capabilities
- UI/UX improvements
- Documentation enhancements
- Integration improvements

### **Lower Priority**
- Nice-to-have features
- Experimental functionality
- Aesthetic improvements

## 💬 **Community Guidelines**

### **Be Respectful**
- Use inclusive and welcoming language
- Respect different perspectives and experiences
- Focus on constructive feedback
- Help others learn and grow

### **Be Collaborative**
- Ask questions when unclear
- Share knowledge and insights
- Help review others' contributions
- Participate in discussions

### **Be Ethical**
- Respect intellectual property rights
- Provide proper attribution
- Don't share sensitive or private information
- Follow platform terms of service

## 🆘 **Getting Help**

### **Questions?**
- Check the [README](README.md) for basic information
- Search [existing issues](../../issues) for similar questions
- Start a [discussion](../../discussions) for general questions
- Ask in your pull request for specific code questions

### **Stuck?**
- Review the [setup guide](README.md#quick-start) again
- Check your environment variables and API keys
- Try the troubleshooting section in the README
- Open an issue with detailed information about your problem

### **Need Support?**
- 🐛 **Bug reports:** [GitHub Issues](../../issues)
- 💬 **General questions:** [GitHub Discussions](../../discussions)
- 🔒 **Security issues:** Email maintainers privately
- 📚 **Documentation:** Check [README](README.md) and [project docs](../../wiki)

## 📄 **License**

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

Your contributions of content must respect the original authors' rights and include proper attribution as outlined in [CREDITS.md](CREDITS.md).

---

Thank you for contributing to the Design Systems MCP community! 🙏
