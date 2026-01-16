# DataLeash Development Rules

> **CRITICAL**: All features must use REAL data from Supabase. No mockups, fake data, or simulated processes allowed.

## Core Principles

### 1. No Mock Data
- ❌ **BANNED**: Hardcoded statistics, dummy users, fake file counts
- ❌ **BANNED**: Simulated delays or fake loading states that don't reflect real operations
- ❌ **BANNED**: Placeholder content that implies real data exists
- ✅ **REQUIRED**: All displayed data must come from Supabase queries
- ✅ **REQUIRED**: If no data exists, show empty states with clear messaging

### 2. No Fake Processes
- ❌ **BANNED**: Fake encryption that doesn't actually encrypt
- ❌ **BANNED**: Simulated security features (fake fingerprinting, fake threat detection)
- ❌ **BANNED**: Mock API responses that don't reflect actual backend behavior
- ✅ **REQUIRED**: All security features must perform real cryptographic operations
- ✅ **REQUIRED**: All API routes must interact with real database

### 3. Data Integrity
- All statistics must be calculated from actual database records
- Dashboard metrics must reflect real user activity
- Access logs must capture genuine events
- File counts, view counts, and analytics must be query-based

### 4. Error Handling
- Show real error messages (sanitized for security)
- Don't hide failures behind fake success states
- Log all errors for debugging

## Implementation Checklist

When adding any feature, verify:
- [ ] Data comes from Supabase, not hardcoded
- [ ] Operations perform real actions, not simulations
- [ ] Empty states are handled gracefully
- [ ] Errors are properly caught and displayed
- [ ] No `// TODO: replace with real data` comments left behind

## Violations

Any code containing:
- `const DUMMY_` or `const MOCK_` or `const FAKE_`
- Hardcoded arrays of sample data for display
- `Math.random()` for generating display statistics
- Comments like "simulated", "placeholder", "dummy"

...must be refactored to use real database queries.
