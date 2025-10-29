---
description: Cardano smart contract development guidelines for Aiken
applyTo: '**/*.ak'
---

# Cardano Smart Contract Guidelines (Aiken)

## Tech Stack Reference
- **Language**: Aiken v1.1.19+
- **Platform**: Cardano blockchain
- **Testing**: Aiken test suite with property-based testing
- **Build**: `aiken build`
- **Check**: `aiken check`

## Code Conventions

### Type Safety
```aiken
// ✅ DO: Use explicit types for all Plutus data
pub type AssetClass {
  policy_id: PolicyId,
  asset_name: AssetName,
}

pub type Redeemer {
  Mint
  Burn { amount: Int }
}

// ❌ DON'T: Use untyped data
pub type Redeemer {
  action: Data
}
```

### Validator Structure
```aiken
// ✅ DO: Include comprehensive redeemer checks
validator property_token {
  fn mint(redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    expect tx = ctx.transaction

    when redeemer is {
      Mint -> {
        // Check authorization
        expect Some(_) = list.find(tx.extra_signatories, fn(sig) {
          sig == owner_pkh
        })

        // Check minting amount
        expect [Pair(_, amount)] =
          value.from_minted_value(tx.mint)
            |> value.tokens(own_policy_id)
            |> dict.to_list()

        amount == 1
      }

      Burn { amount } -> {
        // Verify burn amount matches
        let burned = value.quantity_of(tx.mint, own_policy_id, asset_name)
        burned == -amount
      }
    }
  }
}
```

### Datum Validation
```aiken
// ✅ DO: Validate all datum fields
pub fn validate_property_datum(datum: PropertyDatum) -> Bool {
  and {
    datum.property_id != "",
    datum.total_shares > 0,
    datum.share_price > 0,
    datum.owner != #"",
  }
}

// ❌ DON'T: Trust datum without validation
```

## Security Patterns

### Double Satisfaction Prevention
```aiken
// ✅ DO: Check script purpose uniqueness
fn check_unique_script_purpose(ctx: ScriptContext) -> Bool {
  let purposes = ctx.transaction.redeemers
    |> dict.keys()
    |> list.filter(fn(purpose) {
      when purpose is {
        Spend(own_ref) -> own_ref == ctx.purpose
        _ -> False
      }
    })

  list.length(purposes) == 1
}
```

### Time Range Validation
```aiken
// ✅ DO: Verify time bounds are reasonable
fn validate_time_range(range: ValidityRange) -> Bool {
  expect Interval { lower_bound, upper_bound } = range

  let has_lower = when lower_bound.bound_type is {
    Finite(t) -> t > 0
    _ -> False
  }

  let has_upper = when upper_bound.bound_type is {
    Finite(t) -> t < max_time
    _ -> False
  }

  and {
    has_lower,
    has_upper,
    // Max validity range: 2 hours
    upper_bound - lower_bound <= 7_200_000
  }
}
```

### Value Extraction Protection
```aiken
// ✅ DO: Verify all value flows
fn check_value_preservation(
  inputs: List<Input>,
  outputs: List<Output>,
  expected_change: Value
) -> Bool {
  let total_in = list.foldl(inputs, value.zero(), fn(acc, input) {
    value.merge(acc, input.output.value)
  })

  let total_out = list.foldl(outputs, value.zero(), fn(acc, output) {
    value.merge(acc, output.value)
  })

  value.merge(total_out, expected_change) == total_in
}
```

## Testing Requirements

### Unit Tests
```aiken
test mint_valid_amount() {
  let redeemer = Mint
  let ctx = mock_script_context()
    |> with_minting(own_policy_id, asset_name, 1)
    |> with_signatory(owner_pkh)

  property_token.mint(redeemer, ctx)
}

test mint_invalid_amount_fails() fail {
  let redeemer = Mint
  let ctx = mock_script_context()
    |> with_minting(own_policy_id, asset_name, 2)
    |> with_signatory(owner_pkh)

  property_token.mint(redeemer, ctx)
}
```

### Property-Based Tests
```aiken
// ✅ DO: Test with random inputs
test property_shares_always_positive(total_shares via int.between(1, 1000000)) {
  let datum = PropertyDatum {
    property_id: "TEST001",
    total_shares,
    share_price: 1000000,
    owner: owner_pkh,
  }

  validate_property_datum(datum) == (total_shares > 0)
}
```

### Edge Case Tests
```aiken
// ✅ ALWAYS test:
// - Zero amounts
// - Negative amounts
// - Maximum values
// - Empty lists
// - Missing signatories
// - Invalid datums
// - Time range boundaries
// - Multiple UTxOs
// - Concurrent transactions
```

## CIP Standards

### CIP-68 (Reference NFT Standard)
```aiken
// Reference NFT datum structure
pub type CIP68Datum {
  metadata: Dict<ByteArray, Data>,
  version: Int,
  extra: Data,
}

// Reference token naming: (222) prefix
pub const reference_prefix = #"000de140"

// User token naming: (100) prefix
pub const user_prefix = #"000643b0"
```

### CIP-444 (Rich Fungible Tokens)
```aiken
// Rich fungible token with metadata reference
pub type RichFungibleToken {
  policy_id: PolicyId,
  asset_name: AssetName,
  reference_nft: AssetClass,
}

fn validate_reference_link(
  token: RichFungibleToken,
  reference_utxo: Output
) -> Bool {
  let ref_nft = value.quantity_of(
    reference_utxo.value,
    token.reference_nft.policy_id,
    token.reference_nft.asset_name
  )

  ref_nft == 1
}
```

## Real Estate Tokenization Patterns

### Fractional Ownership Validator
```aiken
validator fractional_property {
  fn spend(
    datum: PropertyDatum,
    redeemer: PropertyRedeemer,
    ctx: ScriptContext
  ) -> Bool {
    expect tx = ctx.transaction

    when redeemer is {
      // Transfer shares
      TransferShares { from, to, amount } -> {
        and {
          // Verify signature
          list.has(tx.extra_signatories, from),
          // Check share amount valid
          amount > 0 && amount <= datum.total_shares,
          // Verify datum updated correctly
          validate_share_transfer(datum, from, to, amount, tx.outputs)
        }
      }

      // Distribute rental yield
      DistributeYield { total_yield } -> {
        and {
          // Only owner can distribute
          list.has(tx.extra_signatories, datum.owner),
          // Verify correct distribution
          validate_yield_distribution(datum, total_yield, tx.outputs)
        }
      }

      // Governance vote
      Vote { proposal_id, vote } -> {
        validate_governance_vote(datum, proposal_id, vote, tx)
      }
    }
  }
}
```

### Rental Yield Distribution
```aiken
fn validate_yield_distribution(
  datum: PropertyDatum,
  total_yield: Int,
  outputs: List<Output>
) -> Bool {
  // Calculate per-share yield
  let yield_per_share = total_yield / datum.total_shares

  // Verify each shareholder receives correct amount
  list.all(datum.shareholders, fn(shareholder) {
    let expected_yield = shareholder.shares * yield_per_share
    let actual_yield = calculate_shareholder_output(
      shareholder.address,
      outputs
    )

    actual_yield >= expected_yield * 99 / 100  // 1% tolerance for rounding
  })
}
```

## Common Vulnerabilities

### ⚠️ CRITICAL: Always Check
1. **Double Satisfaction**
   - Verify script purpose is unique
   - Check only one UTxO consumed per script invocation

2. **Time Manipulation**
   - Validate time ranges are bounded
   - Check time ranges don't exceed reasonable limits
   - Verify time-locked conditions

3. **Value Extraction**
   - Validate all value flows
   - Check no value leaked to attacker addresses
   - Verify collateral handling

4. **Redeemer Validation**
   - Never trust redeemer data without checks
   - Validate all redeemer fields
   - Check redeemer matches expected type

5. **Datum Integrity**
   - Validate datum structure
   - Check datum continuity in spending
   - Verify datum updates are authorized

## Performance Optimization

### Script Size Reduction
```aiken
// ✅ DO: Use constants for repeated values
const max_shares = 1_000_000
const min_share_price = 1_000_000  // 1 ADA

// ✅ DO: Extract common logic
fn has_required_signature(signatories: List<PubKeyHash>, required: PubKeyHash) -> Bool {
  list.has(signatories, required)
}

// ❌ DON'T: Repeat logic inline
```

### Execution Budget
```aiken
// ✅ DO: Minimize list operations
// Use list.any instead of list.filter + list.length
let has_admin = list.any(signatories, fn(sig) { sig == admin_pkh })

// ❌ DON'T: Create unnecessary intermediate lists
let admins = list.filter(signatories, fn(sig) { sig == admin_pkh })
let has_admin = list.length(admins) > 0
```

## Documentation Requirements

```aiken
/// Validates property token minting or burning
///
/// # Arguments
/// * `redeemer` - Mint or Burn action with parameters
/// * `ctx` - Script context containing transaction info
///
/// # Returns
/// * `Bool` - True if validation passes
///
/// # Security Considerations
/// - Minting requires owner signature
/// - Burning requires valid burn amount
/// - Prevents unauthorized token creation
///
/// # Examples
/// ```aiken
/// let redeemer = Mint
/// let ctx = make_context()
/// expect True = mint(redeemer, ctx)
/// ```
pub fn mint(redeemer: Redeemer, ctx: ScriptContext) -> Bool {
  // Implementation
}
```

## Error Handling

```aiken
// ✅ DO: Use expect for clear error messages
expect Some(input) = list.head(tx.inputs)
expect Spend(own_ref) = ctx.purpose

// ✅ DO: Provide meaningful error context
error @"Owner signature required"

// ❌ DON'T: Silent failures
if condition { True } else { False }  // Unclear why it failed
```

## Pre-Deployment Checklist

- [ ] All validators have comprehensive tests
- [ ] Property-based tests cover edge cases
- [ ] Security vulnerabilities checked (double satisfaction, time, value)
- [ ] Datum validation implemented
- [ ] Redeemer checks complete
- [ ] Script size optimized (< 16KB)
- [ ] Execution budget verified (< limits)
- [ ] Documentation complete
- [ ] Code reviewed by security expert
- [ ] Testnet deployment successful
- [ ] Audit completed (for mainnet)

---

**Remember**: Cardano smart contracts are immutable. Test exhaustively before deployment!
