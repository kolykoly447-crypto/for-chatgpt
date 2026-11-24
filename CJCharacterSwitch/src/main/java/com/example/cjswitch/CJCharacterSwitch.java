package com.example.cjswitch;

import net.minecraftforge.fml.common.Mod;

/**
 * CJ Character Switch for Minecraft 1.20.1 / Forge 47.x.
 * The character replacement is client-side and does not require a custom entity.
 */
@Mod(CJCharacterSwitch.MOD_ID)
public final class CJCharacterSwitch {
    public static final String MOD_ID = "cjswitch";

    public CJCharacterSwitch() {
        // Client-only key bindings and render layers are registered by the
        // client event subscribers. Keeping this constructor server-safe allows
        // the mod to be present on a dedicated server without loading client code.
    }
}
