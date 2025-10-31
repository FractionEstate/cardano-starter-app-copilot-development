# Aiken Contracts

This folder is ready for you to add your own Aiken validators. There are no default or placeholder validators included to avoid unsafe examples.

## Commands

```bash
# From aiken/
aiken check          # Type check the project
aiken build          # Compile (emits Plutus artifacts in ./build)
aiken test           # Run unit/property tests
```

## Add your first validator

Create a new file under `validators/`, for example `validators/my_validator.ak`:

```aiken
validator my_validator {
	fn spend(_datum: Data, _redeemer: Data, _ctx: Data) -> Bool {
		error @"Unimplemented validator"
	}
}
```

Then implement the logic and add Aiken tests in this folder. Remember to write property-based tests for critical logic.

## Notes

- The project targets Plutus v3 (see `aiken.toml`).
- Update `aiken.toml` metadata if you publish artifacts.
- Keep validators small and well-documented; prefer reusable helper functions in `lib/`.
