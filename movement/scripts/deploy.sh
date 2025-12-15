
echo "Initiate deploy on Aptos Testnet"
echo "===================================="

# Configurar network
echo "Config for testnet..."
aptos config set-global-config --config-type testnet

# Obtener addresses de los perfiles
echo "🔑 Obteniendo addresses..."
DEPLOYER_ADDR=$(aptos config show-profiles --profile=deployer 2>/dev/null | grep account | cut -d'"' -f4 || "")
ADMIN_ADDR=$(aptos config show-profiles --profile=admin 2>/dev/null | grep account | cut -d'"' -f4 || "")
TREASURY_ADDR=$(aptos config show-profiles --profile=treasury 2>/dev/null | grep account | cut -d'"' -f4 || "")

# Crear perfiles si no existen
if [ -z "$DEPLOYER_ADDR" ]; then
    echo "📝 Creando perfil deployer..."
    aptos init --profile deployer --network testnet --assume-yes
    DEPLOYER_ADDR=$(aptos config show-profiles --profile=deployer | grep account | cut -d'"' -f4)
fi

if [ -z "$ADMIN_ADDR" ]; then
    echo "📝 Creando perfil admin..."
    aptos init --profile admin --network testnet --assume-yes
    ADMIN_ADDR=$(aptos config show-profiles --profile=admin | grep account | cut -d'"' -f4)
fi

if [ -z "$TREASURY_ADDR" ]; then
    echo "📝 Creando perfil treasury..."
    aptos init --profile treasury --network testnet --assume-yes
    TREASURY_ADDR=$(aptos config show-profiles --profile=treasury | grep account | cut -d'"' -f4)
fi

echo ""
echo "📊 Addresses configuradas:"
echo "   Deployer:  0x${DEPLOYER_ADDR}"
echo "   Admin:     0x${ADMIN_ADDR}"
echo "   Treasury:  0x${TREASURY_ADDR}"
echo ""

echo ""
echo "🔨 Compilando contrato..."
aptos move compile \
    --named-addresses game=0x${DEPLOYER_ADDR} \
    --profile deployer

echo ""
echo "🚀 Desplegando contrato..."
aptos move publish \
    --named-addresses game=0x${DEPLOYER_ADDR} \
    --profile deployer \
    --assume-yes

echo ""
echo "⚙️  Inicializando contrato..."
# Precio: 0.5 APT = 50,000,000 octas
PRICE=50000000
aptos move run \
    --function-id "0x${DEPLOYER_ADDR}::ship_nft::initialize" \
    --args \
        "address:0x${ADMIN_ADDR}" \
        "address:0x${TREASURY_ADDR}" \
        "u64:${PRICE}" \
    --profile deployer \
    --assume-yes

echo ""
echo "✅ ¡Deploy completado!"
echo "======================"
echo "Contrato address: 0x${DEPLOYER_ADDR}"
echo "Admin: 0x${ADMIN_ADDR}"
echo "Treasury: 0x${TREASURY_ADDR}"
echo "Precio establecido: ${PRICE} octas ($(echo "scale=2; $PRICE/100000000" | bc) APT)"