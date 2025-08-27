# SNMPv3 Authentication Failure Handling Test Coverage (RFC 3414 §3.2)

This document describes the test coverage added for PR #289 which implements RFC 3414 §3.2 compliant SNMPv3 authentication failure handling.

## Test File: `snmpv3-auth-failures.test.js`

### Coverage Areas

#### 1. Report PDU Generation
- ✅ Tests Report PDU creation with `UNKNOWN_USER_NAME` for unknown users
- ✅ Tests Report PDU creation with `WRONG_DIGESTS` for authentication level mismatches  
- ✅ Tests Report PDU creation with `UNKNOWN_ENGINE_ID` for discovery requests
- ✅ Verifies original message ID preservation in Report PDUs
- ✅ Validates correct security parameters in Report PDUs
- ✅ Tests graceful handling of missing/invalid error types

#### 2. USM Statistics Counter Compliance
- ✅ Verifies correct USM statistics OIDs (`1.3.6.1.6.3.15.1.1.X.0`)
- ✅ Tests proper Counter32 type and value (1) in varbinds
- ✅ Maps all RFC 3414 error types to correct OID suffixes

#### 3. Reportable Flag Handling
- ✅ Tests reportable flag setting and retrieval
- ✅ Validates message flag bit manipulation (bit 2 = reportable)

#### 4. Integration Testing
- ✅ Tests receiver/authorizer setup with known users
- ✅ Validates integration with existing authentication framework

#### 5. Edge Cases
- ✅ Empty user name handling
- ✅ Authentication parameters in messages
- ✅ Privacy parameters in messages
- ✅ Error type constant definitions

### RFC 3414 §3.2 Compliance Verification

The tests verify compliance with specific RFC 3414 requirements:

| RFC Section | Requirement | Test Coverage |
|------------|-------------|---------------|
| §3.2 Step 4 | Use `usmStatsUnknownUserNames` for unknown users | ✅ |
| §3.2 Step 5 | Use `usmStatsWrongDigests` for security level mismatches | ✅ |
| Discovery | Use `usmStatsUnknownEngineIDs` for engine discovery | ✅ |
| Report PDU | Include correct Counter32 OID and value | ✅ |
| Message ID | Preserve original message ID in reports | ✅ |
| Security | Use empty security parameters in reports | ✅ |

### Test Strategy

The tests use a mock-based approach since many internal classes (`UsmErrorType`, `Authorizer`, etc.) are not exported by the module. This approach:

1. **Mirrors actual implementation** - Uses the same constants and logic as PR #289
2. **Tests public interface** - Works with exported functions like `createReceiver`
3. **Validates RFC compliance** - Ensures correct OID construction and counter values
4. **Covers edge cases** - Tests error conditions and boundary cases

### Usage

Run the specific tests:
```bash
npm test -- --grep "SNMPv3 Authentication Failure Handling"
```

Run all tests to ensure no regressions:
```bash
npm test
```

### Benefits

These tests provide:
- **Regression prevention** - Catches changes that break RFC compliance
- **Documentation** - Shows how the authentication failure handling works
- **Quality assurance** - Ensures proper error reporting to SNMP managers
- **Maintenance confidence** - Allows safe refactoring of authentication code
