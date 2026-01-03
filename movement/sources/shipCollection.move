module game::shipCollection {
    use aptos_framework::object::{Self, ObjectCore};
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::table::{Self, Table};
    
    use std::signer;
    use std::vector;
    use std::bcs;
    use std::option::{Self, Option};
    use std::hash;
    use std::string::{Self, String};

    // CONSTANTS
    const MINT_PRICE: u64 = 20000000; // 0.02 APT
    const COLLECTION_NAME: vector<u8> = b"Pixel Riders";
    const COLLECTION_DESCRIPTION: vector<u8> = b"Ship Hangar";
    const MAX_SHIP_SUPPLY: u64 = 10000;

    //ADMIN ADDRESS
    const ADMIN_ADDRESS: address = @game;
    
    // STATUS
    const STATUS_ALIVE: u8 = 0;
    const STATUS_DESTROYED: u8 = 1;
    const STATUS_ONTRADE: u8 = 2;

    // ERROR CODES  
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;
    const E_SHIP_DESTROYED: u64 = 3;
    const E_SHIP_NOT_FOUND: u64 = 4;
    const E_COLLECTION_EXISTS: u64 = 5;
    const E_COLLECTION_NOT_EXISTS: u64 = 6;
    const E_MAX_SHIP_SUPPLY_REACHED: u64 = 7;
    const E_TREASURY_NOT_SET: u64 = 8;

    // STRUCTURES
    struct TreasuryConfig has key {
        treasury_address: address,
        admin: address,
        is_initialized: bool,
    }

    struct CollectionHangar has key {
        creator: address,
        name: String,
        description: String,
        total_ship: u64,
        current_ship: u64,
        ships: Table<u64, Ship>,
        next_token_id: u64,
    }

    struct Ship has store, copy, drop {
        token_id: u64,
        owner: address,
        sprite_id: u8,
        color_base: vector<u8>,
        color_shadow: vector<u8>,
        life: u8,
        attack: u8,
        status: u8,
        created_at: u64,
    }

    // HELPER FUNCTIONS
    fun append_address(data: &mut vector<u8>, addr: address) {
        vector::append(data, bcs::to_bytes(&addr));
    }

    fun append_u64(data: &mut vector<u8>, num: u64) {
        vector::append(data, bcs::to_bytes(&num));
    }

    fun get_treasury_address(): address acquires TreasuryConfig {
        assert!(exists<TreasuryConfig>(@game), E_TREASURY_NOT_SET);
        borrow_global<TreasuryConfig>(@game).treasury_address
    }

    fun generate_seed(
        minter_addr: address,
        token_id: u64,
        timestamp: u64,
        sprite_id: u8,
        color_data: vector<u8>
    ): u64 {
        let seed_data = vector::empty<u8>();
        append_address(&mut seed_data, minter_addr);
        append_u64(&mut seed_data, token_id);
        append_u64(&mut seed_data, timestamp);
        vector::push_back(&mut seed_data, sprite_id);
        vector::append(&mut seed_data, color_data);
        let hash = hash::sha3_256(seed_data);
        bytes_to_u64(hash)
    }
    
    fun bytes_to_u64(bytes: vector<u8>): u64 {
        let result: u64 = 0;
        let len = vector::length(&bytes);
        let i = 0;
        while (i < len && i < 8) {
            let byte = *vector::borrow(&bytes, i);
            result = result + ((byte as u64) * (256 ^ (i as u64)));
            i = i + 1;
        };
        result
    }
    
    fun generate_life(seed: u64): u8 {
        let value = seed % 100;
        if (value < 60) {
            2
        } else if (value < 85) {
            3
        } else if (value < 95) {
            4
        } else {
            5
        }
    }
    
    fun generate_attack(seed: u64): u8 {
        let rotated_seed = (seed >> 32) | (seed << 32);
        let value = rotated_seed % 100;
        if (value < 40) {
            1
        } else if (value < 70) {
            2
        } else if (value < 85) {
            3
        } else if (value < 95) {
            4
        } else {
            5
        }
    }

    public entry fun initialize_treasury(
        admin: &signer,
        treasury_address: address
    ) {
        let admin_addr = signer::address_of(admin);
        
        // Verificar que no esté ya inicializado
        assert!(!exists<TreasuryConfig>(@game), E_TREASURY_NOT_SET);
        
        move_to(admin, TreasuryConfig {
            treasury_address,
            admin: admin_addr,
            is_initialized: true,
        });
    }

    // PUBLIC FUNCTIONS
    public entry fun create_collection(
        creator: &signer,
    ) {
        let creator_addr = signer::address_of(creator);

        assert!(!exists<CollectionHangar>(creator_addr), E_COLLECTION_EXISTS);

        move_to(creator, CollectionHangar {
            creator: creator_addr,
            name: string::utf8(COLLECTION_NAME),
            description: string::utf8(COLLECTION_DESCRIPTION),
            total_ship: MAX_SHIP_SUPPLY,
            current_ship: 0,
            ships: table::new(),
            next_token_id: 1,
        });
    }

    public entry fun mint_ship(
        minter: &signer,
        sprite_id: u8,
        color_base: vector<u8>,
        color_shadow: vector<u8>,
    ) acquires CollectionHangar, TreasuryConfig {
        let minter_addr = signer::address_of(minter);
        
        assert!(exists<CollectionHangar>(minter_addr), E_COLLECTION_NOT_EXISTS);

        let collection = borrow_global_mut<CollectionHangar>(minter_addr);
        assert!(collection.current_ship < collection.total_ship, E_MAX_SHIP_SUPPLY_REACHED);

        let treasury_address = get_treasury_address();

        // Pay fee
        let coins = coin::withdraw<AptosCoin>(minter, MINT_PRICE);
        coin::deposit(treasury_address, coins);

        let token_id = collection.next_token_id;
        let timestamp = timestamp::now_microseconds();

        let color_data = vector::empty<u8>();
        vector::append(&mut color_data, color_base);
        vector::append(&mut color_data, color_shadow);

        let seed = generate_seed(
            minter_addr,
            token_id,
            timestamp,
            sprite_id,
            color_data
        );
        
        let life = generate_life(seed);
        let attack = generate_attack(seed);

        let ship = Ship {
            token_id,
            owner: minter_addr,
            sprite_id,
            color_base: color_base,
            color_shadow: color_shadow,
            life: life,
            attack: attack,
            status: STATUS_ALIVE,
            created_at: timestamp,
        };

        table::add(&mut collection.ships, token_id, ship);
        collection.current_ship = collection.current_ship + 1;
        collection.next_token_id = token_id + 1;
    }

    public entry fun destroy_ship(
        owner: &signer,
        token_id: u64,
    ) acquires CollectionHangar {
        let owner_addr = signer::address_of(owner);

        assert!(exists<CollectionHangar>(owner_addr), E_COLLECTION_NOT_EXISTS);
        
        let collection = borrow_global_mut<CollectionHangar>(owner_addr);
        
        assert!(
            table::contains(&collection.ships, token_id),
            E_SHIP_NOT_FOUND
        );

        let ship = table::borrow_mut(&mut collection.ships, token_id);
        
        assert!(ship.status == STATUS_ALIVE, E_SHIP_DESTROYED);
        
        ship.status = STATUS_DESTROYED;
    }

    #[view]
    public fun get_ship_info(
        collection_owner: address,
        token_id: u64
    ): (
        u64,
        address,
        u8,
        vector<u8>,
        vector<u8>,
        u8,
        u8,
        u8
    ) acquires CollectionHangar {
        assert!(exists<CollectionHangar>(collection_owner), E_COLLECTION_NOT_EXISTS);
        let collection = borrow_global<CollectionHangar>(collection_owner);
        
        assert!(
            table::contains(&collection.ships, token_id),
            E_SHIP_NOT_FOUND
        );
        
        let ship = table::borrow(&collection.ships, token_id);
        
        (
            ship.token_id,
            ship.owner,
            ship.sprite_id,
            ship.color_base,
            ship.color_shadow,
            ship.life,
            ship.attack,
            ship.status
        )
    }

    #[view]
    public fun get_user_ships_count(owner: address): u64 acquires CollectionHangar {
        if (!exists<CollectionHangar>(owner)) {
            return 0
        };
        let collection = borrow_global<CollectionHangar>(owner);
        collection.current_ship
    }

    #[view]
    public fun get_all_user_ships(
        owner: address
    ): vector<u64> acquires CollectionHangar {
        let token_ids = vector::empty<u64>();
        
        if (!exists<CollectionHangar>(owner)) {
            return token_ids
        };
        
        let collection = borrow_global<CollectionHangar>(owner);
        let current_ship = collection.current_ship;
        
        let i: u64 = 1;
        while (i <= current_ship) {
            if (table::contains(&collection.ships, i)) {
                vector::push_back(&mut token_ids, i);
            };
            i = i + 1;
        };
        
        token_ids
    }

    #[view]
    public fun get_collection_info(owner: address): (
        String,
        String,
        u64,
        u64
    ) acquires CollectionHangar {
        assert!(exists<CollectionHangar>(owner), E_COLLECTION_NOT_EXISTS);
        let collection = borrow_global<CollectionHangar>(owner);
        
        (
            collection.name,
            collection.description,
            collection.current_ship,
            collection.total_ship
        )
    }
}