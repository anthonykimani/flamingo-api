interface EnvCheck {
    name: string;
    value: string | undefined;
    description: string;
}

const REQUIRED_VARS: EnvCheck[] = [
    { name: 'PORT', value: process.env.PORT, description: 'Server port' },
    { name: 'DB_HOST', value: process.env.DB_HOST, description: 'Database host' },
    { name: 'DB_USER', value: process.env.DB_USER, description: 'Database user' },
    { name: 'DB_PASSWORD', value: process.env.DB_PASSWORD, description: 'Database password' },
    { name: 'DB_NAME', value: process.env.DB_NAME, description: 'Database name' },
    { name: 'OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY, description: 'OpenRouter API key for AI quiz generation' },
    { name: 'PRIVATE_KEY', value: process.env.PRIVATE_KEY, description: 'Blockchain private key' },
    { name: 'CHAIN', value: process.env.CHAIN, description: 'Active chain (base, base-sepolia, celo, celo-sepolia)' },
    { name: 'TOKEN_SECRET', value: process.env.TOKEN_SECRET, description: 'JWT signing secret (shared with identity service)' },
];

const CHAIN_ADDRESS_KEYS: Record<string, string[]> = {
    base: ['BASE_FLAMINGO_ESCROW_ADDRESS', 'BASE_USDC_ADDRESS'],
    'base-sepolia': ['BASE_SEPOLIA_FLAMINGO_ESCROW_ADDRESS', 'BASE_SEPOLIA_USDC_ADDRESS'],
    celo: ['CELO_FLAMINGO_ESCROW_ADDRESS', 'CELO_USDC_ADDRESS'],
    'celo-sepolia': ['CELO_SEPOLIA_FLAMINGO_ESCROW_ADDRESS', 'CELO_SEPOLIA_USDC_ADDRESS'],
};

function validateEnv(): void {
    const missing: string[] = [];

    for (const check of REQUIRED_VARS) {
        if (!check.value || check.value.trim() === '') {
            missing.push(`${check.name} (${check.description})`);
        }
    }

    const chain = (process.env.CHAIN || '').toLowerCase();
    if (chain) {
        const addressKeys = CHAIN_ADDRESS_KEYS[chain];
        if (!addressKeys) {
            missing.push(`CHAIN must be one of: ${Object.keys(CHAIN_ADDRESS_KEYS).join(', ')}`);
        } else {
            for (const key of addressKeys) {
                const value = process.env[key];
                if (!value || value.trim() === '') {
                    missing.push(`${key} (contract address for chain "${chain}")`);
                }
            }
        }
    }

    if (missing.length > 0) {
        console.error('═'.repeat(60));
        console.error('  MISSING REQUIRED ENVIRONMENT VARIABLES');
        console.error('═'.repeat(60));
        for (const item of missing) {
            console.error(`  ❌ ${item}`);
        }
        console.error('═'.repeat(60));
        console.error('  Ensure all required variables are set in .env.{NODE_ENV}');
        console.error('  or exported in the shell environment.');
        console.error('═'.repeat(60));
        process.exit(1);
    }

    if (process.env.DB_PORT && isNaN(Number(process.env.DB_PORT))) {
        console.error(`❌ DB_PORT must be a number, got: "${process.env.DB_PORT}"`);
        process.exit(1);
    }
}

export { validateEnv };
