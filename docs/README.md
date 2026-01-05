# Documentation Directory

> Technical documentation for FDDHub and FDDAdvisor platforms

## Overview

This directory contains detailed technical documentation for developers working on the platform.

## Available Documentation

### Architecture & Design

| Document | Description |
|----------|-------------|
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | Complete database schema with all tables, relationships, and RLS policies |
| [FINAL_ARCHITECTURE.md](./FINAL_ARCHITECTURE.md) | Platform architecture, auth flows, and implementation status |
| [TWO_PRODUCT_ARCHITECTURE.md](./TWO_PRODUCT_ARCHITECTURE.md) | FDDAdvisor + FDDHub separation strategy |

### Feature Implementation

| Document | Description |
|----------|-------------|
| [TEAM_MEMBER_IMPLEMENTATION.md](./TEAM_MEMBER_IMPLEMENTATION.md) | Team management feature with roles and permissions |
| [PIPELINE_STAGES_IMPLEMENTATION.md](./PIPELINE_STAGES_IMPLEMENTATION.md) | Custom pipeline stages feature |

### Operations & QA

| Document | Description |
|----------|-------------|
| [SENTRY-USAGE-GUIDE.md](./SENTRY-USAGE-GUIDE.md) | Error monitoring with Sentry |
| [MOBILE_REGRESSION_TEST_CHECKLIST.md](./MOBILE_REGRESSION_TEST_CHECKLIST.md) | Mobile testing checklist |
| [FRANCHISOR_ONBOARDING_HANDOFF.md](./FRANCHISOR_ONBOARDING_HANDOFF.md) | Onboarding new franchisors |

## Quick Links

### For New Developers
1. Start with [FINAL_ARCHITECTURE.md](./FINAL_ARCHITECTURE.md)
2. Review [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)
3. Check [TWO_PRODUCT_ARCHITECTURE.md](./TWO_PRODUCT_ARCHITECTURE.md)

### For Feature Work
1. Check existing implementation docs
2. Review related API routes in `/app/api/README.md`
3. Check component patterns in `/components/README.md`

### For Operations
1. [SENTRY-USAGE-GUIDE.md](./SENTRY-USAGE-GUIDE.md) for error tracking
2. [MOBILE_REGRESSION_TEST_CHECKLIST.md](./MOBILE_REGRESSION_TEST_CHECKLIST.md) for QA

## Project-Level Documentation

Additional docs at project root:

| Document | Description |
|----------|-------------|
| `/README.md` | Project overview and setup |
| `/CHANGELOG.md` | Version history |
| `/scripts/FDD_PROCESSING_GUIDE.md` | FDD processing workflow |

## External References

- **FranchiseScore Methodology**: `/FRANCHISESCORE_METHODOLOGY_2_1.md` (Claude Project)
- **Cloud Processing**: `/CLOUD_FDD_PROCESSING_GUIDE.md` (Claude Project)
- **Compliance**: `/FDDHUB_Compliance_Memo_Final.docx` (Claude Project)

## Documentation Standards

When adding new documentation:

1. **Use Markdown** with clear headings
2. **Include tables** for structured data
3. **Add code examples** where helpful
4. **Update this README** with new docs
5. **Date stamp** major updates

## Version History

| Date | Updates |
|------|---------|
| 2026-01-05 | Major update: schema, architecture, feature docs |
| 2025-12-15 | Added Sentry guide, mobile checklist |
| 2025-12-05 | Added team member, pipeline docs |
