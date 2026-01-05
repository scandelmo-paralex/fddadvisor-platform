#!/bin/bash
# Cleanup script for redundant documentation files
# Run from the project root directory

echo "Cleaning up redundant documentation files..."

# Delete redundant files from docs/
rm -f docs/FDD-PROCESSING-GUIDE-v2.md
rm -f docs/FRANCHISESCORE_METHODOLOGY_2.0.md
rm -f docs/SKILL_REFERENCE.md
rm -f docs/adding-franchise-step-by-step.md
rm -f docs/adding-new-franchise.md

echo "✅ Cleanup complete!"
echo ""
echo "Files removed:"
echo "  - docs/FDD-PROCESSING-GUIDE-v2.md (redundant - use scripts/FDD_PROCESSING_GUIDE.md)"
echo "  - docs/FRANCHISESCORE_METHODOLOGY_2.0.md (redundant - use project-level file)"
echo "  - docs/SKILL_REFERENCE.md (moved to SKILL_FILE_FOR_CLAUDE_PROJECT.md)"
echo "  - docs/adding-franchise-step-by-step.md (outdated)"
echo "  - docs/adding-new-franchise.md (outdated)"
echo ""
echo "Remaining docs/ files:"
ls -la docs/
