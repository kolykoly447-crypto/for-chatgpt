package com.example.cjswitch.client;

import net.minecraft.client.KeyMapping;
import com.mojang.blaze3d.platform.InputConstants;
import org.lwjgl.glfw.GLFW;

/** Client-only key mapping and toggle state. */
public final class ClientHooks {
    public static final KeyMapping TOGGLE_CHARACTER = new KeyMapping(
            "key.cjswitch.toggle",
            InputConstants.Type.KEYSYM,
            GLFW.GLFW_KEY_G,
            "key.categories.cjswitch"
    );

    private static boolean cjEnabled;

    private ClientHooks() {
    }

    public static boolean isCjEnabled() {
        return cjEnabled;
    }

    public static void toggle() {
        cjEnabled = !cjEnabled;
    }
}
