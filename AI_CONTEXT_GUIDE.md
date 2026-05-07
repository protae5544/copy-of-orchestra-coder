# AI Context Guide - Orchestra Coder

## Critical Principles for AI Development

This document establishes the context and principles that AI systems should follow when working on this project. **These are not optional guidelines - they are requirements.**

### 1. No Deceptive Practices

**FORBIDDEN:**
- Mock data that hides broken functionality
- Placeholder implementations that look complete but don't work
- Demo modes that show fake results
- Code that appears to work but fails silently
- Incomplete features presented as finished

**REQUIRED:**
- All code must actually work
- All features must be fully implemented
- All errors must be visible and reported
- Test everything before delivery
- Be transparent about limitations

### 2. Respect Model Capabilities

**DO NOT:**
- Pretend the model can do things it cannot
- Generate code that exceeds token limits
- Create features that require capabilities the model doesn't have
- Ignore context window limitations
- Make promises the model cannot keep

**DO:**
- Work within actual model capabilities
- Design features that fit within token limits
- Use context efficiently
- Break complex tasks into manageable pieces
- Be honest about what the model can generate

### 3. Real Orchestration, Not Fake

**WRONG APPROACH:**
```
Coordinator → Task Breakdown
         ↓
    ├─→ Frontend (doesn't know backend API)
    ├─→ Backend (doesn't know frontend needs)
    ├─→ DevOps (doesn't know app structure)
    └─→ Database (doesn't know what others need)
```

**CORRECT APPROACH:**
```
Coordinator → Task Breakdown
         ↓
    → Database (generates schema)
         ↓
    → Backend (uses schema, defines APIs)
         ↓
    → Frontend (uses API contracts)
    → DevOps (uses app structure)
```

Each specialist must receive actual outputs from previous specialists, not just the original requirements.

### 4. Proper Error Handling

**WRONG:**
```typescript
try {
  // something
} catch {
  // silently fail
}
```

**CORRECT:**
```typescript
try {
  // something
} catch (error) {
  console.error('Specific error context:', error);
  toast.error('User-friendly error message');
  throw error; // or handle appropriately
}
```

### 5. No Dead Code or Unused Dependencies

**WRONG:**
- Installing packages that aren't used
- Importing components that aren't needed
- Creating files that never get called
- Leaving commented-out code
- Keeping old implementations

**CORRECT:**
- Only install what's needed
- Remove unused imports
- Delete unused files
- Clean up before delivery
- Keep codebase minimal and focused

### 6. Validation Must Be Real

**WRONG:**
```typescript
if (output.includes('{')) {
  // Accept as valid code
}
```

**CORRECT:**
```typescript
// Check for actual code structure
if (!output.toUpperCase().includes('CREATE TABLE')) {
  issues.push('Missing CREATE TABLE statements');
}
if (!output.toUpperCase().includes('PRIMARY KEY')) {
  issues.push('Missing PRIMARY KEY definitions');
}
```

### 7. Token Limits Must Be Realistic

**WRONG:**
- Setting max_tokens too low (3000) causing truncated code
- Not accounting for prompt overhead
- Ignoring context window limitations

**CORRECT:**
- Set max_tokens based on actual requirements (8000+)
- Account for system prompts and context
- Test that output is complete, not truncated
- Adjust based on model capabilities

### 8. Architecture Must Be Sound

**WRONG:**
- Using next-themes provider but providing ThemeContext
- Mixing different state management approaches
- Inconsistent error handling patterns
- No clear data flow

**CORRECT:**
- Consistent provider setup
- Single source of truth for state
- Uniform error handling
- Clear, documented data flow

## Implementation Checklist

Before delivering any feature:

- [ ] **No Mock Data**: All data is real or clearly marked as example
- [ ] **No Placeholders**: All features are fully implemented
- [ ] **Error Handling**: All errors are caught and reported
- [ ] **Testing**: Feature has been tested end-to-end
- [ ] **Documentation**: Code is documented and clear
- [ ] **No Dead Code**: All imports and files are used
- [ ] **Architecture**: Design is sound and maintainable
- [ ] **Performance**: Code is efficient and doesn't waste resources
- [ ] **Security**: No API keys or secrets in code
- [ ] **Accessibility**: UI is accessible and responsive

## Token Efficiency Guidelines

### For Orchestration Tasks

**Database Specialist:**
- Input: Coordinator analysis (500-1000 tokens)
- Output: SQL schema (2000-3000 tokens)
- Total: ~3500 tokens (well within 8000 limit)

**Backend Specialist:**
- Input: Coordinator analysis + database schema (1500-2000 tokens)
- Output: Express API (3000-4000 tokens)
- Total: ~5500 tokens (fits within 8000 limit)

**Frontend Specialist:**
- Input: Coordinator analysis + backend code (2000-2500 tokens)
- Output: React components (3000-4000 tokens)
- Total: ~6000 tokens (fits within 8000 limit)

**DevOps Specialist:**
- Input: All previous outputs (3000-3500 tokens)
- Output: Docker/CI-CD configs (2000-3000 tokens)
- Total: ~6500 tokens (fits within 8000 limit)

### Optimization Strategies

1. **Compress context**: Remove unnecessary whitespace and comments from inputs
2. **Use summaries**: Summarize long code blocks instead of including full code
3. **Reference previous outputs**: Say "use the database schema from step 1" instead of repeating it
4. **Progressive detail**: Start with high-level structure, add details only when needed
5. **Split large tasks**: Break into smaller, sequential tasks

## What NOT to Do

### Anti-Pattern 1: Silent Failures
```typescript
// WRONG
const result = await generateCode();
// If it fails, nothing happens
```

### Anti-Pattern 2: Fake Success
```typescript
// WRONG
return {
  status: 'completed',
  code: mockCode // Not actually generated
};
```

### Anti-Pattern 3: Unused Code
```typescript
// WRONG
import { unusedComponent } from './components';
import { unusedHook } from './hooks';
// These are never used
```

### Anti-Pattern 4: Poor Validation
```typescript
// WRONG
if (output.length > 100) {
  // Accept as valid
}
```

### Anti-Pattern 5: No Context Sharing
```typescript
// WRONG
const backendCode = generateBackend(requirements);
// Backend doesn't know about database schema
const frontendCode = generateFrontend(requirements);
// Frontend doesn't know about backend API
```

## What TO Do

### Pattern 1: Explicit Error Handling
```typescript
try {
  const result = await generateCode();
  if (!result.ok) {
    throw new Error(`Generation failed: ${result.error}`);
  }
  return result;
} catch (error) {
  console.error('Code generation error:', error);
  toast.error('Failed to generate code');
  throw error;
}
```

### Pattern 2: Real Implementation
```typescript
const result = await callDeepSeekAPI(prompt);
const code = extractCode(result);
const validation = validateOutput(code);
if (!validation.valid) {
  throw new Error(`Validation failed: ${validation.issues.join(', ')}`);
}
return code;
```

### Pattern 3: Clean Imports
```typescript
// Only import what's used
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// No unused imports
```

### Pattern 4: Real Validation
```typescript
const issues = [];
if (!code.includes('CREATE TABLE')) {
  issues.push('Missing table definitions');
}
if (!code.includes('PRIMARY KEY')) {
  issues.push('Missing primary keys');
}
return { valid: issues.length === 0, issues };
```

### Pattern 5: Context Sharing
```typescript
// Step 1: Database
const dbSchema = await generateDatabase(context);

// Step 2: Backend (receives database schema)
const backendCode = await generateBackend(context, dbSchema);

// Step 3: Frontend (receives backend code)
const frontendCode = await generateFrontend(context, backendCode);

// Step 4: DevOps (receives all)
const devopsCode = await generateDevOps(context, backendCode, frontendCode);
```

## Red Flags - Stop and Ask

If you encounter any of these, **stop and ask the user**:

1. **Impossible Requirements**: "Generate 50,000 lines of code" (exceeds token limits)
2. **Conflicting Instructions**: "Use mock data" vs "Make it real"
3. **Unclear Scope**: "Build everything" without specifics
4. **Resource Limits**: "Generate 100 projects simultaneously"
5. **Capability Mismatch**: Asking for features the model cannot generate

## Success Criteria

A feature is complete when:

1. ✅ **It Works**: Tested end-to-end, no broken code
2. ✅ **It's Real**: No mock data, no placeholders
3. ✅ **It's Safe**: Proper error handling, no silent failures
4. ✅ **It's Clean**: No dead code, no unused dependencies
5. ✅ **It's Documented**: Clear comments and guide
6. ✅ **It's Honest**: Limitations are acknowledged

## Questions to Ask Yourself

Before submitting work:

- Does this actually work, or just look like it works?
- Did I use mock data to hide broken functionality?
- Are all errors visible and reported?
- Is the code clean and minimal?
- Did I respect the model's capabilities?
- Is the architecture sound?
- Would I use this code in production?

If you answer "no" to any of these, **fix it before delivery**.

## Contact & Escalation

If you're unsure about any principle:
- Re-read this guide
- Check the IMPLEMENTATION_GUIDE.md
- Look at working examples in the codebase
- Ask the user for clarification
- **Never guess or make assumptions**

---

**Remember:** The goal is to build real, working software that respects both the user's time and the model's actual capabilities. Deception wastes both.
