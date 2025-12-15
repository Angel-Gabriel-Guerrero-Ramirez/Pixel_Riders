module game::ship_nft {
    use aptos_framework::object;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use std::signer;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    const ENOT_OWNER: u64 = 1;
    const EINSUFFICIENT_FUNDS: u64 = 2;
    const ENOT_DESTROYED: u64 = 3;
    const ENOT_ALIVE: u64 = 4;
    const EMINT_PRICE: u64 = 200_000_000; // 0.2 APT (100 million octas)

    struct Ship has key, store {
        owner: address,
        sprite_id: u8,
        color_base: vector<u8>, // [r, g, b]
        color_shadow: vector<u8>, // [r, g, b]
        life: u8, // 2-5
        attack: u8, // 1-5
        status: u8, // 0 = ALIVE, 1 = DESTROYED
        created_at: u64
    }

    struct Collection has key {
        ship_count: u64,
        treasury: address,
        mint_price: u64
    }

    public entry fun initialize(owner: &signer, treasury_addr: address) {
        let owner_addr = signer::address_of(owner);
        
        if (!exists<Collection>(owner_addr)) {
            move_to(owner, Collection {
                ship_count: 0,
                treasury: treasury_addr,
                mint_price: EMINT_PRICE
            });
        }
    }

    // Función para mintear una nueva nave NFT con pago
    public entry fun mint_ship(
        owner: &signer,
        sprite_id: u8,
        color_base: vector<u8>,
        color_shadow: vector<u8>
    ) acquires Collection {
        let owner_addr = signer::address_of(owner);
        let collection_addr = @game;
        
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        let collection = borrow_global_mut<Collection>(collection_addr);
        
        // Verificar que el usuario tiene suficiente APT para pagar
        let aptos_coin: Coin<AptosCoin> = coin::withdraw<AptosCoin>(owner, collection.mint_price);
        
        // Transferir el pago al treasury
        let treasury_account = account::create_account(collection.treasury);
        coin::deposit(collection.treasury, aptos_coin);
        
        // Generar stats aleatorios
        let life = generate_life();
        let attack = generate_attack();
        
        // Crear objeto NFT
        let object_signer = object::create_object(owner_addr);
        let object_addr = object::object_address(&object_signer);
        
        move_to(&object_signer, Ship {
            owner: owner_addr,
            sprite_id,
            color_base,
            color_shadow,
            life,
            attack,
            status: 0, // ALIVE
            created_at: aptos_framework::timestamp::now_seconds()
        });
        
        // Liberar el object_signer
        object::transfer_object(object_signer, owner_addr);
        
        // Incrementar contador
        collection.ship_count = collection.ship_count + 1;
    }

    // Función para marcar nave como destruida (solo puede llamar el dueño)
    public entry fun destroy_ship(
        owner: &signer,
        ship_object_addr: address
    ) acquires Ship {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<Ship>(ship_object_addr), ENOT_OWNER);
        
        let ship = borrow_global_mut<Ship>(ship_object_addr);
        assert!(ship.owner == owner_addr, ENOT_OWNER);
        assert!(ship.status == 0, ENOT_ALIVE); // Solo naves ALIVE pueden ser destruidas
        
        ship.status = 1; // DESTROYED
    }


    // Función para actualizar el precio de mint (solo owner)
    public entry fun update_mint_price(
        owner: &signer,
        new_price: u64
    ) acquires Collection {
        let owner_addr = signer::address_of(owner);
        let collection_addr = @game;
        
        assert!(owner_addr == collection_addr, ENOT_OWNER);
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        let collection = borrow_global_mut<Collection>(collection_addr);
        collection.mint_price = new_price;
    }

    // Función para actualizar treasury address (solo owner)
    public entry fun update_treasury(
        owner: &signer,
        new_treasury: address
    ) acquires Collection {
        let owner_addr = signer::address_of(owner);
        let collection_addr = @game;
        
        assert!(owner_addr == collection_addr, ENOT_OWNER);
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        let collection = borrow_global_mut<Collection>(collection_addr);
        collection.treasury = new_treasury;
    }

    // Funciones de consulta públicas
    public fun get_ship_count(): u64 acquires Collection {
        let collection_addr = @game;
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        borrow_global<Collection>(collection_addr).ship_count
    }

    public fun get_mint_price(): u64 acquires Collection {
        let collection_addr = @game;
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        borrow_global<Collection>(collection_addr).mint_price
    }

    public fun get_treasury(): address acquires Collection {
        let collection_addr = @game;
        assert!(exists<Collection>(collection_addr), ENOT_OWNER);
        
        borrow_global<Collection>(collection_addr).treasury
    }

    // Funciones auxiliares privadas para generar stats
    fun generate_life(): u8 {
        // Vida: 2-5, más probable 2-3
        let rand = aptos_framework::randomness::u64_range(1, 101);
        
        if (rand <= 60) { // 60% probabilidad
            2
        } else if (rand <= 85) { // 15% probabilidad
            3
        } else if (rand <= 95) { // 10% probabilidad
            4
        } else { // 5% probabilidad
            5
        }
    }

    fun generate_attack(): u8 {
        // Ataque: 1-5, más probable 1-2
        let rand = aptos_framework::randomness::u64_range(1, 101);
        
        if (rand <= 40) { // 40% probabilidad
            1
        } else if (rand <= 70) { // 30% probabilidad
            2
        } else if (rand <= 85) { // 15% probabilidad
            3
        } else if (rand <= 95) { // 4% probabilidad
            4
        } else { // 1% probabilidad
            5
        }
    }

}